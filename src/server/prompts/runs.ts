import { desc, eq, inArray } from "drizzle-orm";
import { promptRuns } from "@/server/db/schema";
import type { AppDatabase } from "@/server/db/types";
import { getReadablePrompt } from "./access";
import { listPrompts } from "./repository";
import { getPromptDetail } from "./versions";

export async function createPromptRun(
  db: AppDatabase,
  userId: string,
  promptId: string,
) {
  const detail = await getPromptDetail(db, userId, promptId);
  const input = detail.messages
    .map((message) => `${message.role}: ${message.content}`)
    .join("\n\n");
  const output = `Recorded ${detail.version.model} run with ${detail.messages.length} messages.`;

  const [run] = await db
    .insert(promptRuns)
    .values({
      promptId,
      versionId: detail.version.id,
      model: detail.version.model,
      input,
      output,
      status: "succeeded",
      createdByUserId: userId,
    })
    .returning();

  if (!run) {
    throw new Error("Failed to record run");
  }

  return run;
}

export async function listPromptRuns(
  db: AppDatabase,
  userId: string,
  promptId: string,
) {
  await getReadablePrompt(db, userId, promptId);
  return db
    .select()
    .from(promptRuns)
    .where(eq(promptRuns.promptId, promptId))
    .orderBy(desc(promptRuns.createdAt));
}

export async function listWorkspaceRuns(db: AppDatabase, userId: string) {
  const visible = await listPrompts(db, userId);
  const ids = visible.map((prompt) => prompt.id);
  if (ids.length === 0) {
    return [];
  }

  return db
    .select()
    .from(promptRuns)
    .where(inArray(promptRuns.promptId, ids))
    .orderBy(desc(promptRuns.createdAt));
}
