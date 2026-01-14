import prisma from "../db/prisma.js";

const MAX_SAMPLE_POSTS = 5;

// Get all sample posts for the authenticated user
export const getSamplePosts = async (req, res) => {
  try {
    const userId = req.user.id;

    const samplePosts = await prisma.samplePost.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
    });

    res.json({
      samplePosts,
      count: samplePosts.length,
      maxAllowed: MAX_SAMPLE_POSTS,
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

    res.status(201).json({
      message: "Sample post created successfully",
      samplePost,
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

    res.json({
      message: "Sample post deleted successfully",
    });
  } catch (error) {
    console.error("Delete sample post error:", error);
    res.status(500).json({ message: "Server error" });
  }
};