import { verifyAccessToken } from "../utils/jwt.js";
import prisma from "../db/prisma.js";
import { asyncHandler } from "./asyncHandler.js";
import {
  AuthenticationError,
  AuthorizationError,
  DatabaseError,
} from "../utils/errors.js";

/**
 * Protect routes that require authentication
 * Verifies JWT token and attaches user to request
 */
export const authenticate = asyncHandler(async (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    throw new AuthenticationError("No token provided");
  }

  const token = authHeader.split(" ")[1];

  if (!token) {
    throw new AuthenticationError("Malformed token");
  }

  const decoded = verifyAccessToken(token);

  if (!decoded) {
    throw new AuthenticationError("Invalid or expired token");
  }

  let user;
  try {
    user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: {
        id: true,
        email: true,
        name: true,
        verified: true,
        createdAt: true,
        updatedAt: true,
      },
    });
  } catch (error) {
    throw new DatabaseError(`Failed to fetch user: ${error.message}`);
  }

  if (!user) {
    throw new AuthenticationError("User not found");
  }

  if (!user.verified) {
    throw new AuthorizationError(
      "Email not verified. Please check your email for verification link.",
    );
  }

  req.user = user;
  next();
});
