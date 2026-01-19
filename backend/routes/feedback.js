import express from 'express';
import {
  submitFeedback,
  getFeedback,
} from '../controllers/feedback.controller.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

// All feedback routes require authentication
router.use(authenticate);

// Feedback routes
// POST /feedback and GET /feedback/:postId
router.post('/', submitFeedback);
router.get('/:postId', getFeedback);

export default router;