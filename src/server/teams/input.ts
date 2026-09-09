import { createNamedError, isNamedError } from "@/lib/errors";
import { type TranslationKey, t } from "@/lib/i18n/t";

const NAME_MAX_LENGTH = 80;
const EMAIL_MAX_LENGTH = 320;

export function parseCreateTeamInput(value: unknown): { name: string } {
  const record = asObject(value);
  return {
    name: parseRequiredText(record.name, "field.name", NAME_MAX_LENGTH),
  };
}

export function parseInviteInput(value: unknown): { email: string } {
  const record = asObject(value);
  const email = parseRequiredText(
    record.email,
    "field.email",
    EMAIL_MAX_LENGTH,
  );
  return { email: email.toLowerCase() };
}

export function parseTransferInput(value: unknown): { teamId: string } {
  const record = asObject(value);
  const teamId = record.teamId;
  if (typeof teamId !== "string" || teamId.trim() === "") {
    throw createValidationError(
      t("validation.required", { field: t("field.teamId") }),
    );
  }
  return { teamId: teamId.trim() };
}

export function isTeamInputError(error: unknown) {
  return isNamedError(error, "ValidationError");
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
