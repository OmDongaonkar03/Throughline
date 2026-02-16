import logger from '../utils/logger.js';

/**
 * Request Logging Middleware
 * Logs all HTTP requests with relevant metadata
 * 
 * Logs:
 * - Request method and path
 * - Response status code
 * - Response time
 * - User ID (if authenticated)
 * - IP address
 * - Request ID
 */
export const requestLogger = (req, res, next) => {
  const startTime = Date.now();
  
  // Capture original response methods
  const originalSend = res.send;
  const originalJson = res.json;
  
  // Track if response has been logged
  let logged = false;
  
  const logRequest = () => {
    if (logged) return;
    logged = true;
    
    const duration = Date.now() - startTime;
    const statusCode = res.statusCode;
    
    // Determine log level based on status code
    let level = 'info';
    if (statusCode >= 500) {
      level = 'error';
    } else if (statusCode >= 400) {
      level = 'warn';
    }
    
    // Build log metadata
    const metadata = {
      method: req.method,
      path: req.path,
      status: statusCode,
      duration: `${duration}ms`,
      ip: req.ip,
      userAgent: req.get('user-agent'),
      requestId: req.id
    };
    
    // Add user ID if authenticated
    if (req.user?.id) {
      metadata.userId = req.user.id;
    }
    
    // Add query params if present (excluding sensitive data)
    if (Object.keys(req.query).length > 0) {
      const safeQuery = { ...req.query };
      // Remove potentially sensitive query params
      delete safeQuery.token;
      delete safeQuery.password;
      if (Object.keys(safeQuery).length > 0) {
        metadata.query = safeQuery;
      }
    }
    
    logger[level]('HTTP Request', metadata);
  };
  
  // Override res.send
  res.send = function(data) {
    logRequest();
    return originalSend.call(this, data);
  };
  
  // Override res.json
  res.json = function(data) {
    logRequest();
    return originalJson.call(this, data);
  };
  
  // Fallback: log on response finish
  res.on('finish', () => {
    logRequest();
  });
  
  next();
};

/**
 * Skip logging for specific paths
 * Useful for health checks that spam logs
 */
export const skipHealthCheckLogs = (req, res, next) => {
  // Skip logging for health check endpoint
  if (req.path === '/health') {
    return next();
  }
  
  requestLogger(req, res, next);
};