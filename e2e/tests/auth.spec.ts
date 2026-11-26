import { test, expect, newUser, seeded } from "../fixtures";

test("a visitor registers and lands on sessions", async ({ page }) => {
  const user = newUser();
  await page.goto("/register");

  await page.getByLabel("First Name").fill(user.firstName);
  await page.getByLabel("Last Name").fill(user.lastName);
  await page.getByLabel("Email").fill(user.email);
  await page.getByLabel("Password").fill(user.password);
  await page.getByRole("button", { name: "Register" }).click();

  await expect(page).toHaveURL("/sessions");
  await expect(
    page.getByRole("heading", { name: "Yoga Sessions" }),
  ).toBeVisible();
});

test("a user logs in and stays signed in after a reload", async ({ page }) => {
  await page.goto("/login");

  await page.getByLabel("Email").fill(seeded.member.email);
  await page.getByLabel("Password").fill(seeded.member.password);
  await page.getByRole("button", { name: "Login" }).click();

  await expect(page).toHaveURL("/sessions");
  await page.reload();
  await expect(
    page.getByRole("heading", { name: "Yoga Sessions" }),
  ).toBeVisible();
  await expect(page.getByRole("button", { name: "Logout" })).toBeVisible();
});

test("a visitor is redirected from sessions to login", async ({ page }) => {
  await page.goto("/sessions");

  await expect(page).toHaveURL("/login");
});

test("a visitor is redirected from profile to login", async ({ page }) => {
  await page.goto("/profile");

  await expect(page).toHaveURL("/login");
});
