import express from 'express';
import {
  submitFeedback,
  getFeedback,
} from '../controllers/feedback.controller.js';
import { authenticate } from '../middleware/auth.js';
import { validate, schemas } from '../middleware/validation.js';

const router = express.Router();

router.use(authenticate);

router.post('/', validate(schemas.submitFeedback), submitFeedback);
router.get('/:postId', getFeedback);

export default router;