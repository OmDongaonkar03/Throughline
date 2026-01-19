import prisma from "../db/prisma.js";
import crypto from "crypto";
import {
  generateAccessToken,
  generateRefreshToken,
  generateVerificationToken,
  verifyRefreshToken,
  hashPassword,
  comparePassword,
} from "../utils/jwt.js";
import { sendMail } from "../utils/mail.js";
import { verificationEmailTemplate } from "../templates/verificationEmail.js";
import { createDefaultSchedule, createDefaultPlatformSettings, createDefaultNotificationSettings } from "../utils/schedule.js";

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
    throw new Error(
      "Maximum verification emails sent for today. Please try again tomorrow."
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

export const signup = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ message: "All fields are required" });
    }

    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return res.status(400).json({ message: "Email already registered" });
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
          createdAt: now,
          updatedAt: now,
        },
        select: {
          id: true,
          email: true,
          name: true,
          profilePhoto: true,
          verified: true,
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

      await tx.userPlatformSettings.create({
        data: {
          userId: user.id,
          xEnabled: false,
          linkedinEnabled: true,
          redditEnabled: false,
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

    res.cookie("refreshToken", refreshTokenValue, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    res.status(201).json({
      message:
        "User created successfully. Please check your email to verify your account.",
      token: finalAccessToken,
      user: result,
      verificationSent: true,
    });
  } catch (error) {
    console.error("Signup error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res
        .status(400)
        .json({ message: "Email and password are required" });
    }

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const isValidPassword = await comparePassword(password, user.password);
    if (!isValidPassword) {
      return res.status(401).json({ message: "Invalid credentials" });
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
        if (emailError.message.includes("Maximum verification emails")) {
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

    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    res.json({
      message: "Login successful",
      token: accessToken,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        profilePhoto: user.profilePhoto,
        verified: user.verified,
        createdAt: user.createdAt,
      },
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

export const googleCallback = async (req, res) => {
  try {
    const { code } = req.query;

    if (!code) {
      return res
        .status(400)
        .json({ message: "Authorization code not provided" });
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
      throw new Error(
        `Failed to exchange authorization code: ${
          tokenData.error || "Unknown error"
        }`
      );
    }

    const { access_token } = tokenData;

    const userInfoResponse = await fetch(
      "https://www.googleapis.com/oauth2/v2/userinfo",
      {
        headers: {
          Authorization: `Bearer ${access_token}`,
        },
      }
    );

    if (!userInfoResponse.ok) {
      throw new Error("Failed to fetch user info");
    }

    const googleUser = await userInfoResponse.json();
    const { id: googleId, email, name, picture } = googleUser;

    let user = await prisma.user.findUnique({
      where: { email },
    });

    const now = new Date();
    const refreshTokenValue = generateRefreshToken();

    if (user) {
      const result = await prisma.$transaction(async (tx) => {
        const updatedUser = await tx.user.update({
          where: { id: user.id },
          data: {
            googleId: googleId,
            profilePhoto: picture,
            verified: true,
            updatedAt: now,
          },
          select: {
            id: true,
            email: true,
            name: true,
            profilePhoto: true,
            verified: true,
            createdAt: true,
          },
        });

        await tx.refreshToken.create({
          data: {
            token: refreshTokenValue,
            userId: updatedUser.id,
            expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
            createdAt: new Date(),
          },
        });

        return updatedUser;
      });

      user = result;
    } else {
      const result = await prisma.$transaction(async (tx) => {
        const newUser = await tx.user.create({
          data: {
            email,
            name,
            googleId,
            profilePhoto: picture,
            verified: true,
            createdAt: now,
            updatedAt: now,
          },
          select: {
            id: true,
            email: true,
            name: true,
            profilePhoto: true,
            verified: true,
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

        await tx.userPlatformSettings.create({
          data: {
            userId: newUser.id,
            xEnabled: false,
            linkedinEnabled: true,
            redditEnabled: false,
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

        await tx.refreshToken.create({
          data: {
            token: refreshTokenValue,
            userId: newUser.id,
            expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
            createdAt: new Date(),
          },
        });

        return newUser;
      });

      user = result;
    }

    const accessToken = generateAccessToken(user.id);

    res.cookie("refreshToken", refreshTokenValue, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    const frontendUrl = process.env.FRONTEND_URL || "http://localhost:5173";
    res.redirect(`${frontendUrl}/auth/callback?token=${accessToken}`);
  } catch (error) {
    console.error("Google OAuth error:", error);
    const frontendUrl = process.env.FRONTEND_URL || "http://localhost:5173";
    res.redirect(`${frontendUrl}/auth/callback?error=authentication_failed`);
  }
};

export const refresh = async (req, res) => {
  try {
    const { refreshToken } = req.cookies;

    if (!refreshToken) {
      return res.status(401).json({ message: "Refresh token not found" });
    }

    const decoded = verifyRefreshToken(refreshToken);
    if (!decoded) {
      return res.status(401).json({ message: "Invalid refresh token" });
    }

    const storedToken = await prisma.refreshToken.findUnique({
      where: { token: refreshToken },
      include: { user: true },
    });

    if (!storedToken) {
      return res.status(401).json({ message: "Refresh token not found" });
    }

    if (new Date() > storedToken.expiresAt) {
      await prisma.refreshToken.delete({ where: { token: refreshToken } });
      return res.status(401).json({ message: "Refresh token expired" });
    }

    if (!storedToken.user.verified) {
      return res.status(403).json({
        message:
          "Email not verified. Please check your email for verification link.",
        verified: false,
      });
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
        createdAt: storedToken.user.createdAt,
      },
    });
  } catch (error) {
    console.error("Refresh error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

export const me = async (req, res) => {
  try {
    const { refreshToken } = req.cookies;

    if (!refreshToken) {
      return res.status(401).json({ message: "Not authenticated" });
    }

    const decoded = verifyRefreshToken(refreshToken);
    if (!decoded) {
      return res.status(401).json({ message: "Invalid session" });
    }

    const storedToken = await prisma.refreshToken.findUnique({
      where: { token: refreshToken },
      include: { user: true },
    });

    if (!storedToken || new Date() > storedToken.expiresAt) {
      return res.status(401).json({ message: "Session expired" });
    }

    if (!storedToken.user.verified) {
      return res.status(403).json({
        message:
          "Email not verified. Please check your email for verification link.",
        verified: false,
      });
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
        createdAt: storedToken.user.createdAt,
      },
    });
  } catch (error) {
    console.error("Me endpoint error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

export const logout = async (req, res) => {
  try {
    const { refreshToken } = req.cookies;

    if (refreshToken) {
      await prisma.refreshToken.deleteMany({
        where: { token: refreshToken },
      });
    }

    res.clearCookie("refreshToken", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
    });

    res.json({ message: "Logged out successfully" });
  } catch (error) {
    console.error("Logout error:", error);
    res.status(500).json({ message: "Server error" });
  }
};