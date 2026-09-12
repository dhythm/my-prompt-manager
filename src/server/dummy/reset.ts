import {
  DUMMY_DEFAULT_USER_ID,
  ensureDummyUsers,
} from "@/server/auth/dummy/users";
import {
  projects,
  promptMessages,
  promptRuns,
  prompts,
  promptVersions,
  teamInvites,
  teamMembers,
  teams,
} from "@/server/db/schema";
import type { AppDatabase } from "@/server/db/types";
import { ensureSamplePrompts } from "@/server/prompts/seed-samples";

type TransactionalDatabase = {
  transaction: (fn: (tx: AppDatabase) => Promise<void>) => Promise<void>;
};

export async function resetAndSeed(
  db: AppDatabase,
  userId: string = DUMMY_DEFAULT_USER_ID,
) {
  await (db as unknown as TransactionalDatabase).transaction(async (tx) => {
    await tx.delete(promptRuns);
    await tx.delete(promptMessages);
    await tx.delete(promptVersions);
    await tx.delete(prompts);
    await tx.delete(projects);
    await tx.delete(teamInvites);
    await tx.delete(teamMembers);
    await tx.delete(teams);
    await ensureDummyUsers(tx);
    await ensureSamplePrompts(tx, userId);
  });
}

export async function seedIfEmpty(
  db: AppDatabase,
  userId: string = DUMMY_DEFAULT_USER_ID,
) {
  const existing = await db.select({ id: prompts.id }).from(prompts).limit(1);
  if (existing.length > 0) {
    return { seeded: false as const };
  }
  await ensureDummyUsers(db);
  await ensureSamplePrompts(db, userId);
  return { seeded: true as const };
}
