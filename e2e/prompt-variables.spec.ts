import path from "node:path";
import { expect, test } from "@playwright/test";

const outputDir = path.join("e2e", "output");

test("fills variables, previews expansion, and records expanded run input", async ({
  page,
}) => {
  await page.goto("/");
  await page.getByRole("button", { name: "新規作成" }).click();
  await expect(page.getByLabel("プロンプト名")).toBeVisible();

  await page.getByLabel("プロンプト名").fill("Variable greeting");
  await page.getByLabel("ユーザープロンプト").fill("Hello {{name}}");

  await expect(page.getByRole("heading", { name: "変数" })).toBeVisible();
  await expect(page.getByText("未入力: name")).toBeVisible();
  await expect(page.getByLabel("プレビュー")).toContainText("Hello {{name}}");

  await page.getByRole("textbox", { name: "name" }).fill("Ada");
  await expect(page.getByText("未入力: name")).toHaveCount(0);
  await expect(page.getByLabel("プレビュー")).toContainText("Hello Ada");

  await page.screenshot({
    path: path.join(outputDir, "prompt-variables.png"),
    fullPage: true,
  });

  await page.getByRole("button", { name: "バージョンを保存" }).click();
  await expect(page.getByText("バージョン 2")).toBeVisible();

  await page.getByRole("button", { name: "実行を記録" }).click();
  await page.getByRole("button", { name: "ログ", exact: true }).click();
  await expect(page.getByText("user: Hello Ada")).toBeVisible();
  await expect(page.getByText("{{name}}")).toHaveCount(0);
  await expect(page.getByText(/gpt-4.1 の実行を記録/)).toBeVisible();
});
