import prisma from "../db/prisma.js";
import { regeneratePlatformPosts } from "../mastra/index.js";
import { canUserRegenerate, getRegenerationCount } from "../mastra/index.js";
import { startOfDay } from "../lib/time.js";
import { isLLMConfigured } from "../lib/llm-config.js";

/**
 * Get platform posts for a generated post
 * GET /platform/posts/:postId
 */
export const getPlatformPosts = async (req, res) => {
  try {
    const userId = req.user.id;
    const { postId } = req.params;

    // Verify post belongs to user
    const post = await prisma.generatedPost.findFirst({
      where: {
        id: postId,
        userId,
      },
      include: {
        platformPosts: true,
        toneProfile: true,
      },
    });

    if (!post) {
      return res.status(404).json({ message: "Post not found" });
    }

    res.json({
      post: {
        id: post.id,
        date: post.date,
        content: post.content,
        metadata: post.metadata,
        type: post.type,
      },
      platformPosts: post.platformPosts.map((pp) => ({
        id: pp.id,
        platform: pp.platform,
        content: pp.content,
        hashtags: pp.hashtags,
        createdAt: pp.createdAt,
      })),
    });
  } catch (error) {
    console.error("Get platform posts error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

/**
 * Generate platform adaptations for a post (ORCHESTRATED)
 * Regenerates platform posts for all enabled platforms
 * POST /platform/posts/:postId/generate
 */
export const generatePlatformPosts = async (req, res) => {
  try {
    const userId = req.user.id;
    const { postId } = req.params;

    // Check if LLM is configured
    if (!isLLMConfigured()) {
      return res.status(503).json({
        message: "LLM provider not configured",
      });
    }

    // Check regeneration limit
    const canRegen = await canUserRegenerate(userId, prisma);
    if (!canRegen) {
      const stats = await getRegenerationCount(userId, prisma);
      return res.status(429).json({
        message: "Daily regeneration limit reached",
        limit: stats.limit,
        used: stats.used,
        remaining: stats.remaining,
      });
    }

    // Use orchestrated regeneration
    const result = await regeneratePlatformPosts(
      postId,
      userId,
      prisma
    );

    res.json({
      message: "Platform posts generated successfully",
      platformPosts: result.platformPosts.map((pp) => ({
        id: pp.id,
        platform: pp.platform,
        content: pp.content,
        hashtags: pp.hashtags,
        createdAt: pp.createdAt,
      })),
      stats: {
        generated: result.generated,
        failed: result.failed,
      },
      errors: result.errors,
    });
  } catch (error) {
    console.error("Generate platform posts error:", error);
    res.status(500).json({
      message: error.message || "Failed to generate platform posts",
    });
  }
};

/**
 * Update a specific platform post
 * PUT /platform/posts/:platformPostId
 */
export const updatePlatformPost = async (req, res) => {
  try {
    const userId = req.user.id;
    const { platformPostId } = req.params;
    const { content } = req.body;

    if (!content || content.trim().length === 0) {
      return res.status(400).json({ message: "Content is required" });
    }

    // Verify platform post belongs to user
    const platformPost = await prisma.platformPost.findUnique({
      where: { id: platformPostId },
      include: {
        post: true,
      },
    });

    if (!platformPost) {
      return res.status(404).json({ message: "Platform post not found" });
    }

    if (platformPost.post.userId !== userId) {
      return res.status(403).json({ message: "Unauthorized" });
    }

    // Update platform post
    const updated = await prisma.platformPost.update({
      where: { id: platformPostId },
      data: {
        content: content.trim(),
      },
    });

    res.json({
      message: "Platform post updated successfully",
      platformPost: {
        id: updated.id,
        platform: updated.platform,
        content: updated.content,
        hashtags: updated.hashtags,
      },
    });
  } catch (error) {
    console.error("Update platform post error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

/**
 * Get platform posts by date
 * GET /platform/posts/date/:date
 */
export const getPlatformPostsByDate = async (req, res) => {
  try {
    const userId = req.user.id;
    const { date } = req.params; // YYYY-MM-DD
    const { type = "DAILY" } = req.query;

    const targetDate = startOfDay(new Date(date));

    // Get the base post
    const post = await prisma.generatedPost.findFirst({
      where: {
        userId,
        type: type.toUpperCase(),
        date: targetDate,
        isLatest: true,
      },
      include: {
        platformPosts: true,
      },
    });

    if (!post) {
      return res.status(404).json({
        message: "No post found for this date",
      });
    }

    res.json({
      post: {
        id: post.id,
        date: post.date,
        content: post.content,
        metadata: post.metadata,
        type: post.type,
      },
      platformPosts: post.platformPosts.map((pp) => ({
        id: pp.id,
        platform: pp.platform,
        content: pp.content,
        hashtags: pp.hashtags,
        createdAt: pp.createdAt,
      })),
    });
  } catch (error) {
    console.error("Get platform posts by date error:", error);
    res.status(500).json({ message: "Server error" });
  }
};