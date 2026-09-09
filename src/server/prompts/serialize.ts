import type { Prompt } from "@/lib/prompts/types";
import type { prompts } from "@/server/db/schema";

type PromptRecord = typeof prompts.$inferSelect;

export function serializePrompt(prompt: PromptRecord): Prompt {
  return {
    id: prompt.id,
    title: prompt.title,
    body: prompt.body,
    createdAt: prompt.createdAt.toISOString(),
    updatedAt: prompt.updatedAt.toISOString(),
  };
}
