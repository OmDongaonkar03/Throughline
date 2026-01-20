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
  updatePost,
} from "../controllers/platformPosts.controller.js";
import { validate, schemas } from "../middleware/validation.js";

const router = express.Router();

router.use(authenticate);

router.get("/settings", getPlatformSettings);
router.put("/settings", validate(schemas.updatePlatformSettings), updatePlatformSettings);

router.get("/posts/:postId", getPlatformPosts);
router.post("/posts/:postId/generate", generatePlatformPosts);

router.put("/posts/base/:postId", validate(schemas.updateBasePost), updatePost);
router.put("/posts/platform/:platformPostId", validate(schemas.updatePlatformPost), updatePlatformPost);

router.get("/posts/date/:date", validate(schemas.getPlatformPostsByDate), getPlatformPostsByDate);

export default router;