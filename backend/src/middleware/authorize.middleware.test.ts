import type { NextFunction, Request, Response } from "express";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { requireAdmin, requireSelfOrAdmin } from "./authorize.middleware";

const { findUniqueMock, MockPrismaClient } = vi.hoisted(() => {
  const findUniqueMock = vi.fn();

  class MockPrismaClient {
    user = {
      findUnique: findUniqueMock,
    };
  }

  return { findUniqueMock, MockPrismaClient };
});

vi.mock("@prisma/client", () => ({
  PrismaClient: MockPrismaClient,
}));

const createResponse = () => {
  const response = {
    status: vi.fn(),
    json: vi.fn(),
  } as unknown as Response;

  vi.mocked(response.status).mockReturnValue(response);

  return response;
};

const createRequest = (
  userId?: number,
  params: Record<string, string> = {},
) => {
  return {
    userId,
    params,
  } as Request;
};

const createNext = () => {
  return vi.fn() as unknown as NextFunction;
};

describe("requireAdmin", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("rejects a request without an authenticated user", async () => {
    const req = createRequest();
    const res = createResponse();
    const next = createNext();

    await requireAdmin(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({
      message: "Authentication required",
    });
    expect(findUniqueMock).not.toHaveBeenCalled();
    expect(next).not.toHaveBeenCalled();
  });

  it("allows an administrator", async () => {
    findUniqueMock.mockResolvedValue({ admin: true });
    const req = createRequest(7);
    const res = createResponse();
    const next = createNext();

    await requireAdmin(req, res, next);

    expect(findUniqueMock).toHaveBeenCalledWith({
      where: { id: 7 },
      select: { admin: true },
    });
    expect(next).toHaveBeenCalledOnce();
    expect(res.status).not.toHaveBeenCalled();
  });

  it("rejects a non-administrator", async () => {
    findUniqueMock.mockResolvedValue({ admin: false });
    const req = createRequest(7);
    const res = createResponse();
    const next = createNext();

    await requireAdmin(req, res, next);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith({
      message: "Admin access required",
    });
    expect(next).not.toHaveBeenCalled();
  });

  it("rejects a user that does not exist", async () => {
    findUniqueMock.mockResolvedValue(null);
    const req = createRequest(7);
    const res = createResponse();
    const next = createNext();

    await requireAdmin(req, res, next);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(next).not.toHaveBeenCalled();
  });

  it("returns an internal server error when the admin lookup fails", async () => {
    const error = new Error("database unavailable");
    const consoleError = vi
      .spyOn(console, "error")
      .mockImplementation(() => {});
    findUniqueMock.mockRejectedValue(error);
    const req = createRequest(7);
    const res = createResponse();
    const next = createNext();

    await requireAdmin(req, res, next);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({
      message: "Internal server error",
    });
    expect(consoleError).toHaveBeenCalledWith("Authorization error:", error);
    expect(next).not.toHaveBeenCalled();

    consoleError.mockRestore();
  });
});

describe("requireSelfOrAdmin", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("rejects a request without an authenticated user", async () => {
    const req = createRequest(undefined, { id: "7" });
    const res = createResponse();
    const next = createNext();

    await requireSelfOrAdmin(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({
      message: "Authentication required",
    });
    expect(findUniqueMock).not.toHaveBeenCalled();
    expect(next).not.toHaveBeenCalled();
  });

  it("rejects an invalid target user ID", async () => {
    const req = createRequest(7, { id: "12abc" });
    const res = createResponse();
    const next = createNext();

    await requireSelfOrAdmin(req, res, next);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ message: "Invalid user ID" });
    expect(findUniqueMock).not.toHaveBeenCalled();
    expect(next).not.toHaveBeenCalled();
  });

  it("allows a user to access their own profile without a database lookup", async () => {
    const req = createRequest(7, { id: "7" });
    const res = createResponse();
    const next = createNext();

    await requireSelfOrAdmin(req, res, next);

    expect(next).toHaveBeenCalledOnce();
    expect(findUniqueMock).not.toHaveBeenCalled();
    expect(res.status).not.toHaveBeenCalled();
  });

  it("rejects a non-admin accessing another user's profile", async () => {
    findUniqueMock.mockResolvedValue({ admin: false });
    const req = createRequest(7, { id: "8" });
    const res = createResponse();
    const next = createNext();

    await requireSelfOrAdmin(req, res, next);

    expect(findUniqueMock).toHaveBeenCalledWith({
      where: { id: 7 },
      select: { admin: true },
    });
    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith({ message: "Forbidden" });
    expect(next).not.toHaveBeenCalled();
  });

  it("allows an admin to access another user's profile", async () => {
    findUniqueMock.mockResolvedValue({ admin: true });
    const req = createRequest(7, { id: "8" });
    const res = createResponse();
    const next = createNext();

    await requireSelfOrAdmin(req, res, next);

    expect(next).toHaveBeenCalledOnce();
    expect(res.status).not.toHaveBeenCalled();
  });

  it("returns an internal server error when the admin lookup fails", async () => {
    const error = new Error("database unavailable");
    const consoleError = vi
      .spyOn(console, "error")
      .mockImplementation(() => {});
    findUniqueMock.mockRejectedValue(error);
    const req = createRequest(7, { id: "8" });
    const res = createResponse();
    const next = createNext();

    await requireSelfOrAdmin(req, res, next);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({
      message: "Internal server error",
    });
    expect(consoleError).toHaveBeenCalledWith("Authorization error:", error);
    expect(next).not.toHaveBeenCalled();

    consoleError.mockRestore();
  });
});
