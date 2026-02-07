import express from "express";
import {
  healthCheck,
  detailedHealthCheck,
  readinessCheck,
  livenessCheck,
} from "../controllers/health.controller.js";

const router = express.Router();
router.get("/", healthCheck);
router.get("/detailed", detailedHealthCheck);
router.get("/ready", readinessCheck);
router.get("/live", livenessCheck);

export default router;