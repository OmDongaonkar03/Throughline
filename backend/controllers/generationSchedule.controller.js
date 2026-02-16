import prisma from "../db/prisma.js";
import { asyncHandler } from "../middleware/asyncHandler.js";
import logger, { logUserAction } from '../utils/logger.js';
import { ValidationError } from "../utils/errors.js";

export const getScheduleSettings = asyncHandler(async (req, res) => {
  const userId = req.user.id;

  let schedule = await prisma.generationSchedule.findUnique({
    where: { userId },
  });

  if (!schedule) {
    schedule = await prisma.generationSchedule.create({
      data: {
        userId,
        dailyEnabled: true,
        dailyTime: "21:00",
        weeklyEnabled: true,
        weeklyDay: 0,
        weeklyTime: "20:00",
        monthlyEnabled: true,
        monthlyDay: 28,
        monthlyTime: "20:00",
        timezone: "Asia/Kolkata",
      },
    });
  }

  res.json({
    schedule: {
      dailyEnabled: schedule.dailyEnabled,
      dailyTime: schedule.dailyTime,
      weeklyEnabled: schedule.weeklyEnabled,
      weeklyDay: schedule.weeklyDay,
      weeklyTime: schedule.weeklyTime,
      monthlyEnabled: schedule.monthlyEnabled,
      monthlyDay: schedule.monthlyDay,
      monthlyTime: schedule.monthlyTime,
      timezone: schedule.timezone,
    },
  });
});

export const updateScheduleSettings = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const {
    dailyEnabled,
    dailyTime,
    weeklyEnabled,
    weeklyDay,
    weeklyTime,
    monthlyEnabled,
    monthlyDay,
    monthlyTime,
  } = req.body;

  let currentSchedule = await prisma.generationSchedule.findUnique({
    where: { userId },
  });

  if (!currentSchedule) {
    currentSchedule = await prisma.generationSchedule.create({
      data: {
        userId,
        dailyEnabled: true,
        dailyTime: "21:00",
        weeklyEnabled: true,
        weeklyDay: 0,
        weeklyTime: "20:00",
        monthlyEnabled: true,
        monthlyDay: 28,
        monthlyTime: "20:00",
        timezone: "Asia/Kolkata",
      },
    });
  }

  const updateData = {};

  if (dailyEnabled !== undefined) updateData.dailyEnabled = dailyEnabled;
  if (dailyTime !== undefined) updateData.dailyTime = dailyTime;
  if (weeklyEnabled !== undefined) updateData.weeklyEnabled = weeklyEnabled;
  if (weeklyDay !== undefined) updateData.weeklyDay = weeklyDay;
  if (weeklyTime !== undefined) updateData.weeklyTime = weeklyTime;
  if (monthlyEnabled !== undefined) updateData.monthlyEnabled = monthlyEnabled;
  if (monthlyDay !== undefined) updateData.monthlyDay = monthlyDay;
  if (monthlyTime !== undefined) updateData.monthlyTime = monthlyTime;

  const finalEnabledStates = {
    daily: dailyEnabled !== undefined ? dailyEnabled : currentSchedule.dailyEnabled,
    weekly: weeklyEnabled !== undefined ? weeklyEnabled : currentSchedule.weeklyEnabled,
    monthly: monthlyEnabled !== undefined ? monthlyEnabled : currentSchedule.monthlyEnabled,
  };

  const enabledCount = Object.values(finalEnabledStates).filter(Boolean).length;

  if (enabledCount === 0) {
    throw new ValidationError("At least one schedule type must be enabled");
  }

  const timeRegex = /^([01]\d|2[0-3]):([0-5]\d)$/;
  if (dailyTime && !timeRegex.test(dailyTime)) {
    throw new ValidationError(
      "Invalid daily time format. Use HH:MM (24-hour format)"
    );
  }
  if (weeklyTime && !timeRegex.test(weeklyTime)) {
    throw new ValidationError(
      "Invalid weekly time format. Use HH:MM (24-hour format)"
    );
  }
  if (monthlyTime && !timeRegex.test(monthlyTime)) {
    throw new ValidationError(
      "Invalid monthly time format. Use HH:MM (24-hour format)"
    );
  }

  if (weeklyDay !== undefined && (weeklyDay < 0 || weeklyDay > 6)) {
    throw new ValidationError(
      "Invalid weekly day. Must be between 0 (Sunday) and 6 (Saturday)"
    );
  }

  if (monthlyDay !== undefined && (monthlyDay < 1 || monthlyDay > 28)) {
    throw new ValidationError(
      "Invalid monthly day. Must be between 1 and 28"
    );
  }

  const schedule = await prisma.generationSchedule.update({
    where: { userId },
    data: updateData,
  });

  logUserAction("schedule_updated", userId, {
    dailyEnabled: schedule.dailyEnabled,
    weeklyEnabled: schedule.weeklyEnabled,
    monthlyEnabled: schedule.monthlyEnabled
  });

  res.json({
    message: "Schedule settings updated successfully",
    schedule: {
      dailyEnabled: schedule.dailyEnabled,
      dailyTime: schedule.dailyTime,
      weeklyEnabled: schedule.weeklyEnabled,
      weeklyDay: schedule.weeklyDay,
      weeklyTime: schedule.weeklyTime,
      monthlyEnabled: schedule.monthlyEnabled,
      monthlyDay: schedule.monthlyDay,
      monthlyTime: schedule.monthlyTime,
      timezone: schedule.timezone,
    },
  });
});