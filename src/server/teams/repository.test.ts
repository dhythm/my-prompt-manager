import { afterEach, describe, expect, it } from "vitest";
import { t } from "@/lib/i18n/t";
import {
  DUMMY_DEFAULT_USER_ID,
  dummyUsers,
  ensureDummyUsers,
} from "@/server/auth/dummy/users";
import { createPgliteDatabase } from "@/server/db/pglite";
import {
  acceptInvite,
  createInvite,
  createTeam,
  listPendingInvites,
  listTeams,
} from "./repository";

const agentId = DUMMY_DEFAULT_USER_ID;
const developerId = dummyUsers[1].id;

describe("teams repository", () => {
  const databases: Array<{ close: () => Promise<void> }> = [];

  afterEach(async () => {
    await Promise.all(databases.splice(0).map((database) => database.close()));
  });

  it("makes the creator the team owner", async () => {
    const db = await openDatabase();
    const team = await createTeam(db, agentId, { name: "Core" });

    const teams = await listTeams(db, agentId);
    expect(teams).toEqual([
      {
        id: team.id,
        name: "Core",
        role: "owner",
      },
    ]);
    await expect(listTeams(db, developerId)).resolves.toEqual([]);
  });

  it("accepts an invite and adds the user as a member", async () => {
    const db = await openDatabase();
    const team = await createTeam(db, agentId, { name: "Core" });
    const invite = await createInvite(db, agentId, team.id, {
      email: "dev@local.test",
    });

    const pending = await listPendingInvites(db, "dev@local.test");
    expect(pending.map((item) => item.id)).toEqual([invite.id]);

    await acceptInvite(db, developerId, invite.id);
    await expect(listTeams(db, developerId)).resolves.toEqual([
      {
        id: team.id,
        name: "Core",
        role: "member",
      },
    ]);
    await expect(listPendingInvites(db, "dev@local.test")).resolves.toEqual([]);
  });

  it("rejects invites from non-owners", async () => {
    const db = await openDatabase();
    const team = await createTeam(db, agentId, { name: "Core" });

    await expect(
      createInvite(db, developerId, team.id, { email: "dev@local.test" }),
    ).rejects.toThrowError(t("error.notTeamOwner"));
  });

  async function openDatabase() {
    const db = await createPgliteDatabase();
    await ensureDummyUsers(db);
    databases.push({ close: () => db.$client.close() });
    return db;
  }
});
