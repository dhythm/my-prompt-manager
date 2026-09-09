import { desc } from "drizzle-orm";
import type { AppDatabase } from "@/server/db/client";
import { prompts } from "@/server/db/schema";
import type { CreatePromptInput } from "./input";

export async function listPrompts(db: AppDatabase) {
  return db
    .select()
    .from(prompts)
    .orderBy(desc(prompts.createdAt), desc(prompts.id));
}

export async function createPrompt(db: AppDatabase, input: CreatePromptInput) {
  const [prompt] = await db.insert(prompts).values(input).returning();

  if (!prompt) {
    throw new Error("Failed to create prompt");
  }

  return prompt;
}
