import { createNamedError, isNamedError } from "@/lib/errors";
import { t } from "@/lib/i18n/t";

export type HttpError = ReturnType<typeof createHttpError>;

function createHttpError(status: number, message: string) {
  const error = createNamedError("HttpError", message);
  return Object.assign(error, { status });
}

export function isHttpError(error: unknown): error is HttpError {
  return isNamedError(error, "HttpError") && "status" in error;
}

function readErrorMessage(text: string, fallback: string): string {
  if (text === "") {
    return fallback;
  }
  try {
    const parsed = JSON.parse(text) as { error?: unknown };
    if (typeof parsed.error === "string" && parsed.error !== "") {
      return parsed.error;
    }
  } catch {
    // Use the raw response text when it is not JSON.
  }
  return text;
}

export async function getJson<T>(
  input: RequestInfo | URL,
  init?: RequestInit,
): Promise<T> {
  const response = await fetch(input, init);
  if (!response.ok) {
    const text = await response.text();
    throw createHttpError(
      response.status,
      readErrorMessage(text, response.statusText),
    );
  }

  try {
    return (await response.json()) as T;
  } catch {
    throw createHttpError(response.status, t("error.responseJson"));
  }
}

export async function postJson<T>(
  input: RequestInfo | URL,
  body: unknown,
): Promise<T> {
  return getJson<T>(input, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

export async function patchJson<T>(
  input: RequestInfo | URL,
  body: unknown,
): Promise<T> {
  return getJson<T>(input, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}
