import { expect, test } from "@playwright/test";

test("creates a prompt with system and user messages", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: "New prompt" }).click();
  await expect(page.getByLabel("Prompt title")).toBeVisible();
  await expect(page.getByLabel("System prompt")).toBeVisible();
  await expect(page.getByLabel("User prompt")).toBeVisible();

  await page.getByLabel("Prompt title").fill("Greeting");
  await page.getByLabel("User prompt").fill("Say hello");
  await page.getByRole("button", { name: "Save version" }).click();
  await expect(page.getByText("Version 2")).toBeVisible();

  await page.getByRole("button", { name: "History" }).click();
  await expect(page.getByText("Created")).toBeVisible();

  await page.getByRole("button", { name: "Editor" }).click();
  await page.getByRole("button", { name: "Record run" }).click();
  await page.getByRole("button", { name: "Logs" }).click();
  await expect(page.getByText(/Recorded gpt-4.1 run/)).toBeVisible();
});
