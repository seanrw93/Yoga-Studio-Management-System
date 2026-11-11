import { Router } from "express";
import { SessionController } from "../../controllers/session.controller";
import {
  CreateSessionSchema,
  UpdateSessionSchema,
} from "../../dto/session.dto";
import { authMiddleware } from "../../middleware/auth.middleware";
import { requireAdmin } from "../../middleware/authorize.middleware";
import { validateBody } from "../../middleware/validate.middleware";

const router = Router();
const controller = new SessionController();

router.get("/", authMiddleware, (req, res) => controller.getAll(req, res));

router.get("/:id", authMiddleware, (req, res) => controller.getById(req, res));

router.post(
  "/",
  authMiddleware,
  requireAdmin,
  validateBody(CreateSessionSchema),
  (req, res) => controller.create(req, res),
);

router.put(
  "/:id",
  authMiddleware,
  requireAdmin,
  validateBody(UpdateSessionSchema),
  (req, res) => controller.update(req, res),
);

router.delete("/:id", authMiddleware, requireAdmin, (req, res) =>
  controller.delete(req, res),
);

router.post("/:id/participate/", authMiddleware, (req, res) =>
  controller.participate(req, res),
);

router.delete("/:id/participate/", authMiddleware, (req, res) =>
  controller.unparticipate(req, res),
);

export default router;
