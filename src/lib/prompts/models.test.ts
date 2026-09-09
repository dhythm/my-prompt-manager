import { describe, expect, it } from "vitest";
import {
  defaultPromptModel,
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
});
