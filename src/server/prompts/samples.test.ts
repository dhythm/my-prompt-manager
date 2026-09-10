import { afterEach, describe, expect, it } from "vitest";
import { extractVariablesFromTexts } from "@/lib/prompts/template";
import {
  DUMMY_DEFAULT_USER_ID,
  ensureDummyUsers,
} from "@/server/auth/dummy/users";
import { createPgliteDatabase } from "@/server/db/pglite";
import { listProjects } from "@/server/projects/repository";
import { createTeam, listTeams } from "@/server/teams/repository";
import { createPrompt, listPrompts } from "./repository";
import { samplePromptCatalog } from "./samples";
import { ensureSamplePrompts } from "./seed-samples";
import { getPromptDetail } from "./versions";

describe("sample prompts", () => {
  const databases: Array<{ close: () => Promise<void> }> = [];

  afterEach(async () => {
    await Promise.all(databases.splice(0).map((database) => database.close()));
  });

  it("seeds a small playground catalog for the dummy user", async () => {
    const db = await openDatabase();
    await ensureSamplePrompts(db, DUMMY_DEFAULT_USER_ID);

    const listed = await listPrompts(db, DUMMY_DEFAULT_USER_ID);
    expect(listed.map((prompt) => prompt.title)).toEqual(
      samplePromptCatalog.map((sample) => sample.title),
    );
    expect(new Set(listed.map((prompt) => prompt.model)).size).toBe(
      samplePromptCatalog.length,
    );

    const detail = await getPromptDetail(
      db,
      DUMMY_DEFAULT_USER_ID,
      listed[0].id,
    );
    const variables = extractVariablesFromTexts(
      detail.messages.map((message) => message.content),
    );
    expect(variables.length).toBeGreaterThan(0);
  });

  it("is idempotent and removes leftover e2e titles", async () => {
    const db = await openDatabase();
    await createPrompt(db, DUMMY_DEFAULT_USER_ID, {
      title: "Greeting",
      body: "Say hello",
    });
    await createPrompt(db, DUMMY_DEFAULT_USER_ID, {
      title: "無題",
      body: "",
    });
    await ensureSamplePrompts(db, DUMMY_DEFAULT_USER_ID);
    await ensureSamplePrompts(db, DUMMY_DEFAULT_USER_ID);

    const listed = await listPrompts(db, DUMMY_DEFAULT_USER_ID);
    expect(listed).toHaveLength(samplePromptCatalog.length);
    expect(listed.map((prompt) => prompt.title)).not.toContain("Greeting");
    expect(listed.map((prompt) => prompt.title)).not.toContain("無題");
  });

  it("removes leftover e2e workspaces", async () => {
    const db = await openDatabase();
    const team = await createTeam(db, DUMMY_DEFAULT_USER_ID, {
      name: "Core 1788952250858",
    });
    await createPrompt(db, DUMMY_DEFAULT_USER_ID, {
      title: "Team leftover",
      body: "gone",
      teamId: team.id,
    });
    await ensureSamplePrompts(db, DUMMY_DEFAULT_USER_ID);

    await expect(listTeams(db, DUMMY_DEFAULT_USER_ID)).resolves.toEqual([]);
    const projects = await listProjects(db, DUMMY_DEFAULT_USER_ID);
    expect(projects.every((project) => project.teamId === null)).toBe(true);
  });

  async function openDatabase() {
    const db = await createPgliteDatabase();
    await ensureDummyUsers(db);
    databases.push({ close: () => db.$client.close() });
    return db;
  }
});
