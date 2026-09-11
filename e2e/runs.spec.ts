import { expect, test } from "@playwright/test";

test("filters workspace logs by prompt and model", async ({ page }) => {
  const title = `Filter ${Date.now()}`;
  await page.goto("/");
  await page
    .getByRole("complementary")
    .getByRole("button", { name: "新規作成" })
    .click();
  await page.getByLabel("プロンプト名").fill(title);
  await page.getByLabel("ユーザープロンプト").fill("Say hello");
  await page.getByLabel("モデル").selectOption({ label: "Grok 4.6" });
  await page.getByRole("button", { name: "バージョンを保存" }).click();
  await expect(page.getByText("バージョン 2")).toBeVisible();
  const ran = page.waitForResponse(
    (response) =>
      response.url().includes("/runs") &&
      response.request().method() === "POST",
  );
  await page.getByRole("button", { name: "実行" }).click();
  expect((await ran).ok()).toBeTruthy();

  await page.getByRole("link", { name: "ログ" }).click();
  await expect(
    page.getByRole("heading", { name: "ログ", level: 1 }),
  ).toBeVisible();
  await page.getByLabel("プロンプト名").selectOption({ label: title });
  await expect(
    page.getByRole("main").getByRole("link", { name: title }),
  ).toBeVisible();
  await expect(
    page.getByRole("main").getByRole("link", { name: /編集/ }),
  ).toBeVisible();
  await expect(
    page.getByRole("main").getByRole("link", { name: /Greeting/ }),
  ).toHaveCount(0);

  await page.getByLabel("モデル").selectOption({ label: "GPT-5.6 Sol" });
  await expect(page.getByText("実行ログはまだありません")).toBeVisible();
});

test("keeps heading and filters visible while the log list loads", async ({
  page,
}) => {
  await page.goto("/runs");
  await expect(
    page.getByRole("heading", { name: "ログ", level: 1 }),
  ).toBeVisible();
  await expect(page.getByLabel("プロンプト名")).toBeVisible();
  await expect(page.getByLabel("モデル")).toBeVisible();

  await page.route("**/api/runs**", async (route) => {
    if (route.request().method() !== "GET") {
      await route.continue();
      return;
    }
    const url = new URL(route.request().url());
    if (!url.searchParams.get("model")) {
      await route.continue();
      return;
    }
    await new Promise((resolve) => setTimeout(resolve, 2000));
    await route.continue();
  });

  await page.getByLabel("モデル").selectOption({ label: "Grok 4.6" });

  await expect(
    page.getByRole("heading", { name: "ログ", level: 1 }),
  ).toBeVisible();
  await expect(page.getByLabel("プロンプト名")).toBeVisible();
  await expect(page.getByLabel("モデル")).toBeVisible();
  await expect(page.getByLabel("モデル")).toHaveValue("grok-4.6");
  await expect(page.getByRole("status")).toHaveText("読み込み中...");
});
