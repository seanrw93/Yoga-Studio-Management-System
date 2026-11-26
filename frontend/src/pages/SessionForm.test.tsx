import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import SessionForm from "./SessionForm";
import { sessionService } from "../services/sessions.service";
import { teacherService } from "../services/teacher.service";
import { axiosError, deferred, rejectOnAbort } from "../test/helpers";
import type { Session, Teacher } from "../types";

vi.mock("../services/sessions.service", () => ({
  sessionService: { getById: vi.fn(), create: vi.fn(), update: vi.fn() },
}));
vi.mock("../services/teacher.service", () => ({
  teacherService: { getAll: vi.fn() },
}));

const teachers: Teacher[] = [
  { id: 3, firstName: "Taylor", lastName: "Teacher" },
  { id: 4, firstName: "Sam", lastName: "Stretch" },
];

const session: Session = {
  id: 12,
  name: "Morning Flow",
  date: "2026-12-01T10:00:00.000Z",
  description: "A gentle morning session",
  teacher: teachers[0],
  users: [],
};

const renderPage = (path: string) =>
  render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route path="/sessions/create" element={<SessionForm />} />
        <Route path="/sessions/edit/:id" element={<SessionForm />} />
        <Route path="/sessions" element={<p>Sessions page</p>} />
      </Routes>
    </MemoryRouter>,
  );

const fillNewSession = async () => {
  const user = userEvent.setup();
  await screen.findByRole("option", { name: "Sam Stretch" });
  await user.type(screen.getByLabelText("Session Name"), "Evening Calm");
  fireEvent.change(screen.getByLabelText("Date"), {
    target: { value: "2026-12-24" },
  });
  await user.selectOptions(screen.getByLabelText("Teacher"), "4");
  await user.type(screen.getByLabelText("Description"), "Wind down");
  return user;
};

describe("SessionForm page", () => {
  beforeEach(() => {
    vi.mocked(teacherService.getAll).mockResolvedValue(teachers);
    vi.mocked(sessionService.getById).mockResolvedValue(session);
    vi.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("creates a session and opens sessions", async () => {
    vi.mocked(sessionService.create).mockResolvedValue(session);
    renderPage("/sessions/create");

    expect(
      screen.getByRole("heading", { name: "Create New Session" }),
    ).toBeInTheDocument();
    const user = await fillNewSession();
    await user.click(screen.getByRole("button", { name: "Create Session" }));

    expect(sessionService.create).toHaveBeenCalledWith({
      name: "Evening Calm",
      date: "2026-12-24T00:00:00.000Z",
      description: "Wind down",
      teacherId: 4,
    });
    expect(sessionService.getById).not.toHaveBeenCalled();
    expect(await screen.findByText("Sessions page")).toBeInTheDocument();
  });

  it("does not submit until a teacher is chosen", () => {
    renderPage("/sessions/create");

    const submitted = fireEvent.submit(
      screen.getByRole("button", { name: "Create Session" }),
    );

    expect(submitted).toBe(false); // default prevented: no page reload
    expect(sessionService.create).not.toHaveBeenCalled();
  });

  it("shows saving state, then the error when saving fails", async () => {
    const save = deferred<Session>();
    vi.mocked(sessionService.create).mockReturnValue(save.promise);
    renderPage("/sessions/create");
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();

    const user = await fillNewSession();
    await user.click(screen.getByRole("button", { name: "Create Session" }));

    expect(screen.getByRole("button", { name: "Saving..." })).toBeDisabled();
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();

    save.reject(new Error("offline"));

    expect(
      await screen.findByText("Failed to save session"),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Create Session" }),
    ).toBeEnabled();
  });

  it("prefills an existing session and updates it", async () => {
    vi.mocked(sessionService.update).mockResolvedValue(session);
    const user = userEvent.setup();
    renderPage("/sessions/edit/12");

    expect(
      screen.getByRole("heading", { name: "Edit Session" }),
    ).toBeInTheDocument();
    expect(await screen.findByDisplayValue("Morning Flow")).toBeInTheDocument();
    expect(screen.getByLabelText("Date")).toHaveValue("2026-12-01");
    expect(screen.getByLabelText("Teacher")).toHaveValue("3");
    expect(screen.getByLabelText("Description")).toHaveValue(
      "A gentle morning session",
    );
    expect(sessionService.getById).toHaveBeenCalledWith(
      12,
      expect.any(AbortSignal),
    );

    await user.click(screen.getByRole("button", { name: "Update Session" }));

    expect(sessionService.update).toHaveBeenCalledWith(12, {
      name: "Morning Flow",
      date: "2026-12-01T00:00:00.000Z",
      description: "A gentle morning session",
      teacherId: 3,
    });
    expect(await screen.findByText("Sessions page")).toBeInTheDocument();
  });

  it("shows the server error when the session fails to load", async () => {
    vi.mocked(sessionService.getById).mockRejectedValue(
      axiosError({ message: "Session gone" }),
    );

    renderPage("/sessions/edit/12");

    expect(await screen.findByText("Session gone")).toBeInTheDocument();
  });

  it("shows a generic error when loading fails unexpectedly", async () => {
    vi.mocked(sessionService.getById).mockRejectedValue(new Error("x"));

    renderPage("/sessions/edit/12");

    expect(
      await screen.findByText("Failed to load session"),
    ).toBeInTheDocument();
  });

  it("logs a teacher loading failure and leaves only the placeholder", async () => {
    const error = new Error("offline");
    vi.mocked(teacherService.getAll).mockRejectedValue(error);

    renderPage("/sessions/create");

    await vi.waitFor(() =>
      expect(console.error).toHaveBeenCalledWith(
        "Failed to fetch teachers",
        error,
      ),
    );
    expect(screen.getAllByRole("option")).toHaveLength(1);
  });

  it("ignores requests cancelled by leaving the page", async () => {
    vi.mocked(teacherService.getAll).mockImplementation(rejectOnAbort);
    vi.mocked(sessionService.getById).mockImplementation(rejectOnAbort);

    const { unmount } = renderPage("/sessions/edit/12");
    unmount();

    expect(vi.mocked(teacherService.getAll).mock.calls[0][0]?.aborted).toBe(
      true,
    );
    expect(vi.mocked(sessionService.getById).mock.calls[0][1]?.aborted).toBe(
      true,
    );

    await new Promise((resolve) => setTimeout(resolve));
    expect(console.error).not.toHaveBeenCalled();
  });

  it("cancels back to sessions", async () => {
    const user = userEvent.setup();
    renderPage("/sessions/create");

    await user.click(screen.getByRole("button", { name: "Cancel" }));

    expect(await screen.findByText("Sessions page")).toBeInTheDocument();
  });
});
