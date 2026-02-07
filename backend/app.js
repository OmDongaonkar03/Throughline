import dotenv from "dotenv";
dotenv.config();

import express from "express";
import cookieParser from "cookie-parser";
import logger from "morgan";
import cors from "cors";
import * as Sentry from "@sentry/node";

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV || "development",
});

import authRoutes from "./routes/auth.js";
import checkinRoutes from "./routes/checkin.js";
import notificationRoutes from "./routes/notification.js";
import profileRoutes from "./routes/profile.js";
import samplePostRoutes from "./routes/samplePost.js";
import toneProfileRoutes from "./routes/toneProfile.js";
import generationRoutes from "./routes/generation.js";
import feedbackRoutes from "./routes/feedback.js";
import scheduleRoutes from "./routes/schedule.js";
import healthRoutes from "./routes/health.js";

import {
  globalLimiter,
  authLimiter,
  llmLimiter,
} from "./middleware/rateLimiter.js";
import { requestId } from "./middleware/requestId.js";
import { errorHandler, notFoundHandler } from "./middleware/errorHandler.js";

const app = express();
const PORT = process.env.PORT || 3000;

app.use(
  cors({
    origin: process.env.ALLOWED_ORIGINS?.split(","),
    credentials: true,
  }),
);

app.use(requestId);
app.use(logger("dev"));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());

app.use(globalLimiter);

app.use("/auth/login", authLimiter);
app.use("/auth/signup", authLimiter);
app.use("/auth/google/callback", authLimiter);

app.use("/generation", llmLimiter);
app.use("/tone/extract", llmLimiter);

app.use("/auth", authRoutes);
app.use("/checkin", checkinRoutes);
app.use("/notifications", notificationRoutes);
app.use("/profile", profileRoutes);
app.use("/sample", samplePostRoutes);
app.use("/tone", toneProfileRoutes);
app.use("/generation", generationRoutes);
app.use("/feedback", feedbackRoutes);
app.use("/schedule", scheduleRoutes);
app.use("/health", healthRoutes);

app.use(notFoundHandler);
app.use(errorHandler);

// Sentry v8+ integration
Sentry.setupExpressErrorHandler(app);

export default app;