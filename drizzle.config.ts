import { defineConfig } from "drizzle-kit";
import { resolveDatabaseConfig } from "./src/server/db/env";

const database = resolveDatabaseConfig(process.env);

export default defineConfig({
  dialect: "postgresql",
  schema: "./src/server/db/schema.ts",
  out: "./drizzle",
  ...(database.driver === "pglite"
    ? {
        driver: "pglite" as const,
        dbCredentials: {
          url: database.dataDir ?? ":memory:",
        },
      }
    : {
        dbCredentials: {
          url: database.url,
        },
      }),
});
