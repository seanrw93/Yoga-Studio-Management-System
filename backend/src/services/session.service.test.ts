import type { PrismaClient } from "@prisma/client";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { SessionService } from "./session.service";

const sessionFindManyMock = vi.fn();
const sessionFindUniqueMock = vi.fn();
const sessionCreateMock = vi.fn();
const sessionUpdateMock = vi.fn();
const sessionDeleteMock = vi.fn();
const teacherFindUniqueMock = vi.fn();
const participationFindUniqueMock = vi.fn();
const participationCreateMock = vi.fn();
const participationDeleteMock = vi.fn();

const prisma = {
  session: {
    findMany: sessionFindManyMock,
    findUnique: sessionFindUniqueMock,
    create: sessionCreateMock,
    update: sessionUpdateMock,
    delete: sessionDeleteMock,
  },
  teacher: { findUnique: teacherFindUniqueMock },
  sessionParticipation: {
    findUnique: participationFindUniqueMock,
    create: participationCreateMock,
    delete: participationDeleteMock,
  },
} as unknown as PrismaClient;

const service = new SessionService(prisma);

const sessionDate = new Date("2026-03-01T10:00:00.000Z");
const createdAt = new Date("2026-01-01T00:00:00.000Z");
const updatedAt = new Date("2026-01-02T00:00:00.000Z");

const createSessionRecord = (overrides: Record<string, unknown> = {}) => ({
  id: 10,
  name: "Morning Flow",
  date: sessionDate,
  description: "A gentle start to the day",
  teacherId: 3,
  teacher: { id: 3, firstName: "Anna", lastName: "Lee", createdAt },
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

const validInput = {
  name: "Morning Flow",
  date: "2026-03-01T10:00:00.000Z",
  description: "A gentle start to the day",
  teacherId: 3,
};

const databaseError = new Error("database unavailable");

beforeEach(() => {
  vi.clearAllMocks();
});

describe("SessionService.getAll", () => {
  it("includes each session's teacher and participants", async () => {
    sessionFindManyMock.mockResolvedValue([]);

    await service.getAll();

    expect(sessionFindManyMock).toHaveBeenCalledWith({
      include: sessionInclude,
    });
  });

  it("returns every session with its teacher and participant IDs", async () => {
    sessionFindManyMock.mockResolvedValue([
      createSessionRecord(),
      createSessionRecord({ id: 11, participants: [] }),
    ]);

    await expect(service.getAll()).resolves.toEqual([
      expectedSessionResponse(),
      expectedSessionResponse({ id: 11, users: [] }),
    ]);
  });

  it("returns an empty list when there are no sessions", async () => {
    sessionFindManyMock.mockResolvedValue([]);

    await expect(service.getAll()).resolves.toEqual([]);
  });

  it("propagates a database failure", async () => {
    sessionFindManyMock.mockRejectedValue(databaseError);

    await expect(service.getAll()).rejects.toBe(databaseError);
  });
});

describe("SessionService.getById", () => {
  it("looks the session up by ID with its relations", async () => {
    sessionFindUniqueMock.mockResolvedValue(createSessionRecord());

    await service.getById(10);

    expect(sessionFindUniqueMock).toHaveBeenCalledWith({
      where: { id: 10 },
      include: sessionInclude,
    });
  });

  it("returns the session with its teacher and participant IDs", async () => {
    sessionFindUniqueMock.mockResolvedValue(createSessionRecord());

    await expect(service.getById(10)).resolves.toEqual(
      expectedSessionResponse(),
    );
  });

  it("throws not found when the session does not exist", async () => {
    sessionFindUniqueMock.mockResolvedValue(null);

    await expect(service.getById(10)).rejects.toMatchObject({
      status: 404,
      message: "Session not found",
    });
  });

  it("propagates a database failure", async () => {
    sessionFindUniqueMock.mockRejectedValue(databaseError);

    await expect(service.getById(10)).rejects.toBe(databaseError);
  });
});

describe("SessionService.create", () => {
  it("throws not found when the teacher does not exist", async () => {
    teacherFindUniqueMock.mockResolvedValue(null);

    await expect(service.create(validInput)).rejects.toMatchObject({
      status: 404,
      message: "Teacher not found",
    });
    expect(sessionCreateMock).not.toHaveBeenCalled();
  });

  it("creates the session with the date converted to a Date", async () => {
    teacherFindUniqueMock.mockResolvedValue({ id: 3 });
    sessionCreateMock.mockResolvedValue(
      createSessionRecord({ participants: [] }),
    );

    await service.create(validInput);

    expect(sessionCreateMock).toHaveBeenCalledWith({
      data: {
        name: "Morning Flow",
        date: sessionDate,
        description: "A gentle start to the day",
        teacherId: 3,
      },
      include: sessionInclude,
    });
  });

  it("returns the created session with no participants", async () => {
    teacherFindUniqueMock.mockResolvedValue({ id: 3 });
    sessionCreateMock.mockResolvedValue(
      createSessionRecord({ participants: [] }),
    );

    await expect(service.create(validInput)).resolves.toEqual(
      expectedSessionResponse({ users: [] }),
    );
  });

  it("propagates a creation failure", async () => {
    teacherFindUniqueMock.mockResolvedValue({ id: 3 });
    sessionCreateMock.mockRejectedValue(databaseError);

    await expect(service.create(validInput)).rejects.toBe(databaseError);
  });
});

describe("SessionService.update", () => {
  it("throws not found when the session does not exist", async () => {
    sessionFindUniqueMock.mockResolvedValue(null);

    await expect(service.update(10, { name: "New" })).rejects.toMatchObject({
      status: 404,
      message: "Session not found",
    });
    expect(sessionUpdateMock).not.toHaveBeenCalled();
  });

  it("updates only the submitted fields", async () => {
    sessionFindUniqueMock.mockResolvedValue({ id: 10 });
    sessionUpdateMock.mockResolvedValue(createSessionRecord());

    await service.update(10, { name: "Evening Flow" });

    expect(sessionUpdateMock).toHaveBeenCalledWith({
      where: { id: 10 },
      data: { name: "Evening Flow" },
      include: sessionInclude,
    });
  });

  it("converts the date to a Date", async () => {
    sessionFindUniqueMock.mockResolvedValue({ id: 10 });
    sessionUpdateMock.mockResolvedValue(createSessionRecord());

    await service.update(10, { date: "2026-04-01T09:00:00.000Z" });

    expect(sessionUpdateMock).toHaveBeenCalledWith(
      expect.objectContaining({
        data: { date: new Date("2026-04-01T09:00:00.000Z") },
      }),
    );
  });

  it("updates the description", async () => {
    sessionFindUniqueMock.mockResolvedValue({ id: 10 });
    sessionUpdateMock.mockResolvedValue(createSessionRecord());

    await service.update(10, { description: "New description" });

    expect(sessionUpdateMock).toHaveBeenCalledWith(
      expect.objectContaining({ data: { description: "New description" } }),
    );
  });

  it("assigns a new teacher after checking they exist", async () => {
    sessionFindUniqueMock.mockResolvedValue({ id: 10 });
    teacherFindUniqueMock.mockResolvedValue({ id: 4 });
    sessionUpdateMock.mockResolvedValue(createSessionRecord());

    await service.update(10, { teacherId: 4 });

    expect(teacherFindUniqueMock).toHaveBeenCalledWith({ where: { id: 4 } });
    expect(sessionUpdateMock).toHaveBeenCalledWith(
      expect.objectContaining({ data: { teacherId: 4 } }),
    );
  });

  it("throws not found when the new teacher does not exist", async () => {
    sessionFindUniqueMock.mockResolvedValue({ id: 10 });
    teacherFindUniqueMock.mockResolvedValue(null);

    await expect(service.update(10, { teacherId: 4 })).rejects.toMatchObject({
      status: 404,
      message: "Teacher not found",
    });
    expect(sessionUpdateMock).not.toHaveBeenCalled();
  });

  it("returns the updated session", async () => {
    sessionFindUniqueMock.mockResolvedValue({ id: 10 });
    sessionUpdateMock.mockResolvedValue(createSessionRecord());

    await expect(service.update(10, { name: "Morning Flow" })).resolves.toEqual(
      expectedSessionResponse(),
    );
  });

  it("propagates an update failure", async () => {
    sessionFindUniqueMock.mockResolvedValue({ id: 10 });
    sessionUpdateMock.mockRejectedValue(databaseError);

    await expect(service.update(10, { name: "New" })).rejects.toBe(
      databaseError,
    );
  });
});

describe("SessionService.delete", () => {
  it("deletes an existing session", async () => {
    sessionFindUniqueMock.mockResolvedValue({ id: 10 });
    sessionDeleteMock.mockResolvedValue({ id: 10 });

    await service.delete(10);

    expect(sessionDeleteMock).toHaveBeenCalledWith({ where: { id: 10 } });
  });

  it("throws not found when the session does not exist", async () => {
    sessionFindUniqueMock.mockResolvedValue(null);

    await expect(service.delete(10)).rejects.toMatchObject({
      status: 404,
      message: "Session not found",
    });
    expect(sessionDeleteMock).not.toHaveBeenCalled();
  });

  it("propagates a deletion failure", async () => {
    sessionFindUniqueMock.mockResolvedValue({ id: 10 });
    sessionDeleteMock.mockRejectedValue(databaseError);

    await expect(service.delete(10)).rejects.toBe(databaseError);
  });
});

describe("SessionService.participate", () => {
  it("throws not found when the session does not exist", async () => {
    sessionFindUniqueMock.mockResolvedValue(null);

    await expect(service.participate(10, 7)).rejects.toMatchObject({
      status: 404,
      message: "Session not found",
    });
    expect(participationCreateMock).not.toHaveBeenCalled();
  });

  it("throws a conflict when the user already participates", async () => {
    sessionFindUniqueMock.mockResolvedValue({ id: 10 });
    participationFindUniqueMock.mockResolvedValue({ sessionId: 10, userId: 7 });

    await expect(service.participate(10, 7)).rejects.toMatchObject({
      status: 409,
      message: "User already participating in this session",
    });
    expect(participationCreateMock).not.toHaveBeenCalled();
  });

  it("checks for an existing participation by session and user", async () => {
    sessionFindUniqueMock.mockResolvedValue({ id: 10 });
    participationFindUniqueMock.mockResolvedValue(null);
    participationCreateMock.mockResolvedValue({});

    await service.participate(10, 7);

    expect(participationFindUniqueMock).toHaveBeenCalledWith({
      where: { sessionId_userId: { sessionId: 10, userId: 7 } },
    });
  });

  it("creates the participation", async () => {
    sessionFindUniqueMock.mockResolvedValue({ id: 10 });
    participationFindUniqueMock.mockResolvedValue(null);
    participationCreateMock.mockResolvedValue({});

    await service.participate(10, 7);

    expect(participationCreateMock).toHaveBeenCalledWith({
      data: { sessionId: 10, userId: 7 },
    });
  });

  it("propagates a lookup failure", async () => {
    sessionFindUniqueMock.mockResolvedValue({ id: 10 });
    participationFindUniqueMock.mockRejectedValue(databaseError);

    await expect(service.participate(10, 7)).rejects.toBe(databaseError);
  });

  it("propagates a creation failure", async () => {
    sessionFindUniqueMock.mockResolvedValue({ id: 10 });
    participationFindUniqueMock.mockResolvedValue(null);
    participationCreateMock.mockRejectedValue(databaseError);

    await expect(service.participate(10, 7)).rejects.toBe(databaseError);
  });
});

describe("SessionService.unparticipate", () => {
  it("throws not found when the user has no participation", async () => {
    participationFindUniqueMock.mockResolvedValue(null);

    await expect(service.unparticipate(10, 7)).rejects.toMatchObject({
      status: 404,
      message: "Participation not found",
    });
    expect(participationDeleteMock).not.toHaveBeenCalled();
  });

  it("deletes the participation for the session and user", async () => {
    participationFindUniqueMock.mockResolvedValue({ sessionId: 10, userId: 7 });
    participationDeleteMock.mockResolvedValue({});

    await service.unparticipate(10, 7);

    expect(participationDeleteMock).toHaveBeenCalledWith({
      where: { sessionId_userId: { sessionId: 10, userId: 7 } },
    });
  });

  it("propagates a lookup failure", async () => {
    participationFindUniqueMock.mockRejectedValue(databaseError);

    await expect(service.unparticipate(10, 7)).rejects.toBe(databaseError);
  });

  it("propagates a deletion failure", async () => {
    participationFindUniqueMock.mockResolvedValue({ sessionId: 10, userId: 7 });
    participationDeleteMock.mockRejectedValue(databaseError);

    await expect(service.unparticipate(10, 7)).rejects.toBe(databaseError);
  });
});
