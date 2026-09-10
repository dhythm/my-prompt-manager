import { expect, test } from "@playwright/test";

test("reset-demo removes leftover e2e teams", async ({ page, request }) => {
  const teamName = `Core ${Date.now()}`;
  await page.goto("/teams");
  await page.getByPlaceholder("チーム名").fill(teamName);
  await page.getByRole("button", { name: "チームを作成" }).click();
  await expect(
    page.getByRole("listitem").filter({ hasText: teamName }),
  ).toBeVisible();

  const reset = await request.post("/api/dev/reset-demo");
  expect(reset.ok()).toBeTruthy();

  await page.reload();
  await expect(
    page.getByRole("listitem").filter({ hasText: teamName }),
  ).toHaveCount(0);
});
