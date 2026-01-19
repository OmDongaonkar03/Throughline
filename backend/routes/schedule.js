import express from "express";
import { authenticate } from "../middleware/auth.js";
import {
  getScheduleSettings,
  updateScheduleSettings,
} from "../controllers/generationSchedule.controller.js";

const router = express.Router();

// All routes require authentication
router.use(authenticate);

// Schedule Settings Routes
router.get("/settings", getScheduleSettings);
router.put("/settings", updateScheduleSettings);

export default router;