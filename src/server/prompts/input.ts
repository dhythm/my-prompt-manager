import { createNamedError, isNamedError } from "@/lib/errors";
import type { CreatePromptInput } from "@/lib/prompts/types";

export type { CreatePromptInput };

const TITLE_MAX_LENGTH = 200;
const BODY_MAX_LENGTH = 10_000;

export function parseCreatePromptInput(value: unknown): CreatePromptInput {
  const record = asObject(value);
  const teamId = parseOptionalId(record.teamId, "teamId");
  return {
    title: parseRequiredText(record.title, "title", TITLE_MAX_LENGTH),
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
  const model = parseRequiredText(record.model, "model", 80);
  const messages = parseMessages(record.messages);
  const note =
    typeof record.note === "string" && record.note.trim() !== ""
      ? record.note.trim()
      : undefined;
  return {
    title: parseRequiredText(record.title, "title", TITLE_MAX_LENGTH),
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
    throw createValidationError("Request body must be a JSON object");
  }
  return value as Record<string, unknown>;
}

function parseOptionalBody(value: unknown): string {
  if (value === undefined || value === null) {
    return "";
  }
  if (typeof value !== "string") {
    throw createValidationError("body must be a string");
  }
  if (value.length > BODY_MAX_LENGTH) {
    throw createValidationError(
      `body must be ${BODY_MAX_LENGTH} characters or fewer`,
    );
  }
  return value.trim();
}

function parseMessages(value: unknown) {
  if (!Array.isArray(value) || value.length === 0) {
    throw createValidationError("messages must be a non-empty array");
  }
  return value.map((item, index) => {
    if (typeof item !== "object" || item === null) {
      throw createValidationError(`messages[${index}] must be an object`);
    }
    const role = (item as { role?: unknown }).role;
    const content = (item as { content?: unknown }).content;
    if (role !== "system" && role !== "user" && role !== "assistant") {
      throw createValidationError(`messages[${index}].role is invalid`);
    }
    if (typeof content !== "string") {
      throw createValidationError(`messages[${index}].content is required`);
    }
    if (content.length > BODY_MAX_LENGTH) {
      throw createValidationError(
        `messages[${index}].content must be ${BODY_MAX_LENGTH} characters or fewer`,
      );
    }
    return { role, content } as const;
  });
}

function parseOptionalId(value: unknown, field: string): string | undefined {
  if (value === undefined || value === null || value === "") {
    return undefined;
  }
  if (typeof value !== "string") {
    throw createValidationError(`${field} must be a string`);
  }
  const trimmed = value.trim();
  if (trimmed === "") {
    return undefined;
  }
  return trimmed;
}

function parseRequiredText(
  value: unknown,
  field: string,
  maxLength: number,
): string {
  if (typeof value !== "string") {
    throw createValidationError(`${field} is required`);
  }

  const trimmed = value.trim();
  if (trimmed === "") {
    throw createValidationError(`${field} is required`);
  }

  if (trimmed.length > maxLength) {
    throw createValidationError(
      `${field} must be ${maxLength} characters or fewer`,
    );
  }

  return trimmed;
}
