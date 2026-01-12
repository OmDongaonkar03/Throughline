import prisma from "../db/prisma.js";
import DOMPurify from "dompurify";
import { JSDOM } from "jsdom";

// Create DOMPurify instance for server-side sanitization
const window = new JSDOM("").window;
const purify = DOMPurify(window);

export const createCheckIn = async (req, res) => {
  try {
    const { content } = req.body;
    const userId = req.user.id; // From authenticate middleware

    // Validation
    if (!content || typeof content !== "string") {
      return res.status(400).json({ message: "Content is required" });
    }

    if (content.trim().length === 0) {
      return res.status(400).json({ message: "Content cannot be empty" });
    }

    if (content.length > 1500) {
      return res.status(400).json({ message: "Content exceeds maximum length" });
    }

    // Check daily limit (24 check-ins per day)
    const now = new Date();
    const startOfDay = new Date(now);
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date(now);
    endOfDay.setHours(23, 59, 59, 999);

    const todayCount = await prisma.checkIn.count({
      where: {
        userId,
        createdAt: {
          gte: startOfDay,
          lte: endOfDay,
        },
      },
    });

    if (todayCount >= 24) {
      return res.status(429).json({ 
        message: "Daily check-in limit reached (24 per day)" 
      });
    }

    // Sanitize content to prevent XSS
    const sanitizedContent = purify.sanitize(content.trim(), {
      ALLOWED_TAGS: [], // Strip all HTML tags
      ALLOWED_ATTR: [], // Strip all attributes
    });

    // Create check-in with backend timestamp
    const checkIn = await prisma.checkIn.create({
      data: {
        userId,
        content: sanitizedContent,
        createdAt: now,
      },
      select: {
        id: true,
        content: true,
        createdAt: true,
        userId: true,
      },
    });

    res.status(201).json({
      message: "Check-in created successfully",
      checkIn,
    });
  } catch (error) {
    console.error("Create check-in error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

export const getCheckIns = async (req, res) => {
  try {
    const { date } = req.query; // Expected format: YYYY-MM-DD
    const userId = req.user.id; // From authenticate middleware

    // Validation
    if (!date) {
      return res.status(400).json({ message: "Date parameter is required" });
    }

    // Parse and validate date format
    const targetDate = new Date(date);
    if (isNaN(targetDate.getTime())) {
      return res.status(400).json({ message: "Invalid date format" });
    }

    // Set start and end of day for the query
    const startOfDay = new Date(targetDate);
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date(targetDate);
    endOfDay.setHours(23, 59, 59, 999);

    // Fetch check-ins for the specific date
    const checkIns = await prisma.checkIn.findMany({
      where: {
        userId,
        createdAt: {
          gte: startOfDay,
          lte: endOfDay,
        },
      },
      select: {
        id: true,
        content: true,
        createdAt: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    res.json({
      date,
      count: checkIns.length,
      checkIns,
    });
  } catch (error) {
    console.error("Get check-ins error:", error);
    res.status(500).json({ message: "Server error" });
  }
};