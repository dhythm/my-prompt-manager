import path from "node:path";
import { expect, test } from "@playwright/test";

const outputDir = path.join("e2e", "output");

test("fills variables, previews expansion, and records expanded run input", async ({
  page,
}) => {
  await page.goto("/");
  await page
    .getByRole("complementary")
    .getByRole("button", { name: "新規作成" })
    .click();
  await expect(page.getByLabel("プロンプト名")).toBeVisible();

  await page.getByLabel("プロンプト名").fill("Variable greeting");
  await page.getByLabel("ユーザープロンプト").fill("Hello {{name}}");
  await page.getByLabel("モデル").selectOption({ label: "Grok 4.6" });

  await expect(page.getByRole("heading", { name: "変数" })).toBeVisible();
  await expect(page.getByLabel("変数").getByText("{{name}}")).toBeVisible();
  await expect(page.getByRole("textbox", { name: "name" })).toHaveCount(0);
  await expect(page.getByText("未入力: name")).toHaveCount(0);

  await page.screenshot({
    path: path.join(outputDir, "prompt-variables.png"),
    fullPage: true,
  });

  await page.getByRole("button", { name: "バージョンを保存" }).click();
  await expect(page.getByText("バージョン 2")).toBeVisible();

  await page.getByRole("button", { name: "プレイグラウンド" }).click();
  await expect(page.getByRole("textbox", { name: "name" })).toHaveValue(
    "sample-name",
  );
  await page.getByRole("textbox", { name: "name" }).fill("Ada");
  await page.getByRole("button", { name: "実行" }).click();
  await expect(page.getByLabel("プレビュー")).toContainText("Hello Ada");
  await expect(page.getByLabel("出力")).toBeVisible();
  await expect(page.getByRole("article").getByText(/^system:/)).toHaveCount(0);
  await expect(page.getByText("{{name}}")).toHaveCount(0);
});

test("shows a running status while the playground executes", async ({
  page,
}) => {
  await page.goto("/");
  await page.getByRole("link", { name: "気まずいメールを整える" }).click();
  await page.getByRole("button", { name: "プレイグラウンド" }).click();

  await page.route("**/api/prompts/**/runs", async (route) => {
    if (route.request().method() !== "POST") {
      await route.continue();
      return;
    }
    await new Promise((resolve) => setTimeout(resolve, 2000));
    await route.continue();
  });

  await page.getByRole("button", { name: "実行" }).click();
  await expect(page.getByRole("status")).toHaveText("実行中...");
  await expect(page.getByRole("button", { name: "実行中..." })).toBeVisible();
});
