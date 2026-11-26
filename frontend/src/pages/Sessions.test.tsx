import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { MemoryRouter } from "react-router-dom";
import Sessions from "./Sessions";
import { sessionService } from "../services/sessions.service";
import { useAuth } from "../context/AuthProvider";
import type { Session } from "../types";
import { member, mockAuth, rejectOnAbort } from "../test/helpers";

vi.mock("../services/sessions.service", () => ({
  sessionService: { getAll: vi.fn(), delete: vi.fn() },
}));

vi.mock("../context/AuthProvider", () => ({
  useAuth: vi.fn(),
}));

const sessionFixture: Session = {
  id: 12,
  name: "Morning Flow",
  date: "2026-12-01T10:00:00.000Z",
  description: "A gentle morning session",
  teacher: {
    id: 3,
    firstName: "Taylor",
    lastName: "Teacher",
  },
  users: [1, 2],
};

const renderPage = () =>
  render(
    <MemoryRouter>
      <Sessions />
    </MemoryRouter>,
  );

const setAdmin = () => {
  vi.mocked(useAuth).mockReturnValue({
    user: {
      id: 1,
      email: "admin@example.com",
      firstName: "Yoga",
      lastName: "Admin",
      admin: true,
    },
    token: "admin-token",
    isAuthenticated: true,
    login: vi.fn(),
    register: vi.fn(),
    logout: vi.fn(),
  });
};

describe("Sessions page", () => {
  beforeEach(() => {
    vi.mocked(sessionService.getAll).mockResolvedValue([]);
    vi.mocked(useAuth).mockReturnValue({
      user: null,
      token: null,
      isAuthenticated: false,
      login: vi.fn(),
      register: vi.fn(),
      logout: vi.fn(),
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("shows the empty state when no sessions are available", async () => {
    renderPage();

    expect(
      await screen.findByText("No sessions available"),
    ).toBeInTheDocument();
    expect(sessionService.getAll).toHaveBeenCalledOnce();
  });

  it("shows loading until the sessions request completes", async () => {
    let resolveSessions!: (sessions: Session[]) => void;
    vi.mocked(sessionService.getAll).mockReturnValue(
      new Promise((resolve) => {
        resolveSessions = resolve;
      }),
    );

    renderPage();

    expect(screen.getByText("Loading sessions...")).toBeInTheDocument();
    resolveSessions([]);
    expect(
      await screen.findByText("No sessions available"),
    ).toBeInTheDocument();
  });

  it("shows the server error when loading sessions fails", async () => {
    const error = new Error("Service unavailable");
    vi.mocked(sessionService.getAll).mockRejectedValue(error);
    vi.spyOn(console, "error").mockImplementation(() => {});

    renderPage();

    expect(
      await screen.findByText("Failed to load sessions"),
    ).toBeInTheDocument();
  });

  it("renders a session and removes only it after an admin confirms deletion", async () => {
    vi.mocked(sessionService.getAll).mockResolvedValue([
      sessionFixture,
      { ...sessionFixture, id: 13, name: "Evening Calm", users: [] },
    ]);
    setAdmin();
    vi.mocked(sessionService.delete).mockResolvedValue();
    vi.spyOn(window, "confirm").mockReturnValue(true);
    const user = userEvent.setup();

    renderPage();

    expect(await screen.findByText("Morning Flow")).toBeInTheDocument();
    expect(
      screen.getAllByRole("link", { name: "View Details" })[0],
    ).toHaveAttribute("href", "/sessions/12");
    expect(screen.getByText("Participants: 2")).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: "Create Session" }),
    ).toHaveAttribute("href", "/sessions/create");

    await user.click(screen.getAllByRole("button", { name: "Delete" })[0]);

    await waitFor(() => {
      expect(sessionService.delete).toHaveBeenCalledWith(12);
      expect(screen.queryByText("Morning Flow")).not.toBeInTheDocument();
    });
    expect(screen.getByText("Evening Calm")).toBeInTheDocument();
  });

  it("keeps a session when an admin cancels deletion", async () => {
    vi.mocked(sessionService.getAll).mockResolvedValue([sessionFixture]);
    setAdmin();
    vi.spyOn(window, "confirm").mockReturnValue(false);
    const user = userEvent.setup();

    renderPage();

    await screen.findByText("Morning Flow");
    await user.click(screen.getByRole("button", { name: "Delete" }));

    expect(sessionService.delete).not.toHaveBeenCalled();
    expect(screen.getByText("Morning Flow")).toBeInTheDocument();
  });

  it("ignores the request cancelled by leaving the page", async () => {
    vi.mocked(sessionService.getAll).mockImplementation(rejectOnAbort);
    vi.spyOn(console, "error").mockImplementation(() => {});

    const { unmount } = renderPage();
    unmount();

    expect(vi.mocked(sessionService.getAll).mock.calls[0][0]?.aborted).toBe(
      true,
    );

    await new Promise((resolve) => setTimeout(resolve));
    expect(console.error).not.toHaveBeenCalled();
  });

  it("hides admin actions from a signed-in member", async () => {
    vi.mocked(sessionService.getAll).mockResolvedValue([sessionFixture]);
    mockAuth(member);

    renderPage();

    await screen.findByText("Morning Flow");
    expect(
      screen.queryByRole("button", { name: "Delete" }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("link", { name: "Create Session" }),
    ).not.toBeInTheDocument();
  });

  it("shows an error and keeps a session when deletion fails", async () => {
    vi.mocked(sessionService.getAll).mockResolvedValue([sessionFixture]);
    setAdmin();
    vi.mocked(sessionService.delete).mockRejectedValue(new Error("offline"));
    vi.spyOn(window, "confirm").mockReturnValue(true);
    vi.spyOn(window, "alert").mockImplementation(() => {});
    vi.spyOn(console, "error").mockImplementation(() => {});
    const user = userEvent.setup();

    renderPage();

    await screen.findByText("Morning Flow");
    await user.click(screen.getByRole("button", { name: "Delete" }));

    expect(window.alert).toHaveBeenCalledWith("Failed to delete session");
    expect(screen.getByText("Morning Flow")).toBeInTheDocument();
  });
});
