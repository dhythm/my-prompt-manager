import { and, eq } from "drizzle-orm";
import { t } from "@/lib/i18n/t";
import { teamMembers, teams } from "@/server/db/schema";
import type { AppDatabase } from "@/server/db/types";
import { createForbiddenError, createNotFoundError } from "@/server/errors";

async function getMembership(db: AppDatabase, userId: string, teamId: string) {
  const [membership] = await db
    .select()
    .from(teamMembers)
    .where(and(eq(teamMembers.teamId, teamId), eq(teamMembers.userId, userId)))
    .limit(1);

  return membership;
}

export async function assertMember(
  db: AppDatabase,
  userId: string,
  teamId: string,
) {
  const membership = await getMembership(db, userId, teamId);
  if (!membership) {
    throw createForbiddenError(t("error.notTeamMember"));
  }
  return membership;
}

export async function assertOwner(
  db: AppDatabase,
  userId: string,
  teamId: string,
) {
  const membership = await getMembership(db, userId, teamId);
  if (membership?.role !== "owner") {
    throw createForbiddenError(t("error.notTeamOwner"));
  }
  return membership;
}

export async function requireTeam(db: AppDatabase, teamId: string) {
  const [team] = await db
    .select()
    .from(teams)
    .where(eq(teams.id, teamId))
    .limit(1);
  if (!team) {
    throw createNotFoundError(t("error.teamNotFound"));
  }
  return team;
}
