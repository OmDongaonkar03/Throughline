import winston from 'winston';
import path from 'path';

/**
 * Winston Logger Configuration
 * 
 * Log Levels (in order of severity):
 * - error: Errors that need attention
 * - warn: Warning messages
 * - info: General informational messages
 * - debug: Detailed debugging information
 * 
 * Transports:
 * - Console: Always enabled
 * - File: Only in production
 */

// Custom format for development (readable)
const devFormat = winston.format.combine(
  winston.format.colorize(),
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.printf(({ timestamp, level, message, ...metadata }) => {
    let msg = `${timestamp} [${level}] ${message}`;
    
    // Add metadata if present
    if (Object.keys(metadata).length > 0) {
      msg += ` ${JSON.stringify(metadata)}`;
    }
    
    return msg;
  })
);

// Custom format for production (JSON for parsing)
const prodFormat = winston.format.combine(
  winston.format.timestamp(),
  winston.format.errors({ stack: true }),
  winston.format.json()
);

// Determine environment
const isDevelopment = process.env.NODE_ENV !== 'production';
const isProduction = process.env.NODE_ENV === 'production';

// Create logger instance
const logger = winston.createLogger({
  level: isDevelopment ? 'debug' : 'info',
  format: isDevelopment ? devFormat : prodFormat,
  defaultMeta: {
    service: 'throughline-backend',
    environment: process.env.NODE_ENV || 'development'
  },
  transports: [
    // Console transport (always enabled)
    new winston.transports.Console({
      stderrLevels: ['error']
    })
  ]
});

// Add file transports in production
if (isProduction) {
  // Create logs directory if it doesn't exist
  const logsDir = path.join(process.cwd(), 'logs');
  
  // All logs
  logger.add(new winston.transports.File({
    filename: path.join(logsDir, 'combined.log'),
    maxsize: 10485760, // 10MB
    maxFiles: 5
  }));
  
  // Error logs only
  logger.add(new winston.transports.File({
    filename: path.join(logsDir, 'errors.log'),
    level: 'error',
    maxsize: 10485760, // 10MB
    maxFiles: 5
  }));
}

/**
 * Helper function to safely log errors
 * Extracts relevant error information
 */
export const logError = (message, error, context = {}) => {
  logger.error(message, {
    error: {
      message: error.message,
      stack: error.stack,
      name: error.name,
      code: error.code
    },
    ...context
  });
};

/**
 * Helper function to log user actions
 */
export const logUserAction = (action, userId, metadata = {}) => {
  logger.info(`User action: ${action}`, {
    userId,
    action,
    ...metadata
  });
};

/**
 * Helper function to log security events
 */
export const logSecurityEvent = (event, metadata = {}) => {
  logger.warn(`Security event: ${event}`, {
    event,
    ...metadata
  });
};

/**
 * Helper function to log performance metrics
 */
export const logPerformance = (operation, duration, metadata = {}) => {
  const level = duration > 1000 ? 'warn' : 'debug';
  logger[level](`Performance: ${operation}`, {
    operation,
    duration: `${duration}ms`,
    ...metadata
  });
};

export default logger;