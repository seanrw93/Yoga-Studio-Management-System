import type { Request, Response } from "express";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { UserController } from "./user.controller";

const { findUniqueMock, updateMock, deleteMock, MockPrismaClient } = vi.hoisted(
  () => {
    const findUniqueMock = vi.fn();
    const updateMock = vi.fn();
    const deleteMock = vi.fn();

    class MockPrismaClient {
      user = {
        findUnique: findUniqueMock,
        update: updateMock,
        delete: deleteMock,
      };
    }

    return { findUniqueMock, updateMock, deleteMock, MockPrismaClient };
  },
);

vi.mock("@prisma/client", () => ({
  PrismaClient: MockPrismaClient,
}));

const createdAt = new Date("2026-01-01T00:00:00.000Z");
const updatedAt = new Date("2026-01-02T00:00:00.000Z");

const createUser = (overrides: Record<string, unknown> = {}) => ({
  id: 7,
  email: "user@test.com",
  firstName: "Test",
  lastName: "User",
  password: "hashed-password",
  admin: false,
  createdAt,
  updatedAt,
  ...overrides,
});

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
  body: Record<string, unknown> = {},
) => {
  return {
    userId,
    params,
    body,
  } as Request;
};

const controller = new UserController();

describe("UserController.getById", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("rejects an invalid user ID", async () => {
    const req = createRequest(7, { id: "12abc" });
    const res = createResponse();

    await controller.getById(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ message: "Invalid user ID" });
    expect(findUniqueMock).not.toHaveBeenCalled();
  });

  it("responds with not found when the user does not exist", async () => {
    findUniqueMock.mockResolvedValue(null);
    const req = createRequest(7, { id: "8" });
    const res = createResponse();

    await controller.getById(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({ message: "User not found" });
  });

  it("returns the user's public profile fields", async () => {
    findUniqueMock.mockResolvedValue(createUser());
    const req = createRequest(7, { id: "7" });
    const res = createResponse();

    await controller.getById(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({
      id: 7,
      email: "user@test.com",
      firstName: "Test",
      lastName: "User",
      admin: false,
      createdAt,
      updatedAt,
    });
  });

  it("does not return the password hash", async () => {
    findUniqueMock.mockResolvedValue(createUser());
    const req = createRequest(7, { id: "7" });
    const res = createResponse();

    await controller.getById(req, res);

    expect(res.json).toHaveBeenCalledWith(
      expect.not.objectContaining({ password: expect.anything() }),
    );
  });

  it("returns an internal server error when the lookup fails", async () => {
    const error = new Error("database unavailable");
    const consoleError = vi
      .spyOn(console, "error")
      .mockImplementation(() => {});
    findUniqueMock.mockRejectedValue(error);
    const req = createRequest(7, { id: "7" });
    const res = createResponse();

    await controller.getById(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({
      message: "Internal server error",
    });
    expect(consoleError).toHaveBeenCalledWith("Get user error:", error);

    consoleError.mockRestore();
  });
});

describe("UserController.delete", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("rejects an invalid user ID", async () => {
    const req = createRequest(7, { id: "12abc" });
    const res = createResponse();

    await controller.delete(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ message: "Invalid user ID" });
    expect(findUniqueMock).not.toHaveBeenCalled();
    expect(deleteMock).not.toHaveBeenCalled();
  });

  it("rejects deleting another user's account", async () => {
    const req = createRequest(7, { id: "8" });
    const res = createResponse();

    await controller.delete(req, res);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith({
      message: "You can only delete your own account",
    });
    expect(findUniqueMock).not.toHaveBeenCalled();
    expect(deleteMock).not.toHaveBeenCalled();
  });

  it("deletes the authenticated user's own account", async () => {
    findUniqueMock.mockResolvedValue(createUser());
    deleteMock.mockResolvedValue(createUser());
    const req = createRequest(7, { id: "7" });
    const res = createResponse();

    await controller.delete(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({
      message: "User deleted successfully",
    });
  });

  it("responds with not found when the user does not exist", async () => {
    findUniqueMock.mockResolvedValue(null);
    const req = createRequest(7, { id: "7" });
    const res = createResponse();

    await controller.delete(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({ message: "User not found" });
    expect(deleteMock).not.toHaveBeenCalled();
  });

  it("returns an internal server error when the deletion fails", async () => {
    const error = new Error("database unavailable");
    const consoleError = vi
      .spyOn(console, "error")
      .mockImplementation(() => {});
    findUniqueMock.mockResolvedValue(createUser());
    deleteMock.mockRejectedValue(error);
    const req = createRequest(7, { id: "7" });
    const res = createResponse();

    await controller.delete(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({
      message: "Internal server error",
    });
    expect(consoleError).toHaveBeenCalledWith("Delete user error:", error);

    consoleError.mockRestore();
  });

  it("does not allow deletion without an authenticated user", async () => {
    const req = createRequest(undefined, { id: "7" });
    const res = createResponse();

    await controller.delete(req, res);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(findUniqueMock).not.toHaveBeenCalled();
    expect(deleteMock).not.toHaveBeenCalled();
  });

  it("ignores a user ID supplied in the request body", async () => {
    const req = createRequest(7, { id: "8" }, { userId: 8, id: 8 });
    const res = createResponse();

    await controller.delete(req, res);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(deleteMock).not.toHaveBeenCalled();
  });
});

describe("UserController.promoteSelfToAdmin", () => {
  beforeEach(() => {
    vi.unstubAllEnvs();
    vi.clearAllMocks();
    vi.stubEnv("NODE_ENV", "development");
    vi.stubEnv("ENABLE_ADMIN_SELF_PROMOTION", "true");
  });

  it("rejects self-promotion when NODE_ENV is production", async () => {
    vi.stubEnv("NODE_ENV", "production");
    const req = createRequest(7);
    const res = createResponse();

    await controller.promoteSelfToAdmin(req, res);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(findUniqueMock).not.toHaveBeenCalled();
    expect(updateMock).not.toHaveBeenCalled();
  });

  it("rejects self-promotion when NODE_ENV is missing", async () => {
    vi.stubEnv("NODE_ENV", undefined);
    const req = createRequest(7);
    const res = createResponse();

    await controller.promoteSelfToAdmin(req, res);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(updateMock).not.toHaveBeenCalled();
  });

  it("rejects self-promotion when the flag is missing", async () => {
    vi.stubEnv("ENABLE_ADMIN_SELF_PROMOTION", undefined);
    const req = createRequest(7);
    const res = createResponse();

    await controller.promoteSelfToAdmin(req, res);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(updateMock).not.toHaveBeenCalled();
  });

  it("rejects self-promotion when the flag is false", async () => {
    vi.stubEnv("ENABLE_ADMIN_SELF_PROMOTION", "false");
    const req = createRequest(7);
    const res = createResponse();

    await controller.promoteSelfToAdmin(req, res);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith({
      message: "Admin self-promotion is only available in development",
    });
    expect(updateMock).not.toHaveBeenCalled();
  });

  it("rejects self-promotion in production even when the flag is true", async () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("ENABLE_ADMIN_SELF_PROMOTION", "true");
    const req = createRequest(7);
    const res = createResponse();

    await controller.promoteSelfToAdmin(req, res);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(findUniqueMock).not.toHaveBeenCalled();
    expect(updateMock).not.toHaveBeenCalled();
  });

  it("rejects an unauthenticated request when self-promotion is enabled", async () => {
    const req = createRequest();
    const res = createResponse();

    await controller.promoteSelfToAdmin(req, res);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ message: "Unauthorized" });
    expect(findUniqueMock).not.toHaveBeenCalled();
  });

  it("responds with not found when the user does not exist", async () => {
    findUniqueMock.mockResolvedValue(null);
    const req = createRequest(7);
    const res = createResponse();

    await controller.promoteSelfToAdmin(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({ message: "User not found" });
    expect(updateMock).not.toHaveBeenCalled();
  });

  it("returns an existing admin without updating the database", async () => {
    findUniqueMock.mockResolvedValue(createUser({ admin: true }));
    const req = createRequest(7);
    const res = createResponse();

    await controller.promoteSelfToAdmin(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({
      id: 7,
      email: "user@test.com",
      firstName: "Test",
      lastName: "User",
      admin: true,
      createdAt,
      updatedAt,
    });
    expect(updateMock).not.toHaveBeenCalled();
  });

  it("promotes a non-admin user to admin", async () => {
    findUniqueMock.mockResolvedValue(createUser());
    updateMock.mockResolvedValue(createUser({ admin: true }));
    const req = createRequest(7);
    const res = createResponse();

    await controller.promoteSelfToAdmin(req, res);

    expect(updateMock).toHaveBeenCalledWith({
      where: { id: 7 },
      data: { admin: true },
    });
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({
      id: 7,
      email: "user@test.com",
      firstName: "Test",
      lastName: "User",
      admin: true,
      createdAt,
      updatedAt,
    });
  });

  it("returns an internal server error when the user lookup fails", async () => {
    const error = new Error("database unavailable");
    const consoleError = vi
      .spyOn(console, "error")
      .mockImplementation(() => {});
    findUniqueMock.mockRejectedValue(error);
    const req = createRequest(7);
    const res = createResponse();

    await controller.promoteSelfToAdmin(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({
      message: "Internal server error",
    });
    expect(consoleError).toHaveBeenCalledWith("Promote user error:", error);

    consoleError.mockRestore();
  });

  it("returns an internal server error when the update fails", async () => {
    const error = new Error("database unavailable");
    const consoleError = vi
      .spyOn(console, "error")
      .mockImplementation(() => {});
    findUniqueMock.mockResolvedValue(createUser());
    updateMock.mockRejectedValue(error);
    const req = createRequest(7);
    const res = createResponse();

    await controller.promoteSelfToAdmin(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({
      message: "Internal server error",
    });

    consoleError.mockRestore();
  });
});
