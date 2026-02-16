import dotenv from 'dotenv';
dotenv.config();

// Validate environment variables on startup
import { validateEnv, logEnvConfig } from './utils/validateEnv.js';
import logger from './utils/logger.js';

logger.info("Throughline Backend starting...");

try {
  const env = validateEnv();
  logEnvConfig(env);
} catch (error) {
  logger.error("Environment validation failed", {
    error: error.message
  });
  process.exit(1);
}

import app from './app.js';
import { startScheduler, stopScheduler } from './utils/scheduler.js';

const PORT = process.env.PORT || 3000;

// Check if internal cron should be disabled
const DISABLE_INTERNAL_CRON = process.env.DISABLE_INTERNAL_CRON === 'true';

// Start the server
const server = app.listen(PORT, () => {
  logger.info("Server started successfully", {
    port: PORT,
    apiUrl: process.env.API_URL || `http://localhost:${PORT}`,
    frontendUrl: process.env.FRONTEND_URL,
    nodeEnv: process.env.NODE_ENV || 'development'
  });
  
  // Start the job scheduler
  if (DISABLE_INTERNAL_CRON) {
    logger.info("Cron scheduler disabled", {
      reason: "using_external_triggers",
      method: "github_actions"
    });
  } else {
    try {
      startScheduler();
      logger.info("Cron scheduler enabled");
    } catch (error) {
      logger.error("Failed to start scheduler", {
        error: error.message,
        stack: error.stack
      });
    }
  }
});

// Graceful shutdown
const gracefulShutdown = (signal) => {
  logger.info("Shutdown signal received", { signal });
  
  // Stop cron jobs
  if (!DISABLE_INTERNAL_CRON) {
    try {
      stopScheduler();
      logger.info("Cron scheduler stopped");
    } catch (error) {
      logger.error("Error stopping scheduler", {
        error: error.message
      });
    }
  }
  
  // Close server
  server.close(() => {
    logger.info("HTTP server closed");
    process.exit(0);
  });
  
  // Force close after 10 seconds
  setTimeout(() => {
    logger.error("Could not close connections in time, forcefully shutting down");
    process.exit(1);
  }, 10000);
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// Unhandled errors
process.on('uncaughtException', (err) => {
  logger.error("Uncaught Exception", {
    error: err.message,
    stack: err.stack
  });
  process.exit(1);
});

process.on('unhandledRejection', (reason) => {
  logger.error("Unhandled Rejection", {
    reason: reason?.message || reason,
    stack: reason?.stack
  });
});