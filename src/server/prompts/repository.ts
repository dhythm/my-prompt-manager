import { and, desc, eq, inArray, isNotNull, or } from "drizzle-orm";
import { prompts, teamMembers, teams } from "@/server/db/schema";
import type { AppDatabase } from "@/server/db/types";
import { createForbiddenError } from "@/server/errors";
import { assertMember } from "@/server/teams/membership";
import { findPrompt, getWritablePrompt } from "./access";
import type { CreatePromptInput } from "./input";
import { createInitialPromptVersion, savePromptVersion } from "./versions";

export async function listPrompts(db: AppDatabase, userId: string) {
  const memberTeams = db
    .select({ teamId: teamMembers.teamId })
    .from(teamMembers)
    .where(eq(teamMembers.userId, userId));

  return db
    .select({
      id: prompts.id,
      title: prompts.title,
      body: prompts.body,
      ownerUserId: prompts.ownerUserId,
      teamId: prompts.teamId,
      teamName: teams.name,
      createdByUserId: prompts.createdByUserId,
      createdAt: prompts.createdAt,
      updatedAt: prompts.updatedAt,
    })
    .from(prompts)
    .leftJoin(teams, eq(teams.id, prompts.teamId))
    .where(
      or(
        eq(prompts.ownerUserId, userId),
        and(isNotNull(prompts.teamId), inArray(prompts.teamId, memberTeams)),
      ),
    )
    .orderBy(desc(prompts.createdAt), desc(prompts.id));
}

export async function createPrompt(
  db: AppDatabase,
  userId: string,
  input: CreatePromptInput,
) {
  if (input.teamId) {
    await assertMember(db, userId, input.teamId);
  }

  const [prompt] = await db
    .insert(prompts)
    .values({
      title: input.title,
      body: input.body,
      ownerUserId: input.teamId ? null : userId,
      teamId: input.teamId ?? null,
      createdByUserId: userId,
    })
    .returning();

  if (!prompt) {
    throw new Error("Failed to create prompt");
  }

  await createInitialPromptVersion(db, userId, prompt.id, {
    title: input.title,
    body: input.body,
  });

  return prompt;
}

export async function updatePrompt(
  db: AppDatabase,
  userId: string,
  promptId: string,
  input: { title: string; body: string },
) {
  const prompt = await getWritablePrompt(db, userId, promptId);
  const updated = await savePromptVersion(db, userId, prompt.id, {
    title: input.title,
    model: "gpt-4.1",
    messages: [
      { role: "system", content: "You are a helpful assistant." },
      { role: "user", content: input.body },
    ],
  });
  return updated.prompt;
}

export async function transferPrompt(
  db: AppDatabase,
  userId: string,
  promptId: string,
  teamId: string,
) {
  const prompt = await findPrompt(db, promptId);
  if (prompt.ownerUserId !== userId) {
    throw createForbiddenError("Only the owner can transfer a personal prompt");
  }

  await assertMember(db, userId, teamId);

  const [updated] = await db
    .update(prompts)
    .set({
      ownerUserId: null,
      teamId,
      updatedAt: new Date(),
    })
    .where(eq(prompts.id, prompt.id))
    .returning();

  if (!updated) {
    throw new Error("Failed to transfer prompt");
  }

  return updated;
}
