import { createNamedError, isNamedError } from "@/lib/errors";

export function createForbiddenError(message: string) {
  return createNamedError("ForbiddenError", message);
}

export function isForbiddenError(error: unknown) {
  return isNamedError(error, "ForbiddenError");
}

export function createNotFoundError(message: string) {
  return createNamedError("NotFoundError", message);
}

export function isNotFoundError(error: unknown) {
  return isNamedError(error, "NotFoundError");
}

export function createConflictError(message: string) {
  return createNamedError("ConflictError", message);
}

export function isConflictError(error: unknown) {
  return isNamedError(error, "ConflictError");
}
