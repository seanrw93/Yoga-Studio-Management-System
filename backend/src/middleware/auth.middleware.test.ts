import type { NextFunction, Request, Response } from "express";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { authMiddleware } from "./auth.middleware";

const { verifyTokenMock } = vi.hoisted(() => ({
  verifyTokenMock: vi.fn(),
}));

vi.mock("../utils/jwt.util", () => ({
  verifyToken: verifyTokenMock,
}));

const createResponse = () => {
  const response = {
    status: vi.fn(),
    json: vi.fn(),
  } as unknown as Response;

  vi.mocked(response.status).mockReturnValue(response);

  return response;
};

const createRequest = (authorization?: string) => {
  return {
    headers: authorization === undefined ? {} : { authorization },
  } as Request;
};

const createNext = () => {
  return vi.fn() as unknown as NextFunction;
};

describe("authMiddleware", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("rejects a request without an authorization header", () => {
    const req = createRequest();
    const res = createResponse();
    const next = createNext();

    authMiddleware(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({
      message: "Authentication required",
    });
    expect(verifyTokenMock).not.toHaveBeenCalled();
    expect(next).not.toHaveBeenCalled();
  });

  it("rejects an authorization header that is not a bearer token", () => {
    const req = createRequest("Basic credentials");
    const res = createResponse();
    const next = createNext();

    authMiddleware(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({
      message: "Authentication required",
    });
    expect(next).not.toHaveBeenCalled();
  });

  it("rejects a bearer header without a token", () => {
    const req = createRequest("Bearer ");
    const res = createResponse();
    const next = createNext();

    authMiddleware(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ message: "Invalid token" });
    expect(verifyTokenMock).not.toHaveBeenCalled();
    expect(next).not.toHaveBeenCalled();
  });

  it("rejects an invalid or expired token", () => {
    verifyTokenMock.mockReturnValue(null);
    const req = createRequest("Bearer invalid-token");
    const res = createResponse();
    const next = createNext();

    authMiddleware(req, res, next);

    expect(verifyTokenMock).toHaveBeenCalledWith("invalid-token");
    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({
      message: "Invalid or expired token",
    });
    expect(next).not.toHaveBeenCalled();
  });

  it.each([
    ["zero", 0],
    ["negative", -1],
    ["decimal", 1.5],
    ["unsafe", Number.MAX_SAFE_INTEGER + 1],
  ])("rejects a token with a %s user ID", (_description, userId) => {
    verifyTokenMock.mockReturnValue({ userId });
    const req = createRequest("Bearer token");
    const res = createResponse();
    const next = createNext();

    authMiddleware(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({
      message: "Invalid or expired token",
    });
    expect(next).not.toHaveBeenCalled();
  });

  it("sets the authenticated user ID and calls next for a valid token", () => {
    verifyTokenMock.mockReturnValue({ userId: 42 });
    const req = createRequest("Bearer valid-token");
    const res = createResponse();
    const next = createNext();

    authMiddleware(req, res, next);

    expect(req.userId).toBe(42);
    expect(verifyTokenMock).toHaveBeenCalledWith("valid-token");
    expect(next).toHaveBeenCalledOnce();
    expect(res.status).not.toHaveBeenCalled();
    expect(res.json).not.toHaveBeenCalled();
  });
});
