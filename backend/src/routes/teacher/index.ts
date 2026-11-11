import { Router } from "express";
import { TeacherController } from "../../controllers/teacher.controller";
import { authMiddleware } from "../../middleware/auth.middleware";

const router = Router();
const controller = new TeacherController();

router.get("/", authMiddleware, (req, res) => controller.getAll(req, res));

router.get("/:id", authMiddleware, (req, res) => controller.getById(req, res));

export default router;
