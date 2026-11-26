import { test as base, expect, type Page } from "@playwright/test";

type Credentials = { email: string; password: string };

// Created by backend/prisma/seed.ts.
export const seeded = {
  admin: { email: "yoga@studio.com", password: "test!1234" },
  member: { email: "user@test.com", password: "test!1234" },
};

export const newUser = () => {
  const id = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  return {
    firstName: "Test",
    lastName: "User",
    email: `e2e-${id}@test.com`,
    password: "Secret123!",
  };
};

// Logs in through the API and stores the session the way the app does, skipping the form.
const signIn = async (page: Page, credentials: Credentials) => {
  const res = await page.request.post("/api/auth/login", { data: credentials });
  expect(res.ok()).toBeTruthy();
  const { token, ...user } = await res.json();
  await page.goto("/login");
  await page.evaluate(
    ([token, user]) => {
      localStorage.setItem("token", token);
      localStorage.setItem("user", user);
    },
    [token, JSON.stringify(user)],
  );
};

export const test = base.extend<{
  freshUser: ReturnType<typeof newUser>;
  memberPage: Page;
  adminPage: Page;
}>({
  // A new account per test, so tests that join sessions or delete accounts stay isolated.
  freshUser: async ({ request }, use) => {
    const user = newUser();
    const res = await request.post("/api/auth/register", { data: user });
    expect(res.ok()).toBeTruthy();
    await use(user);
  },
  memberPage: async ({ page, freshUser }, use) => {
    await signIn(page, freshUser);
    await use(page);
  },
  adminPage: async ({ page }, use) => {
    await signIn(page, seeded.admin);
    await use(page);
  },
});

export { expect };
