import express from "express";
import {
  getToneProfile,
  updateToneProfileCustomizations,
} from "../controllers/toneProfile.controller.js";
import { authenticate } from "../middleware/auth.js";

const router = express.Router();

// GET /tone - Get tone profile for authenticated user
router.get("/", authenticate, getToneProfile);

// PUT /tone - Update tone profile customizations
router.put("/", authenticate, updateToneProfileCustomizations);

export default router;