import prisma from "../db/prisma.js";

/**
 * Get user's generation schedule settings
 * GET /schedule/settings
 */
export const getScheduleSettings = async (req, res) => {
  try {
    const userId = req.user.id;

    let schedule = await prisma.generationSchedule.findUnique({
      where: { userId },
    });

    // Create default schedule if none exists
    if (!schedule) {
      schedule = await prisma.generationSchedule.create({
        data: {
          userId,
          dailyEnabled: true,
          dailyTime: "21:00",
          weeklyEnabled: true,
          weeklyDay: 0, // Sunday
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
  } catch (error) {
    console.error("Get schedule settings error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

/**
 * Update generation schedule settings
 * PUT /schedule/settings
 */
export const updateScheduleSettings = async (req, res) => {
  try {
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

    // Get current schedule
    let currentSchedule = await prisma.generationSchedule.findUnique({
      where: { userId },
    });

    // If no schedule exists, create default
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

    // Build update data (only update provided fields)
    const updateData = {};

    if (dailyEnabled !== undefined) updateData.dailyEnabled = dailyEnabled;
    if (dailyTime !== undefined) updateData.dailyTime = dailyTime;
    if (weeklyEnabled !== undefined) updateData.weeklyEnabled = weeklyEnabled;
    if (weeklyDay !== undefined) updateData.weeklyDay = weeklyDay;
    if (weeklyTime !== undefined) updateData.weeklyTime = weeklyTime;
    if (monthlyEnabled !== undefined) updateData.monthlyEnabled = monthlyEnabled;
    if (monthlyDay !== undefined) updateData.monthlyDay = monthlyDay;
    if (monthlyTime !== undefined) updateData.monthlyTime = monthlyTime;

    // Validate at least one schedule is enabled
    const finalEnabledStates = {
      daily: dailyEnabled !== undefined ? dailyEnabled : currentSchedule.dailyEnabled,
      weekly: weeklyEnabled !== undefined ? weeklyEnabled : currentSchedule.weeklyEnabled,
      monthly: monthlyEnabled !== undefined ? monthlyEnabled : currentSchedule.monthlyEnabled,
    };

    const enabledCount = Object.values(finalEnabledStates).filter(Boolean).length;

    if (enabledCount === 0) {
      return res.status(400).json({
        message: "At least one schedule type must be enabled",
      });
    }

    // Validate time format (HH:MM)
    const timeRegex = /^([01]\d|2[0-3]):([0-5]\d)$/;
    if (dailyTime && !timeRegex.test(dailyTime)) {
      return res.status(400).json({
        message: "Invalid daily time format. Use HH:MM (24-hour format)",
      });
    }
    if (weeklyTime && !timeRegex.test(weeklyTime)) {
      return res.status(400).json({
        message: "Invalid weekly time format. Use HH:MM (24-hour format)",
      });
    }
    if (monthlyTime && !timeRegex.test(monthlyTime)) {
      return res.status(400).json({
        message: "Invalid monthly time format. Use HH:MM (24-hour format)",
      });
    }

    // Validate weeklyDay (0-6)
    if (weeklyDay !== undefined && (weeklyDay < 0 || weeklyDay > 6)) {
      return res.status(400).json({
        message: "Invalid weekly day. Must be between 0 (Sunday) and 6 (Saturday)",
      });
    }

    // Validate monthlyDay (1-28)
    if (monthlyDay !== undefined && (monthlyDay < 1 || monthlyDay > 28)) {
      return res.status(400).json({
        message: "Invalid monthly day. Must be between 1 and 28",
      });
    }

    // Update schedule
    const schedule = await prisma.generationSchedule.update({
      where: { userId },
      data: updateData,
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
  } catch (error) {
    console.error("Update schedule settings error:", error);
    res.status(500).json({ message: "Server error" });
  }
};