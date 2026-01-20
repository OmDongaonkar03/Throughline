import express from "express";
import {
  getSamplePosts,
  createSamplePost,
  updateSamplePost,
  deleteSamplePost,
} from "../controllers/samplepost.controller.js";
import { authenticate } from "../middleware/auth.js";
import { validate, schemas } from "../middleware/validation.js";

const router = express.Router();

router.get("/", authenticate, getSamplePosts);
router.post("/", authenticate, validate(schemas.createSamplePost), createSamplePost);
router.put("/:id", authenticate, validate(schemas.updateSamplePost), updateSamplePost);
router.delete("/:id", authenticate, deleteSamplePost);

export default router;