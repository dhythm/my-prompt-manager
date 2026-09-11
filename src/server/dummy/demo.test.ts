import { describe, expect, it } from "vitest";
import { isPgliteDemo } from "./demo";

describe("isPgliteDemo", () => {
  it("is on for the default local PGlite + dummy sandbox", () => {
    expect(isPgliteDemo({})).toBe(true);
  });

  it("stays on when PGlite is forced even if DATABASE_URL is set", () => {
    expect(
      isPgliteDemo({
        DATABASE_DRIVER: "pglite",
        DATABASE_URL: "postgresql://user:pass@localhost:5432/app",
      }),
    ).toBe(true);
  });

  it("is off for Neon, Supabase, or Docker Postgres", () => {
    expect(
      isPgliteDemo({
        DATABASE_URL: "postgresql://user:pass@localhost:5432/app",
      }),
    ).toBe(false);
    expect(
      isPgliteDemo({
        DATABASE_DRIVER: "postgres",
        DATABASE_URL: "postgres://user:pass@localhost:5432/app",
      }),
    ).toBe(false);
  });

  it("is off when Clerk is the auth provider", () => {
    expect(
      isPgliteDemo({
        AUTH_PROVIDER: "clerk",
        NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: "pk_test_x",
        CLERK_SECRET_KEY: "sk_test_x",
      }),
    ).toBe(false);
  });
});
