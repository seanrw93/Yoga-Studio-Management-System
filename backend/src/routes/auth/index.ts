import { Router } from "express";
import { PrismaClient } from "@prisma/client";
import { AuthController } from "../../controllers/auth.controller";
import { AuthService } from "../../services/auth.service";
import { LoginSchema, RegisterSchema } from "../../dto/auth.dto";
import { asyncHandler } from "../../middleware/error-handler.middleware";
import { validateBody } from "../../middleware/validate.middleware";

const router = Router();
const controller = new AuthController(new AuthService(new PrismaClient()));

router.post(
  "/login",
  validateBody(LoginSchema),
  asyncHandler((req, res) => controller.login(req, res)),
);

router.post(
  "/register",
  validateBody(RegisterSchema),
  asyncHandler((req, res) => controller.register(req, res)),
);

export default router;
