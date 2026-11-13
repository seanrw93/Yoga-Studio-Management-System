import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { Request, Response, NextFunction } from "express";
import createError from "http-errors";
import { errorHandler, asyncHandler } from "./error-handler.middleware";

function mockRes(headersSent = false) {
  const res = {
    headersSent,
    status: vi.fn().mockReturnThis(),
    json: vi.fn().mockReturnThis(),
  };
  return res as unknown as Response & typeof res;
}

describe("errorHandler", () => {
  const req = {} as Request;
  const next = vi.fn() as unknown as NextFunction;

  beforeEach(() => {
    vi.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("responds with the http error status and message", () => {
    const res = mockRes();

    errorHandler(createError.NotFound("User not found"), req, res, next);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({ message: "User not found" });
  });

  it("responds with 403 for a forbidden error", () => {
    const res = mockRes();

    errorHandler(createError.Forbidden("Nope"), req, res, next);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith({ message: "Nope" });
  });

  it("hides the message of a 5xx http error", () => {
    const res = mockRes();

    errorHandler(createError(500, "db password leaked"), req, res, next);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ message: "Internal server error" });
  });

  it("responds with 500 and logs an unknown error", () => {
    const res = mockRes();
    const error = new Error("boom");

    errorHandler(error, req, res, next);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ message: "Internal server error" });
    expect(console.error).toHaveBeenCalledWith("Unhandled error:", error);
  });

  it("delegates to next when headers were already sent", () => {
    const res = mockRes(true);
    const error = new Error("late");

    errorHandler(error, req, res, next);

    expect(next).toHaveBeenCalledWith(error);
    expect(res.status).not.toHaveBeenCalled();
  });
});

describe("asyncHandler", () => {
  it("forwards a rejected promise to next", async () => {
    const error = createError.BadRequest("bad");
    const next = vi.fn();
    const handler = asyncHandler(async () => {
      throw error;
    });

    handler({} as Request, {} as Response, next);
    await Promise.resolve();

    expect(next).toHaveBeenCalledWith(error);
  });

  it("does not call next when the handler succeeds", async () => {
    const next = vi.fn();
    const handler = asyncHandler(async () => "ok");

    handler({} as Request, {} as Response, next);
    await Promise.resolve();

    expect(next).not.toHaveBeenCalled();
  });
});
