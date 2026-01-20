import prisma from "../db/prisma.js";
import DOMPurify from "dompurify";
import { JSDOM } from "jsdom";
import { asyncHandler } from "../middleware/asyncHandler.js";
import { ValidationError, RateLimitError } from "../utils/errors.js";

const window = new JSDOM("").window;
const purify = DOMPurify(window);

export const createCheckIn = asyncHandler(async (req, res) => {
  const { content } = req.body;
  const userId = req.user.id;

  if (!content || typeof content !== "string") {
    throw new ValidationError("Content is required");
  }

  if (content.trim().length === 0) {
    throw new ValidationError("Content cannot be empty");
  }

  if (content.length > 1500) {
    throw new ValidationError("Content exceeds maximum length");
  }

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
    throw new RateLimitError("Daily check-in limit reached (24 per day)");
  }

  const sanitizedContent = purify.sanitize(content.trim(), {
    ALLOWED_TAGS: [],
    ALLOWED_ATTR: [],
  });

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
});

export const getCheckIns = asyncHandler(async (req, res) => {
  const { date } = req.query;
  const userId = req.user.id;

  if (!date) {
    throw new ValidationError("Date parameter is required");
  }

  const targetDate = new Date(date);
  if (isNaN(targetDate.getTime())) {
    throw new ValidationError("Invalid date format");
  }

  const startOfDay = new Date(targetDate);
  startOfDay.setHours(0, 0, 0, 0);

  const endOfDay = new Date(targetDate);
  endOfDay.setHours(23, 59, 59, 999);

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
});

export const getCheckInStats = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const { year } = req.query;

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { createdAt: true },
  });

  if (!user) {
    throw new NotFoundError("User not found");
  }

  const accountCreationDate = new Date(user.createdAt);
  const targetYear = year ? parseInt(year) : new Date().getFullYear();
  const currentYear = new Date().getFullYear();
  const accountCreationYear = accountCreationDate.getFullYear();

  if (targetYear < accountCreationYear || targetYear > currentYear) {
    throw new ValidationError(
      "Invalid year. Must be between account creation year and current year"
    );
  }

  const startDate = new Date(targetYear, 0, 1);
  const endDate = new Date(targetYear, 11, 31, 23, 59, 59, 999);

  if (targetYear === accountCreationYear) {
    startDate.setTime(accountCreationDate.getTime());
  }

  if (targetYear === currentYear) {
    endDate.setTime(new Date().getTime());
  }

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

  const dailyCounts = {};
  checkIns.forEach((checkIn) => {
    const dateKey = checkIn.createdAt.toISOString().split("T")[0];
    dailyCounts[dateKey] = (dailyCounts[dateKey] || 0) + 1;
  });

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
});