import prisma from "../db/prisma.js";
import { asyncHandler } from "../middleware/asyncHandler.js";
import logger, { logUserAction } from '../utils/logger.js';
import { sanitizeText, sanitizeArray } from "../utils/sanitize.js";
import { ValidationError } from "../utils/errors.js";

export const getToneProfile = asyncHandler(async (req, res) => {
  const userId = req.user.id;

  const toneProfile = await prisma.toneProfile.findUnique({
    where: { userId },
  });

  if (!toneProfile) {
    return res.json({
      message:
        "No tone profile yet. You can create one manually or add sample posts for AI analysis.",
      hasProfile: false,
      toneProfile: null,
    });
  }

  res.json({
    toneProfile,
    hasProfile: true,
  });
});

export const updateToneProfileCustomizations = asyncHandler(
  async (req, res) => {
    const userId = req.user.id;
    let {
      customVoice,
      customSentenceStyle,
      customEmotionalRange,
      writingGoals,
      targetAudience,
      contentPurpose,
      toneCharacteristics,
      avoidTopics,
      preferredLength,
      includeEmojis,
      includeHashtags,
    } = req.body;

    // Sanitize text inputs to prevent XSS
    if (customVoice !== undefined && customVoice !== null) {
      customVoice = sanitizeText(customVoice);
      if (!customVoice) {
        throw new ValidationError(
          "Custom voice cannot contain only HTML or special characters",
        );
      }
    }

    if (customSentenceStyle !== undefined && customSentenceStyle !== null) {
      customSentenceStyle = sanitizeText(customSentenceStyle);
      if (!customSentenceStyle) {
        throw new ValidationError(
          "Custom sentence style cannot contain only HTML or special characters",
        );
      }
    }

    if (customEmotionalRange !== undefined && customEmotionalRange !== null) {
      customEmotionalRange = sanitizeText(customEmotionalRange);
      if (!customEmotionalRange) {
        throw new ValidationError(
          "Custom emotional range cannot contain only HTML or special characters",
        );
      }
    }

    if (contentPurpose !== undefined && contentPurpose !== null) {
      contentPurpose = sanitizeText(contentPurpose);
    }

    // Sanitize arrays
    if (writingGoals !== undefined && writingGoals !== null) {
      writingGoals = sanitizeArray(writingGoals);
    }

    if (targetAudience !== undefined && targetAudience !== null) {
      targetAudience = sanitizeArray(targetAudience);
    }

    if (avoidTopics !== undefined && avoidTopics !== null) {
      avoidTopics = sanitizeArray(avoidTopics);
    }

    // toneCharacteristics is an object with numeric values, no sanitization needed
    // preferredLength, includeEmojis, includeHashtags are validated by Zod schema

    const existingProfile = await prisma.toneProfile.findUnique({
      where: { userId },
    });

    let profile;
    const isCreating = !existingProfile;

    if (isCreating) {
      profile = await prisma.toneProfile.create({
        data: {
          userId,
          voice: "Manual configuration - no AI analysis",
          sentenceStyle: "Manual configuration - no AI analysis",
          emotionalRange: "Manual configuration - no AI analysis",
          exampleText: "No sample posts analyzed",
          fullProfile: {},
          modelUsed: "manual",
          customVoice: customVoice || null,
          customSentenceStyle: customSentenceStyle || null,
          customEmotionalRange: customEmotionalRange || null,
          writingGoals: writingGoals || null,
          targetAudience: targetAudience || null,
          contentPurpose: contentPurpose || null,
          toneCharacteristics: toneCharacteristics || null,
          avoidTopics: avoidTopics || null,
          preferredLength: preferredLength || null,
          includeEmojis: includeEmojis !== undefined ? includeEmojis : false,
          includeHashtags:
            includeHashtags !== undefined ? includeHashtags : true,
          manuallyEdited: true,
          lastManualEdit: new Date(),
        },
      });

      logUserAction("tone_profile_created", userId, {
        method: "manual",
        hasCustomVoice: !!customVoice,
        hasWritingGoals: !!writingGoals,
        hasTargetAudience: !!targetAudience
      });

      return res.status(201).json({
        message: "Tone profile created successfully",
        toneProfile: profile,
        created: true,
      });
    }

    // Track what fields are being updated
    const updatedFields = [];
    if (customVoice !== undefined) updatedFields.push('customVoice');
    if (customSentenceStyle !== undefined) updatedFields.push('customSentenceStyle');
    if (customEmotionalRange !== undefined) updatedFields.push('customEmotionalRange');
    if (writingGoals !== undefined) updatedFields.push('writingGoals');
    if (targetAudience !== undefined) updatedFields.push('targetAudience');
    if (contentPurpose !== undefined) updatedFields.push('contentPurpose');
    if (toneCharacteristics !== undefined) updatedFields.push('toneCharacteristics');
    if (avoidTopics !== undefined) updatedFields.push('avoidTopics');
    if (preferredLength !== undefined) updatedFields.push('preferredLength');
    if (includeEmojis !== undefined) updatedFields.push('includeEmojis');
    if (includeHashtags !== undefined) updatedFields.push('includeHashtags');

    profile = await prisma.toneProfile.update({
      where: { userId },
      data: {
        customVoice:
          customVoice !== undefined ? customVoice : existingProfile.customVoice,
        customSentenceStyle:
          customSentenceStyle !== undefined
            ? customSentenceStyle
            : existingProfile.customSentenceStyle,
        customEmotionalRange:
          customEmotionalRange !== undefined
            ? customEmotionalRange
            : existingProfile.customEmotionalRange,
        writingGoals:
          writingGoals !== undefined
            ? writingGoals
            : existingProfile.writingGoals,
        targetAudience:
          targetAudience !== undefined
            ? targetAudience
            : existingProfile.targetAudience,
        contentPurpose:
          contentPurpose !== undefined
            ? contentPurpose
            : existingProfile.contentPurpose,
        toneCharacteristics:
          toneCharacteristics !== undefined
            ? toneCharacteristics
            : existingProfile.toneCharacteristics,
        avoidTopics:
          avoidTopics !== undefined ? avoidTopics : existingProfile.avoidTopics,
        preferredLength:
          preferredLength !== undefined
            ? preferredLength
            : existingProfile.preferredLength,
        includeEmojis:
          includeEmojis !== undefined
            ? includeEmojis
            : existingProfile.includeEmojis,
        includeHashtags:
          includeHashtags !== undefined
            ? includeHashtags
            : existingProfile.includeHashtags,
        manuallyEdited: true,
        lastManualEdit: new Date(),
        updatedAt: new Date(),
      },
    });

    logUserAction("tone_profile_updated", userId, {
      fieldsUpdated: updatedFields,
      updateCount: updatedFields.length
    });

    res.json({
      message: "Tone profile updated successfully",
      toneProfile: profile,
      created: false,
    });
  },
);