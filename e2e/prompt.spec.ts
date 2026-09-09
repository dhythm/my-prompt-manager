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

const systemV2 = [
  "You are a helpful writing coach.",
  "Keep answers short.",
  "Use plain language.",
  "Do not invent citations.",
].join("\n");

const userV2 = [
  "Rewrite this email.",
  "",
  "Hi team,",
  "The launch is delayed.",
  "Please wait.",
].join("\n");

const systemV3 = [
  "You are a strict writing coach.",
  "Keep answers short.",
  "Prefer concrete examples.",
  "Do not invent citations.",
  "Ask one follow-up question.",
].join("\n");

const userV3 = [
  "Rewrite this email in a calmer tone.",
  "",
  "Hi team,",
  "The launch moved to Friday.",
  "Please wait for the new date.",
  "Thanks.",
].join("\n");

const assistantV3 = [
  "Sure — here is a calmer draft.",
  "Hi team, the launch is now Friday.",
  "I will send the new timeline today.",
].join("\n");

test("compares versions with a colored line diff", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: "新規作成" }).click();
  await page.getByLabel("プロンプト名").fill("Greeting");
  await page.getByLabel("システムプロンプト").fill(systemV2);
  await page.getByLabel("ユーザープロンプト").fill(userV2);
  await page.getByRole("button", { name: "バージョンを保存" }).click();
  await expect(page.getByText("バージョン 2")).toBeVisible();

  await page.getByLabel("システムプロンプト").fill(systemV3);
  await page.getByLabel("ユーザープロンプト").fill(userV3);
  await page.getByRole("button", { name: "メッセージを追加" }).click();
  await page.getByRole("combobox", { name: "役割" }).nth(2).selectOption({
    label: "アシスタント",
  });
  await page.getByLabel("アシスタントプロンプト").fill(assistantV3);
  await page.getByRole("button", { name: "バージョンを保存" }).click();
  await expect(page.getByText("バージョン 3")).toBeVisible();

  await page.getByRole("button", { name: "履歴" }).click();
  await expect(
    page.getByRole("button", { name: "バージョン 3" }),
  ).toBeVisible();
  await expect(page.getByLabel("比較先")).toHaveValue("3");
  await expect(page.getByLabel("比較元")).toHaveValue("2");
  const removed = page.locator('[data-diff-type="remove"]');
  const added = page.locator('[data-diff-type="add"]');
  await expect(
    removed.filter({ hasText: "You are a helpful writing coach." }),
  ).toBeVisible();
  await expect(
    removed.filter({ hasText: "Use plain language." }),
  ).toBeVisible();
  await expect(
    removed.filter({ hasText: "The launch is delayed." }),
  ).toBeVisible();
  await expect(
    added.filter({ hasText: "You are a strict writing coach." }),
  ).toBeVisible();
  await expect(
    added.filter({ hasText: "Prefer concrete examples." }),
  ).toBeVisible();
  await expect(
    added.filter({ hasText: "The launch moved to Friday." }),
  ).toBeVisible();
  await expect(
    added.filter({ hasText: "Sure — here is a calmer draft." }),
  ).toBeVisible();
  await expect(page.getByText("追加", { exact: true })).toBeVisible();

  await page.screenshot({
    path: "e2e/output/prompt-history-diff.png",
    fullPage: true,
  });

  await page.getByRole("button", { name: "バージョン 1" }).click();
  await expect(page.getByLabel("比較元")).toHaveValue("");
  await page.getByRole("button", { name: "編集に読み込む" }).click();
  await expect(page.getByLabel("ユーザープロンプト")).toHaveValue("");
});
