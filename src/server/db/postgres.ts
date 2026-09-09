import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";

export function createPostgresDatabase(url: string) {
  const client = postgres(url, {
    max: 10,
    prepare: false,
  });

  return drizzle({ client });
}
