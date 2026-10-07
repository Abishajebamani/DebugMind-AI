import express from "express";
import { register, login } from "../controllers/authController.js";
import { profile } from "../controllers/testController.js";
import { authenticate } from "../middleware/authMiddleware.js";

const router = express.Router();

// Register User
router.post("/register", register);
router.post("/login", login);

export default router;