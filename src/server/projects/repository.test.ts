import { eq } from "drizzle-orm";
import { afterEach, describe, expect, it } from "vitest";
import { t } from "@/lib/i18n/t";
import {
  DUMMY_DEFAULT_USER_ID,
  dummyUsers,
  ensureDummyUsers,
} from "@/server/auth/dummy/users";
import { createPgliteDatabase } from "@/server/db/pglite";
import { projects } from "@/server/db/schema";
import { createPrompt } from "@/server/prompts/repository";
import {
  acceptInvite,
  createInvite,
  createTeam,
} from "@/server/teams/repository";
import {
  createProject,
  deleteProject,
  listProjects,
  renameProject,
} from "./repository";

const agentId = DUMMY_DEFAULT_USER_ID;
const developerId = dummyUsers[1].id;

describe("projects repository", () => {
  const databases: Array<{ close: () => Promise<void> }> = [];

  afterEach(async () => {
    await Promise.all(databases.splice(0).map((database) => database.close()));
  });

  it("creates a default personal project when listing", async () => {
    const db = await openDatabase();
    const projects = await listProjects(db, agentId);

    expect(projects).toEqual([
      expect.objectContaining({
        name: t("project.defaultName"),
        ownerUserId: agentId,
        teamId: null,
        teamName: null,
      }),
    ]);
    await expect(listProjects(db, developerId)).resolves.toEqual([
      expect.objectContaining({
        name: t("project.defaultName"),
        ownerUserId: developerId,
        teamId: null,
      }),
    ]);
  });

  it("lists newer projects first and includes createdAt", async () => {
    const db = await openDatabase();
    const [personal] = await listProjects(db, agentId);
    const older = await createProject(db, agentId, { name: "A-old" });
    const newer = await createProject(db, agentId, { name: "Z-new" });
    await db
      .update(projects)
      .set({ createdAt: new Date("2026-01-01T00:00:00.000Z") })
      .where(eq(projects.id, personal.id));
    await db
      .update(projects)
      .set({ createdAt: new Date("2026-01-02T00:00:00.000Z") })
      .where(eq(projects.id, older.id));
    await db
      .update(projects)
      .set({ createdAt: new Date("2026-01-03T00:00:00.000Z") })
      .where(eq(projects.id, newer.id));

    const listed = await listProjects(db, agentId);
    expect(listed.map((project) => project.id)).toEqual([
      newer.id,
      older.id,
      personal.id,
    ]);
    expect(listed[2]?.name).toBe(t("project.defaultName"));
    expect(listed[0]?.createdAt).toMatch(/^\d{4}-\d{2}-\d{2}T/);
  });

  it("creates a personal project and lists it for the owner only", async () => {
    const db = await openDatabase();
    await listProjects(db, agentId);
    const created = await createProject(db, agentId, { name: "Development" });

    const agentProjects = await listProjects(db, agentId);
    expect(agentProjects.map((project) => project.name)).toEqual(
      expect.arrayContaining([t("project.defaultName"), "Development"]),
    );
    expect(agentProjects).toHaveLength(2);
    expect(created.ownerUserId).toBe(agentId);
    expect(created.teamId).toBeNull();

    const developerProjects = await listProjects(db, developerId);
    expect(developerProjects.map((project) => project.id)).not.toContain(
      created.id,
    );
  });

  it("lets team members list team projects", async () => {
    const db = await openDatabase();
    const team = await createTeam(db, agentId, { name: "Core" });
    const invite = await createInvite(db, agentId, team.id, {
      email: "dev@local.test",
    });
    await acceptInvite(db, developerId, invite.id);

    const production = await createProject(db, agentId, {
      name: "Production",
      teamId: team.id,
    });

    const developerProjects = await listProjects(db, developerId);
    expect(developerProjects.map((project) => project.id)).toContain(
      production.id,
    );
    expect(
      developerProjects.find((project) => project.id === production.id),
    ).toMatchObject({
      name: "Production",
      teamId: team.id,
      teamName: "Core",
      ownerUserId: null,
    });
  });

  it("hides team projects from non-members", async () => {
    const db = await openDatabase();
    const team = await createTeam(db, agentId, { name: "Core" });
    const production = await createProject(db, agentId, {
      name: "Production",
      teamId: team.id,
    });

    const developerProjects = await listProjects(db, developerId);
    expect(developerProjects.map((project) => project.id)).not.toContain(
      production.id,
    );
  });

  it("renames a project the user can write", async () => {
    const db = await openDatabase();
    const created = await createProject(db, agentId, { name: "Dev" });
    const renamed = await renameProject(db, agentId, created.id, {
      name: "Development",
    });
    expect(renamed.name).toBe("Development");
  });

  it("rejects rename from a non-owner", async () => {
    const db = await openDatabase();
    const created = await createProject(db, agentId, { name: "Dev" });
    await expect(
      renameProject(db, developerId, created.id, { name: "Stolen" }),
    ).rejects.toThrowError(t("error.projectNotFound"));
  });

  it("deletes an empty project", async () => {
    const db = await openDatabase();
    const created = await createProject(db, agentId, { name: "Scratch" });
    await deleteProject(db, agentId, created.id);
    const remaining = await listProjects(db, agentId);
    expect(remaining.map((project) => project.id)).not.toContain(created.id);
  });

  it("rejects deleting a project that still has prompts", async () => {
    const db = await openDatabase();
    const created = await createProject(db, agentId, { name: "Busy" });
    await createPrompt(db, agentId, {
      title: "Keep me",
      body: "body",
      projectId: created.id,
    });

    await expect(deleteProject(db, agentId, created.id)).rejects.toThrowError(
      t("error.projectNotEmpty"),
    );
  });

  async function openDatabase() {
    const db = await createPgliteDatabase();
    await ensureDummyUsers(db);
    databases.push({ close: () => db.$client.close() });
    return db;
  }
});
