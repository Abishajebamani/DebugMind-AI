import express from "express";
import { authenticate } from "../middleware/authMiddleware.js";
import { profile } from "../controllers/testController.js";

const router = express.Router();

router.get("/profile", authenticate, profile);

export default router;