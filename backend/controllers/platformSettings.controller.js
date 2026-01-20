import prisma from "../db/prisma.js";
import { asyncHandler } from "../middleware/asyncHandler.js";
import { ValidationError } from "../utils/errors.js";

export const getPlatformSettings = asyncHandler(async (req, res) => {
  const userId = req.user.id;

  let settings = await prisma.userPlatformSettings.findUnique({
    where: { userId },
  });

  if (!settings) {
    settings = await prisma.userPlatformSettings.create({
      data: {
        userId,
        xEnabled: false,
        linkedinEnabled: true,
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
});

export const updatePlatformSettings = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const { xEnabled, linkedinEnabled, redditEnabled } = req.body;

  let currentSettings = await prisma.userPlatformSettings.findUnique({
    where: { userId },
  });

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

  const updatedValues = {
    xEnabled: xEnabled !== undefined ? xEnabled : currentSettings.xEnabled,
    linkedinEnabled: linkedinEnabled !== undefined ? linkedinEnabled : currentSettings.linkedinEnabled,
    redditEnabled: redditEnabled !== undefined ? redditEnabled : currentSettings.redditEnabled,
  };

  const enabledCount = [
    updatedValues.xEnabled,
    updatedValues.linkedinEnabled,
    updatedValues.redditEnabled
  ].filter(Boolean).length;

  if (enabledCount === 0) {
    throw new ValidationError("At least one platform must be enabled");
  }

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
});