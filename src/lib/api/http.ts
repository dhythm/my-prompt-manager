import { createNamedError, isNamedError } from "@/lib/errors";

export type HttpError = ReturnType<typeof createHttpError>;

function createHttpError(status: number, message: string) {
  const error = createNamedError("HttpError", message);
  return Object.assign(error, { status });
}

export function isHttpError(error: unknown): error is HttpError {
  return isNamedError(error, "HttpError") && "status" in error;
}

export async function getJson<T>(
  input: RequestInfo | URL,
  init?: RequestInit,
): Promise<T> {
  const response = await fetch(input, init);
  if (!response.ok) {
    const message = (await response.text()) || response.statusText;
    throw createHttpError(response.status, message);
  }

  try {
    return (await response.json()) as T;
  } catch {
    throw createHttpError(response.status, "Response was not valid JSON");
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
