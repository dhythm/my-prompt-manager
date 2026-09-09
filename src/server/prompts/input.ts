import { createNamedError, isNamedError } from "@/lib/errors";
import { type TranslationKey, t } from "@/lib/i18n/t";
import type { CreatePromptInput } from "@/lib/prompts/types";

export type { CreatePromptInput };

const TITLE_MAX_LENGTH = 200;
const BODY_MAX_LENGTH = 10_000;

export function parseCreatePromptInput(value: unknown): CreatePromptInput {
  const record = asObject(value);
  const teamId = parseOptionalId(record.teamId, "field.teamId");
  return {
    title: parseRequiredText(record.title, "field.title", TITLE_MAX_LENGTH),
    body: parseOptionalBody(record.body),
    ...(teamId ? { teamId } : {}),
  };
}

export function parseSavePromptInput(value: unknown): {
  title: string;
  model: string;
  note?: string;
  messages: Array<{ role: "system" | "user" | "assistant"; content: string }>;
} {
  const record = asObject(value);
  const model = parseRequiredText(record.model, "field.model", 80);
  const messages = parseMessages(record.messages);
  const note =
    typeof record.note === "string" && record.note.trim() !== ""
      ? record.note.trim()
      : undefined;
  return {
    title: parseRequiredText(record.title, "field.title", TITLE_MAX_LENGTH),
    model,
    messages,
    ...(note ? { note } : {}),
  };
}

function createValidationError(message: string) {
  return createNamedError("ValidationError", message);
}

export function isValidationError(error: unknown) {
  return isNamedError(error, "ValidationError");
}

function asObject(value: unknown): Record<string, unknown> {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    throw createValidationError(t("validation.jsonObject"));
  }
  return value as Record<string, unknown>;
}

function parseOptionalBody(value: unknown): string {
  if (value === undefined || value === null) {
    return "";
  }
  if (typeof value !== "string") {
    throw createValidationError(t("validation.bodyMustBeString"));
  }
  if (value.length > BODY_MAX_LENGTH) {
    throw createValidationError(
      t("validation.maxLength", {
        field: t("field.body"),
        max: BODY_MAX_LENGTH,
      }),
    );
  }
  return value.trim();
}

function parseMessages(value: unknown) {
  if (!Array.isArray(value) || value.length === 0) {
    throw createValidationError(t("validation.messagesNonEmpty"));
  }
  return value.map((item, index) => {
    if (typeof item !== "object" || item === null) {
      throw createValidationError(
        t("validation.messageMustBeObject", { index }),
      );
    }
    const role = (item as { role?: unknown }).role;
    const content = (item as { content?: unknown }).content;
    if (role !== "system" && role !== "user" && role !== "assistant") {
      throw createValidationError(
        t("validation.messageRoleInvalid", { index }),
      );
    }
    if (typeof content !== "string") {
      throw createValidationError(
        t("validation.messageContentRequired", { index }),
      );
    }
    if (content.length > BODY_MAX_LENGTH) {
      throw createValidationError(
        t("validation.messageContentMax", {
          index,
          max: BODY_MAX_LENGTH,
        }),
      );
    }
    return { role, content } as const;
  });
}

function parseOptionalId(
  value: unknown,
  fieldKey: TranslationKey,
): string | undefined {
  if (value === undefined || value === null || value === "") {
    return undefined;
  }
  if (typeof value !== "string") {
    throw createValidationError(
      t("validation.mustBeString", { field: t(fieldKey) }),
    );
  }
  const trimmed = value.trim();
  if (trimmed === "") {
    return undefined;
  }
  return trimmed;
}

function parseRequiredText(
  value: unknown,
  fieldKey: TranslationKey,
  maxLength: number,
): string {
  if (typeof value !== "string") {
    throw createValidationError(
      t("validation.required", { field: t(fieldKey) }),
    );
  }

  const trimmed = value.trim();
  if (trimmed === "") {
    throw createValidationError(
      t("validation.required", { field: t(fieldKey) }),
    );
  }

  if (trimmed.length > maxLength) {
    throw createValidationError(
      t("validation.maxLength", { field: t(fieldKey), max: maxLength }),
    );
  }

  return trimmed;
}
