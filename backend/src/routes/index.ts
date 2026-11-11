import { Router } from "express";
import authRoutes from "./auth";
import sessionRoutes from "./session";
import teacherRoutes from "./teacher";
import userRoutes from "./user";

const router = Router();

router.use("/auth", authRoutes);
router.use("/session", sessionRoutes);
router.use("/teacher", teacherRoutes);
router.use("/user", userRoutes);

export default router;
