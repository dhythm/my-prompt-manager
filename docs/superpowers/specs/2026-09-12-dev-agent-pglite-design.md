# Split `pnpm dev` (Docker Postgres) and `pnpm dev:agent` (PGlite)

## Problem

`pnpm dev` is `next dev` with PGlite as the implicit default. Human local Postgres via Docker is a manual extra path (`docker compose up`, `DATABASE_URL`, `pnpm db:migrate`). Agents, Playwright, and CI share that same PGlite path, but:

- PGlite persists `.data/pglite` and only removes leftover rows whose names match known e2e fixtures, so agent verification does not start from a known catalog.
- Humans who want production-like Postgres must remember Docker and env by hand.
- If `pnpm dev` were switched to Docker without a separate agent command, CI and agents would need Docker.

## Goals

- Humans: `pnpm dev` starts local Docker Postgres, migrates, and does not seed the sample catalog.
- Agents / Playwright / CI: `pnpm dev:agent` starts PGlite with no Docker, and every process start fully resets then seeds the sample catalog.
- Docker / human Postgres seeding is manual: empty catalog only, unless the operator explicitly resets.
- `/api/dev/reset-demo` uses the same full reset as agent startup (PGlite + dummy auth only).

## Non-goals

- Seeding or resetting Clerk / production (Neon, Supabase) databases.
- Auto-fallback from Docker Postgres to PGlite.
- Changing dummy auth, sample catalog content, or production migrate behavior.
- Making `pnpm dev` work on Windows cmd (env prefix `DATABASE_DRIVER=pglite` is Unix; local and CI are macOS / Ubuntu).
- Starting a second Playwright port to avoid colliding with a running `pnpm dev`.

## Commands

### `pnpm dev`

Sequence:

1. `docker compose up -d --wait` (existing `postgres` healthcheck).
2. `pnpm db:migrate` with `DATABASE_DRIVER=postgres` (and the local `DATABASE_URL`) so drizzle-kit cannot fall through to PGlite if `.env` is missing or unread.
3. `next dev` with the same `DATABASE_DRIVER=postgres` and `DATABASE_URL`.

`DATABASE_URL` comes from `.env` (local Docker URL). Docker Compose already reads `POSTGRES_*` from `.env`. The `dev` script still exports `DATABASE_DRIVER=postgres` for both migrate and Next.

On Docker missing, compose failure, healthcheck timeout, or migrate failure: exit non-zero. Do not start Next and do not open PGlite.

No sample-catalog seed in this path.

### `pnpm dev:agent`

- `DATABASE_DRIVER=pglite next dev`.
- Explicit `DATABASE_DRIVER=pglite` wins over a Docker `DATABASE_URL` in `.env` (existing `resolveDatabaseConfig` rule).
- First `getDb()` in the process runs `resetAndSeed`. `globalThis` already caches the DB promise, so Fast Refresh / HMR does not wipe again. A process restart does.

### Playwright / CI

- `playwright.config.ts` `webServer.command` is `pnpm dev:agent`.
- CI keeps `reuseExistingServer: !process.env.CI` (CI always starts a fresh agent server).
- Local e2e reuses whatever is already on the configured URL. If `pnpm dev` (Docker) occupies port 3000, e2e hits Postgres. Document: stop `pnpm dev` before e2e, or start `pnpm dev:agent` first.

## Environment

Update `.env.example` so the human default is local Docker:

- Uncomment `POSTGRES_USER`, `POSTGRES_PASSWORD`, `POSTGRES_DB`, `POSTGRES_PORT`, `DATABASE_DRIVER=postgres`, and a localhost `DATABASE_URL` that matches those values.
- Comment PGlite as the `pnpm dev:agent` path, not the `pnpm dev` default.

Dummy users (Agent / Developer) stay a login fixture: `getDb()` still calls `ensureDummyUsers` + `backfillPromptOwnership` when `AUTH_PROVIDER` is dummy, including Docker. Sample prompts and runs are the only "seed".

## Reset and seed

Remove leftover-name heuristics (`deleteLeftoverFixtures`, leftover team/project/prompt title matchers used by seed). Replace with two operations.

### `resetAndSeed(db, userId)`

In one transaction:

1. Delete catalog rows, children first: `prompt_runs`, `prompt_messages`, `prompt_versions`, `prompts`, `projects`, `team_invites`, `team_members`, `teams`.
2. Do not delete `users`. Re-run `ensureDummyUsers`.
3. Insert the existing sample prompt catalog (same content as today: default personal project, sample prompts, versions, messages, sample runs).

Callers:

- PGlite + dummy `getDb()` on first init (`isPgliteDemo` / `dummyDemoResetAllowed`).
- `POST /api/dev/reset-demo` (still 404 unless dummy + PGlite).
- `pnpm db:seed:reset`.

### `seedIfEmpty(db, userId)`

- Catalog is empty iff `prompts` has zero rows.
- If empty: insert the sample catalog (and `ensureDummyUsers`). Do not wipe teams/projects that exist without prompts; this path only runs when there are no prompts.
- If not empty: change nothing.

Caller: `pnpm db:seed`. CLI exits `1` and prints that the catalog is not empty (use `db:seed:reset`).

### Seed CLI

- `pnpm db:seed` → `seedIfEmpty`.
- `pnpm db:seed:reset` → `resetAndSeed`.
- Load env via Next's `loadEnvConfig` so `.env` is honored without a new dependency.
- Use `resolveDatabaseConfig` / `resolveAuthConfig`.
- Refuse unless auth provider is dummy (Clerk → error, no writes).
- Open a **dedicated** connection with `createPgliteDatabase` / `createPostgresDatabase`. Do **not** call `getDb()`: on PGlite, `getDb()` runs `resetAndSeed` on first init and would break `seedIfEmpty`.
- Connect with the current driver (human `.env` → Postgres; `DATABASE_DRIVER=pglite` → PGlite).

Entry: `scripts/db-seed.ts` with relative imports into `src/` (no `@/` in the script; this package is not `"type": "module"` and path aliases will not resolve under raw `node --experimental-strip-types`). Run with `tsx` (add as a devDependency) and argv `--reset` for `db:seed:reset`.

## Error handling

| Path | Failure | Behavior |
| --- | --- | --- |
| `pnpm dev` | Docker / health / migrate | Non-zero exit, no Next, no PGlite fallback |
| `pnpm dev:agent` | PGlite migrate or `resetAndSeed` | `getDb()` throws; server cannot serve DB routes |
| `db:seed` | Catalog not empty | Exit 1, no writes |
| `db:seed` | Missing `DATABASE_URL` on postgres, connection error, Clerk | Error, no writes |
| `resetAndSeed` (any caller) | Mid-transaction error | Rollback; do not leave a half-wiped catalog |
| `reset-demo` | Not dummy + PGlite | 404 JSON `{ error: "Not found" }` |

## Tests

TDD on the reset/seed module before wiring scripts:

- `resetAndSeed` after creating an arbitrarily named team/prompt removes them and restores the sample catalog.
- `resetAndSeed` twice yields the same catalog. Compare prompt/run ids and content, not `Date.now()` timestamps or the default project's generated UUID.
- `seedIfEmpty` on an empty DB inserts the catalog.
- `seedIfEmpty` when any prompt exists does not insert, delete, or modify rows.
- Keep catalog-content assertions in `samples.test.ts` (titles, run sources); retarget them at `resetAndSeed` / the insert helper. Drop only leftover-name tests.
- Existing `isPgliteDemo` / `dummyDemoResetAllowed` / `resolveDatabaseConfig` behavior stays (PGlite still wins when `DATABASE_DRIVER=pglite` even if `DATABASE_URL` is set).
- e2e `reset-demo.spec.ts` remains valid: a timestamped team disappears after `POST /api/dev/reset-demo`.
- Playwright still sees the seeded title `気まずいメールを整える` via `pnpm dev:agent`.

Drop tests that only exist to assert leftover-name cleanup.

## Docs

- `README.md`: human setup is `pnpm dev` (Docker). Agent setup is `pnpm dev:agent`. Manual seed: `pnpm db:seed` / `pnpm db:seed:reset`. Remove "no DATABASE_URL means PGlite" as the default `pnpm dev` story.
- `AGENTS.md`: agents use `pnpm dev:agent`; do not start Docker; catalog is reset to samples on each agent server start. Playwright/screenshots use that same command.
- Scripts table in README includes `dev:agent`, `db:seed`, `db:seed:reset`.

## Files (expected)

- `package.json` — `dev`, `dev:agent`, `db:seed`, `db:seed:reset`
- `playwright.config.ts` — `webServer.command`
- `.env.example`
- `src/server/db/client.ts` — PGlite demo calls `resetAndSeed` instead of leftover `ensureSamplePrompts`
- `src/server/prompts/seed-samples.ts` — insert catalog only; leftover deletion removed
- New reset/orchestrator module (e.g. `src/server/dummy/reset.ts` + seed helpers)
- `src/app/api/dev/reset-demo/route.ts` — call `resetAndSeed`
- `scripts/db-seed.ts` (relative imports, run via `tsx`)
- `package.json` devDependency `tsx`
- Delete leftover-only helpers if nothing else imports them (`cleanup.ts` leftover path, `leftovers.ts`, leftover titles used only for seed)
- `README.md`, `AGENTS.md`
- Tests listed above

## Out of scope follow-ups

- Dedicated e2e port so Docker `dev` and Playwright cannot collide locally.
- Seeding Docker automatically behind a flag other than `db:seed` / `db:seed:reset`.
