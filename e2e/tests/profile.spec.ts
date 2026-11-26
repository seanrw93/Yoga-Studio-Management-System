import { test, expect } from "../fixtures";

test("a member views and deletes their profile", async ({
  memberPage: page,
  freshUser,
}) => {
  await page.goto("/profile");

  await expect(page.getByRole("heading", { name: "My Profile" })).toBeVisible();
  await expect(page.getByText(freshUser.email)).toBeVisible();

  page.once("dialog", (dialog) => dialog.accept());
  await page.getByRole("button", { name: "Delete Account" }).click();

  await expect(page).toHaveURL("/login");
  const login = await page.request.post("/api/auth/login", {
    data: { email: freshUser.email, password: freshUser.password },
  });
  expect(login.ok()).toBe(false);
});
