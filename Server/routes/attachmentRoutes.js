import express from "express";
import { authenticate } from "../middleware/authMiddleware.js";
import { upload } from "../middleware/uploadMiddleware.js";
import {
  upload as uploadFile,
  getAll,
} from "../controllers/attachmentController.js";

const router = express.Router();

router.post(
  "/bugs/:bugId/attachments",
  authenticate,
  upload.single("file"),
  uploadFile
);

router.get(
  "/bugs/:bugId/attachments",
  authenticate,
  getAll
);

export default router;