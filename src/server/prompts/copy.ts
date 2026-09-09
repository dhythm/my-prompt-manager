import { eq } from "drizzle-orm";
import { t } from "@/lib/i18n/t";
import { promptMessages, prompts, promptVersions } from "@/server/db/schema";
import type { AppDatabase } from "@/server/db/types";
import { getWritableProject } from "@/server/projects/access";
import { getReadablePrompt } from "./access";

export async function copyPromptToProject(
  db: AppDatabase,
  userId: string,
  promptId: string,
  projectId: string,
) {
  const source = await getReadablePrompt(db, userId, promptId);
  const project = await getWritableProject(db, userId, projectId);

  const versions = await db
    .select()
    .from(promptVersions)
    .where(eq(promptVersions.promptId, source.id))
    .orderBy(promptVersions.versionNumber);

  const [copied] = await db
    .insert(prompts)
    .values({
      title: source.title,
      body: source.body,
      ownerUserId: project.ownerUserId,
      teamId: project.teamId,
      projectId: project.id,
      createdByUserId: userId,
    })
    .returning();

  if (!copied) {
    throw new Error(t("error.promptCopyFailed"));
  }

  for (const version of versions) {
    const messages = await db
      .select()
      .from(promptMessages)
      .where(eq(promptMessages.versionId, version.id))
      .orderBy(promptMessages.position);

    const [copiedVersion] = await db
      .insert(promptVersions)
      .values({
        promptId: copied.id,
        versionNumber: version.versionNumber,
        model: version.model,
        note: version.note,
        createdByUserId: version.createdByUserId,
        createdAt: version.createdAt,
      })
      .returning();

    if (!copiedVersion) {
      throw new Error(t("error.promptCopyFailed"));
    }

    if (messages.length > 0) {
      await db.insert(promptMessages).values(
        messages.map((message) => ({
          versionId: copiedVersion.id,
          role: message.role,
          content: message.content,
          position: message.position,
        })),
      );
    }
  }

  return copied;
}
