import type { NextFunction, Request, Response } from "express";
import { describe, expect, it, vi } from "vitest";
import { z } from "zod";
import { validateBody } from "./validate.middleware";

const createResponse = () => {
  const response = {
    status: vi.fn(),
    json: vi.fn(),
  } as unknown as Response;

  vi.mocked(response.status).mockReturnValue(response);

  return response;
};

describe("validateBody", () => {
  const schema = z.object({
    name: z.string().trim().min(3),
  });

  it("passes parsed data to the next middleware", () => {
    const req = {
      body: { name: "  Morning Flow  " },
    } as Request;
    const res = createResponse();
    const next = vi.fn() as unknown as NextFunction;

    validateBody(schema)(req, res, next);

    expect(req.body).toEqual({ name: "Morning Flow" });
    expect(next).toHaveBeenCalledOnce();
    expect(res.status).not.toHaveBeenCalled();
  });

  it("returns 400 for invalid data", () => {
    const req = {
      body: { name: "No" },
    } as Request;
    const res = createResponse();
    const next = vi.fn() as unknown as NextFunction;

    validateBody(schema)(req, res, next);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        message: "Validation failed",
        errors: expect.any(Object),
      }),
    );
    expect(next).not.toHaveBeenCalled();
  });
});
