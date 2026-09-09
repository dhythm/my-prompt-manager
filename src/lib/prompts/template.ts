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
