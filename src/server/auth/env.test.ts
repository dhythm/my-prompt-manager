import { describe, expect, it } from "vitest";
import { dummyDemoResetAllowed, resolveAuthConfig } from "./env";

describe("resolveAuthConfig", () => {
  it("defaults to dummy auth without Clerk keys", () => {
    expect(resolveAuthConfig({})).toEqual({
      provider: "dummy",
      secret: "dummy-auth-secret-not-for-production",
      autoSignIn: true,
    });
  });

  it("keeps dummy even when Clerk keys exist unless AUTH_PROVIDER is clerk", () => {
    expect(
      resolveAuthConfig({
        NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: "pk_test_x",
        CLERK_SECRET_KEY: "sk_test_x",
      }),
    ).toMatchObject({ provider: "dummy" });
  });

  it("uses AUTH_SECRET and can disable dummy auto sign-in", () => {
    expect(
      resolveAuthConfig({
        AUTH_PROVIDER: "dummy",
        AUTH_SECRET: "local-secret",
        AUTH_DUMMY_AUTO_SIGN_IN: "false",
      }),
    ).toEqual({
      provider: "dummy",
      secret: "local-secret",
      autoSignIn: false,
    });
  });

  it("allows dummy demo reset only for dummy auth", () => {
    expect(dummyDemoResetAllowed({})).toBe(true);
    expect(
      dummyDemoResetAllowed({
        AUTH_PROVIDER: "clerk",
        NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: "pk_test_x",
        CLERK_SECRET_KEY: "sk_test_x",
      }),
    ).toBe(false);
  });

  it("requires Clerk keys when AUTH_PROVIDER is clerk", () => {
    expect(() => resolveAuthConfig({ AUTH_PROVIDER: "clerk" })).toThrowError(
      /CLERK_SECRET_KEY and NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY are required/,
    );
  });

  it("accepts clerk when both keys are present", () => {
    expect(
      resolveAuthConfig({
        AUTH_PROVIDER: "clerk",
        NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: "pk_test_x",
        CLERK_SECRET_KEY: "sk_test_x",
      }),
    ).toEqual({
      provider: "clerk",
      publishableKey: "pk_test_x",
      secretKey: "sk_test_x",
    });
  });

  it("rejects an unsupported AUTH_PROVIDER", () => {
    expect(() => resolveAuthConfig({ AUTH_PROVIDER: "auth0" })).toThrowError(
      /Unsupported AUTH_PROVIDER: auth0/,
    );
  });
});
