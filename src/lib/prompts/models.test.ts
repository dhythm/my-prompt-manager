import { describe, expect, it } from "vitest";
import {
  defaultPromptModel,
  estimateCostUsd,
  formatCostUsd,
  getPromptModel,
  promptModelLabel,
  promptModelOptions,
  promptModels,
} from "./models";

describe("prompt models", () => {
  it("defaults new prompts to Grok 4.6", () => {
    expect(defaultPromptModel).toBe("grok-4.6");
    expect(promptModels.map((model) => model.id)).toEqual([
      "grok-4.6",
      "gpt-5.6",
      "claude-sonnet-5",
      "gemini-3.1-pro",
    ]);
  });

  it("maps known ids to display labels and keeps unknown ids", () => {
    expect(promptModelLabel("grok-4.6")).toBe("Grok 4.6");
    expect(promptModelLabel("gpt-4.1")).toBe("GPT-4.1");
    expect(promptModelLabel("mystery-model")).toBe("mystery-model");
  });

  it("keeps a saved model in the picker when it is no longer current", () => {
    expect(promptModelOptions("gpt-4.1")[0]).toEqual({
      id: "gpt-4.1",
      label: "GPT-4.1",
    });
    expect(promptModelOptions("grok-4.6")[0]?.id).toBe("grok-4.6");
  });

  it("attaches a provider and list prices to each current model", () => {
    expect(getPromptModel("grok-4.6")).toMatchObject({
      provider: "xai",
      apiModel: "grok-4.6",
      inputUsdPerMillion: 2,
      outputUsdPerMillion: 6,
    });
    expect(getPromptModel("gpt-5.6")?.provider).toBe("openai");
    expect(getPromptModel("claude-sonnet-5")?.provider).toBe("anthropic");
    expect(getPromptModel("gemini-3.1-pro")?.provider).toBe("google");
  });

  it("maps legacy ids to a provider without current list prices", () => {
    expect(getPromptModel("gpt-4.1")).toMatchObject({
      provider: "openai",
      apiModel: "gpt-4.1",
    });
    expect(getPromptModel("gpt-4.1")?.inputUsdPerMillion).toBeUndefined();
    expect(getPromptModel("mystery-model")).toBeUndefined();
  });
});

describe("estimateCostUsd", () => {
  it("multiplies token counts by the catalog rates", () => {
    expect(estimateCostUsd("grok-4.6", 12, 34)).toBe("0.0002280000");
  });

  it("returns null when the model has no list price or tokens are missing", () => {
    expect(estimateCostUsd("gpt-4.1", 12, 34)).toBeNull();
    expect(estimateCostUsd("grok-4.6", null, 34)).toBeNull();
    expect(estimateCostUsd("grok-4.6", 12, null)).toBeNull();
    expect(estimateCostUsd("mystery-model", 12, 34)).toBeNull();
  });
});

describe("formatCostUsd", () => {
  it("trims trailing zeros for display", () => {
    expect(formatCostUsd("0.0002280000")).toBe("$0.000228");
    expect(formatCostUsd("0.0000000000")).toBe("$0");
    expect(formatCostUsd(null)).toBeUndefined();
  });
});
