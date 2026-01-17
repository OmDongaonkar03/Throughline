import express from "express";
import cookieParser from "cookie-parser";
import logger from "morgan";
import cors from "cors";
import dotenv from "dotenv";

import authRoutes from "./routes/auth.js";
import checkinRoutes from "./routes/checkin.js";
import notificationRoutes from "./routes/notification.js";
import profileRoutes from "./routes/profile.js";
import samplePostRoutes from "./routes/samplePost.js";
import toneProfileRoutes from "./routes/toneProfile.js";
import generationRoutes from "./routes/generation.js";
import platformRoutes from './routes/platform.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(
  cors({
    origin: ["http://localhost:8080"], // your frontend URL
    credentials: true,
  })
);

app.use(logger("dev"));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());

// routes
app.use("/auth", authRoutes);
app.use("/checkin", checkinRoutes);
app.use("/notifications", notificationRoutes);
app.use("/profile", profileRoutes);
app.use("/sample", samplePostRoutes);
app.use("/tone", toneProfileRoutes);
app.use("/generation", generationRoutes);
app.use("/platform", platformRoutes);

// health check
app.get("/health", (req, res) => {
  res.json({ status: "ok" });
});

export default app;
