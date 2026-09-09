import { createNamedError, isNamedError } from "@/lib/errors";

const NAME_MAX_LENGTH = 80;
const EMAIL_MAX_LENGTH = 320;

export function parseCreateTeamInput(value: unknown): { name: string } {
  const record = asObject(value);
  return { name: parseRequiredText(record.name, "name", NAME_MAX_LENGTH) };
}

export function parseInviteInput(value: unknown): { email: string } {
  const record = asObject(value);
  const email = parseRequiredText(record.email, "email", EMAIL_MAX_LENGTH);
  return { email: email.toLowerCase() };
}

export function parseTransferInput(value: unknown): { teamId: string } {
  const record = asObject(value);
  const teamId = record.teamId;
  if (typeof teamId !== "string" || teamId.trim() === "") {
    throw createValidationError("teamId is required");
  }
  return { teamId: teamId.trim() };
}

export function isTeamInputError(error: unknown) {
  return isNamedError(error, "ValidationError");
}

function asObject(value: unknown): Record<string, unknown> {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    throw createValidationError("Request body must be a JSON object");
  }
  return value as Record<string, unknown>;
}

function createValidationError(message: string) {
  return createNamedError("ValidationError", message);
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
