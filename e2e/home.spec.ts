import path from "node:path";
import { expect, test } from "@playwright/test";

const outputDir = path.join("e2e", "output");

test("home page renders and can be screenshotted", async ({ page }) => {
  await page.goto("/");
  await expect(
    page.getByRole("heading", { name: "Prompt Manager" }),
  ).toBeVisible();
  await expect(page.getByRole("textbox", { name: "Title" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Save prompt" })).toBeVisible();

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
});
