import { createNamedError, isNamedError } from "@/lib/errors";

export function createLlmConfigError(message: string) {
  return createNamedError("LlmConfigError", message);
}

export function isLlmConfigError(error: unknown) {
  return isNamedError(error, "LlmConfigError");
}

export function createLlmRequestError(message: string) {
  return createNamedError("LlmRequestError", message);
}

export function isLlmRequestError(error: unknown) {
  return isNamedError(error, "LlmRequestError");
}
