import { expect, test } from "@playwright/test";

test("keeps the sidebar in view while the main pane scrolls", async ({
  page,
}) => {
  await page.goto("/");
  await expect(
    page.getByRole("heading", { name: "プロンプト", level: 1 }),
  ).toBeVisible();

  await page.getByRole("main").evaluate((main) => {
    main.style.minHeight = "4000px";
    const scroller = main.parentElement;
    if (scroller instanceof HTMLElement) {
      scroller.scrollTop = 1500;
    }
    window.scrollTo(0, 1500);
  });

  await expect(
    page.getByRole("heading", { name: "プロンプト", level: 1 }),
  ).not.toBeInViewport();
  await expect(
    page.getByRole("complementary").getByRole("link", { name: "プロンプト" }),
  ).toBeInViewport();
  await expect(
    page.getByRole("complementary").getByRole("button", { name: "新規作成" }),
  ).toBeInViewport();
});

test("does not list prompts in the sidebar", async ({ page }) => {
  await page.goto("/");
  await expect(
    page.getByRole("heading", { name: "プロンプト", level: 1 }),
  ).toBeVisible();

  await page
    .getByRole("complementary")
    .getByRole("button", { name: "新規作成" })
    .click();
  await expect(page.getByLabel("プロンプト名")).toBeVisible();

  await page.getByRole("link", { name: "プロンプト", exact: true }).click();
  await expect(
    page.getByRole("main").getByRole("link", { name: /無題/ }).first(),
  ).toBeVisible();

  const sidebar = page.getByRole("complementary");
  await expect(sidebar.getByText("ライブラリ")).toHaveCount(0);
  await expect(sidebar.getByRole("link", { name: /無題/ })).toHaveCount(0);
});
