import { describe, expect, it, vi } from "vitest";
import { t } from "@/lib/i18n/t";
import {
  createCompleteChat,
  STUB_INPUT_TOKENS,
  STUB_OUTPUT,
  STUB_OUTPUT_TOKENS,
} from "./complete-chat";
import type { LlmConfig } from "./env";
import { isLlmConfigError, isLlmRequestError } from "./errors";

const messages = [
  { role: "system" as const, content: "You help Ada." },
  { role: "user" as const, content: "Talk about math." },
];

const liveConfig: LlmConfig = {
  mode: "live",
  openaiApiKey: "openai-key",
  anthropicApiKey: "anthropic-key",
  geminiApiKey: "gemini-key",
  xaiApiKey: "xai-key",
};

describe("createCompleteChat", () => {
  it("returns a fixed stub completion without calling fetch", async () => {
    const fetchImpl = vi.fn();
    const completeChat = createCompleteChat({
      config: { mode: "stub" },
      fetchImpl,
    });

    await expect(
      completeChat({ modelId: "grok-4.6", messages }),
    ).resolves.toEqual({
      text: STUB_OUTPUT,
      inputTokens: STUB_INPUT_TOKENS,
      outputTokens: STUB_OUTPUT_TOKENS,
    });
    expect(fetchImpl).not.toHaveBeenCalled();
  });

  it("rejects an unknown model before calling the provider", async () => {
    const fetchImpl = vi.fn();
    const completeChat = createCompleteChat({
      config: liveConfig,
      fetchImpl,
    });

    await expect(
      completeChat({ modelId: "mystery-model", messages }),
    ).rejects.toSatisfy(
      (error) =>
        isLlmConfigError(error) && error.message === t("error.llmModelUnknown"),
    );
    expect(fetchImpl).not.toHaveBeenCalled();
  });

  it("rejects a missing provider key", async () => {
    const completeChat = createCompleteChat({
      config: { mode: "live" },
    });

    await expect(
      completeChat({ modelId: "grok-4.6", messages }),
    ).rejects.toSatisfy(
      (error) =>
        isLlmConfigError(error) &&
        error.message === t("error.llmKeyMissing", { name: "XAI_API_KEY" }),
    );
  });

  it("posts OpenAI chat completions and reads usage", async () => {
    const fetchImpl = jsonFetch({
      choices: [{ message: { content: "Hello from GPT" } }],
      usage: { prompt_tokens: 11, completion_tokens: 7 },
    });
    const completeChat = createCompleteChat({ config: liveConfig, fetchImpl });

    await expect(
      completeChat({ modelId: "gpt-5.6", messages }),
    ).resolves.toEqual({
      text: "Hello from GPT",
      inputTokens: 11,
      outputTokens: 7,
    });

    expect(fetchImpl).toHaveBeenCalledWith(
      "https://api.openai.com/v1/chat/completions",
      expect.objectContaining({
        method: "POST",
        headers: expect.objectContaining({
          Authorization: "Bearer openai-key",
        }),
      }),
    );
    expect(requestBody(fetchImpl)).toEqual({
      model: "gpt-5.6",
      messages,
    });
  });

  it("posts xAI chat completions with store disabled", async () => {
    const fetchImpl = jsonFetch({
      choices: [{ message: { content: "Hello from Grok" } }],
      usage: { prompt_tokens: 9, completion_tokens: 4 },
    });
    const completeChat = createCompleteChat({ config: liveConfig, fetchImpl });

    await expect(
      completeChat({ modelId: "grok-4.6", messages }),
    ).resolves.toEqual({
      text: "Hello from Grok",
      inputTokens: 9,
      outputTokens: 4,
    });

    expect(fetchImpl).toHaveBeenCalledWith(
      "https://api.x.ai/v1/chat/completions",
      expect.objectContaining({
        headers: expect.objectContaining({
          Authorization: "Bearer xai-key",
        }),
      }),
    );
    expect(requestBody(fetchImpl)).toMatchObject({
      model: "grok-4.6",
      store: false,
    });
  });

  it("posts Anthropic messages with a system field", async () => {
    const fetchImpl = jsonFetch({
      content: [{ type: "text", text: "Hello from Claude" }],
      usage: { input_tokens: 20, output_tokens: 8 },
    });
    const completeChat = createCompleteChat({ config: liveConfig, fetchImpl });

    await expect(
      completeChat({ modelId: "claude-sonnet-5", messages }),
    ).resolves.toEqual({
      text: "Hello from Claude",
      inputTokens: 20,
      outputTokens: 8,
    });

    expect(fetchImpl).toHaveBeenCalledWith(
      "https://api.anthropic.com/v1/messages",
      expect.objectContaining({
        headers: expect.objectContaining({
          "x-api-key": "anthropic-key",
          "anthropic-version": "2023-06-01",
        }),
      }),
    );
    expect(requestBody(fetchImpl)).toEqual({
      model: "claude-sonnet-5",
      max_tokens: 4096,
      system: "You help Ada.",
      messages: [{ role: "user", content: "Talk about math." }],
    });
  });

  it("posts Gemini generateContent with a system instruction", async () => {
    const fetchImpl = jsonFetch({
      candidates: [{ content: { parts: [{ text: "Hello from Gemini" }] } }],
      usageMetadata: { promptTokenCount: 15, candidatesTokenCount: 6 },
    });
    const completeChat = createCompleteChat({ config: liveConfig, fetchImpl });

    await expect(
      completeChat({ modelId: "gemini-3.1-pro", messages }),
    ).resolves.toEqual({
      text: "Hello from Gemini",
      inputTokens: 15,
      outputTokens: 6,
    });

    expect(fetchImpl).toHaveBeenCalledWith(
      "https://generativelanguage.googleapis.com/v1beta/models/gemini-3.1-pro:generateContent",
      expect.objectContaining({
        headers: expect.objectContaining({
          "x-goog-api-key": "gemini-key",
        }),
      }),
    );
    expect(requestBody(fetchImpl)).toEqual({
      systemInstruction: { parts: [{ text: "You help Ada." }] },
      contents: [{ role: "user", parts: [{ text: "Talk about math." }] }],
    });
  });

  it("turns a provider error into an llm request error", async () => {
    const fetchImpl = vi.fn(
      async () =>
        new Response(JSON.stringify({ error: { message: "quota" } }), {
          status: 429,
          headers: { "Content-Type": "application/json" },
        }),
    );
    const completeChat = createCompleteChat({ config: liveConfig, fetchImpl });

    await expect(
      completeChat({ modelId: "gpt-5.6", messages }),
    ).rejects.toSatisfy(
      (error) =>
        isLlmRequestError(error) &&
        error.message === t("error.llmRequestFailed"),
    );
  });
});

function requestBody(fetchImpl: ReturnType<typeof vi.fn>) {
  const body = (fetchImpl.mock.calls[0]?.[1] as RequestInit | undefined)?.body;
  if (typeof body !== "string") {
    throw new Error("missing request body");
  }
  return JSON.parse(body) as unknown;
}

function jsonFetch(payload: unknown) {
  return vi.fn(
    async () =>
      new Response(JSON.stringify(payload), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }),
  );
}
