import { Router } from "express";
import { AuthController } from "../../controllers/auth.controller";
import { LoginSchema, RegisterSchema } from "../../dto/auth.dto";
import { validateBody } from "../../middleware/validate.middleware";

const router = Router();
const controller = new AuthController();

router.post("/login", validateBody(LoginSchema), (req, res) =>
  controller.login(req, res),
);

router.post("/register", validateBody(RegisterSchema), (req, res) =>
  controller.register(req, res),
);

export default router;
