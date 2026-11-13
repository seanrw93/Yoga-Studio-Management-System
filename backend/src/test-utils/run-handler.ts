import type { Request, Response } from "express";
import { vi } from "vitest";
import { errorHandler } from "../middleware/error-handler.middleware";

// Runs a controller method the way the app does: a thrown error is handed
// to the real error middleware, which writes the response.
export const runHandler = async (
  handler: (req: Request, res: Response) => Promise<unknown>,
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    await handler(req, res);
  } catch (error) {
    errorHandler(error, req, res, vi.fn());
  }
};
