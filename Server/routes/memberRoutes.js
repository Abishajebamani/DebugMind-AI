import express from "express";
import { authenticate } from "../middleware/authMiddleware.js";

import {
  create,
  getAll,
  update,
  remove,
  getAssignableMembers,
} from "../controllers/memberController.js";

const router = express.Router();

router.post("/members", authenticate, create);

router.get(
  "/members/:projectId/assignable",
  authenticate,
  getAssignableMembers
);

router.get(
  "/members/:projectId",
  authenticate,
  getAll
);

router.put(
  "/members/:projectId/:id",
  authenticate,
  update
);

router.delete(
  "/members/:id",
  authenticate,
  remove
);

export default router;