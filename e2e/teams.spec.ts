import { expect, test } from "@playwright/test";

test("invites a dummy user to a team", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByText("agent@local.test")).toBeVisible();

  await page.getByPlaceholder("Team name").fill("Core");
  await page.getByRole("button", { name: "Create team" }).click();
  await expect(page.getByText("owner").first()).toBeVisible();

  await page.getByPlaceholder("email").fill("dev@local.test");
  await page.getByRole("button", { name: "Invite" }).click();
  await expect(page.getByPlaceholder("email")).toHaveValue("");

  await page.getByRole("button", { name: "Use Developer" }).click();
  await expect(page.getByRole("button", { name: "Use Agent" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Accept" })).toBeVisible();

  await page.getByRole("button", { name: "Accept" }).click();
  await expect(page.getByText("member")).toBeVisible();
});
