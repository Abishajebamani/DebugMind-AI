import express from "express";
import { authenticate } from "../middleware/authMiddleware.js";
import { stats, recentBugs,  bugChart,} from "../controllers/dashboardController.js";

const router = express.Router();

router.get("/stats", authenticate, stats);
router.get("/recent-bugs", authenticate, recentBugs);
router.get("/bug-chart", authenticate, bugChart);

export default router;