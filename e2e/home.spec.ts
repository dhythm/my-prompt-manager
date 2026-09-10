import path from "node:path";
import { expect, test } from "@playwright/test";

const outputDir = path.join("e2e", "output");

test("home page renders and can be screenshotted", async ({ page }) => {
  await page.goto("/");
  await expect(
    page.getByRole("heading", { name: "プロンプト", level: 1 }),
  ).toBeVisible();
  await expect(
    page.getByText("ライブラリから選ぶか、新規作成してください。"),
  ).toHaveCount(0);
  await expect(page.getByText("agent@local.test")).toBeVisible();
  await page.getByRole("button", { name: /agent@local.test/ }).click();
  await expect(
    page.getByRole("menuitem", { name: "Developerに切り替え" }),
  ).toBeVisible();
  await page.getByRole("button", { name: /agent@local.test/ }).click();
  await expect(
    page.getByRole("complementary").getByRole("button", { name: "新規作成" }),
  ).toBeVisible();
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
  await page.getByRole("button", { name: /agent@local.test/ }).click();
  await page.getByRole("menuitem", { name: "ログアウト" }).click();
  await expect(page.getByRole("heading", { name: "ログイン" })).toBeVisible();
  await page.screenshot({
    path: path.join(outputDir, "sign-in.png"),
    fullPage: true,
  });

  await page.getByRole("button", { name: /Agent/ }).click();
  await expect(
    page.getByRole("heading", { name: "プロンプト", level: 1 }),
  ).toBeVisible();

  await page.getByRole("link", { name: "チーム" }).click();
  await expect(
    page.getByRole("heading", { name: "チーム", level: 1 }),
  ).toBeVisible();
  await page.screenshot({
    path: path.join(outputDir, "teams-empty.png"),
    fullPage: true,
  });

  await page.getByRole("link", { name: "ログ" }).click();
  await expect(page.getByRole("heading", { name: "ログ" })).toBeVisible();
  await page.screenshot({
    path: path.join(outputDir, "logs-empty.png"),
    fullPage: true,
  });

  await page
    .getByRole("complementary")
    .getByRole("button", { name: "新規作成" })
    .click();
  await expect(page.getByLabel("プロンプト名")).toBeVisible();
  await page.screenshot({
    path: path.join(outputDir, "prompt-editor.png"),
    fullPage: true,
  });
  await page.getByRole("button", { name: "ログ", exact: true }).click();
  await expect(page.getByText("実行ログはまだありません")).toBeVisible();
  await page.screenshot({
    path: path.join(outputDir, "prompt-logs-empty.png"),
    fullPage: true,
  });
  await page.getByRole("button", { name: "編集" }).click();

  await page.getByRole("link", { name: "プロンプト", exact: true }).click();
  const untitled = page
    .getByRole("main")
    .getByRole("link", { name: /無題/ })
    .first();
  await expect(untitled).toBeVisible();
  await untitled.click();
  await expect(page.getByLabel("プロンプト名")).toBeVisible();

  await page.getByRole("button", { name: "履歴" }).click();
  await expect(page.getByText("作成", { exact: true })).toBeVisible();
  await expect(page.getByText("メッセージ 1")).toBeVisible();
  await page.screenshot({
    path: path.join(outputDir, "prompt-history.png"),
    fullPage: true,
  });

  await page.getByRole("link", { name: "プロンプト", exact: true }).click();
  await expect(
    page.getByRole("main").getByText("Grok 4.6").first(),
  ).toBeVisible();

  await page
    .getByRole("main")
    .getByRole("link", { name: /無題/ })
    .first()
    .click();
  await page.getByLabel("モデル").selectOption({ label: "Grok 4.6" });
  const ran = page.waitForResponse(
    (response) =>
      response.url().includes("/runs") &&
      response.request().method() === "POST",
  );
  await page.getByRole("button", { name: "実行" }).click();
  expect((await ran).ok()).toBeTruthy();
  await page.getByRole("button", { name: "ログ", exact: true }).click();
  await expect(
    page.getByRole("link", { name: /Grok 4.6/ }).first(),
  ).toBeVisible();
  await expect(page.getByText("$0.000228")).toBeVisible();
  await expect(page.getByText(/あなたは親切なアシスタントです/)).toHaveCount(0);
  await page.screenshot({
    path: path.join(outputDir, "prompt-logs.png"),
    fullPage: true,
  });
  await page
    .getByRole("link", { name: /Grok 4.6/ })
    .first()
    .click();
  await expect(page.getByLabel("出力")).toHaveText("stub-output");
});

test("keeps the home heading while switching projects", async ({ page }) => {
  await page.goto("/");
  const heading = page.getByRole("heading", { name: "プロンプト", level: 1 });
  await expect(heading).toBeVisible();
  await expect(
    page.getByRole("main").getByRole("button", { name: "新規作成" }),
  ).toBeVisible();

  const switcher = page.getByLabel("プロジェクト");
  const current = await switcher.inputValue();
  const labels = await switcher.locator("option").allTextContents();
  const next = labels.find((label) => label !== current);
  if (next) {
    await switcher.selectOption({ label: next });
  }

  await expect(heading).toBeVisible();
  await expect(
    page.getByRole("main").getByRole("button", { name: "新規作成" }),
  ).toBeVisible();
});
