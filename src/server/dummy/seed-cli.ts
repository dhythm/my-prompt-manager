import { DUMMY_DEFAULT_USER_ID } from "@/server/auth/dummy/users";
import { resolveAuthConfig } from "@/server/auth/env";
import { resolveDatabaseConfig } from "@/server/db/env";
import { createPgliteDatabase } from "@/server/db/pglite";
import { createPostgresDatabase } from "@/server/db/postgres";
import type { AppDatabase } from "@/server/db/types";
import { resetAndSeed, seedIfEmpty } from "@/server/dummy/reset";

type SeedStatus = { status: "seeded" | "skipped" | "reset" };

export async function runDbSeed(input: {
  env: Record<string, string | undefined>;
  reset: boolean;
  db?: AppDatabase;
}): Promise<SeedStatus> {
  if (resolveAuthConfig(input.env).provider !== "dummy") {
    throw new Error("db:seed is only allowed with dummy auth");
  }

  const db = input.db ?? (await openDedicatedDatabase(input.env));
  const shouldClose = input.db === undefined;

  try {
    if (input.reset) {
      await resetAndSeed(db, DUMMY_DEFAULT_USER_ID);
      return { status: "reset" };
    }
    const result = await seedIfEmpty(db, DUMMY_DEFAULT_USER_ID);
    return { status: result.seeded ? "seeded" : "skipped" };
  } finally {
    if (shouldClose) {
      await closeDedicatedDatabase(db);
    }
  }
}

async function openDedicatedDatabase(
  env: Record<string, string | undefined>,
): Promise<AppDatabase> {
  const config = resolveDatabaseConfig(env);
  if (config.driver === "pglite") {
    return createPgliteDatabase(config.dataDir);
  }
  return createPostgresDatabase(config.url);
}

async function closeDedicatedDatabase(db: AppDatabase) {
  const client = db.$client as {
    close?: () => Promise<void>;
    end?: () => Promise<void>;
  };
  if (typeof client.close === "function") {
    await client.close();
    return;
  }
  if (typeof client.end === "function") {
    await client.end();
  }
}
