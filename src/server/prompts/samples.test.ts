import { afterEach, describe, expect, it } from "vitest";
import { extractVariablesFromTexts } from "@/lib/prompts/template";
import {
  DUMMY_DEFAULT_USER_ID,
  ensureDummyUsers,
} from "@/server/auth/dummy/users";
import { createPgliteDatabase } from "@/server/db/pglite";
import { resetAndSeed } from "@/server/dummy/reset";
import { listPrompts } from "./repository";
import { listWorkspaceRuns } from "./runs";
import { samplePromptCatalog } from "./samples";
import { getPromptDetail } from "./versions";

describe("sample prompts", () => {
  const databases: Array<{ close: () => Promise<void> }> = [];

  afterEach(async () => {
    await Promise.all(databases.splice(0).map((database) => database.close()));
  });

  it("seeds a small playground catalog for the dummy user", async () => {
    const db = await openDatabase();
    await resetAndSeed(db, DUMMY_DEFAULT_USER_ID);

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

  it("seeds playground and api runs so logs are not empty", async () => {
    const db = await openDatabase();
    await resetAndSeed(db, DUMMY_DEFAULT_USER_ID);
    await resetAndSeed(db, DUMMY_DEFAULT_USER_ID);

    const workspace = await listWorkspaceRuns(db, DUMMY_DEFAULT_USER_ID, {
      limit: 50,
    });
    const expected = samplePromptCatalog.flatMap((sample) =>
      sample.runs.map((run) => ({
        id: run.id,
        promptTitle: sample.title,
        source: run.source,
      })),
    );
    expect(workspace.runs).toHaveLength(expected.length);
    expect(
      workspace.runs.map((run) => ({
        id: run.id,
        promptTitle: run.promptTitle,
        source: run.source,
      })),
    ).toEqual(expect.arrayContaining(expected));
    expect(new Set(workspace.runs.map((run) => run.source))).toEqual(
      new Set(["playground", "api"]),
    );
  });

  async function openDatabase() {
    const db = await createPgliteDatabase();
    await ensureDummyUsers(db);
    databases.push({ close: () => db.$client.close() });
    return db;
  }
});
