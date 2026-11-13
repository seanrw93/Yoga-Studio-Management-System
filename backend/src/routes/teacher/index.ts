import { Router } from "express";
import { PrismaClient } from "@prisma/client";
import { TeacherController } from "../../controllers/teacher.controller";
import { TeacherService } from "../../services/teacher.service";
import { authMiddleware } from "../../middleware/auth.middleware";
import { asyncHandler } from "../../middleware/error-handler.middleware";

const router = Router();
const controller = new TeacherController(
  new TeacherService(new PrismaClient()),
);

router.get(
  "/",
  authMiddleware,
  asyncHandler((req, res) => controller.getAll(req, res)),
);

router.get(
  "/:id",
  authMiddleware,
  asyncHandler((req, res) => controller.getById(req, res)),
);

export default router;
