import { test, expect } from "../fixtures";

test("a member sees the seeded sessions", async ({ memberPage: page }) => {
  await page.goto("/sessions");

  await expect(
    page.getByRole("heading", { name: "Yoga Vinyasa" }),
  ).toBeVisible();
  await expect(page.getByRole("heading", { name: "Yin Yoga" })).toBeVisible();
});

test("a member joins and then leaves a session", async ({
  memberPage: page,
}) => {
  await page.goto("/sessions");
  await page
    .getByRole("heading", { name: "Yoga Hatha" })
    .locator("..")
    .getByRole("link", { name: "View Details" })
    .click();

  const participants = page.getByText(/^Participants: \d+$/);
  const before = Number(/\d+/.exec((await participants.textContent()) ?? "")![0]);

  await page.getByRole("button", { name: "Join Session" }).click();
  await expect(participants).toHaveText(`Participants: ${before + 1}`);

  await page.getByRole("button", { name: "Leave Session" }).click();
  await expect(participants).toHaveText(`Participants: ${before}`);
  await expect(page.getByRole("button", { name: "Join Session" })).toBeVisible();
});
