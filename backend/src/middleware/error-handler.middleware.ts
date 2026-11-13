import { Request, Response, NextFunction, RequestHandler } from "express";
import { isHttpError } from "http-errors";

export const errorHandler = (
  error: unknown,
  _req: Request,
  res: Response,
  next: NextFunction,
): void => {
  if (res.headersSent) {
    next(error);
    return;
  }

  if (isHttpError(error) && error.expose) {
    res.status(error.status).json({ message: error.message });
    return;
  }

  console.error("Unhandled error:", error);
  res.status(500).json({ message: "Internal server error" });
};

// Express 4 does not forward rejected promises to error middleware.
export const asyncHandler =
  (
    handler: (
      req: Request,
      res: Response,
      next: NextFunction,
    ) => Promise<unknown>,
  ): RequestHandler =>
  (req, res, next) => {
    handler(req, res, next).catch(next);
  };
