import dotenv from 'dotenv';
dotenv.config();

// Validate environment variables on startup
import { validateEnv, logEnvConfig } from './utils/validateEnv.js';

console.log('='.repeat(60));
console.log('Starting Throughline Backend...');
console.log('='.repeat(60));

try {
  const env = validateEnv();
  logEnvConfig(env);
} catch (error) {
  console.error('Failed to start: Environment validation error');
  process.exit(1);
}

import app from './app.js';
import { startScheduler, stopScheduler } from './utils/scheduler.js';

const PORT = process.env.PORT || 3000;

// Check if internal cron should be disabled
const DISABLE_INTERNAL_CRON = process.env.DISABLE_INTERNAL_CRON === 'true';

// Start the server
const server = app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`API URL: ${process.env.API_URL || `http://localhost:${PORT}`}`);
  console.log(`Frontend URL: ${process.env.FRONTEND_URL}`);
  console.log('='.repeat(60));
  
  // Start the job scheduler
  if (DISABLE_INTERNAL_CRON) {
    console.log('Internal cron scheduler DISABLED');
    console.log('Using external cron triggers (GitHub Actions)');
  } else {
    try {
      startScheduler();
      console.log('Internal cron scheduler ENABLED');
    } catch (error) {
      console.error('Failed to start scheduler:', error);
    }
  }
  
  console.log('='.repeat(60));
});

// Graceful shutdown
const gracefulShutdown = (signal) => {
  console.log(`\n${signal} signal received: closing HTTP server`);
  
  // Stop cron jobs
  if (!DISABLE_INTERNAL_CRON) {
    try {
      stopScheduler();
      console.log('Cron scheduler stopped');
    } catch (error) {
      console.error('Error stopping scheduler:', error);
    }
  }
  
  // Close server
  server.close(() => {
    console.log('HTTP server closed');
    process.exit(0);
  });
  
  // Force close after 10 seconds
  setTimeout(() => {
    console.error('Could not close connections in time, forcefully shutting down');
    process.exit(1);
  }, 10000);
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));