import prisma from "../db/prisma.js";
import { sanitizeText } from "../utils/sanitize.js";
import { updateToneProfile } from "../mastra/index.js";
import { isLLMConfigured } from "../lib/llm-config.js";
import { asyncHandler } from "../middleware/asyncHandler.js";
import {
  ValidationError,
  NotFoundError,
  AuthorizationError,
} from "../utils/errors.js";

const MAX_SAMPLE_POSTS = 5;

export const getSamplePosts = asyncHandler(async (req, res) => {
  const userId = req.user.id;

  const samplePosts = await prisma.samplePost.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
  });

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
});

export const createSamplePost = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const { content } = req.body;

  if (!content || content.trim().length === 0) {
    throw new ValidationError("Content is required");
  }

  const existingCount = await prisma.samplePost.count({
    where: { userId },
  });

  if (existingCount >= MAX_SAMPLE_POSTS) {
    throw new ValidationError(
      `Maximum ${MAX_SAMPLE_POSTS} sample posts allowed. Please delete one to add another.`,
    );
  }

  // Sanitize content - remove all HTML tags and dangerous content
  const sanitizedContent = sanitizeText(content);

  // Additional validation after sanitization
  if (!sanitizedContent || sanitizedContent.length === 0) {
    throw new ValidationError("Content cannot be empty after sanitization");
  }

  const samplePost = await prisma.samplePost.create({
    data: {
      userId,
      content: sanitizedContent,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  });

  const newCount = existingCount + 1;

  res.status(201).json({
    message: "Sample post created successfully",
    samplePost,
    count: newCount,
  });
});

export const updateSamplePost = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const { id } = req.params;
  const { content } = req.body;

  if (!content || content.trim().length === 0) {
    throw new ValidationError("Content is required");
  }

  const existingPost = await prisma.samplePost.findUnique({
    where: { id },
  });

  if (!existingPost) {
    throw new NotFoundError("Sample post not found");
  }

  if (existingPost.userId !== userId) {
    throw new AuthorizationError("Unauthorized");
  }

  // Sanitize content - remove all HTML tags and dangerous content
  const sanitizedContent = sanitizeText(content);

  // Additional validation after sanitization
  if (!sanitizedContent || sanitizedContent.length === 0) {
    throw new ValidationError("Content cannot be empty after sanitization");
  }

  const updatedPost = await prisma.samplePost.update({
    where: { id },
    data: {
      content: sanitizedContent,
      updatedAt: new Date(),
    },
  });

  res.json({
    message: "Sample post updated successfully",
    samplePost: updatedPost,
  });
});

export const deleteSamplePost = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const { id } = req.params;

  const existingPost = await prisma.samplePost.findUnique({
    where: { id },
  });

  if (!existingPost) {
    throw new NotFoundError("Sample post not found");
  }

  if (existingPost.userId !== userId) {
    throw new AuthorizationError("Unauthorized");
  }

  await prisma.samplePost.delete({
    where: { id },
  });

  const remainingCount = await prisma.samplePost.count({
    where: { userId },
  });

  res.json({
    message: "Sample post deleted successfully",
    remainingCount,
  });
});
