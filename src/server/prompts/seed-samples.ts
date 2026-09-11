import { inArray, like, or } from "drizzle-orm";
import { t } from "@/lib/i18n/t";
import { estimateCostUsd } from "@/lib/prompts/models";
import {
  dummyVariableValues,
  extractVariablesFromTexts,
  substitute,
} from "@/lib/prompts/template";
import {
  promptMessages,
  promptRuns,
  prompts,
  promptVersions,
} from "@/server/db/schema";
import type { AppDatabase } from "@/server/db/types";
import {
  deleteLeftoverFixtures,
  deletePromptGraph,
} from "@/server/dummy/cleanup";
import { ensureDefaultProjectForOwnership } from "@/server/projects/repository";
import {
  leftoverPromptTitles,
  samplePromptCatalog,
  samplePromptIds,
} from "./samples";

export async function ensureSamplePrompts(db: AppDatabase, userId: string) {
  const project = await ensureDefaultProjectForOwnership(db, {
    ownerUserId: userId,
    teamId: null,
    createdByUserId: userId,
  });

  await deleteLeftoverFixtures(db);
  await deletePromptGraph(db, await leftoverPromptIds(db));

  for (const [index, sample] of samplePromptCatalog.entries()) {
    await deletePromptGraph(db, [sample.id]);
    const createdAt = new Date(Date.now() - index * 1000);
    await db.insert(prompts).values({
      id: sample.id,
      title: sample.title,
      body: previewFromMessages(sample.messages),
      ownerUserId: project.ownerUserId,
      teamId: project.teamId,
      projectId: project.id,
      createdByUserId: userId,
      createdAt,
      updatedAt: createdAt,
    });
    const [version] = await db
      .insert(promptVersions)
      .values({
        promptId: sample.id,
        versionNumber: 1,
        model: sample.model,
        note: t("prompt.createdNote"),
        createdByUserId: userId,
        createdAt,
      })
      .returning();

    if (!version) {
      throw new Error(t("error.versionSaveFailed"));
    }

    await db.insert(promptMessages).values(
      sample.messages.map((message, position) => ({
        versionId: version.id,
        role: message.role,
        content: message.content,
        position,
      })),
    );

    const values = dummyVariableValues(
      extractVariablesFromTexts(
        sample.messages.map((message) => message.content),
      ),
    );
    const recordedInput = sample.messages
      .map(
        (message) => `${message.role}: ${substitute(message.content, values)}`,
      )
      .join("\n\n");
    await db.insert(promptRuns).values(
      sample.runs.map((run, runIndex) => ({
        id: run.id,
        promptId: sample.id,
        versionId: version.id,
        model: sample.model,
        input: recordedInput,
        output: run.output,
        status: "succeeded",
        inputTokens: run.inputTokens,
        outputTokens: run.outputTokens,
        costUsd: estimateCostUsd(
          sample.model,
          run.inputTokens,
          run.outputTokens,
        ),
        source: run.source,
        createdByUserId: userId,
        createdAt: new Date(createdAt.getTime() - runIndex * 60_000),
      })),
    );
  }
}

async function leftoverPromptIds(db: AppDatabase) {
  const leftover = await db
    .select({ id: prompts.id })
    .from(prompts)
    .where(
      or(
        inArray(prompts.title, leftoverPromptTitles),
        like(prompts.title, "Filter %"),
      ),
    );

  return leftover
    .map((row) => row.id)
    .filter((id) => !samplePromptIds.includes(id));
}

function previewFromMessages(
  messages: Array<{ role: string; content: string }>,
) {
  const userMessage = messages.find((message) => message.role === "user");
  return userMessage?.content ?? messages[0]?.content ?? "";
}
