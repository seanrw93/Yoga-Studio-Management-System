import { Request, Response, NextFunction } from "express";
import { PrismaClient } from "@prisma/client";
import { parseId } from "../utils/parse-id.util";

const prisma = new PrismaClient();

async function isAdmin(userId: number): Promise<boolean> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { admin: true },
  });

  return user?.admin === true;
}

export const requireAdmin = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  if (!req.userId) {
    res.status(401).json({ message: "Authentication required" });
    return;
  }

  try {
    if (!(await isAdmin(req.userId))) {
      res.status(403).json({ message: "Admin access required" });
      return;
    }

    next();
  } catch (error: unknown) {
    console.error("Authorization error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const requireSelfOrAdmin = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  if (!req.userId) {
    res.status(401).json({ message: "Authentication required" });
    return;
  }

  const targetId = parseId(req.params.id);

  if (targetId === null) {
    res.status(400).json({ message: "Invalid user ID" });
    return;
  }

  if (targetId === req.userId) {
    next();
    return;
  }

  try {
    if (!(await isAdmin(req.userId))) {
      res.status(403).json({ message: "Forbidden" });
      return;
    }

    next();
  } catch (error: unknown) {
    console.error("Authorization error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};
