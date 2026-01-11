import express from "express";
import {
  signup,
  login,
  googleCallback,
  refresh,
  me,
  logout,
} from "../controllers/auth.controller.js";

const router = express.Router();

// POST /auth/signup
router.post("/signup", signup);

// POST /auth/login
router.post("/login", login);

// GET /auth/google/callback
router.get("/google/callback", googleCallback);

// POST /auth/refresh
router.post("/refresh", refresh);

// GET /auth/me
router.get("/me", me);

// POST /auth/logout
router.post("/logout", logout);

export default router;