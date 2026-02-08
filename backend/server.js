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
import { setupBullBoard } from './queues/index.js';
import { closeRedisConnection } from './utils/redis.js';

const PORT = process.env.PORT || 3000;

// Start the server
const server = app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`API URL: ${process.env.API_URL || `http://localhost:${PORT}`}`);
  console.log(`Frontend URL: ${process.env.FRONTEND_URL}`);
  console.log('='.repeat(60));
  
  // Initialize Bull Board for queue monitoring
  try {
    const serverAdapter = setupBullBoard();
    app.use('/admin/queues', serverAdapter.getRouter());
    console.log('[Server] Bull Board dashboard available at /admin/queues');
  } catch (error) {
    console.error('[Server] Failed to setup Bull Board:', error);
  }
  
  // Start the job scheduler
  try {
    startScheduler();
  } catch (error) {
    console.error('Failed to start scheduler:', error);
  }
});

// Graceful shutdown
const gracefulShutdown = async (signal) => {
  console.log(`\n${signal} signal received: closing HTTP server`);
  
  // Stop cron jobs
  try {
    stopScheduler();
    console.log('Cron scheduler stopped');
  } catch (error) {
    console.error('Error stopping scheduler:', error);
  }
  
  // Close Redis connection
  try {
    await closeRedisConnection();
    console.log('Redis connection closed');
  } catch (error) {
    console.error('Error closing Redis:', error);
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