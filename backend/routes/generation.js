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
import { validate, schemas } from '../middleware/validation.js';

const router = express.Router();

router.use(authenticate);

router.post('/tone/extract', extractTone);
router.get('/tone', getTone);

router.post('/daily', validate(schemas.generateDaily), generateDaily);
router.get('/daily/:date', validate(schemas.getDaily), getDaily);

router.post('/weekly', validate(schemas.generateWeekly), generateWeekly);
router.get('/weekly/:date', validate(schemas.getWeekly), getWeekly);

router.post('/monthly', validate(schemas.generateMonthly), generateMonthly);
router.get('/monthly/:date', validate(schemas.getMonthly), getMonthly);

router.get('/regen-status', getRegenStatus);
router.get('/posts', validate(schemas.getAllPosts), getAllPosts);
router.get('/config', getConfig);

export default router;