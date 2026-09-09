import { createNamedError } from "@/lib/errors";
import { type TranslationKey, t } from "@/lib/i18n/t";
import type { CreateProjectInput } from "@/lib/projects/types";

export type { CreateProjectInput };

const NAME_MAX_LENGTH = 80;

export function parseCreateProjectInput(value: unknown): CreateProjectInput {
  const record = asObject(value);
  const teamId = parseOptionalId(record.teamId, "field.teamId");
  return {
    name: parseRequiredText(record.name, "field.name", NAME_MAX_LENGTH),
    ...(teamId ? { teamId } : {}),
  };
}

export function parseRenameProjectInput(value: unknown): { name: string } {
  const record = asObject(value);
  return {
    name: parseRequiredText(record.name, "field.name", NAME_MAX_LENGTH),
  };
}

export function parseCopyPromptInput(value: unknown): { projectId: string } {
  const record = asObject(value);
  const projectId = parseOptionalId(record.projectId, "field.projectId");
  if (!projectId) {
    throw createValidationError(
      t("validation.required", { field: t("field.projectId") }),
    );
  }
  return { projectId };
}

function asObject(value: unknown): Record<string, unknown> {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    throw createValidationError(t("validation.jsonObject"));
  }
  return value as Record<string, unknown>;
}

function createValidationError(message: string) {
  return createNamedError("ValidationError", message);
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
