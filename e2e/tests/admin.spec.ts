import { test, expect } from "../fixtures";

test("an admin creates, edits and deletes a session", async ({
  adminPage: page,
}) => {
  const name = `E2E Flow ${Date.now()}`;
  const card = (title: string) =>
    page.getByRole("heading", { name: title, exact: true }).locator("..");

  // Create
  await page.goto("/sessions");
  await page.getByRole("link", { name: "Create Session" }).first().click();
  await page.getByLabel("Session Name").fill(name);
  await page.getByLabel("Date").fill("2027-01-15");
  await page.getByLabel("Teacher").selectOption({ label: "Margot Delahaye" });
  await page.getByLabel("Description").fill("Created by an E2E test");
  await page.getByRole("button", { name: "Create Session" }).click();

  await expect(page).toHaveURL("/sessions");
  await expect(card(name)).toContainText("Margot Delahaye");

  // Edit
  await card(name).getByRole("link", { name: "View Details" }).click();
  await page.getByRole("button", { name: "Edit" }).click();
  await expect(page.getByLabel("Session Name")).toHaveValue(name);
  await page.getByLabel("Session Name").fill(`${name} edited`);
  await page.getByRole("button", { name: "Update Session" }).click();

  await expect(page).toHaveURL("/sessions");
  await expect(card(`${name} edited`)).toBeVisible();

  // Delete
  await card(`${name} edited`)
    .getByRole("link", { name: "View Details" })
    .click();
  page.once("dialog", (dialog) => dialog.accept());
  await page.getByRole("button", { name: "Delete" }).click();

  await expect(page).toHaveURL("/sessions");
  await expect(
    page.getByRole("heading", { name: `${name} edited` }),
  ).toHaveCount(0);
});
