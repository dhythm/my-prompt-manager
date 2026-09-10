import { expect, test } from "@playwright/test";

test("keeps the teams heading and create form visible", async ({ page }) => {
  await page.goto("/teams");
  await expect(
    page.getByRole("heading", { name: "チーム", level: 1 }),
  ).toBeVisible();
  await expect(page.getByPlaceholder("チーム名")).toBeVisible();
  await expect(
    page.getByRole("button", { name: "チームを作成" }),
  ).toBeVisible();
});

test("invites a dummy user to a team", async ({ page }) => {
  await page.goto("/teams");
  await expect(page.getByText("agent@local.test")).toBeVisible();

  const teamName = `Core ${Date.now()}`;
  await page.getByPlaceholder("チーム名").fill(teamName);
  await page.getByRole("button", { name: "チームを作成" }).click();
  const teamRow = page.getByRole("listitem").filter({ hasText: teamName });
  await expect(teamRow).toBeVisible();
  await expect(teamRow.getByText("オーナー")).toBeVisible();

  await teamRow.getByPlaceholder("メールアドレス").fill("dev@local.test");
  const inviteResponse = page.waitForResponse(
    (response) =>
      response.url().includes("/invites") &&
      response.request().method() === "POST",
  );
  await teamRow.getByRole("button", { name: "招待" }).click();
  expect((await inviteResponse).ok()).toBeTruthy();

  await page.getByRole("button", { name: /agent@local.test/ }).click();
  await page.getByRole("menuitem", { name: "Developerに切り替え" }).click();
  await expect(page.getByText("dev@local.test")).toBeVisible();
  await page.getByRole("button", { name: /dev@local.test/ }).click();
  await expect(
    page.getByRole("menuitem", { name: "Agentに切り替え" }),
  ).toBeVisible();

  const inviteRow = page.getByRole("listitem").filter({ hasText: teamName });
  await expect(inviteRow.getByRole("button", { name: "承認" })).toBeVisible();
  await inviteRow.getByRole("button", { name: "承認" }).click();
  await expect(inviteRow.getByText("メンバー")).toBeVisible();
});
