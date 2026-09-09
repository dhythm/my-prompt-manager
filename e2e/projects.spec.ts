import { expect, test } from "@playwright/test";

test("creates a project and copies a prompt with version history", async ({
  page,
}) => {
  await page.goto("/projects");
  await expect(page.getByText("agent@local.test")).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "プロジェクト", level: 1 }),
  ).toBeVisible();
  await expect(page.locator('input[value="デフォルト"]')).toBeVisible();

  const development = `開発 ${Date.now()}`;
  const production = `本番 ${Date.now()}`;

  await page.getByPlaceholder("プロジェクト名").fill(development);
  await page.getByRole("button", { name: "プロジェクトを作成" }).click();
  await expect(page.locator(`input[value="${development}"]`)).toBeVisible();

  await page.getByPlaceholder("プロジェクト名").fill(production);
  await page.getByRole("button", { name: "プロジェクトを作成" }).click();
  await expect(page.locator(`input[value="${production}"]`)).toBeVisible();

  await page.getByLabel("プロジェクト").selectOption({ label: development });
  await page.getByRole("button", { name: "新規作成" }).click();
  await expect(page.getByLabel("プロンプト名")).toBeVisible();

  await page.getByLabel("プロンプト名").fill("Greeting");
  await page.getByLabel("ユーザープロンプト").fill("Say hello");
  await page.getByRole("button", { name: "バージョンを保存" }).click();
  await expect(page.getByText("バージョン 2")).toBeVisible();

  await page.getByLabel("コピー先").selectOption({ label: production });
  await page.getByRole("button", { name: "プロジェクトへコピー" }).click();
  await expect(page.getByLabel("プロンプト名")).toHaveValue("Greeting");
  await expect(page.getByText("バージョン 2")).toBeVisible();

  await page.getByRole("button", { name: "履歴" }).click();
  await expect(page.getByText("作成", { exact: true })).toBeVisible();
  await expect(page.getByText("更新", { exact: true })).toBeVisible();

  await page.getByLabel("プロジェクト").selectOption({ label: production });
  await expect(page.getByRole("link", { name: /Greeting/ })).toBeVisible();

  await page.getByLabel("プロジェクト").selectOption({ label: development });
  await expect(page.getByRole("link", { name: /Greeting/ })).toHaveCount(1);
});
