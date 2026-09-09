import { expect, test } from "@playwright/test";

test("creates a prompt with system and user messages", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: "新規作成" }).click();
  await expect(page.getByLabel("プロンプト名")).toBeVisible();
  await expect(page.getByLabel("システムプロンプト")).toBeVisible();
  await expect(page.getByLabel("ユーザープロンプト")).toBeVisible();

  await page.getByLabel("プロンプト名").fill("Greeting");
  await page.getByLabel("ユーザープロンプト").fill("Say hello");
  await page.getByRole("button", { name: "バージョンを保存" }).click();
  await expect(page.getByText("バージョン 2")).toBeVisible();

  await page.getByRole("button", { name: "履歴" }).click();
  await expect(page.getByText("作成")).toBeVisible();

  await page.getByRole("button", { name: "編集" }).click();
  await page.getByRole("button", { name: "実行を記録" }).click();
  await page.getByRole("button", { name: "ログ" }).click();
  await expect(page.getByText(/gpt-4.1 の実行を記録/)).toBeVisible();
});
