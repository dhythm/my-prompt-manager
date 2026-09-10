import { inArray } from "drizzle-orm";
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
import { samplePromptIds } from "@/server/prompts/samples";
import { isLeftoverProjectName, isLeftoverTeamName } from "./leftovers";

export async function deleteLeftoverFixtures(db: AppDatabase) {
  const teamRows = await db
    .select({ id: teams.id, name: teams.name })
    .from(teams);
  const leftoverTeamIds = teamRows
    .filter((team) => isLeftoverTeamName(team.name))
    .map((team) => team.id);

  const projectRows = await db
    .select({
      id: projects.id,
      name: projects.name,
      teamId: projects.teamId,
    })
    .from(projects);
  const leftoverProjectIds = projectRows
    .filter(
      (project) =>
        isLeftoverProjectName(project.name) ||
        (project.teamId !== null && leftoverTeamIds.includes(project.teamId)),
    )
    .map((project) => project.id);

  const promptRows = await db
    .select({
      id: prompts.id,
      teamId: prompts.teamId,
      projectId: prompts.projectId,
    })
    .from(prompts);
  const leftoverPromptIds = promptRows
    .filter(
      (prompt) =>
        !samplePromptIds.includes(prompt.id) &&
        ((prompt.teamId !== null && leftoverTeamIds.includes(prompt.teamId)) ||
          (prompt.projectId !== null &&
            leftoverProjectIds.includes(prompt.projectId))),
    )
    .map((prompt) => prompt.id);

  await deletePromptGraph(db, leftoverPromptIds);

  if (leftoverProjectIds.length > 0) {
    await db.delete(projects).where(inArray(projects.id, leftoverProjectIds));
  }

  if (leftoverTeamIds.length > 0) {
    await db
      .delete(teamInvites)
      .where(inArray(teamInvites.teamId, leftoverTeamIds));
    await db
      .delete(teamMembers)
      .where(inArray(teamMembers.teamId, leftoverTeamIds));
    await db.delete(teams).where(inArray(teams.id, leftoverTeamIds));
  }
}

export async function deletePromptGraph(db: AppDatabase, promptIds: string[]) {
  if (promptIds.length === 0) {
    return;
  }

  const versions = await db
    .select({ id: promptVersions.id })
    .from(promptVersions)
    .where(inArray(promptVersions.promptId, promptIds));
  const versionIds = versions.map((version) => version.id);

  await db.delete(promptRuns).where(inArray(promptRuns.promptId, promptIds));
  if (versionIds.length > 0) {
    await db
      .delete(promptMessages)
      .where(inArray(promptMessages.versionId, versionIds));
  }
  await db
    .delete(promptVersions)
    .where(inArray(promptVersions.promptId, promptIds));
  await db.delete(prompts).where(inArray(prompts.id, promptIds));
}
