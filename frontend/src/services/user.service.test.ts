import { beforeEach, describe, expect, it, vi } from "vitest";
import { userService } from "./user.service";
import { apiPrivate } from "./api";
import { member } from "../test/helpers";

vi.mock("./api", () => ({
  apiPrivate: { get: vi.fn(), post: vi.fn(), delete: vi.fn() },
}));

describe("userService", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("fetches a user by id", async () => {
    const signal = new AbortController().signal;
    vi.mocked(apiPrivate.get).mockResolvedValue({ data: member });

    expect(await userService.getById(1, signal)).toEqual(member);
    expect(apiPrivate.get).toHaveBeenCalledWith("/user/1", { signal });
  });

  it("deletes a user", async () => {
    vi.mocked(apiPrivate.delete).mockResolvedValue({});

    await userService.delete(1);

    expect(apiPrivate.delete).toHaveBeenCalledWith("/user/1");
  });

  it("promotes the current user to admin", async () => {
    vi.mocked(apiPrivate.post).mockResolvedValue({
      data: { ...member, admin: true },
    });

    expect(await userService.promoteToAdmin()).toEqual({
      ...member,
      admin: true,
    });
    expect(apiPrivate.post).toHaveBeenCalledWith("/user/promote-admin");
  });
});
