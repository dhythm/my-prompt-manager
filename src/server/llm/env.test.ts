import { describe, expect, it } from "vitest";
import { resolveLlmConfig } from "./env";

describe("resolveLlmConfig", () => {
  it("defaults to live mode with no keys", () => {
    expect(resolveLlmConfig({})).toEqual({
      mode: "live",
      openaiApiKey: undefined,
      anthropicApiKey: undefined,
      geminiApiKey: undefined,
      xaiApiKey: undefined,
    });
  });

  it("treats blank keys as unset", () => {
    expect(
      resolveLlmConfig({
        OPENAI_API_KEY: "  ",
        ANTHROPIC_API_KEY: "",
        GEMINI_API_KEY: "gemini-key",
        XAI_API_KEY: " xai-key ",
      }),
    ).toEqual({
      mode: "live",
      openaiApiKey: undefined,
      anthropicApiKey: undefined,
      geminiApiKey: "gemini-key",
      xaiApiKey: " xai-key ",
    });
  });

  it("enables stub mode only when PROMPT_LLM_MODE is stub", () => {
    expect(resolveLlmConfig({ PROMPT_LLM_MODE: "stub" }).mode).toBe("stub");
    expect(resolveLlmConfig({ PROMPT_LLM_MODE: "live" }).mode).toBe("live");
    expect(resolveLlmConfig({ PROMPT_LLM_MODE: "other" }).mode).toBe("live");
  });
});
