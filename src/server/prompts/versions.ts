import { and, desc, eq } from "drizzle-orm";
import { t } from "@/lib/i18n/t";
import { promptModelForId } from "@/lib/prompts/models";
import { promptMessages, prompts, promptVersions } from "@/server/db/schema";
import type { AppDatabase } from "@/server/db/types";
import { createNotFoundError } from "@/server/errors";
import { getReadablePrompt, getWritablePrompt } from "./access";

export type PromptMessageInput = {
  role: "system" | "user" | "assistant";
  content: string;
};

export async function createInitialPromptVersion(
  db: AppDatabase,
  userId: string,
  promptId: string,
  input: { title: string; body: string },
) {
  return insertVersion(db, {
    promptId,
    userId,
    versionNumber: 1,
    model: promptModelForId(promptId),
    note: t("prompt.createdNote"),
    title: input.title,
    messages: defaultMessages(input.body),
  });
}

export async function savePromptVersion(
  db: AppDatabase,
  userId: string,
  promptId: string,
  input: {
    title: string;
    model: string;
    messages: PromptMessageInput[];
    note?: string;
  },
) {
  await getWritablePrompt(db, userId, promptId);
  const latest = await latestVersionNumber(db, promptId);
  const version = await insertVersion(db, {
    promptId,
    userId,
    versionNumber: latest + 1,
    model: input.model,
    note: input.note ?? t("prompt.updatedNote"),
    title: input.title,
    messages: input.messages,
  });

  return version;
}

export async function getPromptDetail(
  db: AppDatabase,
  userId: string,
  promptId: string,
) {
  const prompt = await getReadablePrompt(db, userId, promptId);
  const [version] = await db
    .select()
    .from(promptVersions)
    .where(eq(promptVersions.promptId, promptId))
    .orderBy(desc(promptVersions.versionNumber))
    .limit(1);

  if (!version) {
    throw createNotFoundError(t("error.promptVersionNotFound"));
  }

  const messages = await db
    .select()
    .from(promptMessages)
    .where(eq(promptMessages.versionId, version.id))
    .orderBy(promptMessages.position);

  return { prompt, version, messages };
}

export async function listPromptVersions(
  db: AppDatabase,
  userId: string,
  promptId: string,
) {
  await getReadablePrompt(db, userId, promptId);
  return db
    .select()
    .from(promptVersions)
    .where(eq(promptVersions.promptId, promptId))
    .orderBy(desc(promptVersions.versionNumber));
}

export async function getPromptVersion(
  db: AppDatabase,
  userId: string,
  promptId: string,
  versionNumber: number,
) {
  await getReadablePrompt(db, userId, promptId);
  const [version] = await db
    .select()
    .from(promptVersions)
    .where(
      and(
        eq(promptVersions.promptId, promptId),
        eq(promptVersions.versionNumber, versionNumber),
      ),
    )
    .limit(1);

  if (!version) {
    throw createNotFoundError(t("error.promptVersionNotFound"));
  }

  const messages = await db
    .select()
    .from(promptMessages)
    .where(eq(promptMessages.versionId, version.id))
    .orderBy(promptMessages.position);

  return { version, messages };
}

async function latestVersionNumber(db: AppDatabase, promptId: string) {
  const [version] = await db
    .select({ versionNumber: promptVersions.versionNumber })
    .from(promptVersions)
    .where(eq(promptVersions.promptId, promptId))
    .orderBy(desc(promptVersions.versionNumber))
    .limit(1);

  return version?.versionNumber ?? 0;
}

async function insertVersion(
  db: AppDatabase,
  input: {
    promptId: string;
    userId: string;
    versionNumber: number;
    model: string;
    note: string;
    title: string;
    messages: PromptMessageInput[];
  },
) {
  const [version] = await db
    .insert(promptVersions)
    .values({
      promptId: input.promptId,
      versionNumber: input.versionNumber,
      model: input.model,
      note: input.note,
      createdByUserId: input.userId,
    })
    .returning();

  if (!version) {
    throw new Error(t("error.versionSaveFailed"));
  }

  if (input.messages.length > 0) {
    await db.insert(promptMessages).values(
      input.messages.map((message, position) => ({
        versionId: version.id,
        role: message.role,
        content: message.content,
        position,
      })),
    );
  }

  const body = previewFromMessages(input.messages);
  const [prompt] = await db
    .update(prompts)
    .set({
      title: input.title,
      body,
      updatedAt: new Date(),
    })
    .where(eq(prompts.id, input.promptId))
    .returning();

  if (!prompt) {
    throw new Error(t("error.promptUpdateFailed"));
  }

  return { prompt, version };
}

function defaultMessages(body: string): PromptMessageInput[] {
  return [
    { role: "system", content: t("prompt.defaultSystem") },
    { role: "user", content: body },
  ];
}

function previewFromMessages(messages: PromptMessageInput[]): string {
  const userMessage = messages.find((message) => message.role === "user");
  return userMessage?.content ?? messages[0]?.content ?? "";
}
