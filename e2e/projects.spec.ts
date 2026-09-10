import path from "node:path";
import { expect, type Page, test } from "@playwright/test";

const outputDir = path.join("e2e", "output");

test("creates a project and copies a prompt with version history", async ({
  page,
}) => {
  await page.goto("/projects");
  await expect(page.getByText("agent@local.test")).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "プロジェクト", level: 1 }),
  ).toBeVisible();
  await expect(page.getByPlaceholder("プロジェクト名")).toBeVisible();

  const development = `開発 ${Date.now()}`;
  const production = `本番 ${Date.now()}`;

  await createProject(page, development);
  await createProject(page, production);
  await page.screenshot({
    path: path.join(outputDir, "projects-page.png"),
    fullPage: true,
  });

  await page.getByLabel("ワークスペース").selectOption({ label: "個人" });
  await page.getByLabel("プロジェクト").selectOption({ label: development });
  await page
    .getByRole("complementary")
    .getByRole("button", { name: "新規作成" })
    .click();
  await expect(page.getByLabel("プロンプト名")).toBeVisible();

  await page.getByLabel("プロンプト名").fill("Greeting");
  await page.getByLabel("ユーザープロンプト").fill("Say hello");
  await page.getByRole("button", { name: "バージョンを保存" }).click();
  await expect(page.getByText("バージョン 2")).toBeVisible();

  const copyTarget = page.getByLabel("コピー先");
  await copyTarget.selectOption({ label: production });
  await expect(copyTarget.locator("option:checked")).toHaveText(production);

  const copied = page.waitForResponse(
    (response) =>
      response.url().includes("/copy") &&
      response.request().method() === "POST",
  );
  await page.getByRole("button", { name: "プロジェクトへコピー" }).click();
  const copyResponse = await copied;
  expect(copyResponse.ok()).toBeTruthy();
  const payload = (await copyResponse.json()) as { prompt: { id: string } };
  await expect(page).toHaveURL(new RegExp(`/prompts/${payload.prompt.id}`));
  await expect(page.getByLabel("プロンプト名")).toHaveValue("Greeting");
  await expect(page.getByText("バージョン 2")).toBeVisible();

  await page.getByRole("button", { name: "履歴" }).click();
  await expect(page.locator("ol").getByText("バージョン 1")).toBeVisible();
  await expect(page.locator("ol").getByText("バージョン 2")).toBeVisible();
  await expect(page.getByText("作成", { exact: true })).toBeVisible();
  await expect(page.getByText("更新", { exact: true })).toBeVisible();
  await page.screenshot({
    path: path.join(outputDir, "prompt-copied-history.png"),
    fullPage: true,
  });

  await page.getByRole("link", { name: "プロンプト", exact: true }).click();
  await page.getByLabel("ワークスペース").selectOption({ label: "個人" });
  await page.getByLabel("プロジェクト").selectOption({ label: production });
  await expect(
    page.getByRole("main").getByRole("link", { name: /Greeting/ }),
  ).toBeVisible();

  await page.getByLabel("プロジェクト").selectOption({ label: development });
  await expect(
    page.getByRole("main").getByRole("link", { name: /Greeting/ }),
  ).toHaveCount(1);
});

async function createProject(page: Page, name: string) {
  const nameField = page.getByPlaceholder("プロジェクト名");
  await expect(nameField).toHaveValue("");
  await nameField.fill(name);
  const created = page.waitForResponse(
    (response) =>
      response.url().includes("/api/projects") &&
      response.request().method() === "POST",
  );
  await page.getByRole("button", { name: "プロジェクトを作成" }).click();
  expect((await created).ok()).toBeTruthy();
  await expect(page.locator(`input[value="${name}"]`)).toBeVisible();
  await expect(nameField).toHaveValue("");
}
