import type { PrismaClient } from "@prisma/client";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { TeacherService } from "./teacher.service";

const findManyMock = vi.fn();
const findUniqueMock = vi.fn();

const prisma = {
  teacher: { findMany: findManyMock, findUnique: findUniqueMock },
} as unknown as PrismaClient;

const service = new TeacherService(prisma);

const createdAt = new Date("2026-01-01T00:00:00.000Z");
const updatedAt = new Date("2026-01-02T00:00:00.000Z");

const createTeacher = (overrides: Record<string, unknown> = {}) => ({
  id: 3,
  firstName: "Anna",
  lastName: "Lee",
  createdAt,
  updatedAt,
  ...overrides,
});

const expectedResponse = (overrides: Record<string, unknown> = {}) => ({
  id: 3,
  firstName: "Anna",
  lastName: "Lee",
  createdAt,
  updatedAt,
  ...overrides,
});

beforeEach(() => {
  vi.clearAllMocks();
});

describe("TeacherService.getAll", () => {
  it("orders teachers by newest first", async () => {
    findManyMock.mockResolvedValue([]);

    await service.getAll();

    expect(findManyMock).toHaveBeenCalledWith({
      orderBy: { createdAt: "desc" },
    });
  });

  it("returns every teacher's public fields", async () => {
    findManyMock.mockResolvedValue([
      createTeacher(),
      createTeacher({ id: 4, firstName: "Ben" }),
    ]);

    await expect(service.getAll()).resolves.toEqual([
      expectedResponse(),
      expectedResponse({ id: 4, firstName: "Ben" }),
    ]);
  });

  it("returns an empty list when there are no teachers", async () => {
    findManyMock.mockResolvedValue([]);

    await expect(service.getAll()).resolves.toEqual([]);
  });

  it("propagates a database failure", async () => {
    const error = new Error("database unavailable");
    findManyMock.mockRejectedValue(error);

    await expect(service.getAll()).rejects.toBe(error);
  });
});

describe("TeacherService.getById", () => {
  it("looks the teacher up by ID", async () => {
    findUniqueMock.mockResolvedValue(createTeacher());

    await service.getById(3);

    expect(findUniqueMock).toHaveBeenCalledWith({ where: { id: 3 } });
  });

  it("returns the teacher's public fields", async () => {
    findUniqueMock.mockResolvedValue(createTeacher());

    await expect(service.getById(3)).resolves.toEqual(expectedResponse());
  });

  it("throws not found when the teacher does not exist", async () => {
    findUniqueMock.mockResolvedValue(null);

    await expect(service.getById(3)).rejects.toMatchObject({
      status: 404,
      message: "Teacher not found",
    });
  });

  it("propagates a database failure", async () => {
    const error = new Error("database unavailable");
    findUniqueMock.mockRejectedValue(error);

    await expect(service.getById(3)).rejects.toBe(error);
  });
});
