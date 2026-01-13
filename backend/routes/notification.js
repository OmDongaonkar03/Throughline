import express from "express";
import {
  getNotificationSettings,
  updateNotificationSettings,
} from "../controllers/notification.controller.js";
import { authenticate } from "../middleware/auth.js";

const router = express.Router();

// GET /notifications - Get user's notification settings
router.get("/", authenticate, getNotificationSettings);

// PUT /notifications - Update notification settings
router.put("/", authenticate, updateNotificationSettings);

export default router;