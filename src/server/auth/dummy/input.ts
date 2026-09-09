import { createNamedError, isNamedError } from "@/lib/errors";

export function parseDummySignInInput(value: unknown): { email: string } {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    throw createValidationError("Request body must be a JSON object");
  }

  const email = (value as Record<string, unknown>).email;
  if (typeof email !== "string" || email.trim() === "") {
    throw createValidationError("email is required");
  }

  return { email: email.trim().toLowerCase() };
}

function createValidationError(message: string) {
  return createNamedError("ValidationError", message);
}

export function isDummySignInError(error: unknown) {
  return isNamedError(error, "ValidationError");
}
