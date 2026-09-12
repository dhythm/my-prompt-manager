import {
  and,
  asc,
  count,
  desc,
  eq,
  inArray,
  isNotNull,
  isNull,
  or,
} from "drizzle-orm";
import { t } from "@/lib/i18n/t";
import type { CreateProjectInput } from "@/lib/projects/types";
import { projects, prompts, teamMembers, teams } from "@/server/db/schema";
import type { AppDatabase } from "@/server/db/types";
import { createConflictError, createNotFoundError } from "@/server/errors";
import { assertMember } from "@/server/teams/membership";
import { getWritableProject } from "./access";

export async function listProjects(db: AppDatabase, userId: string) {
  await ensureDefaultProjects(db, userId);
  return selectVisibleProjects(db, userId);
}

export async function createProject(
  db: AppDatabase,
  userId: string,
  input: CreateProjectInput,
) {
  if (input.teamId) {
    await assertMember(db, userId, input.teamId);
  }

  return insertProject(db, {
    name: input.name,
    ownerUserId: input.teamId ? null : userId,
    teamId: input.teamId ?? null,
    createdByUserId: userId,
  });
}

export async function renameProject(
  db: AppDatabase,
  userId: string,
  projectId: string,
  input: { name: string },
) {
  await getWritableProject(db, userId, projectId);
  const [updated] = await db
    .update(projects)
    .set({
      name: input.name,
      updatedAt: new Date(),
    })
    .where(eq(projects.id, projectId))
    .returning();

  if (!updated) {
    throw new Error(t("error.projectRenameFailed"));
  }

  return updated;
}

export async function deleteProject(
  db: AppDatabase,
  userId: string,
  projectId: string,
) {
  await getWritableProject(db, userId, projectId);
  const [usage] = await db
    .select({ total: count() })
    .from(prompts)
    .where(eq(prompts.projectId, projectId));

  if ((usage?.total ?? 0) > 0) {
    throw createConflictError(t("error.projectNotEmpty"));
  }

  const [deleted] = await db
    .delete(projects)
    .where(eq(projects.id, projectId))
    .returning();

  if (!deleted) {
    throw createNotFoundError(t("error.projectNotFound"));
  }

  return deleted;
}

async function ensureDefaultProjects(db: AppDatabase, userId: string) {
  await ensureOwnedProject(db, {
    ownerUserId: userId,
    teamId: null,
    createdByUserId: userId,
  });

  const memberships = await db
    .select({ teamId: teamMembers.teamId })
    .from(teamMembers)
    .where(eq(teamMembers.userId, userId));

  for (const membership of memberships) {
    await ensureOwnedProject(db, {
      ownerUserId: null,
      teamId: membership.teamId,
      createdByUserId: userId,
    });
  }
}

export async function ensureDefaultProjectForOwnership(
  db: AppDatabase,
  input: {
    ownerUserId: string | null;
    teamId: string | null;
    createdByUserId: string;
  },
) {
  return ensureOwnedProject(db, input);
}

export async function resolveProjectForCreate(
  db: AppDatabase,
  userId: string,
  input: { projectId?: string; teamId?: string },
) {
  if (input.projectId) {
    return getWritableProject(db, userId, input.projectId);
  }
  if (input.teamId) {
    await assertMember(db, userId, input.teamId);
    return ensureOwnedProject(db, {
      ownerUserId: null,
      teamId: input.teamId,
      createdByUserId: userId,
    });
  }
  return ensureOwnedProject(db, {
    ownerUserId: userId,
    teamId: null,
    createdByUserId: userId,
  });
}

async function ensureOwnedProject(
  db: AppDatabase,
  input: {
    ownerUserId: string | null;
    teamId: string | null;
    createdByUserId: string;
  },
) {
  const [existing] = await db
    .select()
    .from(projects)
    .where(
      input.teamId
        ? eq(projects.teamId, input.teamId)
        : and(
            eq(projects.ownerUserId, input.ownerUserId ?? ""),
            isNull(projects.teamId),
          ),
    )
    .orderBy(asc(projects.createdAt), asc(projects.id))
    .limit(1);

  if (existing) {
    return existing;
  }

  return insertProject(db, {
    name: t("project.defaultName"),
    ownerUserId: input.ownerUserId,
    teamId: input.teamId,
    createdByUserId: input.createdByUserId,
  });
}

async function insertProject(
  db: AppDatabase,
  input: {
    name: string;
    ownerUserId: string | null;
    teamId: string | null;
    createdByUserId: string;
  },
) {
  const [project] = await db
    .insert(projects)
    .values({
      name: input.name,
      ownerUserId: input.ownerUserId,
      teamId: input.teamId,
      createdByUserId: input.createdByUserId,
    })
    .returning();

  if (!project) {
    throw new Error(t("error.projectCreateFailed"));
  }

  return project;
}

async function selectVisibleProjects(db: AppDatabase, userId: string) {
  const memberTeams = db
    .select({ teamId: teamMembers.teamId })
    .from(teamMembers)
    .where(eq(teamMembers.userId, userId));

  const rows = await db
    .select({
      id: projects.id,
      name: projects.name,
      ownerUserId: projects.ownerUserId,
      teamId: projects.teamId,
      teamName: teams.name,
      createdAt: projects.createdAt,
    })
    .from(projects)
    .leftJoin(teams, eq(teams.id, projects.teamId))
    .where(
      or(
        eq(projects.ownerUserId, userId),
        and(isNotNull(projects.teamId), inArray(projects.teamId, memberTeams)),
      ),
    )
    .orderBy(desc(projects.createdAt), desc(projects.id));

  return rows.map((row) => ({
    ...row,
    createdAt: row.createdAt.toISOString(),
  }));
}
