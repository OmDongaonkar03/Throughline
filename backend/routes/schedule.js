import express from "express";
import { authenticate } from "../middleware/auth.js";
import {
  getScheduleSettings,
  updateScheduleSettings,
} from "../controllers/generationSchedule.controller.js";
import { validate, schemas } from "../middleware/validation.js";

const router = express.Router();

router.use(authenticate);

router.get("/settings", getScheduleSettings);
router.put("/settings", validate(schemas.updateScheduleSettings), updateScheduleSettings);

export default router;