import { eq } from "drizzle-orm";
import { t } from "@/lib/i18n/t";
import { prompts } from "@/server/db/schema";
import type { AppDatabase } from "@/server/db/types";
import { createForbiddenError, createNotFoundError } from "@/server/errors";
import { assertMember } from "@/server/teams/membership";

export async function findPrompt(db: AppDatabase, promptId: string) {
  const [prompt] = await db
    .select()
    .from(prompts)
    .where(eq(prompts.id, promptId))
    .limit(1);

  if (!prompt) {
    throw createNotFoundError(t("error.promptNotFound"));
  }

  return prompt;
}

export async function getReadablePrompt(
  db: AppDatabase,
  userId: string,
  promptId: string,
) {
  const prompt = await findPrompt(db, promptId);
  if (prompt.ownerUserId === userId) {
    return prompt;
  }
  if (prompt.teamId) {
    try {
      await assertMember(db, userId, prompt.teamId);
      return prompt;
    } catch {
      throw createNotFoundError(t("error.promptNotFound"));
    }
  }
  throw createNotFoundError(t("error.promptNotFound"));
}

export async function getWritablePrompt(
  db: AppDatabase,
  userId: string,
  promptId: string,
) {
  const prompt = await findPrompt(db, promptId);
  if (prompt.ownerUserId === userId) {
    return prompt;
  }
  if (prompt.teamId) {
    await assertMember(db, userId, prompt.teamId);
    return prompt;
  }
  throw createForbiddenError(t("error.promptUpdateForbidden"));
}
