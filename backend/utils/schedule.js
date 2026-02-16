import prisma from "../db/prisma.js";
import logger from './logger.js';

/**
 * Create default generation schedule for new user
 * Called during signup (both email/password and OAuth)
 */
export async function createDefaultSchedule(userId) {
  try {
    const schedule = await prisma.generationSchedule.create({
      data: {
        userId,
        dailyEnabled: true,
        dailyTime: "21:00", // 9 PM
        weeklyEnabled: true,
        weeklyDay: 0, // Sunday
        weeklyTime: "20:00", // 8 PM
        monthlyEnabled: true,
        monthlyDay: 28, // Safe for all months
        monthlyTime: "20:00", // 8 PM
        timezone: process.env.TZ || "Asia/Kolkata",
      },
    });

    logger.info('Default schedule created for user', {
      userId,
      dailyTime: schedule.dailyTime,
      weeklyDay: schedule.weeklyDay,
      monthlyDay: schedule.monthlyDay,
      timezone: schedule.timezone
    });

    return schedule;
  } catch (error) {
    logger.error('Failed to create default schedule', {
      userId,
      error: error.message,
      stack: error.stack
    });
    return null;
  }
}

// Helper function to create default notification settings
export async function createDefaultNotificationSettings(userId) {
  try {
    await prisma.notificationSettings.create({
      data: {
        userId,
        emailDigest: false,
        postReminders: true,
        weeklyReport: false,
      },  
    });

    logger.info('Default notification settings created for user', {
      userId,
      emailDigest: false,
      postReminders: true,
      weeklyReport: false
    });
  } catch (error) {
    logger.error('Failed to create default notification settings', {
      userId,
      error: error.message,
      stack: error.stack
    });
  }
}