import express from "express";
import { authenticate } from "../middleware/authMiddleware.js";
import { uploadProject, scanProject, getProjectBugs, analyzeBug, fixBug, applyFix, buildProject , downloadRepairedProject} from "../controllers/aiProjectController.js";
import multer from "multer";

const upload = multer({ storage: multer.memoryStorage() });
const router = express.Router();

router.post("/upload", authenticate, upload.single("zipFile"), uploadProject);
router.post("/:id/scan", authenticate, scanProject);
router.get("/:id/bugs", authenticate, getProjectBugs);
router.get("/bugs/:id/analyze", authenticate, analyzeBug);
router.post("/bugs/:id/fix", authenticate, fixBug);
router.post("/bugs/:id/apply-fix", authenticate, applyFix);
router.post("/:id/build", authenticate, buildProject);
router.get("/:id/download-repaired", authenticate, downloadRepairedProject);
export default router;
