import { afterEach, describe, expect, it } from "vitest";
import { t } from "@/lib/i18n/t";
import {
  DUMMY_DEFAULT_USER_ID,
  dummyUsers,
  ensureDummyUsers,
} from "@/server/auth/dummy/users";
import { createPgliteDatabase } from "@/server/db/pglite";
import type { CompleteChat } from "@/server/llm/complete-chat";
import {
  createLlmConfigError,
  createLlmRequestError,
} from "@/server/llm/errors";
import { createPrompt } from "./repository";
import {
  createPromptRun,
  getPromptRun,
  listPromptRuns,
  listWorkspaceRuns,
} from "./runs";
import { getPromptDetail, savePromptVersion } from "./versions";

const agentId = DUMMY_DEFAULT_USER_ID;
const developerId = dummyUsers[1].id;

const stubCompleteChat: CompleteChat = async ({ modelId }) => ({
  text: `reply:${modelId}`,
  inputTokens: 12,
  outputTokens: 34,
});

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

    const run = await createPromptRun(db, agentId, prompt.id, {
      completeChat: stubCompleteChat,
    });
    expect(run.status).toBe("succeeded");
    expect(run.output).toBe("reply:grok-4.6");
    expect(run.inputTokens).toBe(12);
    expect(run.outputTokens).toBe(34);
    expect(run.costUsd).toBe("0.0002280000");

    const logs = await listPromptRuns(db, agentId, prompt.id);
    expect(logs).toHaveLength(1);
    expect(logs[0]?.id).toBe(run.id);
    expect(logs[0]?.promptTitle).toBe("Greeting");

    const workspace = await listWorkspaceRuns(db, agentId);
    expect(workspace).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: run.id,
          promptTitle: "Greeting",
        }),
      ]),
    );
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
      variables: { name: "Ada", topic: "math" },
      completeChat: stubCompleteChat,
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

    const run = await createPromptRun(db, agentId, prompt.id, {
      completeChat: stubCompleteChat,
    });
    expect(run.input).toContain("Hello {{name}}");
  });

  it("hides runs of personal prompts from other users", async () => {
    const db = await openDatabase();
    const prompt = await createPrompt(db, agentId, {
      title: "Greeting",
      body: "Say hello",
    });
    await createPromptRun(db, agentId, prompt.id, {
      completeChat: stubCompleteChat,
    });

    await expect(
      listPromptRuns(db, developerId, prompt.id),
    ).rejects.toThrowError(t("error.promptNotFound"));
  });

  it("uses the requested model for the completion and cost", async () => {
    const db = await openDatabase();
    const prompt = await createPrompt(db, agentId, {
      title: "Greeting",
      body: "Say hello",
    });

    const run = await createPromptRun(db, agentId, prompt.id, {
      model: "gpt-5.6",
      completeChat: stubCompleteChat,
    });

    expect(run.model).toBe("gpt-5.6");
    expect(run.output).toBe("reply:gpt-5.6");
    expect(run.costUsd).toBe("0.0007280000");
  });

  it("stores a failed run when the provider request fails", async () => {
    const db = await openDatabase();
    const prompt = await createPrompt(db, agentId, {
      title: "Greeting",
      body: "Say hello",
    });

    const run = await createPromptRun(db, agentId, prompt.id, {
      completeChat: async () => {
        throw createLlmRequestError(t("error.llmRequestFailed"));
      },
    });

    expect(run.status).toBe("failed");
    expect(run.output).toBe(t("error.llmRequestFailed"));
    expect(run.costUsd).toBeNull();
    expect(await listPromptRuns(db, agentId, prompt.id)).toHaveLength(1);
  });

  it("does not insert a run when the provider key is missing", async () => {
    const db = await openDatabase();
    const prompt = await createPrompt(db, agentId, {
      title: "Greeting",
      body: "Say hello",
    });

    await expect(
      createPromptRun(db, agentId, prompt.id, {
        completeChat: async () => {
          throw createLlmConfigError(
            t("error.llmKeyMissing", { name: "XAI_API_KEY" }),
          );
        },
      }),
    ).rejects.toThrowError(t("error.llmKeyMissing", { name: "XAI_API_KEY" }));

    expect(await listPromptRuns(db, agentId, prompt.id)).toHaveLength(0);
  });

  it("loads a run the user can access and hides others", async () => {
    const db = await openDatabase();
    const prompt = await createPrompt(db, agentId, {
      title: "Greeting",
      body: "Say hello",
    });
    const run = await createPromptRun(db, agentId, prompt.id, {
      completeChat: stubCompleteChat,
    });

    await expect(getPromptRun(db, agentId, run.id)).resolves.toMatchObject({
      id: run.id,
      promptTitle: "Greeting",
      output: "reply:grok-4.6",
    });
    await expect(getPromptRun(db, developerId, run.id)).rejects.toThrowError(
      t("error.promptNotFound"),
    );
  });

  async function openDatabase() {
    const db = await createPgliteDatabase();
    await ensureDummyUsers(db);
    databases.push({ close: () => db.$client.close() });
    return db;
  }
});
