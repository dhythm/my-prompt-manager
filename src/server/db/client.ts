import type { PgliteDatabase } from "drizzle-orm/pglite";
import type { PostgresJsDatabase } from "drizzle-orm/postgres-js";
import { resolveDatabaseConfig } from "./env";
import { createPgliteDatabase } from "./pglite";
import { createPostgresDatabase } from "./postgres";

export type AppDatabase = PgliteDatabase | PostgresJsDatabase;

const globalForDb = globalThis as typeof globalThis & {
  __promptManagerDb?: Promise<AppDatabase>;
};

async function createDatabase(
  env: Record<string, string | undefined> = process.env,
): Promise<AppDatabase> {
  const config = resolveDatabaseConfig(env);

  if (config.driver === "pglite") {
    return createPgliteDatabase(config.dataDir);
  }

  return createPostgresDatabase(config.url);
}

export function getDb(): Promise<AppDatabase> {
  globalForDb.__promptManagerDb ??= createDatabase().catch((error) => {
    globalForDb.__promptManagerDb = undefined;
    throw error;
  });
  return globalForDb.__promptManagerDb;
}
