import express from "express";
import {createCheckIn, getCheckIns, getCheckInStats} from "../controllers/checkin.controller.js";
import { authenticate } from "../middleware/auth.js";

const router = express.Router();

// GET /checkin/stats - Get check-in statistics
router.get("/stats", authenticate, getCheckInStats);

// POST /checkin - Create a new check-in
router.post("/", authenticate, createCheckIn);

// GET /checkin?date=YYYY-MM-DD - Get check-ins for a specific date
router.get("/", authenticate, getCheckIns);

export default router;