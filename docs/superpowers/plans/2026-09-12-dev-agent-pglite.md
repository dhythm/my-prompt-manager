# Docker `dev` vs PGlite `dev:agent` Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Split human `pnpm dev` onto Docker Postgres (no auto-seed) and agent/CI `pnpm dev:agent` onto PGlite that full-resets and seeds on process start.

**Architecture:** Two npm scripts choose the driver. PGlite demo `getDb()` and `/api/dev/reset-demo` share `resetAndSeed`. Docker seeding is a dedicated CLI (`seedIfEmpty` / `--reset`) that opens its own connection and never calls `getDb()`. Leftover-name cleanup is deleted.

**Tech Stack:** Next.js 16, Drizzle, PGlite, postgres.js, Docker Compose, Vitest, Playwright, tsx.

**Spec:** `docs/superpowers/specs/2026-09-12-dev-agent-pglite-design.md`

**Skills:** @superpowers:test-driven-development @superpowers:subagent-driven-development

---

## File map

| File | Responsibility |
| --- | --- |
| Create: `src/server/dummy/reset.ts` | `resetAndSeed`, `seedIfEmpty`, catalog table wipe |
| Create: `src/server/dummy/reset.test.ts` | Unit tests for wipe / empty-only seed |
| Create: `src/server/dummy/seed-cli.ts` | Dummy-auth guard + dedicated DB connection for CLI |
| Create: `src/server/dummy/seed-cli.test.ts` | Clerk refusal, skipped vs seeded vs reset |
| Create: `scripts/db-seed.ts` | Thin argv entry; relative import of `seed-cli` |
| Create: `scripts/dev.ts` | `docker compose up --wait` → migrate → `next dev` with postgres env |
| Modify: `src/server/prompts/seed-samples.ts` | Insert catalog only (no leftover deletion) |
| Modify: `src/server/prompts/samples.ts` | Remove `leftoverPromptTitles` |
| Modify: `src/server/prompts/samples.test.ts` | Keep catalog-content tests; drop leftover-name tests |
| Modify: `src/server/db/client.ts` | PGlite demo calls `resetAndSeed` |
| Modify: `src/app/api/dev/reset-demo/route.ts` | Call `resetAndSeed` |
| Modify: `package.json` | Scripts + `tsx` + `tsconfig-paths` |
| Modify: `tsconfig.json` | `compilerOptions.baseUrl: "."` so tsconfig-paths resolves `@/` |
| Modify: `playwright.config.ts` | `webServer.command` = `pnpm dev:agent` |
| Modify: `.env.example` | Local Docker as human default |
| Modify: `README.md`, `AGENTS.md` | Command split and seed docs |
| Delete: `src/server/dummy/cleanup.ts`, `leftovers.ts`, `leftovers.test.ts` | Leftover-name heuristics |

Do not change sample catalog content, dummy user ids, or Clerk production paths.

---

### Task 1: `resetAndSeed`

**Files:**
- Create: `src/server/dummy/reset.test.ts`
- Create: `src/server/dummy/reset.ts`
- Modify: none yet (`ensureSamplePrompts` is still leftover-based; wipe-then-insert still yields a clean catalog)

- [ ] **Step 1: Write the failing tests**

```ts
import { afterEach, describe, expect, it } from "vitest";
import {
  DUMMY_DEFAULT_USER_ID,
  dummyUsers,
  ensureDummyUsers,
  listDummyUsers,
} from "@/server/auth/dummy/users";
import { createPgliteDatabase } from "@/server/db/pglite";
import { createPrompt, listPrompts } from "@/server/prompts/repository";
import { listWorkspaceRuns } from "@/server/prompts/runs";
import { samplePromptCatalog } from "@/server/prompts/samples";
import { createTeam, listTeams } from "@/server/teams/repository";
import { resetAndSeed } from "./reset";

describe("resetAndSeed", () => {
  const databases: Array<{ close: () => Promise<void> }> = [];

  afterEach(async () => {
    await Promise.all(databases.splice(0).map((database) => database.close()));
  });

  it("wipes arbitrary catalog rows and restores sample ids", async () => {
    const db = await openDatabase();
    const team = await createTeam(db, DUMMY_DEFAULT_USER_ID, {
      name: "Ad hoc QA",
    });
    await createPrompt(db, DUMMY_DEFAULT_USER_ID, {
      title: "Scratch pad",
      body: "do not keep",
      teamId: team.id,
    });

    await resetAndSeed(db, DUMMY_DEFAULT_USER_ID);

    await expect(listTeams(db, DUMMY_DEFAULT_USER_ID)).resolves.toEqual([]);
    const listed = await listPrompts(db, DUMMY_DEFAULT_USER_ID);
    expect(listed.map((prompt) => prompt.id)).toEqual(
      samplePromptCatalog.map((sample) => sample.id),
    );
    expect(listed.map((prompt) => prompt.title)).toEqual(
      samplePromptCatalog.map((sample) => sample.title),
    );
    expect(listed.map((prompt) => prompt.title)).not.toContain("Scratch pad");

    const emails = (await listDummyUsers(db)).map((user) => user.email);
    expect(emails).toEqual(dummyUsers.map((user) => user.email));
  });

  it("is idempotent on prompt and run ids", async () => {
    const db = await openDatabase();
    await resetAndSeed(db, DUMMY_DEFAULT_USER_ID);
    await resetAndSeed(db, DUMMY_DEFAULT_USER_ID);

    const listed = await listPrompts(db, DUMMY_DEFAULT_USER_ID);
    expect(listed.map((prompt) => prompt.id)).toEqual(
      samplePromptCatalog.map((sample) => sample.id),
    );

    const workspace = await listWorkspaceRuns(db, DUMMY_DEFAULT_USER_ID, {
      limit: 50,
    });
    expect(workspace.runs.map((run) => run.id).sort()).toEqual(
      samplePromptCatalog
        .flatMap((sample) => sample.runs.map((run) => run.id))
        .sort(),
    );
  });

  async function openDatabase() {
    const db = await createPgliteDatabase();
    await ensureDummyUsers(db);
    databases.push({ close: () => db.$client.close() });
    return db;
  }
});
```

`createPrompt` already accepts `teamId` (see existing leftover tests). Do not assert default project UUIDs or `createdAt`.

- [ ] **Step 2: Run tests to verify they fail**

Run: `pnpm exec vitest run src/server/dummy/reset.test.ts`

Expected: FAIL — `resetAndSeed` is not exported.

- [ ] **Step 3: Implement `resetAndSeed`**

```ts
import {
  DUMMY_DEFAULT_USER_ID,
  ensureDummyUsers,
} from "@/server/auth/dummy/users";
import {
  projects,
  promptMessages,
  promptRuns,
  prompts,
  promptVersions,
  teamInvites,
  teamMembers,
  teams,
} from "@/server/db/schema";
import type { AppDatabase } from "@/server/db/types";
import { ensureSamplePrompts } from "@/server/prompts/seed-samples";

export async function resetAndSeed(
  db: AppDatabase,
  userId: string = DUMMY_DEFAULT_USER_ID,
) {
  await db.transaction(async (tx) => {
    const conn = tx as unknown as AppDatabase;
    await conn.delete(promptRuns);
    await conn.delete(promptMessages);
    await conn.delete(promptVersions);
    await conn.delete(prompts);
    await conn.delete(projects);
    await conn.delete(teamInvites);
    await conn.delete(teamMembers);
    await conn.delete(teams);
    await ensureDummyUsers(conn);
    await ensureSamplePrompts(conn, userId);
  });
}
```

Do not delete `users`. If the `AppDatabase` union makes `db.transaction` uncallable, cast `db` as well:

```ts
await (db as unknown as { transaction: Function }).transaction(async (tx: AppDatabase) => {
  ...
});
```

Prefer a typed helper over `Function` if a small local wrapper compiles.

- [ ] **Step 4: Run tests to verify they pass**

Run: `pnpm exec vitest run src/server/dummy/reset.test.ts`

Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/server/dummy/reset.ts src/server/dummy/reset.test.ts
git commit -m "feat: add resetAndSeed to wipe catalog and restore samples"
```

---

### Task 2: `seedIfEmpty`

**Files:**
- Modify: `src/server/dummy/reset.test.ts`
- Modify: `src/server/dummy/reset.ts`

- [ ] **Step 1: Write the failing tests** (append to `reset.test.ts`)

```ts
import { seedIfEmpty } from "./reset";

it("inserts the catalog when prompts are empty", async () => {
  const db = await openDatabase();
  const result = await seedIfEmpty(db, DUMMY_DEFAULT_USER_ID);
  expect(result).toEqual({ seeded: true });
  const listed = await listPrompts(db, DUMMY_DEFAULT_USER_ID);
  expect(listed.map((prompt) => prompt.id)).toEqual(
    samplePromptCatalog.map((sample) => sample.id),
  );
});

it("does not write when any prompt exists", async () => {
  const db = await openDatabase();
  const created = await createPrompt(db, DUMMY_DEFAULT_USER_ID, {
    title: "Keep me",
    body: "existing work",
  });

  const result = await seedIfEmpty(db, DUMMY_DEFAULT_USER_ID);
  expect(result).toEqual({ seeded: false });

  const listed = await listPrompts(db, DUMMY_DEFAULT_USER_ID);
  expect(listed).toHaveLength(1);
  expect(listed[0].id).toBe(created.id);
  expect(listed[0].title).toBe("Keep me");
});
```

Import `seedIfEmpty` next to `resetAndSeed`. Reuse `openDatabase`.

- [ ] **Step 2: Run tests to verify they fail**

Run: `pnpm exec vitest run src/server/dummy/reset.test.ts`

Expected: FAIL — `seedIfEmpty` is not exported.

- [ ] **Step 3: Implement `seedIfEmpty`**

```ts
export async function seedIfEmpty(
  db: AppDatabase,
  userId: string = DUMMY_DEFAULT_USER_ID,
) {
  const existing = await db.select({ id: prompts.id }).from(prompts).limit(1);
  if (existing.length > 0) {
    return { seeded: false as const };
  }
  await ensureDummyUsers(db);
  await ensureSamplePrompts(db, userId);
  return { seeded: true as const };
}
```

Empty means `prompts` has zero rows. Do not wipe teams.

- [ ] **Step 4: Run tests to verify they pass**

Run: `pnpm exec vitest run src/server/dummy/reset.test.ts`

Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/server/dummy/reset.ts src/server/dummy/reset.test.ts
git commit -m "feat: seed sample catalog only when prompts are empty"
```

---

### Task 3: Remove leftover-name heuristics

**Files:**
- Modify: `src/server/prompts/seed-samples.ts`
- Modify: `src/server/prompts/samples.ts`
- Modify: `src/server/prompts/samples.test.ts`
- Delete: `src/server/dummy/cleanup.ts`
- Delete: `src/server/dummy/leftovers.ts`
- Delete: `src/server/dummy/leftovers.test.ts`

- [ ] **Step 1: Retarget catalog tests and drop leftover-only tests**

In `samples.test.ts`:

- Keep "seeds a small playground catalog" and "seeds playground and api runs".
- Change those tests to call `resetAndSeed` instead of `ensureSamplePrompts` (idempotent path is now wipe+insert; insert-only must not run twice or sample UUIDs collide).
- Delete the examples `"is idempotent and removes leftover e2e titles"` and `"removes leftover e2e workspaces"` (covered by Task 1 with arbitrary names).
- Drop unused imports (`createPrompt`, `createTeam`, `listTeams`, `listProjects`, leftover titles).

- [ ] **Step 2: Run tests — leftover tests gone, catalog tests still pass via `resetAndSeed`**

Run: `pnpm exec vitest run src/server/prompts/samples.test.ts src/server/dummy/reset.test.ts src/server/dummy/leftovers.test.ts`

Expected: PASS (leftovers.test.ts still exists until deleted).

- [ ] **Step 3: Make `ensureSamplePrompts` insert-only**

Rewrite `src/server/prompts/seed-samples.ts` to the current insert loop only:

- Remove `deleteLeftoverFixtures`, `deletePromptGraph`, `leftoverPromptIds`, and leftover title matching.
- Keep `ensureDefaultProjectForOwnership` and the sample insert loop (ids, messages, runs).
- Also drop the per-sample `deletePromptGraph(db, [sample.id])` at the start of that loop — insert-only after wipe. Do not keep a leftover `cleanup.ts` just for that line.
- Remove `leftoverPromptTitles` from `samples.ts`.

Then delete `cleanup.ts`, `leftovers.ts`, and `leftovers.test.ts`.

- [ ] **Step 4: Run tests and knip**

Run:

```bash
pnpm exec vitest run src/server/dummy/reset.test.ts src/server/prompts/samples.test.ts
pnpm knip
```

Expected: tests PASS. knip does not report the deleted leftover files. If knip flags a now-unused export, remove that export rather than keeping a shim.

- [ ] **Step 5: Commit**

```bash
git add src/server/prompts/seed-samples.ts src/server/prompts/samples.ts src/server/prompts/samples.test.ts
git add -u src/server/dummy
git commit -m "refactor: drop leftover-name demo cleanup in favor of full reset"
```

---

### Task 4: Wire PGlite startup and `reset-demo`

**Files:**
- Modify: `src/server/db/client.ts`
- Modify: `src/app/api/dev/reset-demo/route.ts`

- [ ] **Step 1: Switch callers**

`client.ts` — replace `ensureSamplePrompts` with `resetAndSeed` inside the `isPgliteDemo` branch. Keep dummy `ensureDummyUsers` + `backfillPromptOwnership` for all dummy auth (including Docker). Do not seed samples on postgres.

`reset-demo/route.ts` — call `resetAndSeed(db, DUMMY_DEFAULT_USER_ID)` instead of `ensureSamplePrompts`. Keep the `dummyDemoResetAllowed()` 404.

- [ ] **Step 2: Run existing env / demo tests**

Run:

```bash
pnpm exec vitest run src/server/db/env.test.ts src/server/dummy/demo.test.ts src/server/auth/env.test.ts src/server/dummy/reset.test.ts
```

Expected: PASS. PGlite still wins when `DATABASE_DRIVER=pglite` even if `DATABASE_URL` is set. `dummyDemoResetAllowed` still false for Clerk and postgres URLs.

- [ ] **Step 3: Commit**

```bash
git add src/server/db/client.ts src/app/api/dev/reset-demo/route.ts
git commit -m "feat: reset PGlite demo catalog on server start and reset-demo"
```

---

### Task 5: Seed CLI (dedicated connection)

**Files:**
- Create: `src/server/dummy/seed-cli.ts`
- Create: `src/server/dummy/seed-cli.test.ts`
- Create: `scripts/db-seed.ts`

- [ ] **Step 1: Write the failing tests**

```ts
import { afterEach, describe, expect, it } from "vitest";
import {
  DUMMY_DEFAULT_USER_ID,
  ensureDummyUsers,
} from "@/server/auth/dummy/users";
import { createPgliteDatabase } from "@/server/db/pglite";
import { createPrompt, listPrompts } from "@/server/prompts/repository";
import { samplePromptCatalog } from "@/server/prompts/samples";
import { runDbSeed } from "./seed-cli";

describe("runDbSeed", () => {
  const databases: Array<{ close: () => Promise<void> }> = [];

  afterEach(async () => {
    await Promise.all(databases.splice(0).map((database) => database.close()));
  });

  it("refuses Clerk instead of writing", async () => {
    await expect(
      runDbSeed({
        env: {
          AUTH_PROVIDER: "clerk",
          NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: "pk_test_x",
          CLERK_SECRET_KEY: "sk_test_x",
          DATABASE_DRIVER: "pglite",
          PGLITE_DATA_DIR: ":memory:",
        },
        reset: false,
      }),
    ).rejects.toThrow(/dummy auth/i);
  });

  it("skips when the catalog is not empty", async () => {
    const db = await createPgliteDatabase();
    databases.push({ close: () => db.$client.close() });
    await ensureDummyUsers(db);
    const created = await createPrompt(db, DUMMY_DEFAULT_USER_ID, {
      title: "Keep me",
      body: "existing",
    });
    const result = await runDbSeed({
      env: { DATABASE_DRIVER: "pglite" },
      reset: false,
      db,
    });
    expect(result).toEqual({ status: "skipped" });
    const listed = await listPrompts(db, DUMMY_DEFAULT_USER_ID);
    expect(listed.map((prompt) => prompt.id)).toEqual([created.id]);
  });

  it("reset replaces existing prompts with sample ids", async () => {
    const db = await createPgliteDatabase();
    databases.push({ close: () => db.$client.close() });
    await ensureDummyUsers(db);
    await createPrompt(db, DUMMY_DEFAULT_USER_ID, {
      title: "Keep me",
      body: "existing",
    });
    const result = await runDbSeed({
      env: { DATABASE_DRIVER: "pglite" },
      reset: true,
      db,
    });
    expect(result).toEqual({ status: "reset" });
    const listed = await listPrompts(db, DUMMY_DEFAULT_USER_ID);
    expect(listed.map((prompt) => prompt.id)).toEqual(
      samplePromptCatalog.map((sample) => sample.id),
    );
  });
});
```

The optional `db` argument is test-only so unit tests never call `getDb()` and never open Postgres. Production CLI omits it and opens a dedicated connection.

- [ ] **Step 2: Run tests to verify they fail**

Run: `pnpm exec vitest run src/server/dummy/seed-cli.test.ts`

Expected: FAIL — `runDbSeed` is not exported.

- [ ] **Step 3: Implement CLI helpers**

`src/server/dummy/seed-cli.ts`:

```ts
import { DUMMY_DEFAULT_USER_ID } from "@/server/auth/dummy/users";
import { resolveAuthConfig } from "@/server/auth/env";
import { createPgliteDatabase } from "@/server/db/pglite";
import { createPostgresDatabase } from "@/server/db/postgres";
import { resolveDatabaseConfig } from "@/server/db/env";
import { resetAndSeed, seedIfEmpty } from "@/server/dummy/reset";
import type { AppDatabase } from "@/server/db/types";

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
  const client = db.$client as { close?: () => Promise<void>; end?: () => Promise<void> };
  if (typeof client.close === "function") {
    await client.close();
    return;
  }
  if (typeof client.end === "function") {
    await client.end();
  }
}
```

Never import `getDb`.

`scripts/db-seed.ts` (relative import only):

```ts
import { loadEnvConfig } from "@next/env";
import { runDbSeed } from "../src/server/dummy/seed-cli";

async function main() {
  loadEnvConfig(process.cwd());
  const reset = process.argv.includes("--reset");
  const result = await runDbSeed({ env: process.env, reset });
  if (result.status === "skipped") {
    console.error("Catalog is not empty. Use pnpm db:seed:reset to replace it.");
    process.exit(1);
  }
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `pnpm exec vitest run src/server/dummy/seed-cli.test.ts src/server/dummy/reset.test.ts`

Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/server/dummy/seed-cli.ts src/server/dummy/seed-cli.test.ts scripts/db-seed.ts
git commit -m "feat: add dummy-auth seed CLI that never uses getDb"
```

---

### Task 6: Scripts, Playwright, env

**Files:**
- Modify: `package.json`
- Modify: `tsconfig.json`
- Modify: `playwright.config.ts`
- Modify: `.env.example`
- Create: `scripts/dev.ts`

- [ ] **Step 1: Add runner deps and `baseUrl`**

```bash
pnpm add -D tsx tsconfig-paths
```

In `tsconfig.json` `compilerOptions`, set `"baseUrl": "."` (keep existing `paths`).

`package.json` scripts:

```json
"dev": "tsx scripts/dev.ts",
"dev:agent": "DATABASE_DRIVER=pglite next dev",
"db:seed": "tsx --require tsconfig-paths/register scripts/db-seed.ts",
"db:seed:reset": "tsx --require tsconfig-paths/register scripts/db-seed.ts --reset"
```

Leave `db:migrate` as `drizzle-kit migrate`. `scripts/dev.ts` must pass `DATABASE_DRIVER=postgres` into that command.

- [ ] **Step 2: Implement `scripts/dev.ts`**

```ts
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
```

Do not catch errors and start PGlite. `spawnSync` inherits stdio so Docker / migrate failures surface.

If `DATABASE_URL` is missing after `loadEnvConfig`, migrate/Next will throw via existing `resolveDatabaseConfig` — that is the desired failure.

- [ ] **Step 3: Point Playwright at `dev:agent`**

In `playwright.config.ts` `webServer`:

```ts
command: "pnpm dev:agent",
env: {
  ...process.env,
  PORT: String(port),
  PROMPT_LLM_MODE: "stub",
  DATABASE_DRIVER: "pglite",
},
```

Keep `reuseExistingServer: !process.env.CI`.

- [ ] **Step 4: Update `.env.example`**

```bash
# Human default: local Docker Postgres (`pnpm dev`)
DATABASE_DRIVER=postgres
DATABASE_URL=postgresql://postgres:change-me@localhost:5432/prompt_manager
POSTGRES_USER=postgres
POSTGRES_PASSWORD=change-me
POSTGRES_DB=prompt_manager
POSTGRES_PORT=5432

# Agent / Playwright: `pnpm dev:agent` forces PGlite even if DATABASE_URL is set
# DATABASE_DRIVER=pglite
# PGLITE_DATA_DIR=.data/pglite
# PGLITE_DATA_DIR=:memory:
```

Keep the existing dummy auth / Clerk / LLM comments below. Do not invent new keys.

- [ ] **Step 5: Typecheck / lint / unit tests / CLI path resolution**

```bash
pnpm typecheck
pnpm lint
pnpm test
pnpm knip
DATABASE_DRIVER=pglite PGLITE_DATA_DIR=:memory: pnpm db:seed
```

Expected: all pass. `pnpm db:seed` must actually start (not fail on `@/` resolution). In-memory PGlite with empty prompts should print nothing and exit 0 (`seeded`). If tsconfig-paths does not resolve `@/` from `scripts/db-seed.ts`, switch the script to `tsx --require tsconfig-paths/register src/server/dummy/seed-cli.ts` with a `main()` export, or add a tiny CJS register — do not ship a CLI that cannot import `src/`.

If knip flags `scripts/*.ts`, add them as knip entrypoints. If knip flags `@next/env` as unlisted, add it to knip ignore or depend on it explicitly; keep `loadEnvConfig`.

- [ ] **Step 6: Commit**

```bash
git add package.json pnpm-lock.yaml tsconfig.json scripts/dev.ts scripts/db-seed.ts playwright.config.ts .env.example
git commit -m "feat: run Docker Postgres on pnpm dev and PGlite on pnpm dev:agent"
```

---

### Task 7: Docs

**Files:**
- Modify: `README.md`
- Modify: `AGENTS.md`

- [ ] **Step 1: Rewrite setup sections**

README:

- Opening: humans use Docker Postgres; agents use PGlite.
- Setup: `cp .env.example .env` then `pnpm dev` (requires Docker). Open http://localhost:3000. Catalog is empty until `pnpm db:seed`.
- Agent: `pnpm dev:agent` (no Docker). Catalog resets to samples on each process start.
- Remove "With no DATABASE_URL, the app uses PGlite" as the `pnpm dev` story.
- PostgreSQL / Docker subsection: `pnpm dev` already starts compose + migrate. Manual `docker compose up` is no longer the documented happy path.
- Scripts table: `pnpm dev` (Docker Postgres), `pnpm dev:agent` (PGlite), `pnpm db:seed`, `pnpm db:seed:reset`.
- Note: local Playwright/e2e reuses port 3000; stop `pnpm dev` or start `pnpm dev:agent` first.

AGENTS.md Development Environment:

- Replace "default database is PGlite at `.data/pglite` (no Docker / DATABASE_URL required)" with: agents MUST use `pnpm dev:agent`. Do not run `pnpm dev` (that starts Docker Postgres).
- Dummy auth + PGlite: `dev:agent` full-resets and seeds samples on process start. Postgres does not auto-seed; humans run `pnpm db:seed` / `pnpm db:seed:reset`.
- Screenshots / agent-browser: app is `pnpm dev:agent` when an agent needs the UI.

Keep pnpm, vitest, dummy auth, and Clerk rules.

- [ ] **Step 2: Commit**

```bash
git add README.md AGENTS.md
git commit -m "docs: split Docker dev and PGlite agent commands"
```

---

### Task 8: Verify

- [ ] **Step 1: Unit and static checks**

```bash
pnpm test
pnpm lint
pnpm typecheck
pnpm knip
```

Expected: PASS

- [ ] **Step 2: Playwright** (needs Chromium; first time `pnpm browser:install`)

```bash
pnpm test:e2e
```

Expected: PASS, including `reset-demo.spec.ts` and home seeing `気まずいメールを整える`. CI starts `pnpm dev:agent` because `CI` is set so `reuseExistingServer` is false.

If a local `pnpm dev` is already on :3000, stop it first.

- [ ] **Step 3: Manual smoke of `dev:agent` only if e2e could not run**

```bash
pnpm dev:agent
```

Then `curl -s -o /dev/null -w "%{http_code}" http://127.0.0.1:3000` → `200`, and stop the server. Do not claim Docker `pnpm dev` works unless Docker was actually started in this environment.

- [ ] **Step 4: Final commit only if Step 1–2 produced extra fixes**

No empty commit. If docs/tests needed patches, commit those with a message that matches the fix.
