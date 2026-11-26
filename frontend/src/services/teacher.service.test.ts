import { beforeEach, describe, expect, it, vi } from "vitest";
import { teacherService } from "./teacher.service";
import { apiPrivate } from "./api";
import type { Teacher } from "../types";

vi.mock("./api", () => ({
  apiPrivate: { get: vi.fn() },
}));

const teacher: Teacher = { id: 3, firstName: "Taylor", lastName: "Teacher" };
const signal = new AbortController().signal;

describe("teacherService", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("fetches all teachers", async () => {
    vi.mocked(apiPrivate.get).mockResolvedValue({ data: [teacher] });

    expect(await teacherService.getAll(signal)).toEqual([teacher]);
    expect(apiPrivate.get).toHaveBeenCalledWith("/teacher", { signal });
  });

  it("fetches one teacher by id", async () => {
    vi.mocked(apiPrivate.get).mockResolvedValue({ data: teacher });

    expect(await teacherService.getById(3, signal)).toEqual(teacher);
    expect(apiPrivate.get).toHaveBeenCalledWith("/teacher/3", { signal });
  });
});
