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
  await expect(page.getByText("作成", { exact: true })).toBeVisible();

  await page.getByRole("button", { name: "編集" }).click();
  await page.getByRole("button", { name: "実行を記録" }).click();
  await page.getByRole("button", { name: "ログ", exact: true }).click();
  await expect(page.getByText(/gpt-4.1 の実行を記録/)).toBeVisible();
});

test("compares versions with a colored line diff", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: "新規作成" }).click();
  await page.getByLabel("プロンプト名").fill("Greeting");
  await page.getByLabel("ユーザープロンプト").fill("Say hello");
  await page.getByRole("button", { name: "バージョンを保存" }).click();
  await expect(page.getByText("バージョン 2")).toBeVisible();

  await page.getByLabel("ユーザープロンプト").fill("Say hello there");
  await page.getByRole("button", { name: "バージョンを保存" }).click();
  await expect(page.getByText("バージョン 3")).toBeVisible();

  await page.getByRole("button", { name: "履歴" }).click();
  await expect(page.getByLabel("比較先")).toHaveValue("3");
  await expect(page.getByLabel("比較元")).toHaveValue("2");
  await expect(page.locator('[data-diff-type="remove"]')).toContainText(
    "Say hello",
  );
  await expect(page.locator('[data-diff-type="add"]')).toContainText(
    "Say hello there",
  );

  await page.screenshot({
    path: "e2e/output/prompt-history-diff.png",
    fullPage: true,
  });

  await page.getByRole("button", { name: "バージョン 1" }).click();
  await expect(page.getByLabel("比較元")).toHaveValue("");
  await page.getByRole("button", { name: "編集に読み込む" }).click();
  await expect(page.getByLabel("ユーザープロンプト")).toHaveValue("");
});
