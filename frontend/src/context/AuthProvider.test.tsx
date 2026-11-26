import { render, renderHook, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { AuthProvider, useAuth } from "./AuthProvider";
import { authService } from "../services/auth.service";

vi.mock("../services/auth.service", () => ({
  authService: {
    getCurrentUser: vi.fn(),
    getToken: vi.fn(),
    login: vi.fn(),
    register: vi.fn(),
    logout: vi.fn(),
  },
}));

function AuthControls() {
  const { user, isAuthenticated, login, register, logout } = useAuth();

  return (
    <div>
      <p>{user?.email ?? "No user"}</p>
      <p>{isAuthenticated ? user?.email : "Signed out"}</p>
      <button
        onClick={() =>
          void login({ email: "member@example.com", password: "p" })
        }
      >
        Sign in
      </button>
      <button
        onClick={() =>
          void register({
            email: "new@example.com",
            password: "password",
            firstName: "New",
            lastName: "Member",
          })
        }
      >
        Register
      </button>
      <button onClick={logout}>Sign out</button>
    </div>
  );
}

describe("AuthProvider", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(authService.getCurrentUser).mockReturnValue(null);
    vi.mocked(authService.getToken).mockReturnValue(null);
  });

  it("updates auth state after login and clears it on logout", async () => {
    vi.mocked(authService.login).mockResolvedValue({
      id: 1,
      email: "member@example.com",
      firstName: "Yoga",
      lastName: "Member",
      admin: false,
      token: "test-token",
    });
    const user = userEvent.setup();

    render(
      <AuthProvider>
        <AuthControls />
      </AuthProvider>,
    );

    await user.click(screen.getByRole("button", { name: "Sign in" }));
    expect(await screen.findAllByText("member@example.com")).toHaveLength(2);

    await user.click(screen.getByRole("button", { name: "Sign out" }));
    expect(screen.getByText("Signed out")).toBeInTheDocument();
    expect(screen.getByText("No user")).toBeInTheDocument();
    expect(authService.logout).toHaveBeenCalledOnce();
  });

  it("updates auth state after registration", async () => {
    vi.mocked(authService.register).mockResolvedValue({
      id: 2,
      email: "new@example.com",
      firstName: "New",
      lastName: "Member",
      admin: false,
      token: "new-token",
    });
    const user = userEvent.setup();

    render(
      <AuthProvider>
        <AuthControls />
      </AuthProvider>,
    );

    await user.click(screen.getByRole("button", { name: "Register" }));
    expect(await screen.findAllByText("new@example.com")).toHaveLength(2);
  });

  it("throws a clear error when useAuth is called outside its provider", () => {
    vi.spyOn(console, "error").mockImplementation(() => {});

    expect(() => renderHook(() => useAuth())).toThrow(
      "useAuth must be inside an AuthProvider",
    );
  });
});
