import express from "express";
import { authenticate } from "../middleware/authMiddleware.js";
import {
  create,
  getAll,
} from "../controllers/commentController.js";

const router = express.Router();

// Add Comment
router.post(
  "/bugs/:bugId/comments",
  authenticate,
  create
);

// Get Comments
router.get(
  "/bugs/:bugId/comments",
  authenticate,
  getAll
);

export default router;