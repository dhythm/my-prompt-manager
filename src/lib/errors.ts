export type NamedError<TName extends string> = Error & { name: TName };

export function createNamedError<TName extends string>(
  name: TName,
  message: string,
): NamedError<TName> {
  const error = new Error(message) as NamedError<TName>;
  error.name = name;
  return error;
}

export function isNamedError<TName extends string>(
  error: unknown,
  name: TName,
): error is NamedError<TName> {
  return error instanceof Error && error.name === name;
}
