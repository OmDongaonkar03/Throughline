import express from 'express';
import {
  extractTone,
  getTone,
  generateDaily,
  getDaily,
  generateWeekly,
  getWeekly,
  generateMonthly,
  getMonthly,
  getRegenStatus,
  getAllPosts,
  getConfig,
} from '../controllers/generation.controller.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

// All generation routes require authentication
router.use(authenticate);

// Tone profile routes
router.post('/tone/extract', extractTone);
router.get('/tone', getTone);

// Daily post routes
router.post('/daily', generateDaily);
router.get('/daily/:date', getDaily);

// Weekly post routes
router.post('/weekly', generateWeekly);
router.get('/weekly/:date', getWeekly);

// Monthly post routes
router.post('/monthly', generateMonthly);
router.get('/monthly/:date', getMonthly);

// Regeneration status
router.get('/regen-status', getRegenStatus);

// General routes
router.get('/posts', getAllPosts);
router.get('/config', getConfig);

export default router;