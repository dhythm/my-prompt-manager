import { and, eq, isNull } from "drizzle-orm";
import { DUMMY_DEFAULT_USER_ID } from "@/server/auth/dummy/users";
import { prompts, promptVersions } from "@/server/db/schema";
import type { AppDatabase } from "@/server/db/types";
import { createInitialPromptVersion } from "./versions";

export async function backfillPromptOwnership(db: AppDatabase) {
  await db
    .update(prompts)
    .set({
      ownerUserId: DUMMY_DEFAULT_USER_ID,
      createdByUserId: DUMMY_DEFAULT_USER_ID,
    })
    .where(and(isNull(prompts.ownerUserId), isNull(prompts.teamId)));

  const records = await db.select().from(prompts);
  for (const prompt of records) {
    const [existing] = await db
      .select({ id: promptVersions.id })
      .from(promptVersions)
      .where(eq(promptVersions.promptId, prompt.id))
      .limit(1);
    if (existing) {
      continue;
    }
    await createInitialPromptVersion(
      db,
      prompt.createdByUserId ?? DUMMY_DEFAULT_USER_ID,
      prompt.id,
      { title: prompt.title, body: prompt.body },
    );
  }
}
