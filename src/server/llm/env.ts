import type { PromptProvider } from "@/lib/prompts/models";

type Env = Record<string, string | undefined>;

export type LlmConfig = {
  mode: "live" | "stub";
  openaiApiKey?: string;
  anthropicApiKey?: string;
  geminiApiKey?: string;
  xaiApiKey?: string;
};

export function resolveLlmConfig(env: Env): LlmConfig {
  return {
    mode: env.PROMPT_LLM_MODE === "stub" ? "stub" : "live",
    openaiApiKey: emptyToUndefined(env.OPENAI_API_KEY),
    anthropicApiKey: emptyToUndefined(env.ANTHROPIC_API_KEY),
    geminiApiKey: emptyToUndefined(env.GEMINI_API_KEY),
    xaiApiKey: emptyToUndefined(env.XAI_API_KEY),
  };
}

export function apiKeyForProvider(
  config: LlmConfig,
  provider: PromptProvider,
): string | undefined {
  if (provider === "openai") {
    return config.openaiApiKey;
  }
  if (provider === "anthropic") {
    return config.anthropicApiKey;
  }
  if (provider === "google") {
    return config.geminiApiKey;
  }
  return config.xaiApiKey;
}

export function apiKeyEnvName(provider: PromptProvider): string {
  if (provider === "openai") {
    return "OPENAI_API_KEY";
  }
  if (provider === "anthropic") {
    return "ANTHROPIC_API_KEY";
  }
  if (provider === "google") {
    return "GEMINI_API_KEY";
  }
  return "XAI_API_KEY";
}

function emptyToUndefined(value: string | undefined): string | undefined {
  if (!value || value.trim() === "") {
    return undefined;
  }
  return value;
}
