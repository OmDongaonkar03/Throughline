import prisma from "../db/prisma.js";

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

    console.log(`[Schedule] Created default schedule for user ${userId}`);
    return schedule;
  } catch (error) {
    console.error(
      `[Schedule] Failed to create default schedule for user ${userId}:`,
      error
    );
    return null;
  }
}

// Helper function to create default platform settings
export async function createDefaultPlatformSettings(userId) {
  try {
    await prisma.userPlatformSettings.create({
      data: {
        userId,
        xEnabled: false,
        linkedinEnabled: true,
        redditEnabled: false,
      },
    });
    console.log(
      `[PlatformSettings] Created default settings for user ${userId}`
    );
  } catch (error) {
    console.error(
      `[PlatformSettings] Failed to create default settings for user ${userId}:`,
      error
    );
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

    console.log(
      `[NotificationSettings] Created default notification settings for user ${userId}`
    );
  } catch (error) {
    console.error(
      `[NotificationSettings] Failed to create default notification settings for user ${userId}:`,
      error
    );
  }
}
