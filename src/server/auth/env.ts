export type AuthConfig =
  | {
      provider: "dummy";
      secret: string;
      autoSignIn: boolean;
    }
  | {
      provider: "clerk";
      publishableKey: string;
      secretKey: string;
    };

type Env = Record<string, string | undefined>;

const DUMMY_SECRET = "dummy-auth-secret-not-for-production";

export function resolveAuthConfig(env: Env): AuthConfig {
  const provider = resolveProvider(env);

  if (provider === "dummy") {
    return {
      provider,
      secret: emptyToUndefined(env.AUTH_SECRET) ?? DUMMY_SECRET,
      autoSignIn: env.AUTH_DUMMY_AUTO_SIGN_IN !== "false",
    };
  }

  const publishableKey = emptyToUndefined(
    env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY,
  );
  const secretKey = emptyToUndefined(env.CLERK_SECRET_KEY);
  if (!publishableKey || !secretKey) {
    throw new Error(
      "CLERK_SECRET_KEY and NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY are required when AUTH_PROVIDER=clerk",
    );
  }

  return { provider, publishableKey, secretKey };
}

function resolveProvider(env: Env): AuthConfig["provider"] {
  const explicit = emptyToUndefined(env.AUTH_PROVIDER);
  if (!explicit) {
    return "dummy";
  }
  if (explicit === "dummy" || explicit === "clerk") {
    return explicit;
  }
  throw new Error(
    `Unsupported AUTH_PROVIDER: ${explicit}. Use "dummy" or "clerk".`,
  );
}

function emptyToUndefined(value: string | undefined): string | undefined {
  if (!value || value.trim() === "") {
    return undefined;
  }
  return value;
}
