import { Router } from "express";
import { PrismaClient } from "@prisma/client";
import { SessionController } from "../../controllers/session.controller";
import { SessionService } from "../../services/session.service";
import {
  CreateSessionSchema,
  UpdateSessionSchema,
} from "../../dto/session.dto";
import { authMiddleware } from "../../middleware/auth.middleware";
import { requireAdmin } from "../../middleware/authorize.middleware";
import { asyncHandler } from "../../middleware/error-handler.middleware";
import { validateBody } from "../../middleware/validate.middleware";

const router = Router();
const controller = new SessionController(
  new SessionService(new PrismaClient()),
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

router.post(
  "/",
  authMiddleware,
  requireAdmin,
  validateBody(CreateSessionSchema),
  asyncHandler((req, res) => controller.create(req, res)),
);

router.put(
  "/:id",
  authMiddleware,
  requireAdmin,
  validateBody(UpdateSessionSchema),
  asyncHandler((req, res) => controller.update(req, res)),
);

router.delete(
  "/:id",
  authMiddleware,
  requireAdmin,
  asyncHandler((req, res) => controller.delete(req, res)),
);

router.post(
  "/:id/participate/",
  authMiddleware,
  asyncHandler((req, res) => controller.participate(req, res)),
);

router.delete(
  "/:id/participate/",
  authMiddleware,
  asyncHandler((req, res) => controller.unparticipate(req, res)),
);

export default router;
