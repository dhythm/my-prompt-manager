import { createNamedError, isNamedError } from "@/lib/errors";
import type { CreatePromptInput } from "@/lib/prompts/types";

export type { CreatePromptInput };

const TITLE_MAX_LENGTH = 200;
const BODY_MAX_LENGTH = 10_000;

export function parseCreatePromptInput(value: unknown): CreatePromptInput {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    throw createValidationError("Request body must be a JSON object");
  }

  const record = value as Record<string, unknown>;
  return {
    title: parseRequiredText(record.title, "title", TITLE_MAX_LENGTH),
    body: parseRequiredText(record.body, "body", BODY_MAX_LENGTH),
  };
}

function createValidationError(message: string) {
  return createNamedError("ValidationError", message);
}

export function isValidationError(error: unknown) {
  return isNamedError(error, "ValidationError");
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
