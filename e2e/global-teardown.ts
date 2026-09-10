import type { FullConfig } from "@playwright/test";

export default async function globalTeardown(config: FullConfig) {
  const baseURL = config.projects[0]?.use.baseURL ?? "http://127.0.0.1:3000";

  try {
    const response = await fetch(new URL("/api/dev/reset-demo", baseURL), {
      method: "POST",
    });
    if (!response.ok) {
      console.warn(`e2e demo reset returned ${response.status}`);
    }
  } catch (error) {
    console.warn("e2e demo reset skipped", error);
  }
}
