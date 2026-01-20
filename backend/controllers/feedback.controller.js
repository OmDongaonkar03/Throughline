import prisma from "../db/prisma.js";
import { asyncHandler } from "../middleware/asyncHandler.js";
import { ValidationError, NotFoundError } from "../utils/errors.js";

export const submitFeedback = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const { postId, rating, issue } = req.body;

  if (![1, 2].includes(rating)) {
    throw new ValidationError(
      "Rating must be 1 (thumbs down) or 2 (thumbs up)"
    );
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

  const existingFeedback = await prisma.postFeedback.findFirst({
    where: {
      userId,
      postId,
    },
  });

  let feedback;

  if (existingFeedback) {
    feedback = await prisma.postFeedback.update({
      where: {
        id: existingFeedback.id,
      },
      data: {
        rating,
        issue: issue || null,
      },
    });
  } else {
    feedback = await prisma.postFeedback.create({
      data: {
        userId,
        postId,
        rating,
        issue: issue || null,
      },
    });
  }

  res.json({
    message: "Feedback submitted successfully",
    feedback,
  });
});

export const getFeedback = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const { postId } = req.params;

  const feedback = await prisma.postFeedback.findFirst({
    where: {
      userId,
      postId,
    },
  });

  res.json({
    feedback: feedback || null,
  });
});