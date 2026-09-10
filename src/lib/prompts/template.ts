const PLACEHOLDER = /\{\{\s*([A-Za-z0-9_]+)\s*\}\}/g;

export function extractVariables(text: string): string[] {
  const names: string[] = [];
  const seen = new Set<string>();
  for (const match of text.matchAll(PLACEHOLDER)) {
    const name = match[1];
    if (!name || seen.has(name)) {
      continue;
    }
    seen.add(name);
    names.push(name);
  }
  return names;
}

export function extractVariablesFromTexts(texts: string[]): string[] {
  const names: string[] = [];
  const seen = new Set<string>();
  for (const text of texts) {
    for (const name of extractVariables(text)) {
      if (seen.has(name)) {
        continue;
      }
      seen.add(name);
      names.push(name);
    }
  }
  return names;
}

export function substitute(
  text: string,
  values: Record<string, string>,
): string {
  return text.replace(PLACEHOLDER, (match, name: string) =>
    Object.hasOwn(values, name) ? values[name] : match,
  );
}

export function missingVariables(
  names: string[],
  values: Record<string, string>,
): string[] {
  return names.filter((name) => {
    const value = values[name];
    return typeof value !== "string" || value.trim() === "";
  });
}

export function filledValues(
  values: Record<string, string>,
): Record<string, string> {
  return Object.fromEntries(
    Object.entries(values).filter(([, value]) => value.trim() !== ""),
  );
}

const playgroundExampleValues: Record<string, string> = {
  audience: "the hardware buyer at Northwind who has been waiting since Friday",
  constraint:
    "120 words max. Do not apologize for the delay. Offer Tuesday 10:00 JST.",
  draft:
    "This is unacceptable. You promised Friday and we still have nothing. Fix it today.",
  language: "TypeScript",
  intent:
    "Reject empty IDs in the public API without breaking existing clients",
  diff: 'export function parseId(raw: string | null) {\n  return raw ?? "unknown";\n}',
  meeting: "Weekly launch standup",
  notes:
    "Ada: pricing page slips to Thursday. Sam will draft copy. We did not decide on the banner.",
  product: "Shared prompt library",
  spec: "Users can star a prompt. Starred prompts appear first. Guests can star too.",
};

export function dummyVariableValues(names: string[]): Record<string, string> {
  return Object.fromEntries(
    names.map((name) => [
      name,
      playgroundExampleValues[name] ?? `sample-${name}`,
    ]),
  );
}

export function withDummyVariableValues(
  names: string[],
  values: Record<string, string>,
): Record<string, string> {
  const dummy = dummyVariableValues(names);
  return Object.fromEntries(
    names.map((name) => {
      const value = values[name];
      return [name, value && value.trim() !== "" ? value : dummy[name]];
    }),
  );
}
