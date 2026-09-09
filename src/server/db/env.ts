type DatabaseDriver = "pglite" | "postgres";

export type DatabaseConfig =
  | {
      driver: "pglite";
      dataDir: string | undefined;
    }
  | {
      driver: "postgres";
      url: string;
    };

type Env = Record<string, string | undefined>;

export function resolveDatabaseConfig(env: Env): DatabaseConfig {
  const driver = resolveDriver(env);

  if (driver === "pglite") {
    const dataDir = emptyToUndefined(env.PGLITE_DATA_DIR);
    return {
      driver,
      dataDir: dataDir === ":memory:" ? undefined : (dataDir ?? ".data/pglite"),
    };
  }

  const url = emptyToUndefined(env.DATABASE_URL);
  if (!url) {
    throw new Error("DATABASE_URL is required when using the postgres driver");
  }

  return { driver, url };
}

function resolveDriver(env: Env): DatabaseDriver {
  const explicit = emptyToUndefined(env.DATABASE_DRIVER);
  if (explicit) {
    if (explicit === "pglite" || explicit === "postgres") {
      return explicit;
    }
    throw new Error(
      `Unsupported DATABASE_DRIVER: ${explicit}. Use "pglite" or "postgres".`,
    );
  }

  const url = emptyToUndefined(env.DATABASE_URL);
  if (url?.startsWith("postgres://") || url?.startsWith("postgresql://")) {
    return "postgres";
  }

  return "pglite";
}

function emptyToUndefined(value: string | undefined): string | undefined {
  if (!value || value.trim() === "") {
    return undefined;
  }
  return value;
}
