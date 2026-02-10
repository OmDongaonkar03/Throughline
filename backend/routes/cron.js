import express from 'express';
import { checkSchedules } from '../jobs/check-schedules.js';
import { processGenerationJobs } from '../jobs/process-jobs.js';

const router = express.Router();

// Middleware to verify cron requests
const verifyCronSecret = (req, res, next) => {
  const secret = req.headers['x-cron-secret'];
  
  if (!process.env.CRON_SECRET) {
    return res.status(500).json({ error: 'CRON_SECRET not configured' });
  }
  
  if (secret !== process.env.CRON_SECRET) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  
  next();
};

// Health check for cron system
router.get('/health', (req, res) => {
  res.json({ 
    status: 'ok',
    message: 'Cron system is operational',
    timestamp: new Date().toISOString()
  });
});

// Check schedules endpoint (runs every hour)
router.post('/check-schedules', verifyCronSecret, async (req, res) => {
  try {
    console.log('[CRON] Check schedules triggered via GitHub Actions');
    await checkSchedules();
    res.json({ 
      success: true, 
      message: 'Schedules checked successfully',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('[CRON] Error checking schedules:', error);
    res.status(500).json({ 
      success: false,
      error: error.message 
    });
  }
});

// Process jobs endpoint (runs every 15 minutes)
router.post('/process-jobs', verifyCronSecret, async (req, res) => {
  try {
    console.log('[CRON] Process jobs triggered via GitHub Actions');
    await processGenerationJobs();  // Changed from processJobs
    res.json({ 
      success: true, 
      message: 'Jobs processed successfully',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('[CRON] Error processing jobs:', error);
    res.status(500).json({ 
      success: false,
      error: error.message 
    });
  }
});

export default router;