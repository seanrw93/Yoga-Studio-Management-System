import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import Login from "./Login";
import { axiosError, deferred, mockAuth } from "../test/helpers";

vi.mock("../context/AuthProvider", () => ({ useAuth: vi.fn() }));

const renderPage = () =>
  render(
    <MemoryRouter initialEntries={["/login"]}>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/sessions" element={<p>Sessions page</p>} />
      </Routes>
    </MemoryRouter>,
  );

const submitButton = () =>
  screen.getByRole("button", { name: /login|loading/i });

const fillAndSubmit = async () => {
  const user = userEvent.setup();
  await user.type(screen.getByLabelText("Email"), " member@example.com ");
  await user.type(screen.getByLabelText("Password"), "secret");
  await user.click(submitButton());
};

describe("Login page", () => {
  let auth: ReturnType<typeof mockAuth>;

  beforeEach(() => {
    auth = mockAuth(null);
  });

  it("shows field errors and skips login for invalid input", () => {
    renderPage();

    expect(fireEvent.submit(submitButton())).toBe(false); // no page reload

    expect(screen.getByLabelText("Email")).toHaveAccessibleDescription(
      "Enter a valid email address",
    );
    expect(screen.getByLabelText("Password")).toHaveAccessibleDescription(
      "Password is required",
    );
    expect(screen.getByLabelText("Email")).toHaveAttribute(
      "aria-invalid",
      "true",
    );
    expect(auth.login).not.toHaveBeenCalled();
  });

  it("clears a field error once that field is edited", async () => {
    const user = userEvent.setup();
    renderPage();
    fireEvent.submit(submitButton());

    await user.type(screen.getByLabelText("Email"), "a");

    expect(screen.getByLabelText("Email")).not.toHaveAccessibleDescription();
    expect(screen.getByLabelText("Password")).toHaveAccessibleDescription(
      "Password is required",
    );

    await user.type(screen.getByLabelText("Password"), "x");

    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });

  it("logs in with trimmed credentials and opens sessions", async () => {
    auth.login.mockResolvedValue(undefined);
    renderPage();

    await fillAndSubmit();

    expect(auth.login).toHaveBeenCalledWith({
      email: "member@example.com",
      password: "secret",
    });
    expect(await screen.findByText("Sessions page")).toBeInTheDocument();
  });

  it("disables the button while the login request is pending", async () => {
    auth.login.mockReturnValue(deferred<void>().promise);
    renderPage();
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();

    await fillAndSubmit();

    expect(submitButton()).toHaveTextContent("Loading...");
    expect(submitButton()).toBeDisabled();
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });

  it("shows the server message and re-enables the button when login fails", async () => {
    auth.login.mockRejectedValue(
      axiosError({ message: "Invalid credentials" }),
    );
    renderPage();

    await fillAndSubmit();

    expect(await screen.findByText("Invalid credentials")).toBeInTheDocument();
    expect(submitButton()).toHaveTextContent("Login");
    expect(submitButton()).toBeEnabled();
  });

  it("falls back to a generic message when the server sends none", async () => {
    auth.login.mockRejectedValue(axiosError());
    renderPage();

    await fillAndSubmit();

    expect(await screen.findByText("Login failed")).toBeInTheDocument();
  });

  it("shows a generic message for unexpected errors", async () => {
    auth.login.mockRejectedValue(new Error("boom"));
    renderPage();

    await fillAndSubmit();

    expect(await screen.findByText("Login failed")).toBeInTheDocument();
  });
});
