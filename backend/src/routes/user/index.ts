import { Router } from "express";
import { UserController } from "../../controllers/user.controller";
import { authMiddleware } from "../../middleware/auth.middleware";
import { requireSelfOrAdmin } from "../../middleware/authorize.middleware";

const router = Router();
const controller = new UserController();

router.get("/:id", authMiddleware, requireSelfOrAdmin, (req, res) =>
  controller.getById(req, res),
);

router.post("/promote-admin", authMiddleware, (req, res) =>
  controller.promoteSelfToAdmin(req, res),
);

router.delete("/:id", authMiddleware, (req, res) =>
  controller.delete(req, res),
);

export default router;
