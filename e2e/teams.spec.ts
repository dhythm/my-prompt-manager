import { expect, test } from "@playwright/test";

test("invites a dummy user to a team", async ({ page }) => {
  await page.goto("/teams");
  await expect(page.getByText("agent@local.test")).toBeVisible();

  const teamName = `Core ${Date.now()}`;
  await page.getByPlaceholder("チーム名").fill(teamName);
  await page.getByRole("button", { name: "チームを作成" }).click();
  await expect(page.getByText(teamName).first()).toBeVisible();

  await expect(page.locator('select[name="teamId"]')).toContainText(teamName);
  await page.locator('select[name="teamId"]').selectOption({ label: teamName });
  await page.getByPlaceholder("メールアドレス").fill("dev@local.test");
  const inviteResponse = page.waitForResponse(
    (response) =>
      response.url().includes("/invites") &&
      response.request().method() === "POST",
  );
  await page.getByRole("button", { name: "招待" }).click();
  expect((await inviteResponse).ok()).toBeTruthy();

  await page.getByRole("button", { name: "Developerに切り替え" }).click();
  await expect(
    page.getByRole("button", { name: "Agentに切り替え" }),
  ).toBeVisible();
  await expect(page.getByRole("button", { name: "承認" })).toBeVisible();

  await page.getByRole("button", { name: "承認" }).click();
  await expect(page.getByText("メンバー")).toBeVisible();
});
