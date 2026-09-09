import { createNamedError, isNamedError } from "@/lib/errors";
import { t } from "@/lib/i18n/t";

export function parseDummySignInInput(value: unknown): { email: string } {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    throw createValidationError(t("validation.jsonObject"));
  }

  const email = (value as Record<string, unknown>).email;
  if (typeof email !== "string" || email.trim() === "") {
    throw createValidationError(
      t("validation.required", { field: t("field.email") }),
    );
  }

  return { email: email.trim().toLowerCase() };
}

function createValidationError(message: string) {
  return createNamedError("ValidationError", message);
}

export function isDummySignInError(error: unknown) {
  return isNamedError(error, "ValidationError");
}
