import express from "express";
import {
  updateProfileData,
  sendVerificationMail,
  verifyUser
} from "../controllers/profile.controller.js";
import { authenticate } from "../middleware/auth.js";

const router = express.Router();

// PUT /profile/update - Update user's profile (requires auth)
router.put("/update", authenticate, updateProfileData);

// POST /profile/verification - Send mail verification (requires auth)
router.post("/verification", authenticate, sendVerificationMail);

// GET /profile/verify/:token - Verify email with token (no auth required)
router.get("/verify/:token", verifyUser);

export default router;