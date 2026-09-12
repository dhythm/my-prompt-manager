import { afterEach, describe, expect, it } from "vitest";
import {
  DUMMY_DEFAULT_USER_ID,
  dummyUsers,
  ensureDummyUsers,
  listDummyUsers,
} from "@/server/auth/dummy/users";
import { createPgliteDatabase } from "@/server/db/pglite";
import { createPrompt, listPrompts } from "@/server/prompts/repository";
import { listWorkspaceRuns } from "@/server/prompts/runs";
import { samplePromptCatalog } from "@/server/prompts/samples";
import { createTeam, listTeams } from "@/server/teams/repository";
import { resetAndSeed, seedIfEmpty } from "./reset";

describe("resetAndSeed", () => {
  const databases: Array<{ close: () => Promise<void> }> = [];

  afterEach(async () => {
    await Promise.all(databases.splice(0).map((database) => database.close()));
  });

  it("wipes arbitrary catalog rows and restores sample ids", async () => {
    const db = await openDatabase();
    const team = await createTeam(db, DUMMY_DEFAULT_USER_ID, {
      name: "Ad hoc QA",
    });
    await createPrompt(db, DUMMY_DEFAULT_USER_ID, {
      title: "Scratch pad",
      body: "do not keep",
      teamId: team.id,
    });

    await resetAndSeed(db, DUMMY_DEFAULT_USER_ID);

    await expect(listTeams(db, DUMMY_DEFAULT_USER_ID)).resolves.toEqual([]);
    const listed = await listPrompts(db, DUMMY_DEFAULT_USER_ID);
    expect(listed.map((prompt) => prompt.id)).toEqual(
      samplePromptCatalog.map((sample) => sample.id),
    );
    expect(listed.map((prompt) => prompt.title)).toEqual(
      samplePromptCatalog.map((sample) => sample.title),
    );
    expect(listed.map((prompt) => prompt.title)).not.toContain("Scratch pad");

    const emails = (await listDummyUsers(db)).map((user) => user.email);
    expect(emails).toEqual(dummyUsers.map((user) => user.email));
  });

  it("is idempotent on prompt and run ids", async () => {
    const db = await openDatabase();
    await resetAndSeed(db, DUMMY_DEFAULT_USER_ID);
    await resetAndSeed(db, DUMMY_DEFAULT_USER_ID);

    const listed = await listPrompts(db, DUMMY_DEFAULT_USER_ID);
    expect(listed.map((prompt) => prompt.id)).toEqual(
      samplePromptCatalog.map((sample) => sample.id),
    );

    const workspace = await listWorkspaceRuns(db, DUMMY_DEFAULT_USER_ID, {
      limit: 50,
    });
    expect(workspace.runs.map((run) => run.id).sort()).toEqual(
      samplePromptCatalog
        .flatMap((sample) => sample.runs.map((run) => run.id))
        .sort(),
    );
  });

  it("inserts the catalog when prompts are empty", async () => {
    const db = await openDatabase();
    const result = await seedIfEmpty(db, DUMMY_DEFAULT_USER_ID);
    expect(result).toEqual({ seeded: true });
    const listed = await listPrompts(db, DUMMY_DEFAULT_USER_ID);
    expect(listed.map((prompt) => prompt.id)).toEqual(
      samplePromptCatalog.map((sample) => sample.id),
    );
  });

  it("does not write when any prompt exists", async () => {
    const db = await openDatabase();
    const created = await createPrompt(db, DUMMY_DEFAULT_USER_ID, {
      title: "Keep me",
      body: "existing work",
    });

    const result = await seedIfEmpty(db, DUMMY_DEFAULT_USER_ID);
    expect(result).toEqual({ seeded: false });

    const listed = await listPrompts(db, DUMMY_DEFAULT_USER_ID);
    expect(listed).toHaveLength(1);
    expect(listed[0].id).toBe(created.id);
    expect(listed[0].title).toBe("Keep me");
  });

  async function openDatabase() {
    const db = await createPgliteDatabase();
    await ensureDummyUsers(db);
    databases.push({ close: () => db.$client.close() });
    return db;
  }
});
