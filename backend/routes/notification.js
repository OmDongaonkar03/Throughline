import express from "express";
import {
  getNotificationSettings,
  updateNotificationSettings,
} from "../controllers/notification.controller.js";
import { authenticate } from "../middleware/auth.js";
import { validate, schemas } from "../middleware/validation.js";

const router = express.Router();

router.get("/", authenticate, getNotificationSettings);
router.put("/", authenticate, validate(schemas.updateNotificationSettings), updateNotificationSettings);

export default router;