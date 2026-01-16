import prisma from "../db/prisma.js";
import { updateToneProfile } from "../mastra/index.js";
import { isLLMConfigured } from "../lib/llm-config.js";

const MAX_SAMPLE_POSTS = 5;

// Get all sample posts for the authenticated user
export const getSamplePosts = async (req, res) => {
  try {
    const userId = req.user.id;

    const samplePosts = await prisma.samplePost.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
    });

    // Check if user has a tone profile
    const toneProfile = await prisma.toneProfile.findUnique({
      where: { userId },
      select: { id: true, extractedAt: true },
    });

    res.json({
      samplePosts,
      count: samplePosts.length,
      maxAllowed: MAX_SAMPLE_POSTS,
      hasToneProfile: !!toneProfile,
      toneProfileLastUpdated: toneProfile?.extractedAt || null,
    });
  } catch (error) {
    console.error("Get sample posts error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Create a new sample post
export const createSamplePost = async (req, res) => {
  try {
    const userId = req.user.id;
    const { content } = req.body;

    if (!content || content.trim().length === 0) {
      return res.status(400).json({ message: "Content is required" });
    }

    // Check if user has reached the limit
    const existingCount = await prisma.samplePost.count({
      where: { userId },
    });

    if (existingCount >= MAX_SAMPLE_POSTS) {
      return res.status(400).json({ 
        message: `Maximum ${MAX_SAMPLE_POSTS} sample posts allowed. Please delete one to add another.`,
        maxReached: true,
      });
    }

    const samplePost = await prisma.samplePost.create({
      data: {
        userId,
        content: content.trim(),
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    });

    // Auto-regenerate tone profile ONLY when adding new posts and user has 3+ samples
    const newCount = existingCount + 1;
    let toneProfileUpdated = false;
    
    if (newCount >= 3 && isLLMConfigured()) {
      try {
        await updateToneProfile(userId, prisma);
        toneProfileUpdated = true;
        console.log(`[Sample Post] Auto-generated tone profile for user ${userId} (${newCount} samples)`);
      } catch (error) {
        console.error(`[Sample Post] Failed to auto-generate tone profile:`, error);
        // Don't fail the request if tone extraction fails
      }
    }

    res.status(201).json({
      message: "Sample post created successfully",
      samplePost,
      toneProfileUpdated,
      count: newCount,
      suggestion: newCount < 3 
        ? `Add ${3 - newCount} more sample post(s) to enable tone extraction`
        : toneProfileUpdated 
          ? "Tone profile updated automatically"
          : null,
    });
  } catch (error) {
    console.error("Create sample post error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Update a sample post
export const updateSamplePost = async (req, res) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;
    const { content } = req.body;

    if (!content || content.trim().length === 0) {
      return res.status(400).json({ message: "Content is required" });
    }

    // Check if the post belongs to the user
    const existingPost = await prisma.samplePost.findUnique({
      where: { id },
    });

    if (!existingPost) {
      return res.status(404).json({ message: "Sample post not found" });
    }

    if (existingPost.userId !== userId) {
      return res.status(403).json({ message: "Unauthorized" });
    }

    const updatedPost = await prisma.samplePost.update({
      where: { id },
      data: {
        content: content.trim(),
        updatedAt: new Date(),
      },
    });

    res.json({
      message: "Sample post updated successfully",
      samplePost: updatedPost,
      note: "Tone profile not automatically updated. Use 'Extract Tone' to regenerate if needed.",
    });
  } catch (error) {
    console.error("Update sample post error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Delete a sample post
export const deleteSamplePost = async (req, res) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;

    // Check if the post belongs to the user
    const existingPost = await prisma.samplePost.findUnique({
      where: { id },
    });

    if (!existingPost) {
      return res.status(404).json({ message: "Sample post not found" });
    }

    if (existingPost.userId !== userId) {
      return res.status(403).json({ message: "Unauthorized" });
    }

    await prisma.samplePost.delete({
      where: { id },
    });

    // Check if we need to delete tone profile (if samples drop below minimum)
    let toneProfileDeleted = false;
    
    const remainingCount = await prisma.samplePost.count({
      where: { userId },
    });
    
    if (remainingCount < 3) {
      // Not enough samples anymore, delete tone profile
      const deletedCount = await prisma.toneProfile.deleteMany({
        where: { userId },
      });
      
      if (deletedCount.count > 0) {
        toneProfileDeleted = true;
        console.log(`[Sample Post] Deleted tone profile for user ${userId} (insufficient samples: ${remainingCount})`);
      }
    }

    res.json({
      message: "Sample post deleted successfully",
      remainingCount,
      toneProfileDeleted,
      note: toneProfileDeleted 
        ? "Tone profile deleted (less than 3 samples remaining)" 
        : "Tone profile preserved. Use 'Extract Tone' to regenerate if needed.",
    });
  } catch (error) {
    console.error("Delete sample post error:", error);
    res.status(500).json({ message: "Server error" });
  }
};