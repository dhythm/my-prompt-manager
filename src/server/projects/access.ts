import { eq } from "drizzle-orm";
import { t } from "@/lib/i18n/t";
import { projects } from "@/server/db/schema";
import type { AppDatabase } from "@/server/db/types";
import { createNotFoundError } from "@/server/errors";
import { assertMember } from "@/server/teams/membership";

async function findProject(db: AppDatabase, projectId: string) {
  const [project] = await db
    .select()
    .from(projects)
    .where(eq(projects.id, projectId))
    .limit(1);

  if (!project) {
    throw createNotFoundError(t("error.projectNotFound"));
  }

  return project;
}

async function getReadableProject(
  db: AppDatabase,
  userId: string,
  projectId: string,
) {
  const project = await findProject(db, projectId);
  if (project.ownerUserId === userId) {
    return project;
  }
  if (project.teamId) {
    try {
      await assertMember(db, userId, project.teamId);
      return project;
    } catch {
      throw createNotFoundError(t("error.projectNotFound"));
    }
  }
  throw createNotFoundError(t("error.projectNotFound"));
}

export async function getWritableProject(
  db: AppDatabase,
  userId: string,
  projectId: string,
) {
  return getReadableProject(db, userId, projectId);
}
