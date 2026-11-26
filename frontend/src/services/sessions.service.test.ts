import { beforeEach, describe, expect, it, vi } from "vitest";
import { sessionService } from "./sessions.service";
import { apiPrivate } from "./api";
import type { Session, SessionFormData } from "../types";

vi.mock("./api", () => ({
  apiPrivate: { get: vi.fn(), post: vi.fn(), put: vi.fn(), delete: vi.fn() },
}));

const session = { id: 12, name: "Morning Flow" } as Session;
const form: SessionFormData = {
  name: "Morning Flow",
  date: "2026-12-01",
  description: "Gentle",
  teacherId: 3,
};
const signal = new AbortController().signal;

describe("sessionService", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("fetches all sessions", async () => {
    vi.mocked(apiPrivate.get).mockResolvedValue({ data: [session] });

    expect(await sessionService.getAll(signal)).toEqual([session]);
    expect(apiPrivate.get).toHaveBeenCalledWith("/session", { signal });
  });

  it("fetches one session by id", async () => {
    vi.mocked(apiPrivate.get).mockResolvedValue({ data: session });

    expect(await sessionService.getById(12, signal)).toEqual(session);
    expect(apiPrivate.get).toHaveBeenCalledWith("/session/12", { signal });
  });

  it("creates a session", async () => {
    vi.mocked(apiPrivate.post).mockResolvedValue({ data: session });

    expect(await sessionService.create(form)).toEqual(session);
    expect(apiPrivate.post).toHaveBeenCalledWith("/session", form);
  });

  it("updates a session", async () => {
    vi.mocked(apiPrivate.put).mockResolvedValue({ data: session });

    expect(await sessionService.update(12, form)).toEqual(session);
    expect(apiPrivate.put).toHaveBeenCalledWith("/session/12", form);
  });

  it("deletes a session", async () => {
    vi.mocked(apiPrivate.delete).mockResolvedValue({});

    await sessionService.delete(12);

    expect(apiPrivate.delete).toHaveBeenCalledWith("/session/12");
  });

  it("joins a session", async () => {
    vi.mocked(apiPrivate.post).mockResolvedValue({});

    await sessionService.participate(12);

    expect(apiPrivate.post).toHaveBeenCalledWith("/session/12/participate");
  });

  it("leaves a session", async () => {
    vi.mocked(apiPrivate.delete).mockResolvedValue({});

    await sessionService.unparticipate(12);

    expect(apiPrivate.delete).toHaveBeenCalledWith("/session/12/participate");
  });
});
