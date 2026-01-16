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
router.put("/posts/:platformPostId", updatePlatformPost);
router.get("/posts/date/:date", getPlatformPostsByDate);

export default router;