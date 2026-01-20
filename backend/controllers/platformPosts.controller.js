import prisma from "../db/prisma.js";
import { regeneratePlatformPosts } from "../mastra/index.js";
import { canUserRegenerate, getRegenerationCount } from "../mastra/index.js";
import { startOfDay } from "../lib/time.js";
import { isLLMConfigured } from "../lib/llm-config.js";
import { asyncHandler } from "../middleware/asyncHandler.js";
import {
  ValidationError,
  NotFoundError,
  AuthorizationError,
  RateLimitError,
  LLMError,
} from "../utils/errors.js";

export const updatePost = asyncHandler(async (req, res) => {
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

export const getPlatformPosts = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const { postId } = req.params;

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
    throw new NotFoundError("Post not found");
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
});

export const generatePlatformPosts = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const { postId } = req.params;

  if (!isLLMConfigured()) {
    throw new LLMError("LLM provider not configured", 503);
  }

  const canRegen = await canUserRegenerate(userId, prisma);
  if (!canRegen) {
    const stats = await getRegenerationCount(userId, prisma);
    throw new RateLimitError(
      `Daily regeneration limit reached. Limit: ${stats.limit}, Used: ${stats.used}, Remaining: ${stats.remaining}`
    );
  }

  const result = await regeneratePlatformPosts(postId, userId, prisma);

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
});

export const updatePlatformPost = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const { platformPostId } = req.params;
  const { content } = req.body;

  if (!content || content.trim().length === 0) {
    throw new ValidationError("Content is required");
  }

  const platformPost = await prisma.platformPost.findUnique({
    where: { id: platformPostId },
    include: {
      post: true,
    },
  });

  if (!platformPost) {
    throw new NotFoundError("Platform post not found");
  }

  if (platformPost.post.userId !== userId) {
    throw new AuthorizationError("Unauthorized");
  }

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
});

export const getPlatformPostsByDate = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const { date } = req.params;
  const { type = "DAILY" } = req.query;

  const targetDate = startOfDay(new Date(date));

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
    throw new NotFoundError("No post found for this date");
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
});