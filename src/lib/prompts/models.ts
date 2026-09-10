const promptProviders = ["openai", "anthropic", "google", "xai"] as const;

export type PromptProvider = (typeof promptProviders)[number];

export type PromptModel = {
  id: string;
  label: string;
  provider: PromptProvider;
  apiModel: string;
  inputUsdPerMillion?: number;
  outputUsdPerMillion?: number;
};

export const promptModels = [
  {
    id: "grok-4.6",
    label: "Grok 4.6",
    provider: "xai",
    apiModel: "grok-4.6",
    inputUsdPerMillion: 2,
    outputUsdPerMillion: 6,
  },
  {
    id: "gpt-5.6",
    label: "GPT-5.6",
    provider: "openai",
    apiModel: "gpt-5.6",
    inputUsdPerMillion: 4,
    outputUsdPerMillion: 20,
  },
  {
    id: "claude-sonnet-5",
    label: "Claude Sonnet 5",
    provider: "anthropic",
    apiModel: "claude-sonnet-5",
    inputUsdPerMillion: 2,
    outputUsdPerMillion: 10,
  },
  {
    id: "gemini-3.1-pro",
    label: "Gemini 3.1 Pro",
    provider: "google",
    apiModel: "gemini-3.1-pro",
    inputUsdPerMillion: 2,
    outputUsdPerMillion: 12,
  },
] as const satisfies readonly PromptModel[];

export type PromptModelId = (typeof promptModels)[number]["id"];

export const defaultPromptModel: PromptModelId = "grok-4.6";

const legacyModels: PromptModel[] = [
  { id: "gpt-4.1", label: "GPT-4.1", provider: "openai", apiModel: "gpt-4.1" },
  {
    id: "claude-sonnet-4",
    label: "Claude Sonnet 4",
    provider: "anthropic",
    apiModel: "claude-sonnet-4",
  },
  { id: "grok-4", label: "Grok 4", provider: "xai", apiModel: "grok-4" },
  {
    id: "gemini-2.5-pro",
    label: "Gemini 2.5 Pro",
    provider: "google",
    apiModel: "gemini-2.5-pro",
  },
];

const modelsById = new Map<string, PromptModel>(
  [...promptModels, ...legacyModels].map((model) => [model.id, model]),
);

export function getPromptModel(id: string): PromptModel | undefined {
  return modelsById.get(id);
}

export function promptModelLabel(id: string): string {
  return getPromptModel(id)?.label ?? id;
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

export function formatCostUsd(
  costUsd: string | null | undefined,
): string | undefined {
  if (costUsd === null || costUsd === undefined || costUsd === "") {
    return undefined;
  }
  const value = Number(costUsd);
  if (!Number.isFinite(value)) {
    return `$${costUsd}`;
  }
  if (value === 0) {
    return "$0";
  }
  return `$${value.toFixed(10).replace(/0+$/, "").replace(/\.$/, "")}`;
}

export function estimateCostUsd(
  modelId: string,
  inputTokens: number | null | undefined,
  outputTokens: number | null | undefined,
): string | null {
  const model = getPromptModel(modelId);
  if (
    model?.inputUsdPerMillion === undefined ||
    model.outputUsdPerMillion === undefined ||
    inputTokens === null ||
    inputTokens === undefined ||
    outputTokens === null ||
    outputTokens === undefined
  ) {
    return null;
  }

  const usd =
    (inputTokens * model.inputUsdPerMillion +
      outputTokens * model.outputUsdPerMillion) /
    1_000_000;
  return usd.toFixed(10);
}
