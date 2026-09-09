import { afterEach, describe, expect, it } from "vitest";
import {
  DUMMY_DEFAULT_USER_ID,
  ensureDummyUsers,
} from "@/server/auth/dummy/users";
import { createPgliteDatabase } from "@/server/db/pglite";
import { createPrompt } from "./repository";
import {
  getPromptDetail,
  listPromptVersions,
  savePromptVersion,
} from "./versions";

const agentId = DUMMY_DEFAULT_USER_ID;

describe("prompt versions", () => {
  const databases: Array<{ close: () => Promise<void> }> = [];

  afterEach(async () => {
    await Promise.all(databases.splice(0).map((database) => database.close()));
  });

  it("creates version 1 with system and user messages", async () => {
    const db = await openDatabase();
    const prompt = await createPrompt(db, agentId, {
      title: "Greeting",
      body: "Say hello",
    });

    const detail = await getPromptDetail(db, agentId, prompt.id);
    expect(detail.version.versionNumber).toBe(1);
    expect(detail.version.model).toBe("gpt-4.1");
    expect(detail.messages.map((message) => message.role)).toEqual([
      "system",
      "user",
    ]);
    expect(detail.messages[1]?.content).toBe("Say hello");
  });

  it("saves a new version in the changelog", async () => {
    const db = await openDatabase();
    const prompt = await createPrompt(db, agentId, {
      title: "Greeting",
      body: "Say hello",
    });

    await savePromptVersion(db, agentId, prompt.id, {
      title: "Greeting",
      model: "claude-sonnet-4",
      note: "Switch model",
      messages: [
        { role: "system", content: "You are terse." },
        { role: "user", content: "Say hello in one word." },
      ],
    });

    const versions = await listPromptVersions(db, agentId, prompt.id);
    expect(versions.map((version) => version.versionNumber)).toEqual([2, 1]);
    expect(versions[0]?.model).toBe("claude-sonnet-4");
    expect(versions[0]?.note).toBe("Switch model");
  });

  async function openDatabase() {
    const db = await createPgliteDatabase();
    await ensureDummyUsers(db);
    databases.push({ close: () => db.$client.close() });
    return db;
  }
});
