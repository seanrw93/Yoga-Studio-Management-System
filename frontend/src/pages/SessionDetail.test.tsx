import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import SessionDetail from "./SessionDetail";
import { sessionService } from "../services/sessions.service";
import {
  admin,
  axiosError,
  deferred,
  member,
  mockAuth,
  rejectOnAbort,
} from "../test/helpers";
import type { Session } from "../types";

vi.mock("../context/AuthProvider", () => ({ useAuth: vi.fn() }));
vi.mock("../services/sessions.service", () => ({
  sessionService: {
    getById: vi.fn(),
    participate: vi.fn(),
    unparticipate: vi.fn(),
    delete: vi.fn(),
  },
}));

const session = (users: number[]): Session => ({
  id: 12,
  name: "Morning Flow",
  date: "2026-12-01T10:00:00.000Z",
  description: "A gentle morning session",
  teacher: { id: 3, firstName: "Taylor", lastName: "Teacher" },
  users,
});

const renderPage = () =>
  render(
    <MemoryRouter initialEntries={["/sessions/12"]}>
      <Routes>
        <Route path="/sessions/:id" element={<SessionDetail />} />
        <Route path="/sessions" element={<p>Sessions page</p>} />
        <Route path="/sessions/edit/:id" element={<p>Edit page</p>} />
      </Routes>
    </MemoryRouter>,
  );

describe("SessionDetail page", () => {
  beforeEach(() => {
    mockAuth(member);
    vi.mocked(sessionService.getById).mockResolvedValue(session([2]));
    vi.spyOn(console, "error").mockImplementation(() => {});
    vi.spyOn(window, "alert").mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("shows loading while the session is fetched", () => {
    vi.mocked(sessionService.getById).mockReturnValue(
      deferred<Session>().promise,
    );

    renderPage();

    expect(screen.getByText("Loading session...")).toBeInTheDocument();
  });

  it("shows the session details", async () => {
    renderPage();

    expect(
      await screen.findByRole("heading", { name: "Morning Flow" }),
    ).toBeInTheDocument();
    expect(screen.getByText("Date:").parentElement).toHaveTextContent(
      "Date: Tuesday, December 1, 2026",
    );
    expect(screen.getByText("Teacher:").parentElement).toHaveTextContent(
      "Teacher: Taylor Teacher",
    );
    expect(screen.getByText("Participants:").parentElement).toHaveTextContent(
      "Participants: 1",
    );
    expect(screen.getByText("A gentle morning session")).toBeInTheDocument();
    expect(sessionService.getById).toHaveBeenCalledWith(
      12,
      expect.any(AbortSignal),
    );
  });

  it("shows the server error when the session fails to load", async () => {
    vi.mocked(sessionService.getById).mockRejectedValue(
      axiosError({ message: "Session gone" }),
    );

    renderPage();

    expect(await screen.findByText("Session gone")).toBeInTheDocument();
  });

  it("shows a generic error when loading fails unexpectedly", async () => {
    vi.mocked(sessionService.getById).mockRejectedValue(new Error("x"));

    renderPage();

    expect(
      await screen.findByText("Failed to load session details"),
    ).toBeInTheDocument();
  });

  it("shows not found when the session response is empty", async () => {
    vi.mocked(sessionService.getById).mockResolvedValue(
      null as unknown as Session,
    );

    renderPage();

    expect(await screen.findByText("Session not found")).toBeInTheDocument();
  });

  it("ignores the request cancelled by leaving the page", async () => {
    vi.mocked(sessionService.getById).mockImplementation(rejectOnAbort);

    const { unmount } = renderPage();
    unmount();

    expect(vi.mocked(sessionService.getById).mock.calls[0][1]?.aborted).toBe(
      true,
    );

    await new Promise((resolve) => setTimeout(resolve));
    expect(console.error).not.toHaveBeenCalled();
  });

  it("lets a member join and reloads the session", async () => {
    vi.mocked(sessionService.participate).mockResolvedValue();
    const user = userEvent.setup();
    renderPage();

    const join = await screen.findByRole("button", { name: "Join Session" });
    vi.mocked(sessionService.getById).mockResolvedValue(session([2, 1]));
    await user.click(join);

    expect(sessionService.participate).toHaveBeenCalledWith(12);
    expect(
      await screen.findByRole("button", { name: "Leave Session" }),
    ).toBeInTheDocument();
  });

  it("lets a participant leave and reloads the session", async () => {
    vi.mocked(sessionService.getById).mockResolvedValue(session([1]));
    vi.mocked(sessionService.unparticipate).mockResolvedValue();
    const user = userEvent.setup();
    renderPage();

    const leave = await screen.findByRole("button", { name: "Leave Session" });
    vi.mocked(sessionService.getById).mockResolvedValue(session([]));
    await user.click(leave);

    expect(sessionService.unparticipate).toHaveBeenCalledWith(12);
    expect(
      await screen.findByRole("button", { name: "Join Session" }),
    ).toBeInTheDocument();
  });

  it("alerts when joining fails", async () => {
    vi.mocked(sessionService.participate).mockRejectedValue(new Error("x"));
    const user = userEvent.setup();
    renderPage();

    await user.click(
      await screen.findByRole("button", { name: "Join Session" }),
    );

    await waitFor(() =>
      expect(window.alert).toHaveBeenCalledWith("Failed to join session"),
    );
  });

  it("alerts when leaving fails", async () => {
    vi.mocked(sessionService.getById).mockResolvedValue(session([1]));
    vi.mocked(sessionService.unparticipate).mockRejectedValue(new Error("x"));
    const user = userEvent.setup();
    renderPage();

    await user.click(
      await screen.findByRole("button", { name: "Leave Session" }),
    );

    await waitFor(() =>
      expect(window.alert).toHaveBeenCalledWith("Failed to leave session"),
    );
  });

  it("does nothing when a signed-out visitor clicks join", async () => {
    mockAuth(null);
    const user = userEvent.setup();
    renderPage();

    await user.click(
      await screen.findByRole("button", { name: "Join Session" }),
    );

    expect(sessionService.participate).not.toHaveBeenCalled();
  });

  it("lets an admin open the edit page instead of joining", async () => {
    mockAuth(admin);
    const user = userEvent.setup();
    renderPage();

    await user.click(await screen.findByRole("button", { name: "Edit" }));

    expect(await screen.findByText("Edit page")).toBeInTheDocument();
  });

  it("hides join and leave from an admin", async () => {
    mockAuth(admin);
    renderPage();

    await screen.findByRole("button", { name: "Edit" });

    expect(
      screen.queryByRole("button", { name: /join|leave/i }),
    ).not.toBeInTheDocument();
  });

  it("deletes the session after an admin confirms", async () => {
    mockAuth(admin);
    vi.spyOn(window, "confirm").mockReturnValue(true);
    vi.mocked(sessionService.delete).mockResolvedValue();
    const user = userEvent.setup();
    renderPage();

    await user.click(await screen.findByRole("button", { name: "Delete" }));

    expect(sessionService.delete).toHaveBeenCalledWith(12);
    expect(await screen.findByText("Sessions page")).toBeInTheDocument();
  });

  it("keeps the session when an admin cancels deletion", async () => {
    mockAuth(admin);
    vi.spyOn(window, "confirm").mockReturnValue(false);
    const user = userEvent.setup();
    renderPage();

    await user.click(await screen.findByRole("button", { name: "Delete" }));

    expect(sessionService.delete).not.toHaveBeenCalled();
  });

  it("alerts when deletion fails", async () => {
    mockAuth(admin);
    vi.spyOn(window, "confirm").mockReturnValue(true);
    vi.mocked(sessionService.delete).mockRejectedValue(new Error("x"));
    const user = userEvent.setup();
    renderPage();

    await user.click(await screen.findByRole("button", { name: "Delete" }));

    await waitFor(() =>
      expect(window.alert).toHaveBeenCalledWith("Failed to delete session"),
    );
    expect(screen.queryByText("Sessions page")).not.toBeInTheDocument();
  });

  it("goes back to sessions", async () => {
    const user = userEvent.setup();
    renderPage();

    await user.click(
      await screen.findByRole("button", { name: "Back to Sessions" }),
    );

    expect(await screen.findByText("Sessions page")).toBeInTheDocument();
  });
});
