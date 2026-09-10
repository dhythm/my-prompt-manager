import { afterEach, describe, expect, it } from "vitest";
import { t } from "@/lib/i18n/t";
import {
  DUMMY_DEFAULT_USER_ID,
  dummyUsers,
  ensureDummyUsers,
} from "@/server/auth/dummy/users";
import { createPgliteDatabase } from "@/server/db/pglite";
import { createProject, listProjects } from "@/server/projects/repository";
import { createTeam } from "@/server/teams/repository";
import { copyPromptToProject } from "./copy";
import { createPrompt, listPrompts } from "./repository";
import { createPromptRun, listPromptRuns } from "./runs";
import {
  getPromptDetail,
  listPromptVersions,
  savePromptVersion,
} from "./versions";

const agentId = DUMMY_DEFAULT_USER_ID;
const developerId = dummyUsers[1].id;

describe("copyPromptToProject", () => {
  const databases: Array<{ close: () => Promise<void> }> = [];

  afterEach(async () => {
    await Promise.all(databases.splice(0).map((database) => database.close()));
  });

  it("deep-copies every version and message into the target project", async () => {
    const db = await openDatabase();
    const defaults = await listProjects(db, agentId);
    const production = await createProject(db, agentId, {
      name: "Production",
    });
    const development = defaults[0];
    if (!development) {
      throw new Error("expected a default project");
    }

    const source = await createPrompt(db, agentId, {
      title: "Greeting",
      body: "Say hello",
      projectId: development.id,
    });
    await savePromptVersion(db, agentId, source.id, {
      title: "Greeting",
      model: "claude-sonnet-4",
      note: "Tighten",
      messages: [
        { role: "system", content: "You are terse." },
        { role: "user", content: "Say hello in one word." },
      ],
    });
    await createPromptRun(db, agentId, source.id, {
      completeChat: async () => ({
        text: "copied-run",
        inputTokens: 1,
        outputTokens: 1,
      }),
    });

    const copied = await copyPromptToProject(
      db,
      agentId,
      source.id,
      production.id,
    );

    expect(copied.id).not.toBe(source.id);
    expect(copied.title).toBe("Greeting");
    expect(copied.projectId).toBe(production.id);
    expect(copied.ownerUserId).toBe(agentId);
    expect(copied.teamId).toBeNull();

    const sourceVersions = await listPromptVersions(db, agentId, source.id);
    const copiedVersions = await listPromptVersions(db, agentId, copied.id);
    expect(copiedVersions.map((version) => version.versionNumber)).toEqual(
      sourceVersions.map((version) => version.versionNumber),
    );
    expect(copiedVersions.map((version) => version.id)).not.toEqual(
      sourceVersions.map((version) => version.id),
    );
    expect(copiedVersions[0]?.note).toBe("Tighten");
    expect(copiedVersions[0]?.model).toBe("claude-sonnet-4");

    const sourceDetail = await getPromptDetail(db, agentId, source.id);
    const copiedDetail = await getPromptDetail(db, agentId, copied.id);
    expect(copiedDetail.messages.map((message) => message.content)).toEqual(
      sourceDetail.messages.map((message) => message.content),
    );
    expect(copiedDetail.messages.map((message) => message.id)).not.toEqual(
      sourceDetail.messages.map((message) => message.id),
    );

    expect((await listPromptRuns(db, agentId, copied.id)).runs).toEqual([]);
    expect((await listPromptRuns(db, agentId, source.id)).runs).toHaveLength(1);

    const listed = await listPrompts(db, agentId, production.id);
    expect(listed.map((prompt) => prompt.id)).toEqual([copied.id]);
  });

  it("copies into a team project with that project's ownership", async () => {
    const db = await openDatabase();
    const team = await createTeam(db, agentId, { name: "Core" });
    const production = await createProject(db, agentId, {
      name: "Production",
      teamId: team.id,
    });
    const source = await createPrompt(db, agentId, {
      title: "Shared later",
      body: "v1",
    });

    const copied = await copyPromptToProject(
      db,
      agentId,
      source.id,
      production.id,
    );
    expect(copied.ownerUserId).toBeNull();
    expect(copied.teamId).toBe(team.id);
    expect(copied.projectId).toBe(production.id);
  });

  it("hides another user's personal prompt from copy", async () => {
    const db = await openDatabase();
    const source = await createPrompt(db, agentId, {
      title: "Secret",
      body: "nope",
    });
    const [developerDefault] = await listProjects(db, developerId);
    if (!developerDefault) {
      throw new Error("expected a default project");
    }

    await expect(
      copyPromptToProject(db, developerId, source.id, developerDefault.id),
    ).rejects.toThrowError(t("error.promptNotFound"));
  });

  async function openDatabase() {
    const db = await createPgliteDatabase();
    await ensureDummyUsers(db);
    databases.push({ close: () => db.$client.close() });
    return db;
  }
});
