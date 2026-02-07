import prisma from "../db/prisma.js";
import {
  getToneProfile,
  updateToneProfile,
  generateCompleteDailyPosts,
  generateCompleteWeeklyPosts,
  generateCompleteMonthlyPosts,
  regeneratePost,
  canUserRegenerate,
  getRegenerationCount,
} from "../mastra/index.js";
import { getToday, startOfDay, startOfWeek, startOfMonth } from "../lib/time.js";
import { isLLMConfigured, getAvailableProviders } from "../lib/llm-config.js";
import { asyncHandler } from "../middleware/asyncHandler.js";
import { ValidationError, NotFoundError, RateLimitError, LLMError } from "../utils/errors.js";

export const extractTone = asyncHandler(async (req, res) => {
  const userId = req.user.id;

  if (!isLLMConfigured()) {
    throw new LLMError(
      "LLM provider not configured. Please set up OpenAI, Anthropic, or Ollama in your environment.",
      503
    );
  }

  const samplePosts = await prisma.samplePost.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    take: 5,
  });

  if (samplePosts.length < 1) {
    throw new ValidationError(
      "At least 1 sample post is required to generate tone profile."
    );
  }

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
});

export const getTone = asyncHandler(async (req, res) => {
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
    throw new NotFoundError(
      "No tone profile found. Please extract tone first by adding sample posts."
    );
  }

  res.json({ toneProfile });
});

export const generateDaily = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const { date } = req.body;

  if (!isLLMConfigured()) {
    throw new LLMError(
      "LLM provider not configured. Please set up OpenAI, Anthropic, or Ollama in your environment.",
      503
    );
  }

  const targetDate = date ? new Date(date) : getToday();

  const canRegen = await canUserRegenerate(userId, prisma);
  if (!canRegen) {
    const stats = await getRegenerationCount(userId, prisma);
    throw new RateLimitError(
      `Daily regeneration limit reached (3 per day). Limit: ${stats.limit}, Used: ${stats.used}, Remaining: ${stats.remaining}`
    );
  }

  const result = await generateCompleteDailyPosts(
    userId,
    targetDate,
    prisma,
    true
  );

  res.json({
    message: "Daily post generated successfully",
    post: {
      id: result.basePost.id,
      date: result.basePost.date,
      content: result.basePost.content,
      metadata: result.basePost.metadata,
      version: result.basePost.version,
      type: result.basePost.type,
      createdAt: result.basePost.createdAt,
    },
  });
});

export const getDaily = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const { date } = req.params;

  const targetDate = date ? new Date(date) : getToday();
  const startOfTargetDay = startOfDay(targetDate);

  const post = await prisma.generatedPost.findFirst({
    where: {
      userId,
      type: "DAILY",
      date: startOfTargetDay,
      isLatest: true,
    },
  });

  if (!post) {
    throw new NotFoundError(
      "No post found for this date. Generate one first."
    );
  }

  res.json({
    post: {
      id: post.id,
      date: post.date,
      content: post.content,
      metadata: post.metadata,
      version: post.version,
      type: post.type,
      generationType: post.generationType,
      createdAt: post.createdAt,
    },
  });
});

export const generateWeekly = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const { date } = req.body;

  if (!isLLMConfigured()) {
    throw new LLMError("LLM provider not configured.", 503);
  }

  const targetDate = date ? new Date(date) : new Date();

  const canRegen = await canUserRegenerate(userId, prisma);
  if (!canRegen) {
    const stats = await getRegenerationCount(userId, prisma);
    throw new RateLimitError(
      `Daily regeneration limit reached (3 per day). Limit: ${stats.limit}, Used: ${stats.used}, Remaining: ${stats.remaining}`
    );
  }

  const result = await generateCompleteWeeklyPosts(
    userId,
    targetDate,
    prisma,
    true
  );

  res.json({
    message: "Weekly post generated successfully",
    post: {
      id: result.basePost.id,
      date: result.basePost.date,
      content: result.basePost.content,
      metadata: result.basePost.metadata,
      version: result.basePost.version,
      type: result.basePost.type,
      createdAt: result.basePost.createdAt,
    },
  });
});

export const getWeekly = asyncHandler(async (req, res) => {
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
  });

  if (!post) {
    throw new NotFoundError("No weekly post found for this date.");
  }

  res.json({
    post: {
      id: post.id,
      date: post.date,
      content: post.content,
      metadata: post.metadata,
      version: post.version,
      type: post.type,
      generationType: post.generationType,
      createdAt: post.createdAt,
    },
  });
});

export const generateMonthly = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const { date } = req.body;

  if (!isLLMConfigured()) {
    throw new LLMError("LLM provider not configured.", 503);
  }

  const targetDate = date ? new Date(date) : new Date();

  const canRegen = await canUserRegenerate(userId, prisma);
  if (!canRegen) {
    const stats = await getRegenerationCount(userId, prisma);
    throw new RateLimitError(
      `Daily regeneration limit reached (3 per day). Limit: ${stats.limit}, Used: ${stats.used}, Remaining: ${stats.remaining}`
    );
  }

  const result = await generateCompleteMonthlyPosts(
    userId,
    targetDate,
    prisma,
    true
  );

  res.json({
    message: "Monthly post generated successfully",
    post: {
      id: result.basePost.id,
      date: result.basePost.date,
      content: result.basePost.content,
      metadata: result.basePost.metadata,
      version: result.basePost.version,
      type: result.basePost.type,
      createdAt: result.basePost.createdAt,
    },
  });
});

export const getMonthly = asyncHandler(async (req, res) => {
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
  });

  if (!post) {
    throw new NotFoundError("No monthly post found for this date.");
  }

  res.json({
    post: {
      id: post.id,
      date: post.date,
      content: post.content,
      metadata: post.metadata,
      version: post.version,
      type: post.type,
      generationType: post.generationType,
      createdAt: post.createdAt,
    },
  });
});

export const regeneratePostById = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const { postId } = req.params;

  if (!isLLMConfigured()) {
    throw new LLMError("LLM provider not configured.", 503);
  }

  const canRegen = await canUserRegenerate(userId, prisma);
  if (!canRegen) {
    const stats = await getRegenerationCount(userId, prisma);
    throw new RateLimitError(
      `Daily regeneration limit reached (3 per day). Limit: ${stats.limit}, Used: ${stats.used}, Remaining: ${stats.remaining}`
    );
  }

  const result = await regeneratePost(postId, userId, prisma);

  res.json({
    message: "Post regenerated successfully",
    post: {
      id: result.basePost.id,
      date: result.basePost.date,
      content: result.basePost.content,
      metadata: result.basePost.metadata,
      version: result.basePost.version,
      type: result.basePost.type,
      createdAt: result.basePost.createdAt,
    },
  });
});

export const updatePostById = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const { postId } = req.params;
  const { content } = req.body;

  if (!content || content.trim() === "") {
    throw new ValidationError("Content is required");
  }

  const post = await prisma.generatedPost.findFirst({
    where: {
      id: postId,
      userId,
    },
  });

  if (!post) {
    throw new NotFoundError("Post not found or does not belong to you");
  }

  const updatedPost = await prisma.generatedPost.update({
    where: {
      id: postId,
    },
    data: {
      content: content.trim(),
      updatedAt: new Date(),
    },
  });

  res.json({
    message: "Post updated successfully",
    post: {
      id: updatedPost.id,
      content: updatedPost.content,
      updatedAt: updatedPost.updatedAt,
    },
  });
});

export const getRegenStatus = asyncHandler(async (req, res) => {
  const userId = req.user.id;

  const stats = await getRegenerationCount(userId, prisma);
  const canRegen = await canUserRegenerate(userId, prisma);

  res.json({
    limit: stats.limit,
    used: stats.used,
    remaining: stats.remaining,
    canRegenerate: canRegen,
  });
});

export const getAllPosts = asyncHandler(async (req, res) => {
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
});

export const getConfig = asyncHandler(async (req, res) => {
  const configured = isLLMConfigured();
  const providers = getAvailableProviders();

  res.json({
    configured,
    providers,
    mode: process.env.MODE || "self-hosted",
  });
});