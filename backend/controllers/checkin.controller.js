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

export const getCheckInStats = async (req, res) => {
  try {
    const userId = req.user.id;
    const { year } = req.query;

    // Get user's account creation date
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { createdAt: true },
    });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const accountCreationDate = new Date(user.createdAt);
    
    // Determine the year to query
    const targetYear = year ? parseInt(year) : new Date().getFullYear();
    const currentYear = new Date().getFullYear();
    const accountCreationYear = accountCreationDate.getFullYear();

    // Validate year range
    if (targetYear < accountCreationYear || targetYear > currentYear) {
      return res.status(400).json({
        message: "Invalid year. Must be between account creation year and current year",
      });
    }

    // Set date range for the year
    const startDate = new Date(targetYear, 0, 1); // Jan 1
    const endDate = new Date(targetYear, 11, 31, 23, 59, 59, 999); // Dec 31

    // If querying account creation year, start from creation date
    if (targetYear === accountCreationYear) {
      startDate.setTime(accountCreationDate.getTime());
    }

    // If querying current year, end at today
    if (targetYear === currentYear) {
      endDate.setTime(new Date().getTime());
    }

    // Fetch all check-ins for the year
    const checkIns = await prisma.checkIn.findMany({
      where: {
        userId,
        createdAt: {
          gte: startDate,
          lte: endDate,
        },
      },
      select: {
        createdAt: true,
      },
    });

    // Group check-ins by date
    const dailyCounts = {};
    checkIns.forEach((checkIn) => {
      const dateKey = checkIn.createdAt.toISOString().split("T")[0]; // YYYY-MM-DD
      dailyCounts[dateKey] = (dailyCounts[dateKey] || 0) + 1;
    });

    // Calculate total and current streak
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    let currentStreak = 0;
    let checkDate = new Date(today);
    
    while (true) {
      const dateKey = checkDate.toISOString().split("T")[0];
      if (dailyCounts[dateKey]) {
        currentStreak++;
        checkDate.setDate(checkDate.getDate() - 1);
      } else {
        break;
      }
    }

    res.json({
      year: targetYear,
      accountCreationDate: accountCreationDate.toISOString().split("T")[0],
      availableYears: Array.from(
        { length: currentYear - accountCreationYear + 1 },
        (_, i) => accountCreationYear + i
      ),
      dailyCounts,
      totalCheckIns: checkIns.length,
      currentStreak,
      startDate: startDate.toISOString().split("T")[0],
      endDate: endDate.toISOString().split("T")[0],
    });
  } catch (error) {
    console.error("Get check-in stats error:", error);
    res.status(500).json({ message: "Server error" });
  }
};