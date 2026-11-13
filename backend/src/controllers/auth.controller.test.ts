import type { PrismaClient } from "@prisma/client";
import { PrismaClient as MockedPrismaClient } from "@prisma/client";
import type { Request, Response } from "express";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { runHandler } from "../test-utils/run-handler";
import { AuthService } from "../services/auth.service";
import { AuthController } from "./auth.controller";

const {
  findUniqueMock,
  createMock,
  compareMock,
  hashMock,
  generateTokenMock,
  MockPrismaClient,
} = vi.hoisted(() => {
  const findUniqueMock = vi.fn();
  const createMock = vi.fn();

  class MockPrismaClient {
    user = {
      findUnique: findUniqueMock,
      create: createMock,
    };
  }

  return {
    findUniqueMock,
    createMock,
    compareMock: vi.fn(),
    hashMock: vi.fn(),
    generateTokenMock: vi.fn(),
    MockPrismaClient,
  };
});

vi.mock("@prisma/client", () => ({
  PrismaClient: MockPrismaClient,
}));

vi.mock("bcrypt", () => ({ compare: compareMock, hash: hashMock }));

vi.mock("../utils/jwt.util", () => ({ generateToken: generateTokenMock }));

const createUser = (overrides: Record<string, unknown> = {}) => ({
  id: 7,
  email: "user@test.com",
  firstName: "Test",
  lastName: "User",
  password: "hashed-password",
  admin: false,
  createdAt: new Date("2026-01-01T00:00:00.000Z"),
  updatedAt: new Date("2026-01-02T00:00:00.000Z"),
  ...overrides,
});

const expectedAuthResponse = (overrides: Record<string, unknown> = {}) => ({
  id: 7,
  email: "user@test.com",
  firstName: "Test",
  lastName: "User",
  admin: false,
  token: "signed-token",
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

const createRequest = (body: Record<string, unknown> = {}) => {
  return { body } as Request;
};

const credentials = { email: "user@test.com", password: "Password1!" };
const registration = { ...credentials, firstName: "Test", lastName: "User" };

const controller = new AuthController(
  new AuthService(new MockedPrismaClient() as unknown as PrismaClient),
);

describe("AuthController.login", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    generateTokenMock.mockReturnValue("signed-token");
  });

  it("returns the user's profile and a token for valid credentials", async () => {
    findUniqueMock.mockResolvedValue(createUser());
    compareMock.mockResolvedValue(true);
    const req = createRequest(credentials);
    const res = createResponse();

    await runHandler(controller.login.bind(controller), req, res);

    expect(findUniqueMock).toHaveBeenCalledWith({
      where: { email: "user@test.com" },
    });
    expect(compareMock).toHaveBeenCalledWith("Password1!", "hashed-password");
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(expectedAuthResponse());
  });

  it("does not return the password hash", async () => {
    findUniqueMock.mockResolvedValue(createUser());
    compareMock.mockResolvedValue(true);
    const req = createRequest(credentials);
    const res = createResponse();

    await runHandler(controller.login.bind(controller), req, res);

    expect(res.json).toHaveBeenCalledWith(
      expect.not.objectContaining({ password: expect.anything() }),
    );
  });

  it("rejects an unknown email", async () => {
    findUniqueMock.mockResolvedValue(null);
    const req = createRequest(credentials);
    const res = createResponse();

    await runHandler(controller.login.bind(controller), req, res);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ message: "Invalid credentials" });
    expect(compareMock).not.toHaveBeenCalled();
  });

  it("rejects a wrong password", async () => {
    findUniqueMock.mockResolvedValue(createUser());
    compareMock.mockResolvedValue(false);
    const req = createRequest(credentials);
    const res = createResponse();

    await runHandler(controller.login.bind(controller), req, res);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ message: "Invalid credentials" });
    expect(generateTokenMock).not.toHaveBeenCalled();
  });

  it("returns an internal server error when the lookup fails", async () => {
    const error = new Error("database unavailable");
    const consoleError = vi
      .spyOn(console, "error")
      .mockImplementation(() => {});
    findUniqueMock.mockRejectedValue(error);
    const req = createRequest(credentials);
    const res = createResponse();

    await runHandler(controller.login.bind(controller), req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({
      message: "Internal server error",
    });
    expect(consoleError).toHaveBeenCalledWith("Unhandled error:", error);

    consoleError.mockRestore();
  });
});

describe("AuthController.register", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    generateTokenMock.mockReturnValue("signed-token");
    hashMock.mockResolvedValue("hashed-password");
  });

  it("creates a non-admin user with a hashed password", async () => {
    findUniqueMock.mockResolvedValue(null);
    createMock.mockResolvedValue(createUser());
    const req = createRequest(registration);
    const res = createResponse();

    await runHandler(controller.register.bind(controller), req, res);

    expect(hashMock).toHaveBeenCalledWith("Password1!", 10);
    expect(createMock).toHaveBeenCalledWith({
      data: {
        email: "user@test.com",
        password: "hashed-password",
        firstName: "Test",
        lastName: "User",
        admin: false,
      },
    });
  });

  it("returns the new user's profile and a token", async () => {
    findUniqueMock.mockResolvedValue(null);
    createMock.mockResolvedValue(createUser());
    const req = createRequest(registration);
    const res = createResponse();

    await runHandler(controller.register.bind(controller), req, res);

    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith(expectedAuthResponse());
  });

  it("does not return the password hash", async () => {
    findUniqueMock.mockResolvedValue(null);
    createMock.mockResolvedValue(createUser());
    const req = createRequest(registration);
    const res = createResponse();

    await runHandler(controller.register.bind(controller), req, res);

    expect(res.json).toHaveBeenCalledWith(
      expect.not.objectContaining({ password: expect.anything() }),
    );
  });

  it("rejects an email that is already registered", async () => {
    findUniqueMock.mockResolvedValue(createUser());
    const req = createRequest(registration);
    const res = createResponse();

    await runHandler(controller.register.bind(controller), req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ message: "Email already exists" });
    expect(createMock).not.toHaveBeenCalled();
  });

  it("returns an internal server error when creation fails", async () => {
    const error = new Error("database unavailable");
    const consoleError = vi
      .spyOn(console, "error")
      .mockImplementation(() => {});
    findUniqueMock.mockResolvedValue(null);
    createMock.mockRejectedValue(error);
    const req = createRequest(registration);
    const res = createResponse();

    await runHandler(controller.register.bind(controller), req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({
      message: "Internal server error",
    });
    expect(consoleError).toHaveBeenCalledWith("Unhandled error:", error);

    consoleError.mockRestore();
  });
});
