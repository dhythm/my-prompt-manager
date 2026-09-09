import { sql } from "drizzle-orm";
import {
  check,
  integer,
  pgTable,
  primaryKey,
  text,
  timestamp,
  unique,
  uuid,
} from "drizzle-orm/pg-core";

export const users = pgTable("users", {
  id: uuid().primaryKey(),
  email: text().notNull().unique(),
  name: text().notNull(),
  provider: text().notNull(),
  clerkUserId: text("clerk_user_id").unique(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

export const teams = pgTable("teams", {
  id: uuid().defaultRandom().primaryKey(),
  name: text().notNull(),
  createdByUserId: uuid("created_by_user_id")
    .notNull()
    .references(() => users.id),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

export const teamMembers = pgTable(
  "team_members",
  {
    teamId: uuid("team_id")
      .notNull()
      .references(() => teams.id),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id),
    role: text().notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [primaryKey({ columns: [table.teamId, table.userId] })],
);

export const teamInvites = pgTable("team_invites", {
  id: uuid().defaultRandom().primaryKey(),
  teamId: uuid("team_id")
    .notNull()
    .references(() => teams.id),
  email: text().notNull(),
  invitedByUserId: uuid("invited_by_user_id")
    .notNull()
    .references(() => users.id),
  status: text().notNull(),
  token: text().notNull().unique(),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

export const projects = pgTable(
  "projects",
  {
    id: uuid().defaultRandom().primaryKey(),
    name: text().notNull(),
    ownerUserId: uuid("owner_user_id").references(() => users.id),
    teamId: uuid("team_id").references(() => teams.id),
    createdByUserId: uuid("created_by_user_id").references(() => users.id),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    check(
      "project_owner_xor",
      sql`(
        (${table.ownerUserId} is not null and ${table.teamId} is null)
        or (${table.ownerUserId} is null and ${table.teamId} is not null)
      )`,
    ),
  ],
);

export const prompts = pgTable(
  "prompts",
  {
    id: uuid().defaultRandom().primaryKey(),
    title: text().notNull(),
    body: text().notNull(),
    ownerUserId: uuid("owner_user_id").references(() => users.id),
    teamId: uuid("team_id").references(() => teams.id),
    projectId: uuid("project_id").references(() => projects.id),
    createdByUserId: uuid("created_by_user_id").references(() => users.id),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    check(
      "prompt_owner_xor",
      sql`(
        (${table.ownerUserId} is not null and ${table.teamId} is null)
        or (${table.ownerUserId} is null and ${table.teamId} is not null)
        or (${table.ownerUserId} is null and ${table.teamId} is null)
      )`,
    ),
  ],
);

export const promptVersions = pgTable(
  "prompt_versions",
  {
    id: uuid().defaultRandom().primaryKey(),
    promptId: uuid("prompt_id")
      .notNull()
      .references(() => prompts.id),
    versionNumber: integer("version_number").notNull(),
    model: text().notNull(),
    note: text(),
    createdByUserId: uuid("created_by_user_id").references(() => users.id),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [unique().on(table.promptId, table.versionNumber)],
);

export const promptMessages = pgTable("prompt_messages", {
  id: uuid().defaultRandom().primaryKey(),
  versionId: uuid("version_id")
    .notNull()
    .references(() => promptVersions.id),
  role: text().notNull(),
  content: text().notNull(),
  position: integer().notNull(),
});

export const promptRuns = pgTable("prompt_runs", {
  id: uuid().defaultRandom().primaryKey(),
  promptId: uuid("prompt_id")
    .notNull()
    .references(() => prompts.id),
  versionId: uuid("version_id")
    .notNull()
    .references(() => promptVersions.id),
  model: text().notNull(),
  input: text().notNull(),
  output: text().notNull(),
  status: text().notNull(),
  createdByUserId: uuid("created_by_user_id").references(() => users.id),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});
