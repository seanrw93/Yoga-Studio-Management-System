import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import Register from "./Register";
import { axiosError, deferred, mockAuth } from "../test/helpers";

vi.mock("../context/AuthProvider", () => ({ useAuth: vi.fn() }));

const renderPage = () =>
  render(
    <MemoryRouter initialEntries={["/register"]}>
      <Routes>
        <Route path="/register" element={<Register />} />
        <Route path="/sessions" element={<p>Sessions page</p>} />
      </Routes>
    </MemoryRouter>,
  );

const submitButton = () => screen.getByRole("button", { name: /register/i });

const validData = {
  firstName: "Yoga",
  lastName: "Member",
  email: "member@example.com",
  password: "Secret123!",
};

const fillAndSubmit = async () => {
  const user = userEvent.setup();
  await user.type(screen.getByLabelText("First Name"), validData.firstName);
  await user.type(screen.getByLabelText("Last Name"), validData.lastName);
  await user.type(screen.getByLabelText("Email"), validData.email);
  await user.type(screen.getByLabelText("Password"), validData.password);
  await user.click(submitButton());
};

describe("Register page", () => {
  let auth: ReturnType<typeof mockAuth>;

  beforeEach(() => {
    auth = mockAuth(null);
  });

  it("shows field errors and skips registration for invalid input", () => {
    renderPage();

    expect(fireEvent.submit(submitButton())).toBe(false); // no page reload

    expect(screen.getByLabelText("First Name")).toHaveAccessibleDescription(
      "First name must be at least 2 characters",
    );
    expect(screen.getByLabelText("Last Name")).toHaveAccessibleDescription(
      "Last name must be at least 2 characters",
    );
    expect(screen.getByLabelText("Email")).toHaveAccessibleDescription(
      "Enter a valid email address",
    );
    expect(screen.getByLabelText("Password")).toHaveAccessibleDescription(
      "Password must be at least 8 characters",
    );
    expect(screen.getByLabelText("Password")).toHaveAttribute(
      "aria-invalid",
      "true",
    );
    expect(auth.register).not.toHaveBeenCalled();
  });

  it("clears a field error once that field is edited", async () => {
    const user = userEvent.setup();
    renderPage();
    fireEvent.submit(submitButton());

    await user.type(screen.getByLabelText("First Name"), "Y");

    expect(
      screen.getByLabelText("First Name"),
    ).not.toHaveAccessibleDescription();
    expect(screen.getAllByRole("alert")).toHaveLength(3);
  });

  it("registers and opens sessions", async () => {
    auth.register.mockResolvedValue(undefined);
    renderPage();

    await fillAndSubmit();

    expect(auth.register).toHaveBeenCalledWith(validData);
    expect(await screen.findByText("Sessions page")).toBeInTheDocument();
  });

  it("disables the button while the registration request is pending", async () => {
    auth.register.mockReturnValue(deferred<void>().promise);
    renderPage();
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();

    await fillAndSubmit();

    expect(submitButton()).toHaveTextContent("Registering...");
    expect(submitButton()).toBeDisabled();
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });

  it("shows server validation errors next to their fields", async () => {
    auth.register.mockRejectedValue(
      axiosError({
        message: "Validation failed",
        errors: { properties: { email: { errors: ["Email is blocked"] } } },
      }),
    );
    renderPage();

    await fillAndSubmit();

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Email is blocked",
    );
    expect(screen.getByLabelText("Email")).toHaveAccessibleDescription(
      "Email is blocked",
    );
    expect(screen.queryByText("Validation failed")).not.toBeInTheDocument();
    expect(submitButton()).toBeEnabled();
  });

  it("shows a duplicate email as an email field error", async () => {
    auth.register.mockRejectedValue(
      axiosError({ message: "Email already exists" }),
    );
    renderPage();

    await fillAndSubmit();

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Email already exists",
    );
    expect(screen.getByLabelText("Email")).toHaveAccessibleDescription(
      "Email already exists",
    );
    expect(screen.getAllByText("Email already exists")).toHaveLength(1);
  });

  it("shows any other server message as a form error", async () => {
    auth.register.mockRejectedValue(axiosError({ message: "Server down" }));
    renderPage();

    await fillAndSubmit();

    expect(await screen.findByRole("alert")).toHaveTextContent("Server down");
    expect(screen.getByLabelText("Email")).not.toHaveAccessibleDescription();
  });

  it("falls back to a generic message when the server sends none", async () => {
    auth.register.mockRejectedValue(axiosError());
    renderPage();

    await fillAndSubmit();

    expect(await screen.findByText("Registration failed")).toBeInTheDocument();
  });

  it("shows a generic message for unexpected errors", async () => {
    auth.register.mockRejectedValue(new Error("boom"));
    renderPage();

    await fillAndSubmit();

    expect(await screen.findByText("Registration failed")).toBeInTheDocument();
  });
});
