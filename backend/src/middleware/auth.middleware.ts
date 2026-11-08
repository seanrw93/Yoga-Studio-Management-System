import { Request, Response, NextFunction } from "express";
import { verifyToken } from "../utils/jwt.util";

export const authMiddleware = (
  req: Request,
  res: Response,
  next: NextFunction,
): void => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    res.status(401).json({ message: "Authentication required" });
    return;
  }

  const token = authHeader.split(" ")[1];

  if (!token) {
    res.status(401).json({ message: "Invalid token" });
    return;
  }

  const decoded = verifyToken(token);

  if (
    !decoded ||
    !Number.isSafeInteger(decoded.userId) ||
    decoded.userId <= 0
  ) {
    res.status(401).json({ message: "Invalid or expired token" });
    return;
  }

  req.userId = decoded.userId;

  next();
};
