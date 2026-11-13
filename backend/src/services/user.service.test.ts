import type { PrismaClient } from "@prisma/client";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { UserService } from "./user.service";

const findUniqueMock = vi.fn();
const updateMock = vi.fn();
const deleteMock = vi.fn();

const prisma = {
  user: {
    findUnique: findUniqueMock,
    update: updateMock,
    delete: deleteMock,
  },
} as unknown as PrismaClient;

const service = new UserService(prisma);

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

const expectedResponse = (overrides: Record<string, unknown> = {}) => ({
  id: 7,
  email: "user@test.com",
  firstName: "Test",
  lastName: "User",
  admin: false,
  createdAt,
  updatedAt,
  ...overrides,
});

beforeEach(() => {
  vi.clearAllMocks();
});

describe("UserService.getById", () => {
  it("looks the user up by ID", async () => {
    findUniqueMock.mockResolvedValue(createUser());

    await service.getById(7);

    expect(findUniqueMock).toHaveBeenCalledWith({ where: { id: 7 } });
  });

  it("returns the user's public profile fields", async () => {
    findUniqueMock.mockResolvedValue(createUser());

    await expect(service.getById(7)).resolves.toEqual(expectedResponse());
  });

  it("does not return the password hash", async () => {
    findUniqueMock.mockResolvedValue(createUser());

    await expect(service.getById(7)).resolves.not.toHaveProperty("password");
  });

  it("throws not found when the user does not exist", async () => {
    findUniqueMock.mockResolvedValue(null);

    await expect(service.getById(7)).rejects.toMatchObject({
      status: 404,
      message: "User not found",
    });
  });

  it("propagates a database failure", async () => {
    const error = new Error("database unavailable");
    findUniqueMock.mockRejectedValue(error);

    await expect(service.getById(7)).rejects.toBe(error);
  });
});

describe("UserService.delete", () => {
  it("deletes an existing user", async () => {
    findUniqueMock.mockResolvedValue(createUser());
    deleteMock.mockResolvedValue(createUser());

    await service.delete(7);

    expect(deleteMock).toHaveBeenCalledWith({ where: { id: 7 } });
  });

  it("throws not found when the user does not exist", async () => {
    findUniqueMock.mockResolvedValue(null);

    await expect(service.delete(7)).rejects.toMatchObject({
      status: 404,
      message: "User not found",
    });
  });

  it("does not delete when the user does not exist", async () => {
    findUniqueMock.mockResolvedValue(null);

    await service.delete(7).catch(() => undefined);

    expect(deleteMock).not.toHaveBeenCalled();
  });

  it("propagates a deletion failure", async () => {
    const error = new Error("database unavailable");
    findUniqueMock.mockResolvedValue(createUser());
    deleteMock.mockRejectedValue(error);

    await expect(service.delete(7)).rejects.toBe(error);
  });
});

describe("UserService.promoteToAdmin", () => {
  it("promotes a non-admin user", async () => {
    findUniqueMock.mockResolvedValue(createUser());
    updateMock.mockResolvedValue(createUser({ admin: true }));

    await service.promoteToAdmin(7);

    expect(updateMock).toHaveBeenCalledWith({
      where: { id: 7 },
      data: { admin: true },
    });
  });

  it("returns the promoted user without the password hash", async () => {
    findUniqueMock.mockResolvedValue(createUser());
    updateMock.mockResolvedValue(createUser({ admin: true }));

    await expect(service.promoteToAdmin(7)).resolves.toEqual(
      expectedResponse({ admin: true }),
    );
  });

  it("returns an existing admin without updating the database", async () => {
    findUniqueMock.mockResolvedValue(createUser({ admin: true }));

    await expect(service.promoteToAdmin(7)).resolves.toEqual(
      expectedResponse({ admin: true }),
    );
    expect(updateMock).not.toHaveBeenCalled();
  });

  it("throws not found when the user does not exist", async () => {
    findUniqueMock.mockResolvedValue(null);

    await expect(service.promoteToAdmin(7)).rejects.toMatchObject({
      status: 404,
      message: "User not found",
    });
    expect(updateMock).not.toHaveBeenCalled();
  });

  it("propagates an update failure", async () => {
    const error = new Error("database unavailable");
    findUniqueMock.mockResolvedValue(createUser());
    updateMock.mockRejectedValue(error);

    await expect(service.promoteToAdmin(7)).rejects.toBe(error);
  });
});
