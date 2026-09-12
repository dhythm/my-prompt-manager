import { spawnSync } from "node:child_process";
import { loadEnvConfig } from "@next/env";

loadEnvConfig(process.cwd());

const postgresEnv = {
  ...process.env,
  DATABASE_DRIVER: "postgres",
};

function run(command: string, args: string[]) {
  const result = spawnSync(command, args, {
    stdio: "inherit",
    env: postgresEnv,
  });
  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }
}

run("docker", ["compose", "up", "-d", "--wait"]);
run("pnpm", ["db:migrate"]);
run("pnpm", ["exec", "next", "dev"]);
