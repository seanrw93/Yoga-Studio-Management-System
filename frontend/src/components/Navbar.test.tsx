import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import Navbar from "./Navbar";
import { useAuth } from "../context/AuthProvider";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";

vi.mock("../context/AuthProvider", () => ({
  useAuth: vi.fn(),
}));

const mockNavigate = vi.fn();
const mockUseAuth = vi.mocked(useAuth);
const logout = vi.fn();

vi.mock("react-router-dom", async (importOriginal) => ({
  ...(await importOriginal<typeof import("react-router-dom")>()),
  useNavigate: () => mockNavigate,
}));

const renderNavbar = () => {
  render(
    <MemoryRouter>
      <Navbar />
    </MemoryRouter>,
  );
};

describe("Navbar", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("shows Login and Register when logged out", () => {
    mockUseAuth.mockReturnValue({
      user: null,
      isAuthenticated: false,
      logout,
    } as never);
    renderNavbar();
    expect(screen.getByRole("link", { name: "Login" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Register" })).toBeInTheDocument();
  });

  it("hides Create Session for a non-admin user", () => {
    mockUseAuth.mockReturnValue({
      user: { admin: false },
      isAuthenticated: true,
      logout,
    } as never);
    renderNavbar();
    expect(
      screen.queryByRole("link", { name: "Create Session" }),
    ).not.toBeInTheDocument();
  });

  it("does not show admin navigation when auth state has no user", () => {
    mockUseAuth.mockReturnValue({
      user: null,
      isAuthenticated: true,
      logout,
    } as never);

    renderNavbar();

    expect(screen.getByRole("link", { name: "Sessions" })).toBeInTheDocument();
    expect(
      screen.queryByRole("link", { name: "Create Session" }),
    ).not.toBeInTheDocument();
  });

  it("shows Create Session for an admin", () => {
    mockUseAuth.mockReturnValue({
      user: { admin: true },
      isAuthenticated: true,
      logout,
    } as never);
    renderNavbar();
    expect(
      screen.getByRole("link", { name: "Create Session" }),
    ).toBeInTheDocument();
  });

  it("logs out and navigates to /login", async () => {
    mockUseAuth.mockReturnValue({
      user: { admin: false },
      isAuthenticated: true,
      logout,
    } as never);
    renderNavbar();
    await userEvent.click(screen.getByRole("button", { name: "Logout" }));
    expect(logout).toHaveBeenCalledOnce();
    expect(mockNavigate).toHaveBeenCalledWith("/login");
  });
  it("shows Sessions, Profile and Logout when logged in", () => {
    mockUseAuth.mockReturnValue({
      user: { admin: false },
      isAuthenticated: true,
      logout,
    } as never);
    renderNavbar();
    expect(screen.getByRole("link", { name: "Sessions" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Profile" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Logout" })).toBeInTheDocument();
  });

  it("hides Login and Register when logged in", () => {
    mockUseAuth.mockReturnValue({
      user: { admin: false },
      isAuthenticated: true,
      logout,
    } as never);
    renderNavbar();
    expect(
      screen.queryByRole("link", { name: "Login" }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("link", { name: "Register" }),
    ).not.toBeInTheDocument();
  });
});
