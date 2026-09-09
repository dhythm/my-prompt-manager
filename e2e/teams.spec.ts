import { expect, test } from "@playwright/test";

test("invites a dummy user to a team", async ({ page }) => {
  await page.goto("/teams");
  await expect(page.getByText("agent@local.test")).toBeVisible();

  const teamName = `Core ${Date.now()}`;
  await page.getByPlaceholder("Team name").fill(teamName);
  await page.getByRole("button", { name: "Create team" }).click();
  await expect(page.getByText(teamName).first()).toBeVisible();

  await expect(page.locator('select[name="teamId"]')).toContainText(teamName);
  await page.locator('select[name="teamId"]').selectOption({ label: teamName });
  await page.getByPlaceholder("email").fill("dev@local.test");
  const inviteResponse = page.waitForResponse(
    (response) =>
      response.url().includes("/invites") &&
      response.request().method() === "POST",
  );
  await page.getByRole("button", { name: "Invite" }).click();
  expect((await inviteResponse).ok()).toBeTruthy();

  await page.getByRole("button", { name: "Use Developer" }).click();
  await expect(page.getByRole("button", { name: "Use Agent" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Accept" })).toBeVisible();

  await page.getByRole("button", { name: "Accept" }).click();
  await expect(page.getByText("member")).toBeVisible();
});
