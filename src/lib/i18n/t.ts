import { messages } from "./messages";

type Messages = typeof messages;

type Join<K extends string, P extends string> = `${K}.${P}`;

type MessageKey<T, Prefix extends string = ""> = {
  [K in keyof T & string]: T[K] extends string
    ? Prefix extends ""
      ? K
      : Join<Prefix, K>
    : MessageKey<T[K], Prefix extends "" ? K : Join<Prefix, K>>;
}[keyof T & string];

export type TranslationKey = MessageKey<Messages>;

function lookup(key: TranslationKey): string {
  const parts = key.split(".");
  let current: unknown = messages;
  for (const part of parts) {
    if (typeof current !== "object" || current === null) {
      throw new Error(`Unknown message: ${key}`);
    }
    current = (current as Record<string, unknown>)[part];
  }
  if (typeof current !== "string") {
    throw new Error(`Unknown message: ${key}`);
  }
  return current;
}

export function t(
  key: TranslationKey,
  vars?: Record<string, string | number>,
): string {
  const template = lookup(key);
  if (!vars) {
    return template;
  }
  return template.replace(/\{(\w+)\}/g, (match, name: string) =>
    Object.hasOwn(vars, name) ? String(vars[name]) : match,
  );
}
