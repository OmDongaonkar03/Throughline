import prisma from "../db/prisma.js";
import { asyncHandler } from "../middleware/asyncHandler.js";
import logger, { logUserAction } from '../utils/logger.js';
import { ValidationError } from "../utils/errors.js";

export const getNotificationSettings = asyncHandler(async (req, res) => {
  const userId = req.user.id;

  let settings = await prisma.notificationSettings.findUnique({
    where: { userId },
    select: {
      id: true,
      emailDigest: true,
      postReminders: true,
      weeklyReport: true,
    },
  });

  if (!settings) {
    settings = await prisma.notificationSettings.create({
      data: {
        userId,
        emailDigest: true,
        postReminders: true,
        weeklyReport: false,
      },
      select: {
        id: true,
        emailDigest: true,
        postReminders: true,
        weeklyReport: true,
      },
    });

    logger.info("Notification settings created with defaults", {
      userId,
      emailDigest: true,
      postReminders: true,
      weeklyReport: false
    });
  }

  res.json({
    message: "Notification settings retrieved successfully",
    settings,
  });
});

export const updateNotificationSettings = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const { emailDigest, postReminders, weeklyReport } = req.body;

  if (
    emailDigest === undefined &&
    postReminders === undefined &&
    weeklyReport === undefined
  ) {
    throw new ValidationError(
      "At least one notification setting must be provided"
    );
  }

  const updates = {};
  const updatedFields = [];

  if (emailDigest !== undefined) {
    if (typeof emailDigest !== "boolean") {
      throw new ValidationError("emailDigest must be a boolean value");
    }
    updates.emailDigest = emailDigest;
    updatedFields.push('emailDigest');
  }
  if (postReminders !== undefined) {
    if (typeof postReminders !== "boolean") {
      throw new ValidationError("postReminders must be a boolean value");
    }
    updates.postReminders = postReminders;
    updatedFields.push('postReminders');
  }
  if (weeklyReport !== undefined) {
    if (typeof weeklyReport !== "boolean") {
      throw new ValidationError("weeklyReport must be a boolean value");
    }
    updates.weeklyReport = weeklyReport;
    updatedFields.push('weeklyReport');
  }

  const settings = await prisma.notificationSettings.upsert({
    where: { userId },
    update: updates,
    create: {
      userId,
      emailDigest: emailDigest ?? true,
      postReminders: postReminders ?? true,
      weeklyReport: weeklyReport ?? false,
    },
    select: {
      id: true,
      emailDigest: true,
      postReminders: true,
      weeklyReport: true,
    },
  });

  logUserAction("notification_settings_updated", userId, {
    fieldsUpdated: updatedFields,
    newSettings: {
      emailDigest: settings.emailDigest,
      postReminders: settings.postReminders,
      weeklyReport: settings.weeklyReport
    }
  });

  res.json({
    message: "Notification settings updated successfully",
    settings,
  });
});