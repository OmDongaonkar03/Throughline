import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";

const JWT_SECRET = process.env.JWT_SECRET;
const JWT_REFRESH_SECRET =
  process.env.JWT_REFRESH_SECRET;
const JWT_VERIFICATION_SECRET =
  process.env.JWT_VERIFICATION_SECRET;

// generate access token (short-lived: 15min)
export const generateAccessToken = (userId) => {
  return jwt.sign({ userId }, JWT_SECRET, { expiresIn: "15m" });
};

// generate refresh token (long-lived: 7 days)
export const generateRefreshToken = (userId) => {
  return jwt.sign({ userId }, JWT_REFRESH_SECRET, { expiresIn: "7d" });
};

// generate verification token (short-lived: 15min)
export const generateVerificationToken = (userId, email) => {
  return jwt.sign({ userId, email, type: "verification" }, JWT_VERIFICATION_SECRET, { 
    expiresIn: "15m" 
  });
};

// verify access token
export const verifyAccessToken = (token) => {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (error) {
    return null;
  }
};

// verify refresh token
export const verifyRefreshToken = (token) => {
  try {
    return jwt.verify(token, JWT_REFRESH_SECRET);
  } catch (error) {
    return null;
  }
};

// verify verification token
export const verifyVerificationToken = (token) => {
  try {
    return jwt.verify(token, JWT_VERIFICATION_SECRET);
  } catch (error) {
    return null;
  }
};

// hash password
export const hashPassword = async (password) => {
  return bcrypt.hash(password, 10);
};

// compare password
export const comparePassword = async (password, hash) => {
  return bcrypt.compare(password, hash);
};