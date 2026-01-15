import app from './app.js';
import { startScheduler } from './utils/scheduler.js';

const PORT = process.env.PORT || 3000;

// Start the server
const server = app.listen(PORT, () => {
  // Start the job scheduler
  try {
    startScheduler();
  } catch (error) {
    console.error('Failed to start scheduler:', error);
  }
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM signal received: closing HTTP server');
  server.close(() => {
    console.log('HTTP server closed');
  });
});

process.on('SIGINT', () => {
  console.log('\nSIGINT signal received: closing HTTP server');
  server.close(() => {
    console.log('HTTP server closed');
    process.exit(0);
  });
});