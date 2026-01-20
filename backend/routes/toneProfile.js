import express from "express";
import {
  getToneProfile,
  updateToneProfileCustomizations,
} from "../controllers/toneProfile.controller.js";
import { authenticate } from "../middleware/auth.js";
import { validate, schemas } from "../middleware/validation.js";

const router = express.Router();

router.get("/", authenticate, getToneProfile);
router.put("/", authenticate, validate(schemas.updateToneProfile), updateToneProfileCustomizations);

export default router;