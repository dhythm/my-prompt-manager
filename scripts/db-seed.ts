import { loadEnvConfig } from "@next/env";
import { runDbSeed } from "../src/server/dummy/seed-cli";

async function main() {
  loadEnvConfig(process.cwd());
  const reset = process.argv.includes("--reset");
  const result = await runDbSeed({ env: process.env, reset });
  if (result.status === "skipped") {
    console.error(
      "Catalog is not empty. Use pnpm db:seed:reset to replace it.",
    );
    process.exit(1);
  }
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
