import prisma from "../db/prisma.js";

/**
 * Get user's platform settings
 * GET /platform/settings
 */
export const getPlatformSettings = async (req, res) => {
  try {
    const userId = req.user.id;

    let settings = await prisma.userPlatformSettings.findUnique({
      where: { userId },
    });

    // Create default settings if none exist
    if (!settings) {
      settings = await prisma.userPlatformSettings.create({
        data: {
          userId,
          xEnabled: false,
          linkedinEnabled: true, // Default enabled
          redditEnabled: false,
        },
      });
    }

    res.json({
      settings: {
        xEnabled: settings.xEnabled,
        linkedinEnabled: settings.linkedinEnabled,
        redditEnabled: settings.redditEnabled,
      },
    });
  } catch (error) {
    console.error("Get platform settings error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

/**
 * Update platform settings
 * PUT /platform/settings
 */
export const updatePlatformSettings = async (req, res) => {
  try {
    const userId = req.user.id;
    const { xEnabled, linkedinEnabled, redditEnabled } = req.body;

    // Get current settings
    let currentSettings = await prisma.userPlatformSettings.findUnique({
      where: { userId },
    });

    // If no settings exist, create default
    if (!currentSettings) {
      currentSettings = await prisma.userPlatformSettings.create({
        data: {
          userId,
          xEnabled: false,
          linkedinEnabled: true,
          redditEnabled: false,
        },
      });
    }

    // Merge current settings with updates (only update provided fields)
    const updatedValues = {
      xEnabled: xEnabled !== undefined ? xEnabled : currentSettings.xEnabled,
      linkedinEnabled: linkedinEnabled !== undefined ? linkedinEnabled : currentSettings.linkedinEnabled,
      redditEnabled: redditEnabled !== undefined ? redditEnabled : currentSettings.redditEnabled,
    };

    // Validate at least one platform is enabled
    const enabledCount = [
      updatedValues.xEnabled,
      updatedValues.linkedinEnabled,
      updatedValues.redditEnabled
    ].filter(Boolean).length;

    if (enabledCount === 0) {
      return res.status(400).json({
        message: "At least one platform must be enabled",
      });
    }

    // Update settings
    const settings = await prisma.userPlatformSettings.update({
      where: { userId },
      data: updatedValues,
    });

    res.json({
      message: "Platform settings updated successfully",
      settings: {
        xEnabled: settings.xEnabled,
        linkedinEnabled: settings.linkedinEnabled,
        redditEnabled: settings.redditEnabled,
      },
    });
  } catch (error) {
    console.error("Update platform settings error:", error);
    res.status(500).json({ message: "Server error" });
  }
};