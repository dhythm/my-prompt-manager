import fs from "node:fs";
import path from "node:path";
import { PGlite } from "@electric-sql/pglite";
import { drizzle } from "drizzle-orm/pglite";
import { migrate } from "drizzle-orm/pglite/migrator";

const migrationsFolder = path.join(process.cwd(), "drizzle");

export async function createPgliteDatabase(dataDir?: string) {
  if (dataDir) {
    fs.mkdirSync(dataDir, { recursive: true });
  }

  const client = dataDir ? new PGlite(dataDir) : new PGlite();
  const db = drizzle({ client });
  const result = await migrate(db, { migrationsFolder });

  if (result && "exitCode" in result) {
    throw new Error(`Failed to migrate PGlite database: ${result.exitCode}`);
  }

  return db;
}
