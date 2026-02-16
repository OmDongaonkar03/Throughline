import prisma from "../db/prisma.js";
import { sanitizeText } from "../utils/sanitize.js";
import { asyncHandler } from "../middleware/asyncHandler.js";
import logger, { logUserAction } from '../utils/logger.js';
import {
  ValidationError,
  RateLimitError,
  NotFoundError,
} from "../utils/errors.js";
import { validateAndParseDate } from "../lib/time.js";

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
    logger.warn("Check-in daily limit reached", {
      userId,
      limit: 24,
      date: startOfDay.toISOString().split('T')[0]
    });
    throw new RateLimitError("Daily check-in limit reached (24 per day)");
  }

  // Sanitize content - remove all HTML tags and dangerous content
  const sanitizedContent = sanitizeText(content);

  // Additional validation after sanitization
  if (!sanitizedContent || sanitizedContent.length === 0) {
    throw new ValidationError("Content cannot be empty after sanitization");
  }

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

  logUserAction("checkin_created", userId, {
    date: now.toISOString().split('T')[0],
    contentLength: sanitizedContent.length
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

  // Use our new date validation
  const targetDate = validateAndParseDate(date, {
    allowFuture: false,
    maxPastYears: 2,
  });

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
      "Invalid year. Must be between account creation year and current year",
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
      (_, i) => accountCreationYear + i,
    ),
    dailyCounts,
    totalCheckIns: checkIns.length,
    currentStreak,
    startDate: startDate.toISOString().split("T")[0],
    endDate: endDate.toISOString().split("T")[0],
  });
});