import express from "express";
import { authenticate } from "../middleware/authMiddleware.js";
import { create, getAll, update, remove,  assign, myBugs ,getProjectBugs,} from "../controllers/bugController.js";
import { authorize } from "../middleware/roleMiddleware.js";

const router = express.Router();


router.post("/", authenticate, create);
router.get("/", authenticate, getAll);
router.put("/:id/assign",authenticate,authorize("Project Manager"),assign);
router.delete("/:id", authenticate, remove);
router.get("/my",authenticate,myBugs);
router.put("/:id", authenticate, update);
router.get(
  "/project/:projectId",
  authenticate,
  getProjectBugs
);

export default router;