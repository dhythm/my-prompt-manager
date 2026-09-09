import { afterEach, describe, expect, it } from "vitest";
import {
  DUMMY_DEFAULT_USER_ID,
  dummyUsers,
  ensureDummyUsers,
} from "@/server/auth/dummy/users";
import { createPgliteDatabase } from "@/server/db/pglite";
import { prompts } from "@/server/db/schema";
import {
  acceptInvite,
  createInvite,
  createTeam,
} from "@/server/teams/repository";
import {
  createPrompt,
  listPrompts,
  transferPrompt,
  updatePrompt,
} from "./repository";

const agentId = DUMMY_DEFAULT_USER_ID;
const developerId = dummyUsers[1].id;

describe("prompts repository", () => {
  const databases: Array<{ close: () => Promise<void> }> = [];

  afterEach(async () => {
    await Promise.all(databases.splice(0).map((database) => database.close()));
  });

  it("returns an empty list when the user has no prompts", async () => {
    const db = await openDatabase();
    await expect(listPrompts(db, agentId)).resolves.toEqual([]);
  });

  it("hides personal prompts from other users", async () => {
    const db = await openDatabase();
    await createPrompt(db, agentId, { title: "Agent only", body: "secret" });

    const agentPrompts = await listPrompts(db, agentId);
    expect(agentPrompts).toHaveLength(1);
    await expect(listPrompts(db, developerId)).resolves.toEqual([]);
  });

  it("lets team members list and update team prompts", async () => {
    const db = await openDatabase();
    const team = await createTeam(db, agentId, { name: "Core" });
    const invite = await createInvite(db, agentId, team.id, {
      email: "dev@local.test",
    });
    await acceptInvite(db, developerId, invite.id);

    const created = await createPrompt(db, agentId, {
      title: "Shared",
      body: "v1",
      teamId: team.id,
    });

    const listed = await listPrompts(db, developerId);
    expect(listed.map((prompt) => prompt.title)).toEqual(["Shared"]);

    const updated = await updatePrompt(db, developerId, created.id, {
      title: "Shared",
      body: "v2",
    });
    expect(updated.body).toBe("v2");
  });

  it("hides team prompts from non-members", async () => {
    const db = await openDatabase();
    const team = await createTeam(db, agentId, { name: "Core" });
    await createPrompt(db, agentId, {
      title: "Shared",
      body: "v1",
      teamId: team.id,
    });

    await expect(listPrompts(db, developerId)).resolves.toEqual([]);
  });

  it("transfers a personal prompt to a team the owner belongs to", async () => {
    const db = await openDatabase();
    const team = await createTeam(db, agentId, { name: "Core" });
    const created = await createPrompt(db, agentId, {
      title: "Move me",
      body: "personal",
    });

    const transferred = await transferPrompt(db, agentId, created.id, team.id);
    expect(transferred.ownerUserId).toBeNull();
    expect(transferred.teamId).toBe(team.id);
    expect(transferred.projectId).toBeTruthy();

    const invite = await createInvite(db, agentId, team.id, {
      email: "dev@local.test",
    });
    await acceptInvite(db, developerId, invite.id);
    await expect(listPrompts(db, developerId)).resolves.toHaveLength(1);
  });

  it("lists prompts newest first for the current user", async () => {
    const db = await openDatabase();
    const older = new Date("2026-01-01T00:00:00.000Z");
    const newer = new Date("2026-01-02T00:00:00.000Z");

    await db.insert(prompts).values([
      {
        title: "Old",
        body: "Older body",
        ownerUserId: agentId,
        createdByUserId: agentId,
        createdAt: older,
        updatedAt: older,
      },
      {
        title: "New",
        body: "Newer body",
        ownerUserId: agentId,
        createdByUserId: agentId,
        createdAt: newer,
        updatedAt: newer,
      },
    ]);

    const listed = await listPrompts(db, agentId);
    expect(listed.map((prompt) => prompt.title)).toEqual(["New", "Old"]);
  });

  async function openDatabase() {
    const db = await createPgliteDatabase();
    await ensureDummyUsers(db);
    databases.push({ close: () => db.$client.close() });
    return db;
  }
});
