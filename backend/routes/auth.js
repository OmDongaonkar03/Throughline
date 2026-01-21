import express from "express";
import {
  signup,
  login,
  googleCallback,
  refresh,
  me,
  logout,
  forgotPassword,
  validateResetToken,
  resetPassword,
} from "../controllers/auth.controller.js";
import { validate, schemas } from "../middleware/validation.js";

const router = express.Router();

router.post("/signup", validate(schemas.signup), signup);
router.post("/login", validate(schemas.login), login);
router.get("/google/callback", googleCallback);
router.post("/refresh", refresh);
router.get("/me", me);
router.post("/logout", logout);
router.post("/forgot-password", forgotPassword);
router.post("/validate-reset-token", validateResetToken);
router.post("/reset-password", resetPassword);

export default router;