# my-prompt-manager

Next.js app for managing prompts. Local and agent environments use PGlite. Production uses PostgreSQL (Neon or Supabase).

## Stack

- Next.js 16, TypeScript, Tailwind CSS 4, Biome
- TanStack Query for client-to-server data
- Drizzle ORM
- PGlite by default, `postgres.js` for PostgreSQL
- Vitest, knip, `tsc`, GitHub Actions

## Setup

```bash
pnpm install
cp .env.example .env
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000). With no `DATABASE_URL`, the app uses PGlite at `.data/pglite` and applies migrations automatically.

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
| `pnpm lint` | Biome CI (lint + format) |
| `pnpm typecheck` | `tsc --noEmit` |
| `pnpm knip` | Unused files / exports / deps |
| `pnpm build` | Production build |
| `pnpm db:generate` | Generate SQL from the Drizzle schema |
| `pnpm db:migrate` | Apply SQL migrations (PostgreSQL) |
| `pnpm db:studio` | Drizzle Studio |

CI runs lint, typecheck, knip, test, and build.
