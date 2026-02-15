import rateLimit, { ipKeyGenerator } from "express-rate-limit";
import { RateLimitError } from "../utils/errors.js";

/**
 * Custom rate limit handler that throws RateLimitError
 */
const createRateLimitHandler = (message) => {
  return (req, res) => {
    throw new RateLimitError(message);
  };
};

/**
 * Skip rate limiting in development if SKIP_RATE_LIMIT env var is set
 */
const skipInDevelopment = (req) => {
  return (
    process.env.NODE_ENV === "development" &&
    process.env.SKIP_RATE_LIMIT === "true"
  );
};

/**
 * Global rate limiter - applies to all requests
 * 150 requests per 15 minutes per IP
 */
export const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 150,
  message: "Too many requests from this IP, please try again later.",
  standardHeaders: true, // Return rate limit info in RateLimit-* headers
  legacyHeaders: false, // Disable X-RateLimit-* headers
  keyGenerator: (req) => {
    return req.ip; // Rate limit per IP
  },
  handler: createRateLimitHandler(
    "Too many requests from this IP, please try again later.",
  ),
  skip: skipInDevelopment,
});

/**
 * Authentication rate limiter
 * 10 attempts per 15 minutes per IP
 * Only counts failed attempts
 */
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10,
  message: "Too many authentication attempts, please try again later.",
  skipSuccessfulRequests: true, // Don't count successful logins
  handler: createRateLimitHandler(
    "Too many authentication attempts, please try again later.",
  ),
  skip: skipInDevelopment,
});

/**
 * LLM generation rate limiter
 * 20 requests per hour per user/IP
 * For expensive AI operations
 */
export const llmLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 20,
  message: "Too many generation requests, please try again later.",
  handler: createRateLimitHandler(
    "Too many generation requests, please try again later.",
  ),
  skip: skipInDevelopment,
  // Use user ID if authenticated, otherwise properly normalized IP
  keyGenerator: (req) => {
    return req.user?.id || ipKeyGenerator(req);
  },
});

/**
 * Upload rate limiter
 * 15 uploads per 15 minutes per IP
 */
export const uploadLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 15,
  message: "Too many upload requests, please try again later.",
  handler: createRateLimitHandler(
    "Too many upload requests, please try again later.",
  ),
  skip: skipInDevelopment,
});