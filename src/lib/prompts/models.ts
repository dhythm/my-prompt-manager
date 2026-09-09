export const promptModels = [
  { id: "grok-4.6", label: "Grok 4.6" },
  { id: "gpt-5.6", label: "GPT-5.6" },
  { id: "claude-sonnet-5", label: "Claude Sonnet 5" },
  { id: "gemini-3.1-pro", label: "Gemini 3.1 Pro" },
] as const;

export type PromptModelId = (typeof promptModels)[number]["id"];

export const defaultPromptModel: PromptModelId = "grok-4.6";

const legacyModelLabels: Record<string, string> = {
  "gpt-4.1": "GPT-4.1",
  "claude-sonnet-4": "Claude Sonnet 4",
  "grok-4": "Grok 4",
  "gemini-2.5-pro": "Gemini 2.5 Pro",
};

export function promptModelLabel(id: string): string {
  const current = promptModels.find((model) => model.id === id);
  if (current) {
    return current.label;
  }
  return legacyModelLabels[id] ?? id;
}

export function promptModelOptions(selectedId: string) {
  if (promptModels.some((model) => model.id === selectedId)) {
    return promptModels;
  }
  return [
    { id: selectedId, label: promptModelLabel(selectedId) },
    ...promptModels,
  ];
}
