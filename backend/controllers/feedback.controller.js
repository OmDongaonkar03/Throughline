import prisma from "../db/prisma.js";

/**
 * Submit feedback for a post
 * POST /feedback
 * Body: { postId, rating, issue? }
 */
export const submitFeedback = async (req, res) => {
  try {
    const userId = req.user.id;
    const { postId, rating, issue } = req.body;

    // Validate rating
    if (![1, 2].includes(rating)) {
      return res.status(400).json({
        message: "Rating must be 1 (thumbs down) or 2 (thumbs up)",
      });
    }

    // Verify the post belongs to the user
    const post = await prisma.generatedPost.findFirst({
      where: {
        id: postId,
        userId,
      },
    });

    if (!post) {
      return res.status(404).json({
        message: "Post not found or does not belong to you",
      });
    }

    // Check if feedback already exists
    const existingFeedback = await prisma.postFeedback.findFirst({
      where: {
        userId,
        postId,
      },
    });

    let feedback;

    if (existingFeedback) {
      // Update existing feedback
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
      // Create new feedback
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
  } catch (error) {
    console.error("Submit feedback error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

/**
 * Get feedback for a post
 * GET /feedback/:postId
 */
export const getFeedback = async (req, res) => {
  try {
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
  } catch (error) {
    console.error("Get feedback error:", error);
    res.status(500).json({ message: "Server error" });
  }
};