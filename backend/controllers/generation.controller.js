import prisma from "../db/prisma.js";
import {
  getToneProfile,
  updateToneProfile,
  generateCompleteDailyPosts,
  generateCompleteWeeklyPosts,
  generateCompleteMonthlyPosts,
  canUserRegenerate,
  getRegenerationCount,
} from "../mastra/index.js";
import { getToday, startOfDay, startOfWeek, startOfMonth } from "../lib/time.js";
import { isLLMConfigured, getAvailableProviders } from "../lib/llm-config.js";

/**
 * Extract tone profile from user's sample posts
 * POST /generation/tone/extract
 */
export const extractTone = async (req, res) => {
  try {
    const userId = req.user.id;

    // Check if LLM is configured
    if (!isLLMConfigured()) {
      return res.status(503).json({
        message:
          "LLM provider not configured. Please set up OpenAI, Anthropic, or Ollama in your environment.",
      });
    }

    // Get user's sample posts (minimum 1 required)
    const samplePosts = await prisma.samplePost.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take: 5,
    });

    if (samplePosts.length < 1) {
      return res.status(400).json({
        message: "At least 1 sample post is required to generate tone profile.",
      });
    }

    // Extract tone profile
    const toneProfile = await updateToneProfile(userId, prisma);

    res.json({
      message: "Tone profile extracted successfully",
      toneProfile: {
        id: toneProfile.id,
        voice: toneProfile.voice,
        sentenceStyle: toneProfile.sentenceStyle,
        emotionalRange: toneProfile.emotionalRange,
        commonPhrases: toneProfile.commonPhrases,
        extractedAt: toneProfile.extractedAt,
        modelUsed: toneProfile.modelUsed,
      },
    });
  } catch (error) {
    console.error("Extract tone error:", error);
    res.status(500).json({
      message: error.message || "Failed to extract tone profile",
    });
  }
};

/**
 * Get user's tone profile
 * GET /generation/tone
 */
export const getTone = async (req, res) => {
  try {
    const userId = req.user.id;

    const toneProfile = await prisma.toneProfile.findUnique({
      where: { userId },
      select: {
        id: true,
        voice: true,
        sentenceStyle: true,
        emotionalRange: true,
        commonPhrases: true,
        extractedAt: true,
        modelUsed: true,
      },
    });

    if (!toneProfile) {
      return res.status(404).json({
        message: "No tone profile found. Please extract tone first by adding sample posts.",
      });
    }

    res.json({ toneProfile });
  } catch (error) {
    console.error("Get tone error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

/**
 * Generate daily post with platform adaptations (ORCHESTRATED)
 * POST /generation/daily
 * Body: { date?: string }
 */
export const generateDaily = async (req, res) => {
  try {
    const userId = req.user.id;
    const { date } = req.body;

    // Check if LLM is configured
    if (!isLLMConfigured()) {
      return res.status(503).json({
        message:
          "LLM provider not configured. Please set up OpenAI, Anthropic, or Ollama in your environment.",
      });
    }

    const targetDate = date ? new Date(date) : getToday();

    // Check regeneration limit for manual requests
    const canRegen = await canUserRegenerate(userId, prisma);
    if (!canRegen) {
      const stats = await getRegenerationCount(userId, prisma);
      return res.status(429).json({
        message: "Daily regeneration limit reached (3 per day)",
        limit: stats.limit,
        used: stats.used,
        remaining: stats.remaining,
      });
    }

    // Use orchestrated generation
    const result = await generateCompleteDailyPosts(
      userId,
      targetDate,
      prisma,
      true // isManual
    );

    res.json({
      message: "Daily post generated successfully",
      post: {
        id: result.basePost.id,
        date: result.basePost.date,
        content: result.basePost.content,
        metadata: result.basePost.metadata,
        version: result.basePost.version,
        createdAt: result.basePost.createdAt,
      },
      platformPosts: result.platformPosts.map((pp) => ({
        id: pp.id,
        platform: pp.platform,
        content: pp.content,
        hashtags: pp.hashtags,
      })),
      stats: {
        generated: result.generated,
        failed: result.failed,
      },
      errors: result.errors,
    });
  } catch (error) {
    console.error("Generate daily error:", error);
    res.status(500).json({
      message: error.message || "Failed to generate daily post",
    });
  }
};

/**
 * Get daily post (with platform posts)
 * GET /generation/daily/:date
 */
export const getDaily = async (req, res) => {
  try {
    const userId = req.user.id;
    const { date } = req.params; // YYYY-MM-DD format

    const targetDate = date ? new Date(date) : getToday();
    const startOfTargetDay = startOfDay(targetDate);

    // Get existing post with platform posts
    const post = await prisma.generatedPost.findFirst({
      where: {
        userId,
        type: "DAILY",
        date: startOfTargetDay,
        isLatest: true,
      },
      include: {
        platformPosts: true,
      },
    });

    if (!post) {
      return res.status(404).json({
        message: "No post found for this date. Generate one first.",
      });
    }

    res.json({
      post: {
        id: post.id,
        date: post.date,
        content: post.content,
        metadata: post.metadata,
        version: post.version,
        generationType: post.generationType,
        createdAt: post.createdAt,
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
    console.error("Get daily error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

/**
 * Generate weekly post with platform adaptations
 * POST /generation/weekly
 * Body: { date?: string }
 */
export const generateWeekly = async (req, res) => {
  try {
    const userId = req.user.id;
    const { date } = req.body;

    if (!isLLMConfigured()) {
      return res.status(503).json({
        message: "LLM provider not configured.",
      });
    }

    const targetDate = date ? new Date(date) : new Date();

    // Check regeneration limit
    const canRegen = await canUserRegenerate(userId, prisma);
    if (!canRegen) {
      const stats = await getRegenerationCount(userId, prisma);
      return res.status(429).json({
        message: "Daily regeneration limit reached (3 per day)",
        limit: stats.limit,
        used: stats.used,
        remaining: stats.remaining,
      });
    }

    // Generate weekly post
    const result = await generateCompleteWeeklyPosts(
      userId,
      targetDate,
      prisma,
      true // isManual
    );

    res.json({
      message: "Weekly post generated successfully",
      post: {
        id: result.basePost.id,
        date: result.basePost.date,
        content: result.basePost.content,
        metadata: result.basePost.metadata,
        version: result.basePost.version,
        createdAt: result.basePost.createdAt,
      },
      platformPosts: result.platformPosts.map((pp) => ({
        id: pp.id,
        platform: pp.platform,
        content: pp.content,
        hashtags: pp.hashtags,
      })),
      stats: {
        generated: result.generated,
        failed: result.failed,
      },
      errors: result.errors,
    });
  } catch (error) {
    console.error("Generate weekly error:", error);
    res.status(500).json({
      message: error.message || "Failed to generate weekly post",
    });
  }
};

/**
 * Get weekly post (with platform posts)
 * GET /generation/weekly/:date
 */
export const getWeekly = async (req, res) => {
  try {
    const userId = req.user.id;
    const { date } = req.params;

    const targetDate = date ? new Date(date) : new Date();
    const weekStart = startOfWeek(targetDate);

    const post = await prisma.generatedPost.findFirst({
      where: {
        userId,
        type: "WEEKLY",
        date: weekStart,
        isLatest: true,
      },
      include: {
        platformPosts: true,
      },
    });

    if (!post) {
      return res.status(404).json({
        message: "No weekly post found for this date.",
      });
    }

    res.json({
      post: {
        id: post.id,
        date: post.date,
        content: post.content,
        metadata: post.metadata,
        version: post.version,
        generationType: post.generationType,
        createdAt: post.createdAt,
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
    console.error("Get weekly error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

/**
 * Generate monthly post with platform adaptations
 * POST /generation/monthly
 * Body: { date?: string }
 */
export const generateMonthly = async (req, res) => {
  try {
    const userId = req.user.id;
    const { date } = req.body;

    if (!isLLMConfigured()) {
      return res.status(503).json({
        message: "LLM provider not configured.",
      });
    }

    const targetDate = date ? new Date(date) : new Date();

    // Check regeneration limit
    const canRegen = await canUserRegenerate(userId, prisma);
    if (!canRegen) {
      const stats = await getRegenerationCount(userId, prisma);
      return res.status(429).json({
        message: "Daily regeneration limit reached (3 per day)",
        limit: stats.limit,
        used: stats.used,
        remaining: stats.remaining,
      });
    }

    // Generate monthly post
    const result = await generateCompleteMonthlyPosts(
      userId,
      targetDate,
      prisma,
      true // isManual
    );

    res.json({
      message: "Monthly post generated successfully",
      post: {
        id: result.basePost.id,
        date: result.basePost.date,
        content: result.basePost.content,
        metadata: result.basePost.metadata,
        version: result.basePost.version,
        createdAt: result.basePost.createdAt,
      },
      platformPosts: result.platformPosts.map((pp) => ({
        id: pp.id,
        platform: pp.platform,
        content: pp.content,
        hashtags: pp.hashtags,
      })),
      stats: {
        generated: result.generated,
        failed: result.failed,
      },
      errors: result.errors,
    });
  } catch (error) {
    console.error("Generate monthly error:", error);
    res.status(500).json({
      message: error.message || "Failed to generate monthly post",
    });
  }
};

/**
 * Get monthly post (with platform posts)
 * GET /generation/monthly/:date
 */
export const getMonthly = async (req, res) => {
  try {
    const userId = req.user.id;
    const { date } = req.params;

    const targetDate = date ? new Date(date) : new Date();
    const monthStart = startOfMonth(targetDate);

    const post = await prisma.generatedPost.findFirst({
      where: {
        userId,
        type: "MONTHLY",
        date: monthStart,
        isLatest: true,
      },
      include: {
        platformPosts: true,
      },
    });

    if (!post) {
      return res.status(404).json({
        message: "No monthly post found for this date.",
      });
    }

    res.json({
      post: {
        id: post.id,
        date: post.date,
        content: post.content,
        metadata: post.metadata,
        version: post.version,
        generationType: post.generationType,
        createdAt: post.createdAt,
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
    console.error("Get monthly error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

/**
 * Get regeneration status
 * GET /generation/regen-status
 */
export const getRegenStatus = async (req, res) => {
  try {
    const userId = req.user.id;

    const stats = await getRegenerationCount(userId, prisma);
    const canRegen = await canUserRegenerate(userId, prisma);

    res.json({
      limit: stats.limit,
      used: stats.used,
      remaining: stats.remaining,
      canRegenerate: canRegen,
    });
  } catch (error) {
    console.error("Get regen status error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

/**
 * Get all posts for a user
 * GET /generation/posts
 */
export const getAllPosts = async (req, res) => {
  try {
    const userId = req.user.id;
    const { type, limit = 30, offset = 0 } = req.query;

    const where = {
      userId,
      isLatest: true,
    };

    if (type) {
      where.type = type.toUpperCase();
    }

    const posts = await prisma.generatedPost.findMany({
      where,
      orderBy: {
        date: "desc",
      },
      take: parseInt(limit),
      skip: parseInt(offset),
      select: {
        id: true,
        type: true,
        date: true,
        content: true,
        metadata: true,
        version: true,
        generationType: true,
        createdAt: true,
        platformPosts: {
          select: {
            id: true,
            platform: true,
            content: true,
            hashtags: true,
            createdAt: true,
          },
        },
      },
    });

    const total = await prisma.generatedPost.count({ where });

    res.json({
      posts,
      pagination: {
        total,
        limit: parseInt(limit),
        offset: parseInt(offset),
      },
    });
  } catch (error) {
    console.error("Get all posts error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

/**
 * Get LLM configuration status
 * GET /generation/config
 */
export const getConfig = async (req, res) => {
  try {
    const configured = isLLMConfigured();
    const providers = getAvailableProviders();

    res.json({
      configured,
      providers,
      mode: process.env.MODE || "self-hosted",
    });
  } catch (error) {
    console.error("Get config error:", error);
    res.status(500).json({ message: "Server error" });
  }
};