import prisma from "../db/prisma.js";
import crypto from "crypto";
import {
  generateAccessToken,
  generateRefreshToken,
  generateVerificationToken,
  generatePasswordResetToken,
  verifyRefreshToken,
  verifyPasswordResetToken,
  verifyAccessToken,
  hashPassword,
  comparePassword,
  validatePassword,
} from "../utils/jwt.js";
import { sendMail } from "../utils/mail.js";
import { verificationEmailTemplate } from "../templates/verificationEmail.js";
import { passwordResetEmailTemplate } from "../templates/passwordResetEmail.js";
import { asyncHandler } from "../middleware/asyncHandler.js";
import {
  ValidationError,
  AuthenticationError,
  AuthorizationError,
  ConflictError,
  RateLimitError,
} from "../utils/errors.js";

const sendVerificationEmail = async (user) => {
  const verificationToken = generateVerificationToken(user.id, user.email);
  const expiresAt = new Date(Date.now() + 15 * 60 * 1000);

  const tokenHash = crypto
    .createHash("sha256")
    .update(verificationToken)
    .digest("hex");

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
      "Maximum verification emails sent for today. Please try again tomorrow.",
    );
  }

  await prisma.verificationToken.create({
    data: {
      token: verificationToken,
      tokenHash: tokenHash,
      userId: user.id,
      email: user.email,
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
    to: user.email,
    subject: emailContent.subject,
    html: emailContent.html,
    text: emailContent.text,
  });
};

export const signup = asyncHandler(async (req, res) => {
  const { name, email, password } = req.body;

  if (!name || !email || !password) {
    throw new ValidationError("All fields are required");
  }

  if (!validatePassword(password)) {
    throw new ValidationError(
      "Password must be at least 8 characters long and contain at least one uppercase letter, one lowercase letter, and one special character (@$!%*?&)",
    );
  }

  const existingUser = await prisma.user.findUnique({ where: { email } });
  if (existingUser) {
    throw new ConflictError("Email already registered");
  }

  const hashedPassword = await hashPassword(password);
  const now = new Date();
  const accessToken = generateAccessToken();
  const refreshTokenValue = generateRefreshToken();

  const result = await prisma.$transaction(async (tx) => {
    const user = await tx.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        verified: false,
        hasCompletedOnboarding: false,
        createdAt: now,
        updatedAt: now,
      },
      select: {
        id: true,
        email: true,
        name: true,
        profilePhoto: true,
        verified: true,
        hasCompletedOnboarding: true,
        createdAt: true,
      },
    });

    await tx.generationSchedule.create({
      data: {
        userId: user.id,
        dailyEnabled: true,
        dailyTime: "21:00",
        weeklyEnabled: true,
        weeklyDay: 0,
        weeklyTime: "20:00",
        monthlyEnabled: true,
        monthlyDay: 28,
        monthlyTime: "20:00",
        timezone: process.env.TZ || "Asia/Kolkata",
      },
    });

    await tx.notificationSettings.create({
      data: {
        userId: user.id,
        emailDigest: false,
        postReminders: true,
        weeklyReport: false,
      },
    });

    await tx.refreshToken.create({
      data: {
        token: refreshTokenValue,
        userId: user.id,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        createdAt: new Date(),
      },
    });

    return user;
  });

  try {
    await sendVerificationEmail(result);
  } catch (emailError) {
    console.error("Failed to send verification email:", emailError);
  }

  const finalAccessToken = generateAccessToken(result.id);

  const cookieOptions = {
    httpOnly: true,
    maxAge: 7 * 24 * 60 * 60 * 1000,
  };
  if (process.env.NODE_ENV === "production") {
    cookieOptions.secure = true;
    cookieOptions.sameSite = "None";
  } else {
    cookieOptions.sameSite = "lax";
  }
  res.cookie("refreshToken", refreshTokenValue, cookieOptions);

  res.status(201).json({
    message:
      "User created successfully. Please check your email to verify your account.",
    token: finalAccessToken,
    user: result,
    verificationSent: true,
  });
});

export const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    throw new ValidationError("Email and password are required");
  }

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    throw new AuthenticationError("Invalid credentials");
  }

  // Check if user signed up with Google OAuth (no password set)
  if (!user.password && user.googleId) {
    throw new AuthenticationError(
      "This account was created using Google sign-in. Please use the 'Continue with Google' button to login.",
    );
  }

  if (!user.password) {
    throw new AuthenticationError("Invalid credentials");
  }

  const isValidPassword = await comparePassword(user.password, password);
  if (!isValidPassword) {
    throw new AuthenticationError("Invalid credentials");
  }

  if (!user.verified) {
    try {
      await sendVerificationEmail(user);
      return res.status(403).json({
        message:
          "Email not verified. A new verification link has been sent to your email.",
        verified: false,
        verificationSent: true,
      });
    } catch (emailError) {
      if (emailError instanceof RateLimitError) {
        return res.status(429).json({
          message: emailError.message,
          verified: false,
        });
      }
      return res.status(403).json({
        message: "Email not verified. Please contact support.",
        verified: false,
      });
    }
  }

  const accessToken = generateAccessToken(user.id);
  const refreshToken = generateRefreshToken(user.id);

  await prisma.refreshToken.create({
    data: {
      token: refreshToken,
      userId: user.id,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      createdAt: new Date(),
    },
  });

  const cookieOptions = {
    httpOnly: true,
    maxAge: 7 * 24 * 60 * 60 * 1000,
  };
  if (process.env.NODE_ENV === "production") {
    cookieOptions.secure = true;
    cookieOptions.sameSite = "None";
  } else {
    cookieOptions.sameSite = "lax";
  }
  res.cookie("refreshToken", refreshToken, cookieOptions);

  res.json({
    message: "Login successful",
    token: accessToken,
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      profilePhoto: user.profilePhoto,
      verified: user.verified,
      hasCompletedOnboarding: user.hasCompletedOnboarding,
      createdAt: user.createdAt,
    },
  });
});

export const googleCallback = asyncHandler(async (req, res) => {
  const { code } = req.query;

  if (!code) {
    throw new ValidationError("Authorization code not provided");
  }

  const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      code,
      client_id: process.env.GOOGLE_CLIENT_ID,
      client_secret: process.env.GOOGLE_CLIENT_SECRET,
      redirect_uri: `${process.env.API_URL}/auth/google/callback`,
      grant_type: "authorization_code",
    }),
  });

  const tokenData = await tokenResponse.json();

  if (!tokenResponse.ok) {
    console.error("Google token exchange error:", tokenData);
    const frontendUrl = process.env.FRONTEND_URL || "http://localhost:5173";
    return res.redirect(
      `${frontendUrl}/auth/callback?error=authentication_failed`,
    );
  }

  const { access_token } = tokenData;

  const userInfoResponse = await fetch(
    "https://www.googleapis.com/oauth2/v2/userinfo",
    {
      headers: {
        Authorization: `Bearer ${access_token}`,
      },
    },
  );

  const userInfo = await userInfoResponse.json();

  if (!userInfoResponse.ok) {
    console.error("Google user info error:", userInfo);
    const frontendUrl = process.env.FRONTEND_URL || "http://localhost:5173";
    return res.redirect(
      `${frontendUrl}/auth/callback?error=authentication_failed`,
    );
  }

  const { id: googleId, email, name, picture } = userInfo;

  let user = await prisma.user.findUnique({ where: { googleId } });

  const refreshTokenValue = generateRefreshToken();

  if (!user) {
    const existingUserByEmail = await prisma.user.findUnique({
      where: { email },
      select: {
        id: true,
        email: true,
        name: true,
        profilePhoto: true,
        verified: true,
        hasCompletedOnboarding: true,
        googleId: true,
        createdAt: true,
      },
    });

    if (existingUserByEmail) {
      user = await prisma.user.update({
        where: { email },
        data: {
          googleId,
          verified: true,
          profilePhoto: picture || existingUserByEmail.profilePhoto,
          updatedAt: new Date(),
        },
        select: {
          id: true,
          email: true,
          name: true,
          profilePhoto: true,
          verified: true,
          hasCompletedOnboarding: true,
          createdAt: true,
        },
      });
    } else {
      // New user - create account
      user = await prisma.$transaction(async (tx) => {
        const newUser = await tx.user.create({
          data: {
            googleId,
            email,
            name,
            profilePhoto: picture,
            verified: true,
            hasCompletedOnboarding: false,
          },
          select: {
            id: true,
            email: true,
            name: true,
            profilePhoto: true,
            verified: true,
            hasCompletedOnboarding: true,
            createdAt: true,
          },
        });

        await tx.generationSchedule.create({
          data: {
            userId: newUser.id,
            dailyEnabled: true,
            dailyTime: "21:00",
            weeklyEnabled: true,
            weeklyDay: 0,
            weeklyTime: "20:00",
            monthlyEnabled: true,
            monthlyDay: 28,
            monthlyTime: "20:00",
            timezone: process.env.TZ || "Asia/Kolkata",
          },
        });

        await tx.notificationSettings.create({
          data: {
            userId: newUser.id,
            emailDigest: false,
            postReminders: true,
            weeklyReport: false,
          },
        });

        return newUser;
      });
    }
  }

  await prisma.refreshToken.create({
    data: {
      token: refreshTokenValue,
      userId: user.id,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      createdAt: new Date(),
    },
  });

  const accessToken = generateAccessToken(user.id);
  const frontendUrl = process.env.FRONTEND_URL || "http://localhost:5173";

  const cookieOptions = {
    httpOnly: true,
    maxAge: 7 * 24 * 60 * 60 * 1000,
  };
  if (process.env.NODE_ENV === "production") {
    cookieOptions.secure = true;
    cookieOptions.sameSite = "None";
  } else {
    cookieOptions.sameSite = "lax";
  }
  res.cookie("refreshToken", refreshTokenValue, cookieOptions);

  const userData = encodeURIComponent(
    JSON.stringify({
      id: user.id,
      email: user.email,
      name: user.name,
      profilePhoto: user.profilePhoto,
      verified: user.verified,
      hasCompletedOnboarding: user.hasCompletedOnboarding,
      createdAt: user.createdAt,
    }),
  );

  res.redirect(
    `${frontendUrl}/auth/callback?token=${accessToken}&user=${userData}`,
  );
});

export const refresh = asyncHandler(async (req, res) => {
  const { refreshToken } = req.cookies;

  if (!refreshToken) {
    throw new AuthenticationError("No refresh token provided");
  }

  const decoded = verifyRefreshToken(refreshToken);
  if (!decoded) {
    throw new AuthenticationError("Invalid refresh token");
  }

  const storedToken = await prisma.refreshToken.findUnique({
    where: { token: refreshToken },
    include: { user: true },
  });

  if (!storedToken) {
    throw new AuthenticationError("Invalid refresh token");
  }

  if (new Date() > storedToken.expiresAt) {
    await prisma.refreshToken.delete({ where: { token: refreshToken } });
    throw new AuthenticationError("Refresh token expired");
  }

  if (!storedToken.user.verified) {
    throw new AuthorizationError(
      "Email not verified. Please check your email for verification link.",
    );
  }

  const newAccessToken = generateAccessToken(storedToken.userId);

  res.json({
    token: newAccessToken,
    user: {
      id: storedToken.user.id,
      email: storedToken.user.email,
      name: storedToken.user.name,
      profilePhoto: storedToken.user.profilePhoto,
      verified: storedToken.user.verified,
      hasCompletedOnboarding: storedToken.user.hasCompletedOnboarding,
      createdAt: storedToken.user.createdAt,
    },
  });
});

export const me = asyncHandler(async (req, res) => {
  const { refreshToken } = req.cookies;

  if (!refreshToken) {
    throw new AuthenticationError("Not authenticated");
  }

  const decoded = verifyRefreshToken(refreshToken);
  if (!decoded) {
    throw new AuthenticationError("Invalid session");
  }

  const storedToken = await prisma.refreshToken.findUnique({
    where: { token: refreshToken },
    include: { user: true },
  });

  if (!storedToken || new Date() > storedToken.expiresAt) {
    throw new AuthenticationError("Session expired");
  }

  if (!storedToken.user.verified) {
    throw new AuthorizationError(
      "Email not verified. Please check your email for verification link.",
    );
  }

  const newAccessToken = generateAccessToken(storedToken.userId);

  res.json({
    token: newAccessToken,
    user: {
      id: storedToken.user.id,
      email: storedToken.user.email,
      name: storedToken.user.name,
      bio: storedToken.user.bio,
      profilePhoto: storedToken.user.profilePhoto,
      verified: storedToken.user.verified,
      hasCompletedOnboarding: storedToken.user.hasCompletedOnboarding,
      createdAt: storedToken.user.createdAt,
    },
  });
});

export const logout = asyncHandler(async (req, res) => {
  const { refreshToken } = req.cookies;

  if (refreshToken) {
    await prisma.refreshToken.deleteMany({
      where: { token: refreshToken },
    });
  }

  const cookieOptions = {
    httpOnly: true,
  };
  if (process.env.NODE_ENV === "production") {
    cookieOptions.secure = true;
    cookieOptions.sameSite = "None";
  } else {
    cookieOptions.sameSite = "lax";
  }
  res.clearCookie("refreshToken", cookieOptions);

  res.json({ message: "Logged out successfully" });
});

export const forgotPassword = asyncHandler(async (req, res) => {
  const { email } = req.body;

  if (!email) {
    throw new ValidationError("Email is required");
  }

  const successMessage =
    "If an account exists with this email, you will receive a password reset link.";

  const user = await prisma.user.findUnique({ where: { email } });

  if (!user) {
    return res.json({ message: successMessage });
  }

  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);

  const tokensSentToday = await prisma.passwordResetToken.count({
    where: {
      userId: user.id,
      createdAt: {
        gte: startOfDay,
      },
    },
  });

  if (tokensSentToday >= 3) {
    console.log(`Rate limit hit for password reset: ${email}`);
    return res.json({ message: successMessage });
  }

  const resetToken = generatePasswordResetToken(user.id, user.email);
  const expiresAt = new Date(Date.now() + 15 * 60 * 1000);

  const tokenHash = crypto
    .createHash("sha256")
    .update(resetToken)
    .digest("hex");

  await prisma.passwordResetToken.create({
    data: {
      token: resetToken,
      tokenHash: tokenHash,
      userId: user.id,
      email: user.email,
      used: false,
      expiresAt,
      createdAt: new Date(),
    },
  });

  const frontendUrl = process.env.FRONTEND_URL || "http://localhost:5173";
  const resetLink = `${frontendUrl}/reset-password?token=${resetToken}`;

  const emailContent = passwordResetEmailTemplate({
    name: user.name,
    resetLink,
  });

  try {
    await sendMail({
      to: user.email,
      subject: emailContent.subject,
      html: emailContent.html,
      text: emailContent.text,
    });
  } catch (emailError) {
    console.error("Failed to send password reset email:", emailError);
  }

  res.json({ message: successMessage });
});

export const validateResetToken = asyncHandler(async (req, res) => {
  const { token } = req.body;

  if (!token) {
    throw new ValidationError("Token is required");
  }

  const decoded = verifyPasswordResetToken(token);
  if (!decoded) {
    return res.status(400).json({
      valid: false,
      message: "Invalid or expired reset token",
    });
  }

  const tokenHash = crypto.createHash("sha256").update(token).digest("hex");

  const storedToken = await prisma.passwordResetToken.findUnique({
    where: { tokenHash },
  });

  if (!storedToken) {
    return res.status(400).json({
      valid: false,
      message: "Invalid reset token",
    });
  }

  if (new Date() > storedToken.expiresAt) {
    return res.status(400).json({
      valid: false,
      message:
        "Reset token has expired. Please request a new password reset link.",
    });
  }

  if (storedToken.used) {
    return res.status(400).json({
      valid: false,
      message:
        "This reset link has already been used. Please request a new password reset if needed.",
    });
  }

  res.json({
    valid: true,
    message: "Token is valid",
  });
});

export const resetPassword = asyncHandler(async (req, res) => {
  const { token, newPassword } = req.body;

  if (!token || !newPassword) {
    throw new ValidationError("Token and new password are required");
  }

  if (!validatePassword(newPassword)) {
    throw new ValidationError(
      "Password must be at least 8 characters long and contain at least one uppercase letter, one lowercase letter, and one special character (@$!%*?&)",
    );
  }

  const decoded = verifyPasswordResetToken(token);
  if (!decoded) {
    throw new AuthenticationError("Invalid or expired reset token");
  }

  const tokenHash = crypto.createHash("sha256").update(token).digest("hex");

  const storedToken = await prisma.passwordResetToken.findUnique({
    where: { tokenHash },
    include: { user: true },
  });

  if (!storedToken) {
    throw new AuthenticationError("Invalid reset token");
  }

  if (new Date() > storedToken.expiresAt) {
    throw new AuthenticationError("Reset token has expired");
  }

  if (storedToken.used) {
    throw new AuthenticationError("Reset token has already been used");
  }

  if (
    storedToken.email !== decoded.email ||
    storedToken.userId !== decoded.userId
  ) {
    throw new AuthenticationError("Invalid reset token");
  }

  const isSamePassword = await comparePassword(
    newPassword,
    storedToken.user.password,
  );
  if (isSamePassword) {
    throw new ValidationError(
      "New password must be different from your current password",
    );
  }

  const hashedPassword = await hashPassword(newPassword);

  // Use transaction with atomic update to prevent token reuse
  const result = await prisma.$transaction(async (tx) => {
    // Update user password
    await tx.user.update({
      where: { id: storedToken.userId },
      data: {
        password: hashedPassword,
        updatedAt: new Date(),
      },
    });

    // Mark token as used atomically - only updates if not already used
    const tokenUpdate = await tx.passwordResetToken.updateMany({
      where: {
        tokenHash,
        used: false, // Only update if not already used
      },
      data: { used: true },
    });

    // If no rows were updated, token was already used (race condition)
    if (tokenUpdate.count === 0) {
      throw new AuthenticationError("Reset token has already been used");
    }

    // Invalidate all existing sessions
    await tx.refreshToken.deleteMany({
      where: { userId: storedToken.userId },
    });

    return tokenUpdate;
  });

  res.json({
    message: "Password reset successful. Please login with your new password.",
  });
});

export const completeOnboarding = asyncHandler(async (req, res) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    throw new AuthenticationError("No access token provided");
  }

  const token = authHeader.substring(7);
  const decoded = verifyAccessToken(token);

  if (!decoded) {
    throw new AuthenticationError("Invalid access token");
  }

  const userId = decoded.userId;

  const user = await prisma.user.update({
    where: { id: userId },
    data: {
      hasCompletedOnboarding: true,
      updatedAt: new Date(),
    },
    select: {
      id: true,
      email: true,
      name: true,
      bio: true,
      profilePhoto: true,
      verified: true,
      hasCompletedOnboarding: true,
      createdAt: true,
    },
  });

  res.json({
    message: "Onboarding completed successfully",
    user,
  });
});