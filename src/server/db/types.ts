import type { PgliteDatabase } from "drizzle-orm/pglite";
import type { PostgresJsDatabase } from "drizzle-orm/postgres-js";

export type AppDatabase = PgliteDatabase | PostgresJsDatabase;
