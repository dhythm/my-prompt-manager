import { and, desc, eq, inArray, lt, or } from "drizzle-orm";
import { t } from "@/lib/i18n/t";
import { estimateCostUsd } from "@/lib/prompts/models";
import { RUNS_PAGE_SIZE } from "@/lib/prompts/runs-page";
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

export type ListRunsQuery = {
  promptId?: string;
  model?: string;
  cursor?: string;
  limit?: number;
};

export type ListedRuns = {
  runs: Array<{
    id: string;
    promptId: string;
    promptTitle: string;
    versionId: string;
    model: string;
    input: string;
    output: string;
    status: string;
    inputTokens: number | null;
    outputTokens: number | null;
    costUsd: string | null;
    createdByUserId: string | null;
    createdAt: Date;
  }>;
  nextCursor: string | null;
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
  query: ListRunsQuery = {},
): Promise<ListedRuns> {
  await getReadablePrompt(db, userId, promptId);
  return listRunPage(db, {
    promptIds: [promptId],
    model: query.model,
    cursor: query.cursor,
    limit: query.limit,
  });
}

export async function listWorkspaceRuns(
  db: AppDatabase,
  userId: string,
  query: ListRunsQuery = {},
): Promise<ListedRuns> {
  const visible = await listPrompts(db, userId);
  const ids = visible
    .map((prompt) => prompt.id)
    .filter((id) => (query.promptId ? id === query.promptId : true));
  if (ids.length === 0) {
    return { runs: [], nextCursor: null };
  }

  return listRunPage(db, {
    promptIds: ids,
    model: query.model,
    cursor: query.cursor,
    limit: query.limit,
  });
}

async function listRunPage(
  db: AppDatabase,
  query: {
    promptIds: string[];
    model?: string;
    cursor?: string;
    limit?: number;
  },
): Promise<ListedRuns> {
  const limit = query.limit ?? RUNS_PAGE_SIZE;
  const conditions = [inArray(promptRuns.promptId, query.promptIds)];
  if (query.model) {
    conditions.push(eq(promptRuns.model, query.model));
  }
  const cursor = query.cursor ? decodeRunCursor(query.cursor) : undefined;
  if (cursor) {
    const older = or(
      lt(promptRuns.createdAt, cursor.createdAt),
      and(
        eq(promptRuns.createdAt, cursor.createdAt),
        lt(promptRuns.id, cursor.id),
      ),
    );
    if (older) {
      conditions.push(older);
    }
  }

  const rows = await db
    .select(runColumns)
    .from(promptRuns)
    .innerJoin(prompts, eq(prompts.id, promptRuns.promptId))
    .where(and(...conditions))
    .orderBy(desc(promptRuns.createdAt), desc(promptRuns.id))
    .limit(limit + 1);

  const hasMore = rows.length > limit;
  const runs = hasMore ? rows.slice(0, limit) : rows;
  const last = runs[runs.length - 1];
  return {
    runs,
    nextCursor: hasMore && last ? encodeRunCursor(last) : null,
  };
}

function encodeRunCursor(run: { createdAt: Date; id: string }): string {
  return `${run.createdAt.toISOString()}::${run.id}`;
}

function decodeRunCursor(value: string): { createdAt: Date; id: string } {
  const separator = value.lastIndexOf("::");
  const createdAt = new Date(value.slice(0, separator));
  const id = value.slice(separator + 2);
  return { createdAt, id };
}
