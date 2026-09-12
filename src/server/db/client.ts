import {
  DUMMY_DEFAULT_USER_ID,
  ensureDummyUsers,
} from "@/server/auth/dummy/users";
import { resolveAuthConfig } from "@/server/auth/env";
import { isPgliteDemo } from "@/server/dummy/demo";
import { resetAndSeed } from "@/server/dummy/reset";
import { backfillPromptOwnership } from "@/server/prompts/backfill";
import { resolveDatabaseConfig } from "./env";
import { createPgliteDatabase } from "./pglite";
import { createPostgresDatabase } from "./postgres";
import type { AppDatabase } from "./types";

export type { AppDatabase };

const globalForDb = globalThis as typeof globalThis & {
  __promptManagerDb?: Promise<AppDatabase>;
};

async function createDatabase(
  env: Record<string, string | undefined> = process.env,
): Promise<AppDatabase> {
  const config = resolveDatabaseConfig(env);
  const db =
    config.driver === "pglite"
      ? await createPgliteDatabase(config.dataDir)
      : createPostgresDatabase(config.url);

  if (resolveAuthConfig(env).provider === "dummy") {
    await ensureDummyUsers(db);
    await backfillPromptOwnership(db);
  }
  if (isPgliteDemo(env)) {
    await resetAndSeed(db, DUMMY_DEFAULT_USER_ID);
  }

  return db;
}

export function getDb(): Promise<AppDatabase> {
  globalForDb.__promptManagerDb ??= createDatabase().catch((error) => {
    globalForDb.__promptManagerDb = undefined;
    throw error;
  });
  return globalForDb.__promptManagerDb;
}
