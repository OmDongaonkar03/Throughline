import express from "express";
import {
  getSamplePosts,
  createSamplePost,
  updateSamplePost,
  deleteSamplePost,
} from "../controllers/samplepost.controller.js";
import { authenticate } from "../middleware/auth.js";

const router = express.Router();

// GET /sample - Get all sample posts for authenticated user
router.get("/", authenticate, getSamplePosts);

// POST /sample - Create a new sample post
router.post("/", authenticate, createSamplePost);

// PUT /sample/:id - Update a sample post
router.put("/:id", authenticate, updateSamplePost);

// DELETE /sample/:id - Delete a sample post
router.delete("/:id", authenticate, deleteSamplePost);

export default router;