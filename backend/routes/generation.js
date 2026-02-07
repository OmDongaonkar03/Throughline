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
  regeneratePostById,
  updatePostById,
  getRegenStatus,
  getAllPosts,
  getConfig,
} from '../controllers/generation.controller.js';
import { authenticate } from '../middleware/auth.js';
import { validate, schemas } from '../middleware/validation.js';

const router = express.Router();

router.use(authenticate);

// Tone profile
router.post('/tone/extract', extractTone);
router.get('/tone', getTone);

// Daily posts
router.post('/daily', validate(schemas.generateDaily), generateDaily);
router.get('/daily/:date', validate(schemas.getDaily), getDaily);

// Weekly posts
router.post('/weekly', validate(schemas.generateWeekly), generateWeekly);
router.get('/weekly/:date', validate(schemas.getWeekly), getWeekly);

// Monthly posts
router.post('/monthly', validate(schemas.generateMonthly), generateMonthly);
router.get('/monthly/:date', validate(schemas.getMonthly), getMonthly);

// Post operations
router.post('/posts/:postId/regenerate', regeneratePostById);
router.put('/posts/:postId', updatePostById);

// Stats and config
router.get('/regen-status', getRegenStatus);
router.get('/posts', validate(schemas.getAllPosts), getAllPosts);
router.get('/config', getConfig);

export default router;