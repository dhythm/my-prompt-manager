import { randomBytes } from "node:crypto";
import { and, eq } from "drizzle-orm";
import { teamInvites, teamMembers, teams, users } from "@/server/db/schema";
import type { AppDatabase } from "@/server/db/types";
import {
  createConflictError,
  createForbiddenError,
  createNotFoundError,
} from "@/server/errors";
import { assertOwner, requireTeam } from "./membership";

const INVITE_TTL_MS = 1000 * 60 * 60 * 24 * 14;

export async function createTeam(
  db: AppDatabase,
  userId: string,
  input: { name: string },
) {
  const [team] = await db
    .insert(teams)
    .values({
      name: input.name,
      createdByUserId: userId,
    })
    .returning();

  if (!team) {
    throw new Error("Failed to create team");
  }

  await db.insert(teamMembers).values({
    teamId: team.id,
    userId,
    role: "owner",
  });

  return team;
}

export async function listTeams(db: AppDatabase, userId: string) {
  const records = await db
    .select({
      id: teams.id,
      name: teams.name,
      role: teamMembers.role,
    })
    .from(teamMembers)
    .innerJoin(teams, eq(teams.id, teamMembers.teamId))
    .where(eq(teamMembers.userId, userId))
    .orderBy(teams.name);

  return records;
}

export async function createInvite(
  db: AppDatabase,
  userId: string,
  teamId: string,
  input: { email: string },
) {
  await requireTeam(db, teamId);
  await assertOwner(db, userId, teamId);

  const email = input.email.trim().toLowerCase();
  const [existingUser] = await db
    .select()
    .from(users)
    .where(eq(users.email, email))
    .limit(1);

  if (existingUser) {
    const [membership] = await db
      .select()
      .from(teamMembers)
      .where(
        and(
          eq(teamMembers.teamId, teamId),
          eq(teamMembers.userId, existingUser.id),
        ),
      )
      .limit(1);
    if (membership) {
      throw createConflictError("User is already a team member");
    }
  }

  const [pending] = await db
    .select()
    .from(teamInvites)
    .where(
      and(
        eq(teamInvites.teamId, teamId),
        eq(teamInvites.email, email),
        eq(teamInvites.status, "pending"),
      ),
    )
    .limit(1);

  if (pending) {
    throw createConflictError("Invite already pending");
  }

  const [invite] = await db
    .insert(teamInvites)
    .values({
      teamId,
      email,
      invitedByUserId: userId,
      status: "pending",
      token: randomBytes(16).toString("hex"),
      expiresAt: new Date(Date.now() + INVITE_TTL_MS),
    })
    .returning();

  if (!invite) {
    throw new Error("Failed to create invite");
  }

  return invite;
}

export async function listPendingInvites(db: AppDatabase, email: string) {
  return db
    .select({
      id: teamInvites.id,
      teamId: teamInvites.teamId,
      teamName: teams.name,
      email: teamInvites.email,
      expiresAt: teamInvites.expiresAt,
    })
    .from(teamInvites)
    .innerJoin(teams, eq(teams.id, teamInvites.teamId))
    .where(
      and(
        eq(teamInvites.email, email.trim().toLowerCase()),
        eq(teamInvites.status, "pending"),
      ),
    );
}

export async function acceptInvite(
  db: AppDatabase,
  userId: string,
  inviteId: string,
) {
  const [user] = await db
    .select()
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);
  if (!user) {
    throw createNotFoundError("User not found");
  }

  const [invite] = await db
    .select()
    .from(teamInvites)
    .where(eq(teamInvites.id, inviteId))
    .limit(1);

  if (invite?.status !== "pending") {
    throw createNotFoundError("Invite not found");
  }

  if (invite.email !== user.email.toLowerCase()) {
    throw createForbiddenError("Invite is for a different email");
  }

  if (invite.expiresAt.getTime() <= Date.now()) {
    throw createForbiddenError("Invite has expired");
  }

  await db.insert(teamMembers).values({
    teamId: invite.teamId,
    userId,
    role: "member",
  });

  const [updated] = await db
    .update(teamInvites)
    .set({ status: "accepted", updatedAt: new Date() })
    .where(eq(teamInvites.id, inviteId))
    .returning();

  return updated;
}
