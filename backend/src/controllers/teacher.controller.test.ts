import type { PrismaClient } from "@prisma/client";
import { PrismaClient as MockedPrismaClient } from "@prisma/client";
import type { Request, Response } from "express";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { runHandler } from "../test-utils/run-handler";
import { TeacherService } from "../services/teacher.service";
import { TeacherController } from "./teacher.controller";

const { findManyMock, findUniqueMock, MockPrismaClient } = vi.hoisted(() => {
  const findManyMock = vi.fn();
  const findUniqueMock = vi.fn();

  class MockPrismaClient {
    teacher = {
      findMany: findManyMock,
      findUnique: findUniqueMock,
    };
  }

  return { findManyMock, findUniqueMock, MockPrismaClient };
});

vi.mock("@prisma/client", () => ({
  PrismaClient: MockPrismaClient,
}));

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

const expectedTeacherResponse = (overrides: Record<string, unknown> = {}) => ({
  id: 3,
  firstName: "Anna",
  lastName: "Lee",
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

const createRequest = (params: Record<string, string> = {}) => {
  return { params } as unknown as Request;
};

const controller = new TeacherController(
  new TeacherService(new MockedPrismaClient() as unknown as PrismaClient),
);

describe("TeacherController.getAll", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns every teacher, newest first", async () => {
    findManyMock.mockResolvedValue([
      createTeacher(),
      createTeacher({ id: 4, firstName: "Ben" }),
    ]);
    const req = createRequest();
    const res = createResponse();

    await runHandler(controller.getAll.bind(controller), req, res);

    expect(findManyMock).toHaveBeenCalledWith({
      orderBy: { createdAt: "desc" },
    });
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith([
      expectedTeacherResponse(),
      expectedTeacherResponse({ id: 4, firstName: "Ben" }),
    ]);
  });

  it("returns an empty list when there are no teachers", async () => {
    findManyMock.mockResolvedValue([]);
    const req = createRequest();
    const res = createResponse();

    await runHandler(controller.getAll.bind(controller), req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith([]);
  });

  it("returns an internal server error when the lookup fails", async () => {
    const error = new Error("database unavailable");
    const consoleError = vi
      .spyOn(console, "error")
      .mockImplementation(() => {});
    findManyMock.mockRejectedValue(error);
    const req = createRequest();
    const res = createResponse();

    await runHandler(controller.getAll.bind(controller), req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({
      message: "Internal server error",
    });
    expect(consoleError).toHaveBeenCalledWith("Unhandled error:", error);

    consoleError.mockRestore();
  });
});

describe("TeacherController.getById", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("rejects an invalid teacher ID", async () => {
    const req = createRequest({ id: "12abc" });
    const res = createResponse();

    await runHandler(controller.getById.bind(controller), req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ message: "Invalid teacher ID" });
    expect(findUniqueMock).not.toHaveBeenCalled();
  });

  it("responds with not found when the teacher does not exist", async () => {
    findUniqueMock.mockResolvedValue(null);
    const req = createRequest({ id: "3" });
    const res = createResponse();

    await runHandler(controller.getById.bind(controller), req, res);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({ message: "Teacher not found" });
  });

  it("returns the teacher's public fields", async () => {
    findUniqueMock.mockResolvedValue(createTeacher());
    const req = createRequest({ id: "3" });
    const res = createResponse();

    await runHandler(controller.getById.bind(controller), req, res);

    expect(findUniqueMock).toHaveBeenCalledWith({ where: { id: 3 } });
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(expectedTeacherResponse());
  });

  it("returns an internal server error when the lookup fails", async () => {
    const error = new Error("database unavailable");
    const consoleError = vi
      .spyOn(console, "error")
      .mockImplementation(() => {});
    findUniqueMock.mockRejectedValue(error);
    const req = createRequest({ id: "3" });
    const res = createResponse();

    await runHandler(controller.getById.bind(controller), req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({
      message: "Internal server error",
    });
    expect(consoleError).toHaveBeenCalledWith("Unhandled error:", error);

    consoleError.mockRestore();
  });
});
