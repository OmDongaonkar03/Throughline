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

// Helper function to send verification email
const sendVerificationEmail = async (user) => {
  const verificationToken = generateVerificationToken(user.id, user.email);
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

  // Store verification token in database with hash
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
    to: user.email,
    subject: emailContent.subject,
    html: emailContent.html,
    text: emailContent.text,
  });
};

// Signup controller
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

    const user = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        verified: false, // Start as unverified
        createdAt: now,
        updatedAt: now,
      },
      select: { id: true, email: true, name: true, profilePhoto: true, verified: true, createdAt: true },
    });

    // Send verification email
    try {
      await sendVerificationEmail(user);
    } catch (emailError) {
      console.error("Failed to send verification email:", emailError);
      // Continue with signup even if email fails
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

    res.status(201).json({
      message: "User created successfully. Please check your email to verify your account.",
      token: accessToken,
      user,
      verificationSent: true,
    });
  } catch (error) {
    console.error("Signup error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Login controller
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

    // If user is not verified, send verification email
    if (!user.verified) {
      try {
        await sendVerificationEmail(user);
        return res.status(403).json({ 
          message: "Email not verified. A new verification link has been sent to your email.",
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

// Google OAuth callback controller
export const googleCallback = async (req, res) => {
  try {
    const { code } = req.query;

    if (!code) {
      return res.status(400).json({ message: "Authorization code not provided" });
    }

    // Exchange code for tokens
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
      throw new Error(`Failed to exchange authorization code: ${tokenData.error || 'Unknown error'}`);
    }

    const { access_token } = tokenData;

    // Get user info from Google
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

    // Check if user exists
    let user = await prisma.user.findUnique({
      where: { email },
    });

    const now = new Date();

    if (user) {
      // Update existing user with Google ID and profile photo if not set
      user = await prisma.user.update({
        where: { id: user.id },
        data: {
          googleId: googleId,
          profilePhoto: picture,
          verified: true, // Google OAuth users are auto-verified
          updatedAt: now,
        },
        select: { 
          id: true, 
          email: true, 
          name: true, 
          profilePhoto: true, 
          verified: true,
          createdAt: true 
        },
      });
    } else {
      // Create new user
      user = await prisma.user.create({
        data: {
          email,
          name,
          googleId,
          profilePhoto: picture,
          verified: true, // Google OAuth users are auto-verified
          createdAt: now,
          updatedAt: now,
        },
        select: { 
          id: true, 
          email: true, 
          name: true, 
          profilePhoto: true,
          verified: true, 
          createdAt: true 
        },
      });
    }

    // Generate tokens
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

    // Redirect to frontend with token
    const frontendUrl = process.env.FRONTEND_URL || "http://localhost:5173";
    res.redirect(`${frontendUrl}/auth/callback?token=${accessToken}`);
  } catch (error) {
    console.error("Google OAuth error:", error);
    const frontendUrl = process.env.FRONTEND_URL || "http://localhost:5173";
    res.redirect(`${frontendUrl}/auth/callback?error=authentication_failed`);
  }
};

// Refresh token controller
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

    // Check if user is verified
    if (!storedToken.user.verified) {
      return res.status(403).json({ 
        message: "Email not verified. Please check your email for verification link.",
        verified: false
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

// Get current user controller
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

    // Check if user is verified
    if (!storedToken.user.verified) {
      return res.status(403).json({ 
        message: "Email not verified. Please check your email for verification link.",
        verified: false
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

// Logout controller
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