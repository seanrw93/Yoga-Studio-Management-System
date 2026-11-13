import { Router } from "express";
import { PrismaClient } from "@prisma/client";
import { UserController } from "../../controllers/user.controller";
import { UserService } from "../../services/user.service";
import { authMiddleware } from "../../middleware/auth.middleware";
import { requireSelfOrAdmin } from "../../middleware/authorize.middleware";
import { asyncHandler } from "../../middleware/error-handler.middleware";

const router = Router();
const controller = new UserController(new UserService(new PrismaClient()));

router.get(
  "/:id",
  authMiddleware,
  requireSelfOrAdmin,
  asyncHandler((req, res) => controller.getById(req, res)),
);

router.post(
  "/promote-admin",
  authMiddleware,
  asyncHandler((req, res) => controller.promoteSelfToAdmin(req, res)),
);

router.delete(
  "/:id",
  authMiddleware,
  asyncHandler((req, res) => controller.delete(req, res)),
);

export default router;
