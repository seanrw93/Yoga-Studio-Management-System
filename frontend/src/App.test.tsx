import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import App from "./App";
import { AuthProvider } from "./context/AuthProvider";

vi.mock("./services/sessions.service", () => ({
  sessionService: { getAll: vi.fn().mockResolvedValue([]) },
}));

vi.mock("./services/teacher.service", () => ({
  teacherService: { getAll: vi.fn().mockResolvedValue([]) },
}));

const renderApp = (path: string) => {
  window.history.pushState({}, "", path);
  return render(
    <AuthProvider>
      <App />
    </AuthProvider>,
  );
};

describe("App routes", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("renders the public login page", () => {
    renderApp("/login");

    expect(
      screen.getByRole("heading", { name: "Login to Yoga Studio" }),
    ).toBeInTheDocument();
    expect(screen.getByRole("textbox", { name: "Email" })).toBeInTheDocument();
    expect(screen.getByLabelText("Password")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Register here" })).toHaveAttribute(
      "href",
      "/register",
    );
  });

  it("redirects an unauthenticated visitor from private sessions to login", () => {
    renderApp("/sessions");

    expect(
      screen.getByRole("heading", { name: "Login to Yoga Studio" }),
    ).toBeInTheDocument();
  });

  it("redirects a non-admin away from session creation", async () => {
    localStorage.setItem("token", "test-token");
    localStorage.setItem(
      "user",
      JSON.stringify({
        id: 1,
        email: "member@example.com",
        firstName: "Yoga",
        lastName: "Member",
        admin: false,
      }),
    );

    renderApp("/sessions/create");

    expect(
      await screen.findByRole("heading", { name: "Yoga Sessions" }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("heading", { name: "Create New Session" }),
    ).not.toBeInTheDocument();
  });

  it("lets an admin open session creation", async () => {
    localStorage.setItem("token", "test-token");
    localStorage.setItem(
      "user",
      JSON.stringify({
        id: 1,
        email: "admin@example.com",
        firstName: "Yoga",
        lastName: "Admin",
        admin: true,
      }),
    );

    renderApp("/sessions/create");

    expect(
      await screen.findByRole("heading", { name: "Create New Session" }),
    ).toBeInTheDocument();
  });

  it("safely redirects when a stored token has no valid user", async () => {
    localStorage.setItem("token", "test-token");

    renderApp("/sessions/create");

    expect(
      await screen.findByRole("heading", { name: "Yoga Sessions" }),
    ).toBeInTheDocument();
  });
});
