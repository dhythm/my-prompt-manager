const promptModels = [
  { id: "gpt-4.1", label: "GPT-4.1" },
  { id: "claude-sonnet-4", label: "Claude Sonnet 4" },
  { id: "grok-4", label: "Grok 4" },
  { id: "gemini-2.5-pro", label: "Gemini 2.5 Pro" },
] as const;

export type PromptModelId = (typeof promptModels)[number]["id"];

export const defaultPromptModel: PromptModelId = "gpt-4.1";
