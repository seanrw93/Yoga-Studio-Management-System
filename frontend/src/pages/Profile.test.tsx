import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import Profile from "./Profile";
import { userService } from "../services/user.service";
import { authService } from "../services/auth.service";
import {
  admin,
  axiosError,
  deferred,
  member,
  mockAuth,
  rejectOnAbort,
} from "../test/helpers";
import type { User } from "../types";

vi.mock("../context/AuthProvider", () => ({ useAuth: vi.fn() }));
vi.mock("../services/user.service", () => ({
  userService: { getById: vi.fn(), delete: vi.fn(), promoteToAdmin: vi.fn() },
}));
vi.mock("../services/auth.service", () => ({
  authService: { updateCurrentUser: vi.fn() },
}));

const renderPage = () =>
  render(
    <MemoryRouter initialEntries={["/profile"]}>
      <Routes>
        <Route path="/profile" element={<Profile />} />
        <Route path="/login" element={<p>Login page</p>} />
        <Route path="/sessions" element={<p>Sessions page</p>} />
      </Routes>
    </MemoryRouter>,
  );

describe("Profile page", () => {
  let auth: ReturnType<typeof mockAuth>;

  beforeEach(() => {
    auth = mockAuth(member);
    vi.mocked(userService.getById).mockResolvedValue({
      ...member,
      createdAt: "2024-03-15T12:00:00.000Z",
    });
    vi.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllEnvs();
  });

  it("shows loading while the profile is fetched", () => {
    vi.mocked(userService.getById).mockReturnValue(deferred<User>().promise);

    renderPage();

    expect(screen.getByText("Loading profile...")).toBeInTheDocument();
  });

  it("keeps loading without fetching when no user is signed in", () => {
    mockAuth(null);

    renderPage();

    expect(screen.getByText("Loading profile...")).toBeInTheDocument();
    expect(userService.getById).not.toHaveBeenCalled();
  });

  it("shows the signed-in user's details", async () => {
    renderPage();

    expect(await screen.findByText("Yoga")).toBeInTheDocument();
    expect(screen.getByText("Member")).toBeInTheDocument();
    expect(screen.getByText("member@example.com")).toBeInTheDocument();
    expect(screen.getByText("User")).toBeInTheDocument();
    expect(screen.getByText("March 15, 2024")).toBeInTheDocument();
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
    expect(userService.getById).toHaveBeenCalledWith(
      1,
      expect.any(AbortSignal),
    );
  });

  it("shows an admin badge, a dash for a missing date and no promote button", async () => {
    mockAuth(admin);
    vi.mocked(userService.getById).mockResolvedValue(admin);

    renderPage();

    expect(await screen.findByText("Administrator")).toBeInTheDocument();
    expect(screen.getByText("—")).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /promote/i }),
    ).not.toBeInTheDocument();
  });

  it("hides the promote button outside development", async () => {
    vi.stubEnv("DEV", false);

    renderPage();

    await screen.findByText("Yoga");
    expect(
      screen.queryByRole("button", { name: /promote/i }),
    ).not.toBeInTheDocument();
  });

  it("shows the server error when the profile fails to load", async () => {
    vi.mocked(userService.getById).mockRejectedValue(
      axiosError({ message: "Not allowed" }),
    );

    renderPage();

    expect(await screen.findByText("Not allowed")).toBeInTheDocument();
  });

  it("shows a fallback error when the profile response is empty", async () => {
    vi.mocked(userService.getById).mockResolvedValue(null as unknown as User);

    renderPage();

    expect(
      await screen.findByText("Failed to load profile"),
    ).toBeInTheDocument();
  });

  it("ignores the request cancelled by leaving the page", async () => {
    vi.mocked(userService.getById).mockImplementation(rejectOnAbort);

    const { unmount } = renderPage();
    unmount();

    expect(vi.mocked(userService.getById).mock.calls[0][1]?.aborted).toBe(true);

    await new Promise((resolve) => setTimeout(resolve));
    expect(console.error).not.toHaveBeenCalled();
  });

  it("deletes the account, logs out and opens login after confirming", async () => {
    vi.spyOn(window, "confirm").mockReturnValue(true);
    vi.mocked(userService.delete).mockResolvedValue();
    const user = userEvent.setup();
    renderPage();

    await user.click(
      await screen.findByRole("button", { name: "Delete Account" }),
    );

    expect(userService.delete).toHaveBeenCalledWith(1);
    expect(auth.logout).toHaveBeenCalled();
    expect(await screen.findByText("Login page")).toBeInTheDocument();
  });

  it("keeps the account when deletion is not confirmed", async () => {
    vi.spyOn(window, "confirm").mockReturnValue(false);
    const user = userEvent.setup();
    renderPage();

    await user.click(
      await screen.findByRole("button", { name: "Delete Account" }),
    );

    expect(userService.delete).not.toHaveBeenCalled();
  });

  it("alerts when account deletion fails", async () => {
    vi.spyOn(window, "confirm").mockReturnValue(true);
    vi.spyOn(window, "alert").mockImplementation(() => {});
    vi.mocked(userService.delete).mockRejectedValue(new Error("offline"));
    const user = userEvent.setup();
    renderPage();

    await user.click(
      await screen.findByRole("button", { name: "Delete Account" }),
    );

    await waitFor(() =>
      expect(window.alert).toHaveBeenCalledWith("Failed to delete account"),
    );
    expect(auth.logout).not.toHaveBeenCalled();
  });

  it("promotes the user to admin in development", async () => {
    const promotion = deferred<User>();
    vi.mocked(userService.promoteToAdmin).mockReturnValue(promotion.promise);
    const user = userEvent.setup();
    renderPage();

    await user.click(
      await screen.findByRole("button", { name: "Promote to Admin (Dev)" }),
    );

    expect(screen.getByRole("button", { name: "Promoting..." })).toBeDisabled();
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();

    promotion.resolve({ ...member, admin: true });

    expect(await screen.findByText("Administrator")).toBeInTheDocument();
    expect(authService.updateCurrentUser).toHaveBeenCalledWith({ admin: true });
  });

  it("shows the error and re-enables the button when promotion fails", async () => {
    vi.mocked(userService.promoteToAdmin).mockRejectedValue(new Error("nope"));
    const user = userEvent.setup();
    renderPage();

    await user.click(
      await screen.findByRole("button", { name: "Promote to Admin (Dev)" }),
    );

    expect(
      await screen.findByText("Failed to promote to admin"),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Promote to Admin (Dev)" }),
    ).toBeEnabled();
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
