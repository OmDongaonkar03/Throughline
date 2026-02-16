import { AppError } from "../utils/errors.js";
import logger from "../utils/logger.js";

/**
 * Check if error should be logged as error (vs warn/info)
 * Don't log common expected errors at ERROR level
 */
const shouldLogAsError = (error) => {
  const infoLevelErrors = [400, 401, 403, 404, 429];
  return !infoLevelErrors.includes(error.statusCode);
};

/**
 * Sanitize error message for production
 * Remove sensitive information
 */
const sanitizeErrorMessage = (message) => {
  if (process.env.NODE_ENV !== "production") {
    return message;
  }

  const sensitivePatterns = [
    /password/i,
    /token/i,
    /secret/i,
    /api[_-]?key/i,
    /credential/i,
  ];

  for (const pattern of sensitivePatterns) {
    if (pattern.test(message)) {
      return "An error occurred. Please contact support.";
    }
  }

  return message;
};

/**
 * Log error with appropriate level and structure using Winston
 */
const logError = (error, req) => {
  const logData = {
    requestId: req.id || "unknown",
    statusCode: error.statusCode,
    message: error.message,
    path: req.path,
    method: req.method,
    ip: req.ip,
    userId: req.user?.id,
    userAgent: req.get('user-agent')
  };

  // Add stack trace for actual errors (not client errors)
  if (shouldLogAsError(error) && error.stack) {
    logData.stack = error.stack;
  }

  // Log at appropriate level
  if (shouldLogAsError(error)) {
    logger.error("Request error", logData);
  } else {
    logger.warn("Client error", logData);
  }
};

/**
 * Global error handling middleware
 * Catches all errors thrown in the application
 */
export const errorHandler = (err, req, res, next) => {
  let error = err;

  // Convert non-AppError errors to AppError
  if (!(error instanceof AppError)) {
    const statusCode = error.statusCode || 500;
    const message = error.message || "Internal server error";
    error = new AppError(message, statusCode);
  }

  // Log the error
  logError(error, req);

  const isDevelopment = process.env.NODE_ENV === "development";

  // Build error response
  const response = {
    success: false,
    message: sanitizeErrorMessage(error.message),
    statusCode: error.statusCode,
    timestamp: new Date().toISOString(),
  };

  // Add request ID if available
  if (req.id) {
    response.requestId = req.id;
  }

  // Add debug info in development
  if (isDevelopment) {
    response.stack = error.stack;
    response.error = err;
    response.path = req.path;
    response.method = req.method;
  }

  // Send error response
  res.status(error.statusCode).json(response);
};

/**
 * 404 Not Found handler
 * Handles requests to non-existent routes
 */
export const notFoundHandler = (req, res, next) => {
  const error = new AppError(
    `Route ${req.method} ${req.originalUrl} not found`,
    404,
  );
  next(error);
};