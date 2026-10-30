import jwt from "jsonwebtoken";
import type { AuthTokenPayload } from "../types/jwt.types";

const JWT_SECRET = process.env.JWT_SECRET || "default-secret-key";

if (!JWT_SECRET) {
  throw new Error("JWT_SECRET must be configured");
}

export function generateToken(userId: number): string {
  return jwt.sign({ userId }, JWT_SECRET, { expiresIn: "24h" });
}

export function verifyToken(token: string): AuthTokenPayload | null {
  try {
    const decoded = jwt.verify(token, JWT_SECRET);

    if (
      typeof decoded === "string" ||
      !Number.isSafeInteger(decoded.userId) ||
      decoded.userId <= 0
    ) {
      return null;
    }

    return { userId: decoded.userId as number };
  } catch {
    return null;
  }
}
