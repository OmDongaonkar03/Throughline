import prisma from "../db/prisma.js";

// Get tone profile for the authenticated user
export const getToneProfile = async (req, res) => {
  try {
    const userId = req.user.id;

    const toneProfile = await prisma.toneProfile.findUnique({
      where: { userId },
    });

    if (!toneProfile) {
      // Return empty state but indicate user can create one manually
      return res.json({ 
        message: "No tone profile yet. You can create one manually or add sample posts for AI analysis.",
        hasProfile: false,
        toneProfile: null,
      });
    }

    res.json({
      toneProfile,
      hasProfile: true,
    });
  } catch (error) {
    console.error("Get tone profile error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Update tone profile with manual customizations
export const updateToneProfileCustomizations = async (req, res) => {
  try {
    const userId = req.user.id;
    const {
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

    // Check if tone profile exists
    const existingProfile = await prisma.toneProfile.findUnique({
      where: { userId },
    });

    let profile;

    if (!existingProfile) {
      // Create a new tone profile with manual data only
      profile = await prisma.toneProfile.create({
        data: {
          userId,
          // Set default/empty values for AI-extracted fields
          voice: "Manual configuration - no AI analysis",
          sentenceStyle: "Manual configuration - no AI analysis",
          emotionalRange: "Manual configuration - no AI analysis",
          exampleText: "No sample posts analyzed",
          fullProfile: {},
          modelUsed: "manual",
          // Set manual customizations
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
          includeHashtags: includeHashtags !== undefined ? includeHashtags : true,
          manuallyEdited: true,
          lastManualEdit: new Date(),
        },
      });

      return res.status(201).json({
        message: "Tone profile created successfully",
        toneProfile: profile,
        created: true,
      });
    }

    // Update existing tone profile with manual customizations
    profile = await prisma.toneProfile.update({
      where: { userId },
      data: {
        customVoice: customVoice || null,
        customSentenceStyle: customSentenceStyle || null,
        customEmotionalRange: customEmotionalRange || null,
        writingGoals: writingGoals || null,
        targetAudience: targetAudience || null,
        contentPurpose: contentPurpose || null,
        toneCharacteristics: toneCharacteristics || null,
        avoidTopics: avoidTopics || null,
        preferredLength: preferredLength || null,
        includeEmojis: includeEmojis !== undefined ? includeEmojis : existingProfile.includeEmojis,
        includeHashtags: includeHashtags !== undefined ? includeHashtags : existingProfile.includeHashtags,
        manuallyEdited: true,
        lastManualEdit: new Date(),
        updatedAt: new Date(),
      },
    });

    res.json({
      message: "Tone profile updated successfully",
      toneProfile: profile,
      created: false,
    });
  } catch (error) {
    console.error("Update tone profile error:", error);
    res.status(500).json({ message: "Server error" });
  }
};