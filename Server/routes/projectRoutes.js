import express from "express";
import { authenticate } from "../middleware/authMiddleware.js";
import {create,getAll,update,remove,getById,} from "../controllers/projectController.js";
import { authorize } from "../middleware/roleMiddleware.js";

const router = express.Router();

router.post("/",authenticate,authorize("Admin", "Developer"),create);
router.get("/", authenticate, getAll);
router.put("/:id", authenticate, update);
router.delete( "/:id",authenticate,authorize("Admin", "Developer"),remove);
router.get("/:id", authenticate, getById);

export default router;