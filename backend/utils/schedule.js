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
