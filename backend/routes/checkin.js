import express from "express";
import {createCheckIn, getCheckIns, getCheckInStats} from "../controllers/checkin.controller.js";
import { authenticate } from "../middleware/auth.js";
import { validate, schemas } from "../middleware/validation.js";

const router = express.Router();

router.get("/stats", authenticate, validate(schemas.getCheckInStats), getCheckInStats);
router.post("/", authenticate, validate(schemas.createCheckIn), createCheckIn);
router.get("/", authenticate, validate(schemas.getCheckIns), getCheckIns);

export default router;