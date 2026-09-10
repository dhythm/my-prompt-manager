import type { Page } from "@playwright/test";

export async function chooseLabeledOption(
  page: Page,
  name: string,
  label: string,
) {
  await page.getByRole("combobox", { name }).click();
  await page.getByRole("option", { name: label, exact: true }).click();
}
