import express from "express";
import {createCheckIn, getCheckIns} from "../controllers/checkin.controller.js";
import { authenticate } from "../middleware/auth.js";

const router = express.Router();

// POST /checkin - Create a new check-in
router.post("/", authenticate, createCheckIn);

// GET /checkin?date=YYYY-MM-DD - Get check-ins for a specific date
router.get("/", authenticate, getCheckIns);

export default router;