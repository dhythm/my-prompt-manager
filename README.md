# my-prompt-manager

Next.js app for managing prompts. Humans develop against local Docker Postgres (`pnpm dev`). Agents, Playwright, and CI use PGlite (`pnpm dev:agent`). Production uses PostgreSQL (Neon or Supabase).

## Stack

- Next.js 16, TypeScript, Tailwind CSS 4, Biome
- TanStack Query for client-to-server data
- Drizzle ORM
- Docker Postgres for human local dev; PGlite for agents / Playwright / CI; `postgres.js` for PostgreSQL
- Vitest, Playwright, agent-browser, knip, `tsc`, GitHub Actions

## Setup

Requires Docker. Copy env and start the app (compose + migrate run automatically):

```bash
pnpm install
cp .env.example .env
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000). The catalog is empty until you seed:

```bash
pnpm db:seed
```

Use `pnpm db:seed:reset` to wipe and reseed.

### Agent / Playwright

No Docker. PGlite starts with a known sample catalog on every process start:

```bash
pnpm install
cp .env.example .env
pnpm dev:agent
```

Auth defaults to dummy accounts (`agent@local.test` and `dev@local.test`). The Agent user is signed in automatically so local and agent environments work without Clerk. Sign out and visit `/sign-in` to pick the other user. Set `AUTH_DUMMY_AUTO_SIGN_IN=false` to require an explicit sign-in.

Prompts are either personal (only the owner) or owned by a team (all members can view and update). Each prompt has a model, system/user/assistant messages, a version history, and run logs. Create a team, invite by email, and transfer a personal prompt into a team. Dummy users can invite each other (`dev@local.test`) without Clerk or SMTP.

Running a prompt calls the selected model with the saved messages (and variable values, if any). Set provider keys in `.env`; they stay on the server. Logs store the model output, token counts, and an estimated USD cost from catalog rates.

```bash
OPENAI_API_KEY=
ANTHROPIC_API_KEY=
GEMINI_API_KEY=
XAI_API_KEY=
```

Playwright sets `PROMPT_LLM_MODE=stub` so e2e does not call paid APIs. Do not use stub in production.

Local Playwright / e2e reuses whatever is already listening on port 3000. Stop `pnpm dev` first, or start `pnpm dev:agent` before running e2e, so tests hit PGlite instead of Docker Postgres.

Clerk is reserved for production later:

```bash
AUTH_PROVIDER=clerk
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_...
CLERK_SECRET_KEY=sk_...
```

In-memory PGlite (tests do this by default):

```bash
PGLITE_DATA_DIR=:memory:
```

## PostgreSQL

`pnpm dev` already starts Docker Compose, waits for health, and applies migrations. Prefer that for local Postgres.

For Neon, Supabase, or an existing Postgres instance, set a connection string:

```bash
DATABASE_DRIVER=postgres
DATABASE_URL=postgresql://user:password@host:5432/dbname?sslmode=require
```

Then apply migrations:

```bash
pnpm db:migrate
```

Neon and Supabase both work with the `postgres` driver. Transaction poolers need `prepare: false`, which is already set.

## Scripts

| Command | What it does |
| --- | --- |
| `pnpm dev` | Docker Postgres + migrate + Next.js dev server |
| `pnpm dev:agent` | PGlite Next.js dev server (no Docker; resets + seeds samples) |
| `pnpm test` | Vitest |
| `pnpm test:e2e` | Playwright (starts `pnpm dev:agent`, takes screenshots) |
| `pnpm screenshot` | Desktop + mobile PNGs in `e2e/output/` |
| `pnpm browser:install` | Chromium for Playwright and agent-browser |
| `pnpm lint` | Biome CI (lint + format) |
| `pnpm typecheck` | `tsc --noEmit` |
| `pnpm knip` | Unused files / exports / deps |
| `pnpm build` | Production build |
| `pnpm db:generate` | Generate SQL from the Drizzle schema |
| `pnpm db:migrate` | Apply SQL migrations (PostgreSQL) |
| `pnpm db:seed` | Seed sample catalog if empty (dummy auth only) |
| `pnpm db:seed:reset` | Wipe catalog and reseed samples (dummy auth only) |
| `pnpm db:studio` | Drizzle Studio |

CI runs lint, typecheck, knip, test, Playwright screenshots, and build.

## Screenshots

First time on a machine:

```bash
pnpm browser:install
```

Then:

```bash
pnpm screenshot
```

That writes `e2e/output/home-desktop.png` and `e2e/output/home-mobile.png`.

With the app already running via `pnpm dev:agent`, agent-browser can snapshot and screenshot:

```bash
pnpm exec agent-browser open http://127.0.0.1:3000
pnpm exec agent-browser snapshot -i
pnpm exec agent-browser screenshot --full e2e/output/page.png
pnpm exec agent-browser close
```
