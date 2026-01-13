import prisma from "../db/prisma.js";

export const getNotificationSettings = async (req, res) => {
  try {
    const userId = req.user.id; // From authenticate middleware

    // Get or create notification settings
    let settings = await prisma.notificationSettings.findUnique({
      where: { userId },
      select: {
        id: true,
        emailDigest: true,
        postReminders: true,
        weeklyReport: true,
      },
    });

    // If user doesn't have settings yet, create default ones
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
    }

    res.json({
      message: "Notification settings retrieved successfully",
      settings,
    });
  } catch (error) {
    console.error("Get notification settings error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

export const updateNotificationSettings = async (req, res) => {
  try {
    const userId = req.user.id; // From authenticate middleware
    const { emailDigest, postReminders, weeklyReport } = req.body;

    // Validation - at least one field must be provided
    if (
      emailDigest === undefined &&
      postReminders === undefined &&
      weeklyReport === undefined
    ) {
      return res.status(400).json({
        message: "At least one notification setting must be provided",
      });
    }

    // Validate boolean values
    const updates = {};
    if (emailDigest !== undefined) {
      if (typeof emailDigest !== "boolean") {
        return res.status(400).json({
          message: "emailDigest must be a boolean value",
        });
      }
      updates.emailDigest = emailDigest;
    }
    if (postReminders !== undefined) {
      if (typeof postReminders !== "boolean") {
        return res.status(400).json({
          message: "postReminders must be a boolean value",
        });
      }
      updates.postReminders = postReminders;
    }
    if (weeklyReport !== undefined) {
      if (typeof weeklyReport !== "boolean") {
        return res.status(400).json({
          message: "weeklyReport must be a boolean value",
        });
      }
      updates.weeklyReport = weeklyReport;
    }

    // Upsert notification settings (update if exists, create if doesn't)
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

    res.json({
      message: "Notification settings updated successfully",
      settings,
    });
  } catch (error) {
    console.error("Update notification settings error:", error);
    res.status(500).json({ message: "Server error" });
  }
};