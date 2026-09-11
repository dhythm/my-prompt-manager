import { dummyDemoResetAllowed } from "@/server/auth/env";

export function isPgliteDemo(
  env: Record<string, string | undefined> = process.env,
): boolean {
  return dummyDemoResetAllowed(env);
}
