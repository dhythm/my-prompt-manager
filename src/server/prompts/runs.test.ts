import { afterEach, describe, expect, it } from "vitest";
import {
  DUMMY_DEFAULT_USER_ID,
  dummyUsers,
  ensureDummyUsers,
} from "@/server/auth/dummy/users";
import { createPgliteDatabase } from "@/server/db/pglite";
import { createPrompt } from "./repository";
import { createPromptRun, listPromptRuns } from "./runs";

const agentId = DUMMY_DEFAULT_USER_ID;
const developerId = dummyUsers[1].id;

describe("prompt runs", () => {
  const databases: Array<{ close: () => Promise<void> }> = [];

  afterEach(async () => {
    await Promise.all(databases.splice(0).map((database) => database.close()));
  });

  it("records an execution log for a prompt the user can access", async () => {
    const db = await openDatabase();
    const prompt = await createPrompt(db, agentId, {
      title: "Greeting",
      body: "Say hello",
    });

    const run = await createPromptRun(db, agentId, prompt.id);
    expect(run.status).toBe("succeeded");
    expect(run.output.length).toBeGreaterThan(0);

    const logs = await listPromptRuns(db, agentId, prompt.id);
    expect(logs).toHaveLength(1);
    expect(logs[0]?.id).toBe(run.id);
  });

  it("hides runs of personal prompts from other users", async () => {
    const db = await openDatabase();
    const prompt = await createPrompt(db, agentId, {
      title: "Greeting",
      body: "Say hello",
    });
    await createPromptRun(db, agentId, prompt.id);

    await expect(
      listPromptRuns(db, developerId, prompt.id),
    ).rejects.toThrowError(/not found|cannot/i);
  });

  async function openDatabase() {
    const db = await createPgliteDatabase();
    await ensureDummyUsers(db);
    databases.push({ close: () => db.$client.close() });
    return db;
  }
});
