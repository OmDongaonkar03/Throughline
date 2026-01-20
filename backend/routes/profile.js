import express from "express";
import {
  updateProfileData,
  sendVerificationMail,
  verifyUser
} from "../controllers/profile.controller.js";
import { authenticate } from "../middleware/auth.js";
import { validate, schemas } from "../middleware/validation.js";

const router = express.Router();

router.put("/update", authenticate, validate(schemas.updateProfile), updateProfileData);
router.post("/verification", authenticate, sendVerificationMail);
router.get("/verify/:token", verifyUser);

export default router;  