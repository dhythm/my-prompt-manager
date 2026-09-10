# my-prompt-manager

Next.js app for managing prompts. Local and agent environments use PGlite. Production uses PostgreSQL (Neon or Supabase).

## Stack

- Next.js 16, TypeScript, Tailwind CSS 4, Biome
- TanStack Query for client-to-server data
- Drizzle ORM
- PGlite by default, `postgres.js` for PostgreSQL
- Vitest, Playwright, agent-browser, knip, `tsc`, GitHub Actions

## Setup

```bash
pnpm install
cp .env.example .env
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000). With no `DATABASE_URL`, the app uses PGlite at `.data/pglite` and applies migrations automatically.

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

Set a connection string (Neon, Supabase, or local Postgres):

```bash
DATABASE_DRIVER=postgres
DATABASE_URL=postgresql://user:password@host:5432/dbname?sslmode=require
```

Then apply migrations:

```bash
pnpm db:migrate
```

Local Postgres with Docker:

```bash
cp .env.example .env
# set POSTGRES_* and DATABASE_URL in .env
docker compose up -d
pnpm db:migrate
pnpm dev
```

Neon and Supabase both work with the `postgres` driver. Transaction poolers need `prepare: false`, which is already set.

## Scripts

| Command | What it does |
| --- | --- |
| `pnpm dev` | Next.js dev server |
| `pnpm test` | Vitest |
| `pnpm test:e2e` | Playwright (starts the app, takes screenshots) |
| `pnpm screenshot` | Desktop + mobile PNGs in `e2e/output/` |
| `pnpm browser:install` | Chromium for Playwright and agent-browser |
| `pnpm lint` | Biome CI (lint + format) |
| `pnpm typecheck` | `tsc --noEmit` |
| `pnpm knip` | Unused files / exports / deps |
| `pnpm build` | Production build |
| `pnpm db:generate` | Generate SQL from the Drizzle schema |
| `pnpm db:migrate` | Apply SQL migrations (PostgreSQL) |
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

With the app already running, agent-browser can snapshot and screenshot:

```bash
pnpm exec agent-browser open http://127.0.0.1:3000
pnpm exec agent-browser snapshot -i
pnpm exec agent-browser screenshot --full e2e/output/page.png
pnpm exec agent-browser close
```
