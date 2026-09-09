import { and, desc, eq, inArray, isNotNull, or } from "drizzle-orm";
import { t } from "@/lib/i18n/t";
import { defaultPromptModel } from "@/lib/prompts/models";
import { projects, prompts, teamMembers, teams } from "@/server/db/schema";
import type { AppDatabase } from "@/server/db/types";
import { createForbiddenError } from "@/server/errors";
import { resolveProjectForCreate } from "@/server/projects/repository";
import { assertMember } from "@/server/teams/membership";
import { findPrompt, getWritablePrompt } from "./access";
import type { CreatePromptInput } from "./input";
import { createInitialPromptVersion, savePromptVersion } from "./versions";

export async function listPrompts(
  db: AppDatabase,
  userId: string,
  projectId?: string,
) {
  const memberTeams = db
    .select({ teamId: teamMembers.teamId })
    .from(teamMembers)
    .where(eq(teamMembers.userId, userId));

  const visible = or(
    eq(prompts.ownerUserId, userId),
    and(isNotNull(prompts.teamId), inArray(prompts.teamId, memberTeams)),
  );
  const filter = projectId
    ? and(visible, eq(prompts.projectId, projectId))
    : visible;

  return db
    .select({
      id: prompts.id,
      title: prompts.title,
      body: prompts.body,
      ownerUserId: prompts.ownerUserId,
      teamId: prompts.teamId,
      teamName: teams.name,
      projectId: prompts.projectId,
      projectName: projects.name,
      createdByUserId: prompts.createdByUserId,
      createdAt: prompts.createdAt,
      updatedAt: prompts.updatedAt,
    })
    .from(prompts)
    .leftJoin(teams, eq(teams.id, prompts.teamId))
    .leftJoin(projects, eq(projects.id, prompts.projectId))
    .where(filter)
    .orderBy(desc(prompts.createdAt), desc(prompts.id));
}

export async function createPrompt(
  db: AppDatabase,
  userId: string,
  input: CreatePromptInput,
) {
  const project = await resolveProjectForCreate(db, userId, input);

  const [prompt] = await db
    .insert(prompts)
    .values({
      title: input.title,
      body: input.body,
      ownerUserId: project.ownerUserId,
      teamId: project.teamId,
      projectId: project.id,
      createdByUserId: userId,
    })
    .returning();

  if (!prompt) {
    throw new Error(t("error.promptCreateFailed"));
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
    model: defaultPromptModel,
    messages: [
      { role: "system", content: t("prompt.defaultSystem") },
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
    throw createForbiddenError(t("error.transferOwnerOnly"));
  }

  await assertMember(db, userId, teamId);
  const project = await resolveProjectForCreate(db, userId, { teamId });

  const [updated] = await db
    .update(prompts)
    .set({
      ownerUserId: null,
      teamId,
      projectId: project.id,
      updatedAt: new Date(),
    })
    .where(eq(prompts.id, prompt.id))
    .returning();

  if (!updated) {
    throw new Error(t("error.transferFailed"));
  }

  return updated;
}
