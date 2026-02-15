import prisma from "../db/prisma.js";
import crypto from "crypto";
import { sanitizeText } from "../utils/sanitize.js";
import { generateVerificationToken, verifyVerificationToken } from "../utils/jwt.js";
import { sendMail } from "../utils/mail.js";
import { verificationEmailTemplate } from "../templates/verificationEmail.js";
import { asyncHandler } from "../middleware/asyncHandler.js";
import {
  ValidationError,
  NotFoundError,
  ConflictError,
  RateLimitError,
} from "../utils/errors.js";

const sendVerificationEmail = async (user, newEmail = null) => {
  const emailToVerify = newEmail || user.email;
  const verificationToken = generateVerificationToken(user.id, emailToVerify);
  const expiresAt = new Date(Date.now() + 15 * 60 * 1000);
  
  const tokenHash = crypto.createHash('sha256').update(verificationToken).digest('hex');

  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);

  const tokensSentToday = await prisma.verificationToken.count({
    where: {
      userId: user.id,
      createdAt: {
        gte: startOfDay,
      },
    },
  });

  if (tokensSentToday >= 3) {
    throw new RateLimitError(
      "Maximum verification emails sent for today. Please try again tomorrow."
    );
  }

  await prisma.verificationToken.updateMany({
    where: {
      userId: user.id,
      used: false,
    },
    data: {
      used: true,
    },
  });

  await prisma.verificationToken.create({
    data: {
      tokenHash: tokenHash,
      userId: user.id,
      email: emailToVerify,
      expiresAt,
      createdAt: new Date(),
    },
  });

  const frontendUrl = process.env.FRONTEND_URL || "http://localhost:5173";
  const verificationLink = `${frontendUrl}/verify-email?token=${verificationToken}`;

  const emailContent = verificationEmailTemplate({
    name: user.name,
    verificationLink,
  });

  await sendMail({
    to: emailToVerify,
    subject: emailContent.subject,
    html: emailContent.html,
    text: emailContent.text,
  });
};

export const updateProfileData = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  let { name, bio, email } = req.body;

  // Sanitize inputs to prevent XSS attacks
  if (name !== undefined) {
    const originalName = name;
    name = sanitizeText(name);
    
    // Validate that name is not empty after sanitization
    if (originalName.trim() && !name) {
      throw new ValidationError("Name cannot contain only HTML or special characters");
    }
  }

  if (bio !== undefined) {
    // Sanitize bio (can be empty string - user clearing bio)
    bio = sanitizeText(bio);
  }

  // Email normalization (already handled by validation middleware, but be defensive)
  if (email !== undefined) {
    email = email.toLowerCase().trim();
  }

  const currentUser = await prisma.user.findUnique({
    where: { id: userId },
    select: { email: true, name: true, bio: true },
  });

  if (!currentUser) {
    throw new NotFoundError("User not found");
  }

  const emailChanged = email && email !== currentUser.email;

  if (emailChanged) {
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      throw new ConflictError("Email already in use");
    }
  }

  const updateData = {
    updatedAt: new Date(),
  };

  if (name !== undefined) updateData.name = name;
  if (bio !== undefined) updateData.bio = bio;
  if (emailChanged) {
    updateData.email = email;
    updateData.verified = false;
  }

  if (emailChanged) {
    const updatedUser = await prisma.$transaction(async (tx) => {
      const user = await tx.user.update({
        where: { id: userId },
        data: updateData,
        select: {
          id: true,
          email: true,
          name: true,
          bio: true,
          profilePhoto: true,
          verified: true,
          createdAt: true,
          updatedAt: true,
        },
      });

      await tx.refreshToken.deleteMany({
        where: { userId },
      });

      return user;
    });

    try {
      await sendVerificationEmail(updatedUser);
      
      res.clearCookie("refreshToken", {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
      });

      return res.json({
        message: "Profile updated. Email changed - please verify your new email address. You have been logged out.",
        user: updatedUser,
        emailChanged: true,
        verificationSent: true,
        loggedOut: true,
      });
    } catch (emailError) {
      console.error("Failed to send verification email:", emailError);
      throw new Error(
        "Profile updated but failed to send verification email. Please contact support."
      );
    }
  }

  const updatedUser = await prisma.user.update({
    where: { id: userId },
    data: updateData,
    select: {
      id: true,
      email: true,
      name: true,
      bio: true,
      profilePhoto: true,
      verified: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  res.json({
    message: "Profile updated successfully",
    user: updatedUser,
  });
});

export const sendVerificationMail = asyncHandler(async (req, res) => {
  const userId = req.user.id;

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, email: true, name: true, verified: true },
  });

  if (!user) {
    throw new NotFoundError("User not found");
  }

  if (user.verified) {
    throw new ValidationError("Email already verified");
  }

  await sendVerificationEmail(user);
  
  res.json({ 
    message: "Verification email sent successfully",
    verificationSent: true,
  });
});

export const verifyUser = asyncHandler(async (req, res) => {
  const { token } = req.params;

  if (!token) {
    throw new ValidationError("Verification token is required");
  }

  const decoded = verifyVerificationToken(token);
  
  if (!decoded || decoded.type !== "verification") {
    throw new ValidationError("Invalid verification token");
  }

  const tokenHash = crypto.createHash('sha256').update(token).digest('hex');

  const storedToken = await prisma.verificationToken.findUnique({
    where: { tokenHash },
  });

  if (!storedToken) {
    throw new NotFoundError("Verification token not found");
  }

  if (storedToken.used) {
    throw new ValidationError("Verification token already used");
  }

  if (new Date() > storedToken.expiresAt) {
    throw new ValidationError("Verification token has expired");
  }

  if (storedToken.userId !== decoded.userId) {
    throw new ValidationError("Invalid verification token");
  }

  const updatedUser = await prisma.$transaction(async (tx) => {
    const user = await tx.user.update({
      where: { id: decoded.userId },
      data: {
        verified: true,
        email: decoded.email,
        updatedAt: new Date(),
      },
      select: {
        id: true,
        email: true,
        name: true,
        verified: true,
      },
    });

    await tx.verificationToken.update({
      where: { tokenHash },
      data: { used: true },
    });

    return user;
  });

  res.json({ 
    message: "Email verified successfully",
    user: updatedUser,
    verified: true,
  });
});