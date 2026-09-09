import { pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";

export const prompts = pgTable("prompts", {
  id: uuid().defaultRandom().primaryKey(),
  title: text().notNull(),
  body: text().notNull(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});
