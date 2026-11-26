import { beforeEach, describe, expect, it, vi } from "vitest";
import { authService } from "./auth.service";
import { apiPublic } from "./api";

const validUser = {
  id: 1,
  email: "member@example.com",
  firstName: "Yoga",
  lastName: "Member",
  admin: false,
};

vi.mock("./api", () => ({
  apiPublic: { post: vi.fn() },
}));

describe("authService", () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  it("persists the returned token and user after login", async () => {
    vi.mocked(apiPublic.post).mockResolvedValue({
      data: {
        ...validUser,
        token: "test-token",
      },
    });

    const credentials = {
      email: "member@example.com",
      password: "password",
    };

    await authService.login(credentials);

    expect(apiPublic.post).toHaveBeenCalledWith("/auth/login", credentials);
    expect(localStorage.getItem("token")).toBe("test-token");
    expect(authService.getCurrentUser()).toEqual(validUser);
  });

  it("clears malformed persisted user data instead of exposing it", () => {
    localStorage.setItem("user", "{invalid json");

    expect(authService.getCurrentUser()).toBeNull();
    expect(localStorage.getItem("user")).toBeNull();
  });

  it.each([
    ["null", null],
    ["an array", []],
    ["an invalid id", { ...validUser, id: 1.5 }],
    ["an invalid email", { ...validUser, email: 123 }],
    ["an invalid first name", { ...validUser, firstName: null }],
    ["an invalid last name", { ...validUser, lastName: 123 }],
    ["an invalid admin flag", { ...validUser, admin: "false" }],
  ])("removes persisted user data with %s", (_description, user) => {
    localStorage.setItem("user", JSON.stringify(user));

    expect(authService.getCurrentUser()).toBeNull();
    expect(localStorage.getItem("user")).toBeNull();
  });

  it("registers and persists the returned token and user", async () => {
    vi.mocked(apiPublic.post).mockResolvedValue({
      data: { ...validUser, token: "registration-token" },
    });

    await authService.register({
      email: validUser.email,
      password: "password",
      firstName: validUser.firstName,
      lastName: validUser.lastName,
    });

    expect(apiPublic.post).toHaveBeenCalledWith("/auth/register", {
      email: validUser.email,
      password: "password",
      firstName: validUser.firstName,
      lastName: validUser.lastName,
    });
    expect(localStorage.getItem("token")).toBe("registration-token");
    expect(authService.getCurrentUser()).toEqual(validUser);
  });

  it("stores nothing when login returns no token", async () => {
    vi.mocked(apiPublic.post).mockResolvedValue({ data: validUser });

    await authService.login({ email: validUser.email, password: "password" });

    expect(localStorage.getItem("token")).toBeNull();
    expect(localStorage.getItem("user")).toBeNull();
  });

  it("stores nothing when registration returns no token", async () => {
    vi.mocked(apiPublic.post).mockResolvedValue({ data: validUser });

    await authService.register({
      email: validUser.email,
      password: "password",
      firstName: validUser.firstName,
      lastName: validUser.lastName,
    });

    expect(localStorage.getItem("token")).toBeNull();
    expect(localStorage.getItem("user")).toBeNull();
  });

  it("clears both stored credentials on logout", () => {
    localStorage.setItem("token", "test-token");
    localStorage.setItem("user", JSON.stringify(validUser));

    expect(authService.getToken()).toBe("test-token");
    expect(authService.isAuthenticated()).toBe(true);

    authService.logout();

    expect(localStorage.getItem("token")).toBeNull();
    expect(localStorage.getItem("user")).toBeNull();
    expect(authService.getToken()).toBeNull();
    expect(authService.isAuthenticated()).toBe(false);
  });

  it("updates the stored user and ignores updates when no user exists", () => {
    expect(authService.updateCurrentUser({ admin: true })).toBeNull();

    localStorage.setItem("user", JSON.stringify(validUser));

    const updatedUser = authService.updateCurrentUser({ admin: true });

    expect(updatedUser).toEqual({ ...validUser, admin: true });
    expect(authService.getCurrentUser()).toEqual(updatedUser);
  });

  it("returns null when no user has been stored", () => {
    expect(authService.getCurrentUser()).toBeNull();
  });
});
