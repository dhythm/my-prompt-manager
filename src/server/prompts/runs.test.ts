import { afterEach, describe, expect, it } from "vitest";
import { t } from "@/lib/i18n/t";
import {
  DUMMY_DEFAULT_USER_ID,
  dummyUsers,
  ensureDummyUsers,
} from "@/server/auth/dummy/users";
import { createPgliteDatabase } from "@/server/db/pglite";
import { createPrompt } from "./repository";
import { createPromptRun, listPromptRuns } from "./runs";
import { getPromptDetail, savePromptVersion } from "./versions";

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

  it("stores expanded run input and keeps raw templates on the version", async () => {
    const db = await openDatabase();
    const prompt = await createPrompt(db, agentId, {
      title: "Greeting",
      body: "Say hello",
    });
    await savePromptVersion(db, agentId, prompt.id, {
      title: "Greeting",
      model: "gpt-4.1",
      messages: [
        { role: "system", content: "You help {{name}}." },
        { role: "user", content: "Talk about {{topic}}." },
      ],
    });

    const run = await createPromptRun(db, agentId, prompt.id, {
      name: "Ada",
      topic: "math",
    });

    expect(run.input).toBe("system: You help Ada.\n\nuser: Talk about math.");

    const detail = await getPromptDetail(db, agentId, prompt.id);
    expect(detail.messages.map((message) => message.content)).toEqual([
      "You help {{name}}.",
      "Talk about {{topic}}.",
    ]);
  });

  it("leaves unknown placeholders in the recorded input", async () => {
    const db = await openDatabase();
    const prompt = await createPrompt(db, agentId, {
      title: "Greeting",
      body: "Hello {{name}}",
    });

    const run = await createPromptRun(db, agentId, prompt.id, {});
    expect(run.input).toContain("Hello {{name}}");
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
    ).rejects.toThrowError(t("error.promptNotFound"));
  });

  async function openDatabase() {
    const db = await createPgliteDatabase();
    await ensureDummyUsers(db);
    databases.push({ close: () => db.$client.close() });
    return db;
  }
});
