import { desc, eq, inArray } from "drizzle-orm";
import { t } from "@/lib/i18n/t";
import { estimateCostUsd } from "@/lib/prompts/models";
import { substitute } from "@/lib/prompts/template";
import { promptRuns, prompts } from "@/server/db/schema";
import type { AppDatabase } from "@/server/db/types";
import { createNotFoundError } from "@/server/errors";
import {
  type ChatMessage,
  type CompleteChat,
  createCompleteChat,
} from "@/server/llm/complete-chat";
import { resolveLlmConfig } from "@/server/llm/env";
import { isLlmConfigError, isLlmRequestError } from "@/server/llm/errors";
import { getReadablePrompt } from "./access";
import { listPrompts } from "./repository";
import { getPromptDetail } from "./versions";

export type CreatePromptRunInput = {
  variables?: Record<string, string>;
  model?: string;
  completeChat?: CompleteChat;
};

const runColumns = {
  id: promptRuns.id,
  promptId: promptRuns.promptId,
  promptTitle: prompts.title,
  versionId: promptRuns.versionId,
  model: promptRuns.model,
  input: promptRuns.input,
  output: promptRuns.output,
  status: promptRuns.status,
  inputTokens: promptRuns.inputTokens,
  outputTokens: promptRuns.outputTokens,
  costUsd: promptRuns.costUsd,
  createdByUserId: promptRuns.createdByUserId,
  createdAt: promptRuns.createdAt,
};

export async function createPromptRun(
  db: AppDatabase,
  userId: string,
  promptId: string,
  input: CreatePromptRunInput = {},
) {
  const detail = await getPromptDetail(db, userId, promptId);
  const variables = input.variables ?? {};
  const model = input.model ?? detail.version.model;
  const completeChat =
    input.completeChat ??
    createCompleteChat({ config: resolveLlmConfig(process.env) });
  const expanded: ChatMessage[] = detail.messages.map((message) => ({
    role: message.role as ChatMessage["role"],
    content: substitute(message.content, variables),
  }));
  const recordedInput = expanded
    .map((message) => `${message.role}: ${message.content}`)
    .join("\n\n");

  let output = "";
  let status = "succeeded";
  let inputTokens: number | null = null;
  let outputTokens: number | null = null;
  let costUsd: string | null = null;

  try {
    const completion = await completeChat({
      modelId: model,
      messages: expanded,
    });
    output = completion.text;
    inputTokens = completion.inputTokens;
    outputTokens = completion.outputTokens;
    costUsd = estimateCostUsd(model, inputTokens, outputTokens);
  } catch (error) {
    if (isLlmConfigError(error)) {
      throw error;
    }
    status = "failed";
    output = isLlmRequestError(error)
      ? error.message
      : t("error.llmRequestFailed");
  }

  const [run] = await db
    .insert(promptRuns)
    .values({
      promptId,
      versionId: detail.version.id,
      model,
      input: recordedInput,
      output,
      status,
      inputTokens,
      outputTokens,
      costUsd,
      createdByUserId: userId,
    })
    .returning();

  if (!run) {
    throw new Error(t("error.runRecordFailed"));
  }

  return { ...run, promptTitle: detail.prompt.title };
}

export async function getPromptRun(
  db: AppDatabase,
  userId: string,
  runId: string,
) {
  const [run] = await db
    .select(runColumns)
    .from(promptRuns)
    .innerJoin(prompts, eq(prompts.id, promptRuns.promptId))
    .where(eq(promptRuns.id, runId))
    .limit(1);

  if (!run) {
    throw createNotFoundError(t("error.runNotFound"));
  }

  await getReadablePrompt(db, userId, run.promptId);
  return run;
}

export async function listPromptRuns(
  db: AppDatabase,
  userId: string,
  promptId: string,
) {
  await getReadablePrompt(db, userId, promptId);
  return db
    .select(runColumns)
    .from(promptRuns)
    .innerJoin(prompts, eq(prompts.id, promptRuns.promptId))
    .where(eq(promptRuns.promptId, promptId))
    .orderBy(desc(promptRuns.createdAt));
}

export async function listWorkspaceRuns(db: AppDatabase, userId: string) {
  const visible = await listPrompts(db, userId);
  const ids = visible.map((prompt) => prompt.id);
  if (ids.length === 0) {
    return [];
  }

  return db
    .select(runColumns)
    .from(promptRuns)
    .innerJoin(prompts, eq(prompts.id, promptRuns.promptId))
    .where(inArray(promptRuns.promptId, ids))
    .orderBy(desc(promptRuns.createdAt));
}
