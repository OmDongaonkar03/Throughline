import express from "express";
import cookieParser from "cookie-parser";
import logger from "morgan";
import cors from "cors";
import dotenv from "dotenv";

import authRoutes from "./routes/auth.js";
import checkinRoutes from "./routes/checkin.js";
import notificationRoutes from "./routes/notification.js";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(
  cors({
    origin: "http://localhost:8080", // your frontend URL
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

// health check
app.get("/health", (req, res) => {
  res.json({ status: "ok" });
});

export default app;
