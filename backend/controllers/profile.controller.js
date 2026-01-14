import prisma from "../db/prisma.js";
import crypto from "crypto";
import { generateVerificationToken, verifyVerificationToken } from "../utils/jwt.js";
import { sendMail } from "../utils/mail.js";
import { verificationEmailTemplate } from "../templates/verificationEmail.js";

// Helper function to send verification email
const sendVerificationEmail = async (user, newEmail = null) => {
  const emailToVerify = newEmail || user.email;
  const verificationToken = generateVerificationToken(user.id, emailToVerify);
  const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes
  
  // Create hash of token for storage
  const tokenHash = crypto.createHash('sha256').update(verificationToken).digest('hex');

  // Check rate limit - max 3 verification emails per day
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
    throw new Error("Maximum verification emails sent for today. Please try again tomorrow.");
  }

  // Invalidate all previous unused tokens for this user
  await prisma.verificationToken.updateMany({
    where: {
      userId: user.id,
      used: false,
    },
    data: {
      used: true, // Mark as used to invalidate
    },
  });

  // Store verification token in database with hash
  await prisma.verificationToken.create({
    data: {
      token: verificationToken,
      tokenHash: tokenHash,
      userId: user.id,
      email: emailToVerify,
      expiresAt,
      createdAt: new Date(),
    },
  });

  // Generate verification link
  const frontendUrl = process.env.FRONTEND_URL || "http://localhost:5173";
  const verificationLink = `${frontendUrl}/verify-email?token=${verificationToken}`;

  // Get email template
  const emailContent = verificationEmailTemplate({
    name: user.name,
    verificationLink,
  });

  // Send email
  await sendMail({
    to: emailToVerify,
    subject: emailContent.subject,
    html: emailContent.html,
    text: emailContent.text,
  });
};

export const updateProfileData = async (req, res) => {
  try {
    const userId = req.user.id;
    const { name, bio, email } = req.body;

    // Get current user data
    const currentUser = await prisma.user.findUnique({
      where: { id: userId },
      select: { email: true, name: true, bio: true },
    });

    if (!currentUser) {
      return res.status(404).json({ message: "User not found" });
    }

    // Check if email is being changed
    const emailChanged = email && email !== currentUser.email;

    // If email is being changed, check if new email already exists
    if (emailChanged) {
      const existingUser = await prisma.user.findUnique({
        where: { email },
      });

      if (existingUser) {
        return res.status(400).json({ message: "Email already in use" });
      }
    }

    // Prepare update data
    const updateData = {
      updatedAt: new Date(),
    };

    if (name !== undefined) updateData.name = name;
    if (bio !== undefined) updateData.bio = bio;
    if (emailChanged) {
      updateData.email = email;
      updateData.verified = false; // Set verified to false when email changes
    }

    // Update user
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

    // If email changed, invalidate all refresh tokens and send verification email
    if (emailChanged) {
      // Delete all refresh tokens to log user out
      await prisma.refreshToken.deleteMany({
        where: { userId },
      });

      // Send verification email
      try {
        await sendVerificationEmail(updatedUser);
        
        // Clear the refresh token cookie
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
        return res.status(500).json({ 
          message: "Profile updated but failed to send verification email. Please contact support.",
          user: updatedUser,
          emailChanged: true,
        });
      }
    }

    res.json({
      message: "Profile updated successfully",
      user: updatedUser,
    });
  } catch (error) {
    console.error("Update profile data error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

export const sendVerificationMail = async (req, res) => {
  try {
    const userId = req.user.id;

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, email: true, name: true, verified: true },
    });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (user.verified) {
      return res.status(400).json({ message: "Email already verified" });
    }

    try {
      await sendVerificationEmail(user);
      res.json({ 
        message: "Verification email sent successfully",
        verificationSent: true,
      });
    } catch (emailError) {
      if (emailError.message.includes("Maximum verification emails")) {
        return res.status(429).json({ 
          message: emailError.message,
        });
      }
      throw emailError;
    }
  } catch (error) {
    console.error("Send verification mail error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

export const verifyUser = async (req, res) => {
  try {
    const { token } = req.params;

    if (!token) {
      return res.status(400).json({ message: "Verification token is required" });
    }

    // Verify the JWT token
    const decoded = verifyVerificationToken(token);
    
    if (!decoded || decoded.type !== "verification") {
      return res.status(400).json({ message: "Invalid verification token" });
    }

    // Create hash of the token to look it up in database
    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');

    // Check if token exists in database and is not used
    const storedToken = await prisma.verificationToken.findUnique({
      where: { tokenHash },
    });

    if (!storedToken) {
      return res.status(400).json({ message: "Verification token not found" });
    }

    if (storedToken.used) {
      return res.status(400).json({ message: "Verification token already used" });
    }

    // Check if token has expired
    if (new Date() > storedToken.expiresAt) {
      return res.status(400).json({ message: "Verification token has expired" });
    }

    // Verify that the token matches the user
    if (storedToken.userId !== decoded.userId) {
      return res.status(400).json({ message: "Invalid verification token" });
    }

    // Update user as verified and update email if it was changed
    const updatedUser = await prisma.user.update({
      where: { id: decoded.userId },
      data: {
        verified: true,
        email: decoded.email, // Update to the email in the token (handles email changes)
        updatedAt: new Date(),
      },
      select: {
        id: true,
        email: true,
        name: true,
        verified: true,
      },
    });

    // Mark token as used
    await prisma.verificationToken.update({
      where: { tokenHash },
      data: { used: true },
    });

    res.json({ 
      message: "Email verified successfully",
      user: updatedUser,
      verified: true,
    });
  } catch (error) {
    console.error("Verify user error:", error);
    res.status(500).json({ message: "Server error" });
  }
};