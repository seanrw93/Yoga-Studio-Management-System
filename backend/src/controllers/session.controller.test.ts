import type { Request, Response } from "express";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { SessionController } from "./session.controller";

const {
  sessionFindManyMock,
  sessionFindUniqueMock,
  sessionCreateMock,
  sessionUpdateMock,
  sessionDeleteMock,
  teacherFindUniqueMock,
  participationFindUniqueMock,
  participationCreateMock,
  participationDeleteMock,
  MockPrismaClient,
} = vi.hoisted(() => {
  const sessionFindManyMock = vi.fn();
  const sessionFindUniqueMock = vi.fn();
  const sessionCreateMock = vi.fn();
  const sessionUpdateMock = vi.fn();
  const sessionDeleteMock = vi.fn();
  const teacherFindUniqueMock = vi.fn();
  const participationFindUniqueMock = vi.fn();
  const participationCreateMock = vi.fn();
  const participationDeleteMock = vi.fn();

  class MockPrismaClient {
    session = {
      findMany: sessionFindManyMock,
      findUnique: sessionFindUniqueMock,
      create: sessionCreateMock,
      update: sessionUpdateMock,
      delete: sessionDeleteMock,
    };
    teacher = {
      findUnique: teacherFindUniqueMock,
    };
    sessionParticipation = {
      findUnique: participationFindUniqueMock,
      create: participationCreateMock,
      delete: participationDeleteMock,
    };
  }

  return {
    sessionFindManyMock,
    sessionFindUniqueMock,
    sessionCreateMock,
    sessionUpdateMock,
    sessionDeleteMock,
    teacherFindUniqueMock,
    participationFindUniqueMock,
    participationCreateMock,
    participationDeleteMock,
    MockPrismaClient,
  };
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
  body: Record<string, unknown> = {},
  query: Record<string, unknown> = {},
) => {
  return {
    userId,
    params,
    body,
    query,
  } as unknown as Request;
};

const controller = new SessionController();

const sessionDate = new Date("2026-03-01T10:00:00.000Z");
const createdAt = new Date("2026-01-01T00:00:00.000Z");
const updatedAt = new Date("2026-01-02T00:00:00.000Z");

const createSessionRecord = (overrides: Record<string, unknown> = {}) => ({
  id: 10,
  name: "Morning Flow",
  date: sessionDate,
  description: "A gentle start to the day",
  teacherId: 3,
  teacher: {
    id: 3,
    firstName: "Anna",
    lastName: "Lee",
    createdAt,
  },
  participants: [{ user: { id: 1 } }, { user: { id: 2 } }],
  createdAt,
  updatedAt,
  ...overrides,
});

const expectedSessionResponse = (overrides: Record<string, unknown> = {}) => ({
  id: 10,
  name: "Morning Flow",
  date: sessionDate,
  description: "A gentle start to the day",
  teacher: { id: 3, firstName: "Anna", lastName: "Lee" },
  users: [1, 2],
  createdAt,
  updatedAt,
  ...overrides,
});

const sessionInclude = {
  teacher: true,
  participants: { include: { user: true } },
};

describe("SessionController.getAll", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns every session with its teacher and participant IDs", async () => {
    sessionFindManyMock.mockResolvedValue([createSessionRecord()]);
    const req = createRequest(7);
    const res = createResponse();

    await controller.getAll(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith([expectedSessionResponse()]);
  });

  it("returns an empty list when there are no sessions", async () => {
    sessionFindManyMock.mockResolvedValue([]);
    const req = createRequest(7);
    const res = createResponse();

    await controller.getAll(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith([]);
  });

  it("returns an internal server error when the lookup fails", async () => {
    const error = new Error("database unavailable");
    const consoleError = vi
      .spyOn(console, "error")
      .mockImplementation(() => {});
    sessionFindManyMock.mockRejectedValue(error);
    const req = createRequest(7);
    const res = createResponse();

    await controller.getAll(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({
      message: "Internal server error",
    });
    expect(consoleError).toHaveBeenCalledWith("Get sessions error:", error);

    consoleError.mockRestore();
  });
});

describe("SessionController.getById", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("rejects an invalid session ID", async () => {
    const req = createRequest(7, { id: "12abc" });
    const res = createResponse();

    await controller.getById(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ message: "Invalid session ID" });
    expect(sessionFindUniqueMock).not.toHaveBeenCalled();
  });

  it("responds with not found when the session does not exist", async () => {
    sessionFindUniqueMock.mockResolvedValue(null);
    const req = createRequest(7, { id: "10" });
    const res = createResponse();

    await controller.getById(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({ message: "Session not found" });
  });

  it("returns the session with its teacher and participant IDs", async () => {
    sessionFindUniqueMock.mockResolvedValue(createSessionRecord());
    const req = createRequest(7, { id: "10" });
    const res = createResponse();

    await controller.getById(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(expectedSessionResponse());
  });

  it("returns an internal server error when the lookup fails", async () => {
    const error = new Error("database unavailable");
    const consoleError = vi
      .spyOn(console, "error")
      .mockImplementation(() => {});
    sessionFindUniqueMock.mockRejectedValue(error);
    const req = createRequest(7, { id: "10" });
    const res = createResponse();

    await controller.getById(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({
      message: "Internal server error",
    });
    expect(consoleError).toHaveBeenCalledWith("Get session error:", error);

    consoleError.mockRestore();
  });
});

describe("SessionController.create", () => {
  const validBody = {
    name: "Morning Flow",
    date: "2026-03-01T10:00:00.000Z",
    description: "A gentle start to the day",
    teacherId: 3,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("requires a name", async () => {
    const req = createRequest(7, {}, { ...validBody, name: undefined });
    const res = createResponse();

    await controller.create(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ message: "Name is required" });
    expect(sessionCreateMock).not.toHaveBeenCalled();
  });

  it("requires a date", async () => {
    const req = createRequest(7, {}, { ...validBody, date: undefined });
    const res = createResponse();

    await controller.create(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ message: "Date is required" });
    expect(sessionCreateMock).not.toHaveBeenCalled();
  });

  it("requires a description", async () => {
    const req = createRequest(7, {}, { ...validBody, description: undefined });
    const res = createResponse();

    await controller.create(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      message: "Description is required",
    });
    expect(sessionCreateMock).not.toHaveBeenCalled();
  });

  it("requires a teacher ID", async () => {
    const req = createRequest(7, {}, { ...validBody, teacherId: undefined });
    const res = createResponse();

    await controller.create(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      message: "Teacher ID is required",
    });
    expect(sessionCreateMock).not.toHaveBeenCalled();
  });

  it("responds with not found when the teacher does not exist", async () => {
    teacherFindUniqueMock.mockResolvedValue(null);
    const req = createRequest(7, {}, validBody);
    const res = createResponse();

    await controller.create(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({ message: "Teacher not found" });
    expect(sessionCreateMock).not.toHaveBeenCalled();
  });

  it("creates the session with the submitted values and returns it", async () => {
    teacherFindUniqueMock.mockResolvedValue({ id: 3 });
    sessionCreateMock.mockResolvedValue(createSessionRecord());
    const req = createRequest(7, {}, validBody);
    const res = createResponse();

    await controller.create(req, res);

    expect(sessionCreateMock).toHaveBeenCalledWith({
      data: {
        name: "Morning Flow",
        date: sessionDate,
        description: "A gentle start to the day",
        teacherId: 3,
      },
      include: { teacher: true, participants: true },
    });
    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith(
      expectedSessionResponse({ users: [] }),
    );
  });

  it("returns an internal server error when creation fails", async () => {
    const error = new Error("database unavailable");
    const consoleError = vi
      .spyOn(console, "error")
      .mockImplementation(() => {});
    teacherFindUniqueMock.mockResolvedValue({ id: 3 });
    sessionCreateMock.mockRejectedValue(error);
    const req = createRequest(7, {}, validBody);
    const res = createResponse();

    await controller.create(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({
      message: "Internal server error",
    });
    expect(consoleError).toHaveBeenCalledWith("Create session error:", error);

    consoleError.mockRestore();
  });
});

describe("SessionController.update", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("rejects an invalid session ID", async () => {
    const req = createRequest(7, { id: "12abc" }, { name: "New name" });
    const res = createResponse();

    await controller.update(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ message: "Invalid session ID" });
    expect(sessionFindUniqueMock).not.toHaveBeenCalled();
    expect(sessionUpdateMock).not.toHaveBeenCalled();
  });

  it("responds with not found when the session does not exist", async () => {
    sessionFindUniqueMock.mockResolvedValue(null);
    const req = createRequest(7, { id: "10" }, { name: "New name" });
    const res = createResponse();

    await controller.update(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({ message: "Session not found" });
    expect(sessionUpdateMock).not.toHaveBeenCalled();
  });

  it("responds with not found when the new teacher does not exist", async () => {
    sessionFindUniqueMock.mockResolvedValue({ id: 10 });
    teacherFindUniqueMock.mockResolvedValue(null);
    const req = createRequest(7, { id: "10" }, { teacherId: 99 });
    const res = createResponse();

    await controller.update(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({ message: "Teacher not found" });
    expect(sessionUpdateMock).not.toHaveBeenCalled();
  });

  it("updates only the submitted fields and returns the updated session", async () => {
    sessionFindUniqueMock.mockResolvedValue({ id: 10 });
    sessionUpdateMock.mockResolvedValue(createSessionRecord());
    const req = createRequest(7, { id: "10" }, { name: "Evening Flow" });
    const res = createResponse();

    await controller.update(req, res);

    expect(sessionUpdateMock).toHaveBeenCalledWith({
      where: { id: 10 },
      data: { name: "Evening Flow" },
      include: sessionInclude,
    });
    expect(sessionUpdateMock.mock.calls[0][0].data).toStrictEqual({
      name: "Evening Flow",
    });
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(expectedSessionResponse());
    expect(teacherFindUniqueMock).not.toHaveBeenCalled();
  });

  it("converts the date and assigns the new teacher", async () => {
    sessionFindUniqueMock.mockResolvedValue({ id: 10 });
    teacherFindUniqueMock.mockResolvedValue({ id: 4 });
    sessionUpdateMock.mockResolvedValue(createSessionRecord());
    const req = createRequest(
      7,
      { id: "10" },
      {
        date: "2026-03-01T10:00:00.000Z",
        description: "Updated description",
        teacherId: 4,
      },
    );
    const res = createResponse();

    await controller.update(req, res);

    expect(sessionUpdateMock).toHaveBeenCalledWith({
      where: { id: 10 },
      data: {
        date: sessionDate,
        description: "Updated description",
        teacherId: 4,
      },
      include: sessionInclude,
    });
    expect(sessionUpdateMock.mock.calls[0][0].data).toStrictEqual({
      date: sessionDate,
      description: "Updated description",
      teacherId: 4,
    });
  });

  it("returns an internal server error when the update fails", async () => {
    const error = new Error("database unavailable");
    const consoleError = vi
      .spyOn(console, "error")
      .mockImplementation(() => {});
    sessionFindUniqueMock.mockResolvedValue({ id: 10 });
    sessionUpdateMock.mockRejectedValue(error);
    const req = createRequest(7, { id: "10" }, { name: "Evening Flow" });
    const res = createResponse();

    await controller.update(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({
      message: "Internal server error",
    });
    expect(consoleError).toHaveBeenCalledWith("Update session error:", error);

    consoleError.mockRestore();
  });
});

describe("SessionController.delete", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("rejects an invalid session ID", async () => {
    const req = createRequest(7, { id: "12abc" });
    const res = createResponse();

    await controller.delete(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ message: "Invalid session ID" });
    expect(sessionFindUniqueMock).not.toHaveBeenCalled();
    expect(sessionDeleteMock).not.toHaveBeenCalled();
  });

  it("responds with not found when the session does not exist", async () => {
    sessionFindUniqueMock.mockResolvedValue(null);
    const req = createRequest(7, { id: "10" });
    const res = createResponse();

    await controller.delete(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({ message: "Session not found" });
    expect(sessionDeleteMock).not.toHaveBeenCalled();
  });

  it("deletes the session and responds with success", async () => {
    sessionFindUniqueMock.mockResolvedValue({ id: 10 });
    sessionDeleteMock.mockResolvedValue({ id: 10 });
    const req = createRequest(7, { id: "10" });
    const res = createResponse();

    await controller.delete(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({
      message: "Session deleted successfully",
    });
  });

  it("returns an internal server error when the deletion fails", async () => {
    const error = new Error("database unavailable");
    const consoleError = vi
      .spyOn(console, "error")
      .mockImplementation(() => {});
    sessionFindUniqueMock.mockResolvedValue({ id: 10 });
    sessionDeleteMock.mockRejectedValue(error);
    const req = createRequest(7, { id: "10" });
    const res = createResponse();

    await controller.delete(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({
      message: "Internal server error",
    });
    expect(consoleError).toHaveBeenCalledWith("Delete session error:", error);

    consoleError.mockRestore();
  });
});

describe("SessionController.participate", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("rejects a request without an authenticated user", async () => {
    const req = createRequest(undefined, { id: "10" });
    const res = createResponse();

    await controller.participate(req, res);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({
      message: "Authentication required",
    });
    expect(sessionFindUniqueMock).not.toHaveBeenCalled();
    expect(participationCreateMock).not.toHaveBeenCalled();
  });

  it("rejects an invalid session ID", async () => {
    const req = createRequest(42, { id: "12abc" });
    const res = createResponse();

    await controller.participate(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ message: "Invalid session ID" });
    expect(sessionFindUniqueMock).not.toHaveBeenCalled();
    expect(participationCreateMock).not.toHaveBeenCalled();
  });

  it("responds with not found when the session does not exist", async () => {
    sessionFindUniqueMock.mockResolvedValue(null);
    const req = createRequest(42, { id: "10" });
    const res = createResponse();

    await controller.participate(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({ message: "Session not found" });
    expect(participationCreateMock).not.toHaveBeenCalled();
  });

  it("responds with a conflict when the user already participates", async () => {
    sessionFindUniqueMock.mockResolvedValue({ id: 10 });
    participationFindUniqueMock.mockResolvedValue({
      sessionId: 10,
      userId: 42,
    });
    const req = createRequest(42, { id: "10" });
    const res = createResponse();

    await controller.participate(req, res);

    expect(res.status).toHaveBeenCalledWith(409);
    expect(res.json).toHaveBeenCalledWith({
      message: "User already participating in this session",
    });
    expect(participationCreateMock).not.toHaveBeenCalled();
  });

  it("creates participation for the authenticated user, ignoring spoofed IDs", async () => {
    sessionFindUniqueMock.mockResolvedValue({ id: 10 });
    participationFindUniqueMock.mockResolvedValue(null);
    participationCreateMock.mockResolvedValue({ sessionId: 10, userId: 42 });
    const req = createRequest(
      42,
      { id: "10" },
      { userId: 99 },
      { userId: "99" },
    );
    const res = createResponse();

    await controller.participate(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({
      message: "Successfully joined the session",
    });
    expect(participationFindUniqueMock).toHaveBeenCalledWith({
      where: { sessionId_userId: { sessionId: 10, userId: 42 } },
    });
    expect(participationCreateMock).toHaveBeenCalledWith({
      data: {
        sessionId: 10,
        userId: 42,
      },
    });
  });

  it("returns an internal server error when the lookup fails", async () => {
    const error = new Error("database unavailable");
    const consoleError = vi
      .spyOn(console, "error")
      .mockImplementation(() => {});
    sessionFindUniqueMock.mockRejectedValue(error);
    const req = createRequest(42, { id: "10" });
    const res = createResponse();

    await controller.participate(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({
      message: "Internal server error",
    });
    expect(participationCreateMock).not.toHaveBeenCalled();
    expect(consoleError).toHaveBeenCalledWith("Participate error:", error);

    consoleError.mockRestore();
  });

  it("returns an internal server error when creating the participation fails", async () => {
    const consoleError = vi
      .spyOn(console, "error")
      .mockImplementation(() => {});
    sessionFindUniqueMock.mockResolvedValue({ id: 10 });
    participationFindUniqueMock.mockResolvedValue(null);
    participationCreateMock.mockRejectedValue(new Error("write failed"));
    const req = createRequest(42, { id: "10" });
    const res = createResponse();

    await controller.participate(req, res);

    expect(res.status).toHaveBeenCalledWith(500);

    consoleError.mockRestore();
  });
});

describe("SessionController.unparticipate", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("rejects an invalid session ID", async () => {
    const req = createRequest(42, { id: "12abc" });
    const res = createResponse();

    await controller.unparticipate(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ message: "Invalid session ID" });
    expect(participationFindUniqueMock).not.toHaveBeenCalled();
    expect(participationDeleteMock).not.toHaveBeenCalled();
  });

  it("rejects a request without an authenticated user", async () => {
    const req = createRequest(undefined, { id: "10" });
    const res = createResponse();

    await controller.unparticipate(req, res);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({
      message: "Authentication required",
    });
    expect(participationFindUniqueMock).not.toHaveBeenCalled();
    expect(participationDeleteMock).not.toHaveBeenCalled();
  });

  it("responds with not found when the user has no participation", async () => {
    participationFindUniqueMock.mockResolvedValue(null);
    const req = createRequest(42, { id: "10" });
    const res = createResponse();

    await controller.unparticipate(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({
      message: "Participation not found",
    });
    expect(participationDeleteMock).not.toHaveBeenCalled();
  });

  it("deletes participation for the authenticated user, ignoring spoofed IDs", async () => {
    participationFindUniqueMock.mockResolvedValue({
      sessionId: 10,
      userId: 42,
    });
    participationDeleteMock.mockResolvedValue({ sessionId: 10, userId: 42 });
    const req = createRequest(
      42,
      { id: "10" },
      { userId: 99 },
      { userId: "99" },
    );
    const res = createResponse();

    await controller.unparticipate(req, res);

    expect(participationFindUniqueMock).toHaveBeenCalledWith({
      where: { sessionId_userId: { sessionId: 10, userId: 42 } },
    });
    expect(participationDeleteMock).toHaveBeenCalledWith({
      where: { sessionId_userId: { sessionId: 10, userId: 42 } },
    });
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({
      message: "Successfully left the session",
    });
  });

  it("returns an internal server error when the lookup fails", async () => {
    const error = new Error("database unavailable");
    const consoleError = vi
      .spyOn(console, "error")
      .mockImplementation(() => {});
    participationFindUniqueMock.mockRejectedValue(error);
    const req = createRequest(42, { id: "10" });
    const res = createResponse();

    await controller.unparticipate(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({
      message: "Internal server error",
    });
    expect(consoleError).toHaveBeenCalledWith("Unparticipate error:", error);

    consoleError.mockRestore();
  });

  it("returns an internal server error when the deletion fails", async () => {
    const consoleError = vi
      .spyOn(console, "error")
      .mockImplementation(() => {});
    participationFindUniqueMock.mockResolvedValue({
      sessionId: 10,
      userId: 42,
    });
    participationDeleteMock.mockRejectedValue(new Error("write failed"));
    const req = createRequest(42, { id: "10" });
    const res = createResponse();

    await controller.unparticipate(req, res);

    expect(res.status).toHaveBeenCalledWith(500);

    consoleError.mockRestore();
  });
});
