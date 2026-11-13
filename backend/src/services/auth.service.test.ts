import type { PrismaClient } from "@prisma/client";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { AuthService } from "./auth.service";

const { compareMock, hashMock, generateTokenMock } = vi.hoisted(() => ({
  compareMock: vi.fn(),
  hashMock: vi.fn(),
  generateTokenMock: vi.fn(),
}));

vi.mock("bcrypt", () => ({ compare: compareMock, hash: hashMock }));
vi.mock("../utils/jwt.util", () => ({ generateToken: generateTokenMock }));

const findUniqueMock = vi.fn();
const createMock = vi.fn();

const prisma = {
  user: { findUnique: findUniqueMock, create: createMock },
} as unknown as PrismaClient;

const service = new AuthService(prisma);

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

const expectedResponse = (overrides: Record<string, unknown> = {}) => ({
  id: 7,
  email: "user@test.com",
  firstName: "Test",
  lastName: "User",
  admin: false,
  token: "signed-token",
  ...overrides,
});

const credentials = { email: "user@test.com", password: "Password1!" };
const registration = {
  ...credentials,
  firstName: "Test",
  lastName: "User",
};

beforeEach(() => {
  vi.clearAllMocks();
  generateTokenMock.mockReturnValue("signed-token");
});

describe("AuthService.login", () => {
  it("looks the user up by email", async () => {
    findUniqueMock.mockResolvedValue(createUser());
    compareMock.mockResolvedValue(true);

    await service.login(credentials);

    expect(findUniqueMock).toHaveBeenCalledWith({
      where: { email: "user@test.com" },
    });
  });

  it("compares the submitted password with the stored hash", async () => {
    findUniqueMock.mockResolvedValue(createUser());
    compareMock.mockResolvedValue(true);

    await service.login(credentials);

    expect(compareMock).toHaveBeenCalledWith("Password1!", "hashed-password");
  });

  it("returns the user's profile with a signed token", async () => {
    findUniqueMock.mockResolvedValue(createUser());
    compareMock.mockResolvedValue(true);

    await expect(service.login(credentials)).resolves.toEqual(
      expectedResponse(),
    );
    expect(generateTokenMock).toHaveBeenCalledWith(7);
  });

  it("does not return the password hash", async () => {
    findUniqueMock.mockResolvedValue(createUser());
    compareMock.mockResolvedValue(true);

    await expect(service.login(credentials)).resolves.not.toHaveProperty(
      "password",
    );
  });

  it("throws unauthorized when the email is unknown", async () => {
    findUniqueMock.mockResolvedValue(null);

    await expect(service.login(credentials)).rejects.toMatchObject({
      status: 401,
      message: "Invalid credentials",
    });
    expect(compareMock).not.toHaveBeenCalled();
  });

  it("throws unauthorized when the password is wrong", async () => {
    findUniqueMock.mockResolvedValue(createUser());
    compareMock.mockResolvedValue(false);

    await expect(service.login(credentials)).rejects.toMatchObject({
      status: 401,
      message: "Invalid credentials",
    });
    expect(generateTokenMock).not.toHaveBeenCalled();
  });

  it("propagates a database failure", async () => {
    const error = new Error("database unavailable");
    findUniqueMock.mockRejectedValue(error);

    await expect(service.login(credentials)).rejects.toBe(error);
  });
});

describe("AuthService.register", () => {
  it("rejects an email that is already registered", async () => {
    findUniqueMock.mockResolvedValue(createUser());

    await expect(service.register(registration)).rejects.toMatchObject({
      status: 400,
      message: "Email already exists",
    });
    expect(createMock).not.toHaveBeenCalled();
  });

  it("hashes the password with 10 salt rounds", async () => {
    findUniqueMock.mockResolvedValue(null);
    hashMock.mockResolvedValue("hashed-password");
    createMock.mockResolvedValue(createUser());

    await service.register(registration);

    expect(hashMock).toHaveBeenCalledWith("Password1!", 10);
  });

  it("creates a non-admin user with the hashed password", async () => {
    findUniqueMock.mockResolvedValue(null);
    hashMock.mockResolvedValue("hashed-password");
    createMock.mockResolvedValue(createUser());

    await service.register(registration);

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

  it("returns the new user's profile with a signed token", async () => {
    findUniqueMock.mockResolvedValue(null);
    hashMock.mockResolvedValue("hashed-password");
    createMock.mockResolvedValue(createUser());

    await expect(service.register(registration)).resolves.toEqual(
      expectedResponse(),
    );
    expect(generateTokenMock).toHaveBeenCalledWith(7);
  });

  it("does not return the password hash", async () => {
    findUniqueMock.mockResolvedValue(null);
    hashMock.mockResolvedValue("hashed-password");
    createMock.mockResolvedValue(createUser());

    await expect(service.register(registration)).resolves.not.toHaveProperty(
      "password",
    );
  });

  it("propagates a creation failure", async () => {
    const error = new Error("database unavailable");
    findUniqueMock.mockResolvedValue(null);
    hashMock.mockResolvedValue("hashed-password");
    createMock.mockRejectedValue(error);

    await expect(service.register(registration)).rejects.toBe(error);
  });
});
