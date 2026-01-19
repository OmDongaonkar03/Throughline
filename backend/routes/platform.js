import express from "express";
import { authenticate } from "../middleware/auth.js";
import {
  getPlatformSettings,
  updatePlatformSettings,
} from "../controllers/platformSettings.controller.js";
import {
  getPlatformPosts,
  generatePlatformPosts,
  updatePlatformPost,
  getPlatformPostsByDate,
  updatePost, // Import the base post update function
} from "../controllers/platformPosts.controller.js";

const router = express.Router();

// All routes require authentication
router.use(authenticate);

// Platform Settings Routes
router.get("/settings", getPlatformSettings);
router.put("/settings", updatePlatformSettings);

// Platform Posts Routes
router.get("/posts/:postId", getPlatformPosts);
router.post("/posts/:postId/generate", generatePlatformPosts);

// Base Post Update Route
router.put("/posts/base/:postId", updatePost);

// Platform Post Update Route
router.put("/posts/platform/:platformPostId", updatePlatformPost);

router.get("/posts/date/:date", getPlatformPostsByDate);

export default router;