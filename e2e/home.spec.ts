import path from "node:path";
import { expect, test } from "@playwright/test";

const outputDir = path.join("e2e", "output");

test("home page renders and can be screenshotted", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { name: "プロンプト" })).toBeVisible();
  await expect(page.getByText("agent@local.test")).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Developerに切り替え" }),
  ).toBeVisible();
  await expect(page.getByRole("button", { name: "新規作成" })).toBeVisible();
  await expect(page.getByRole("link", { name: "ログ" })).toBeVisible();
  await expect(page.getByRole("link", { name: "チーム" })).toBeVisible();

  await page.setViewportSize({ width: 1280, height: 800 });
  await page.screenshot({
    path: path.join(outputDir, "home-desktop.png"),
    fullPage: true,
  });

  await page.setViewportSize({ width: 390, height: 844 });
  await page.screenshot({
    path: path.join(outputDir, "home-mobile.png"),
    fullPage: true,
  });

  await page.setViewportSize({ width: 1280, height: 800 });
  await page.getByRole("button", { name: "ログアウト" }).click();
  await expect(page.getByRole("heading", { name: "ログイン" })).toBeVisible();
  await page.screenshot({
    path: path.join(outputDir, "sign-in.png"),
    fullPage: true,
  });

  await page.getByRole("button", { name: /Agent/ }).click();
  await expect(page.getByRole("heading", { name: "プロンプト" })).toBeVisible();

  await page.getByRole("link", { name: "チーム" }).click();
  await expect(page.getByRole("heading", { name: "チーム" })).toBeVisible();
  await expect(page.getByText("チームはまだありません")).toBeVisible();
  await page.screenshot({
    path: path.join(outputDir, "teams-empty.png"),
    fullPage: true,
  });

  await page.getByRole("link", { name: "ログ" }).click();
  await expect(page.getByRole("heading", { name: "ログ" })).toBeVisible();
  await expect(page.getByText("実行ログはまだありません")).toBeVisible();
  await page.screenshot({
    path: path.join(outputDir, "logs-empty.png"),
    fullPage: true,
  });

  await page.getByRole("button", { name: "新規作成" }).click();
  await expect(page.getByLabel("プロンプト名")).toBeVisible();
  await page.screenshot({
    path: path.join(outputDir, "prompt-editor.png"),
    fullPage: true,
  });

  await page.getByRole("button", { name: "履歴" }).click();
  await expect(page.getByText("作成")).toBeVisible();
  await page.screenshot({
    path: path.join(outputDir, "prompt-history.png"),
    fullPage: true,
  });

  await page.getByRole("button", { name: "ログ" }).click();
  await expect(page.getByText("実行ログはまだありません")).toBeVisible();
  await page.screenshot({
    path: path.join(outputDir, "prompt-logs-empty.png"),
    fullPage: true,
  });
});
