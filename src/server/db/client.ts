import { ensureDummyUsers } from "@/server/auth/dummy/users";
import { resolveAuthConfig } from "@/server/auth/env";
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
