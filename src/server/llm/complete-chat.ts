import { t } from "@/lib/i18n/t";
import { getPromptModel } from "@/lib/prompts/models";
import type { PromptMessage } from "@/lib/prompts/types";
import { apiKeyEnvName, apiKeyForProvider, type LlmConfig } from "./env";
import { createLlmConfigError, createLlmRequestError } from "./errors";

export const STUB_OUTPUT = "stub-output";
export const STUB_INPUT_TOKENS = 12;
export const STUB_OUTPUT_TOKENS = 34;

const ANTHROPIC_MAX_TOKENS = 4096;

export type ChatMessage = Pick<PromptMessage, "role" | "content">;

type ChatCompletion = {
  text: string;
  inputTokens: number | null;
  outputTokens: number | null;
};

export type CompleteChat = (input: {
  modelId: string;
  messages: ChatMessage[];
}) => Promise<ChatCompletion>;

export function createCompleteChat(options: {
  config: LlmConfig;
  fetchImpl?: typeof fetch;
}): CompleteChat {
  const fetchImpl = options.fetchImpl ?? fetch;

  return async ({ modelId, messages }) => {
    if (options.config.mode === "stub") {
      return {
        text: STUB_OUTPUT,
        inputTokens: STUB_INPUT_TOKENS,
        outputTokens: STUB_OUTPUT_TOKENS,
      };
    }

    const model = getPromptModel(modelId);
    if (!model) {
      throw createLlmConfigError(t("error.llmModelUnknown"));
    }

    const apiKey = apiKeyForProvider(options.config, model.provider);
    if (!apiKey) {
      throw createLlmConfigError(
        t("error.llmKeyMissing", { name: apiKeyEnvName(model.provider) }),
      );
    }

    if (model.provider === "openai") {
      return completeOpenAiCompatible({
        fetchImpl,
        url: "https://api.openai.com/v1/chat/completions",
        apiKey,
        body: { model: model.apiModel, messages },
      });
    }

    if (model.provider === "xai") {
      return completeOpenAiCompatible({
        fetchImpl,
        url: "https://api.x.ai/v1/chat/completions",
        apiKey,
        body: { model: model.apiModel, messages, store: false },
      });
    }

    if (model.provider === "anthropic") {
      return completeAnthropic({
        fetchImpl,
        apiKey,
        apiModel: model.apiModel,
        messages,
      });
    }

    return completeGemini({
      fetchImpl,
      apiKey,
      apiModel: model.apiModel,
      messages,
    });
  };
}

async function completeOpenAiCompatible(input: {
  fetchImpl: typeof fetch;
  url: string;
  apiKey: string;
  body: unknown;
}): Promise<ChatCompletion> {
  const payload = await postJson(
    input.fetchImpl,
    input.url,
    {
      Authorization: `Bearer ${input.apiKey}`,
    },
    input.body,
  );
  const text = openaiText(payload);
  if (text === undefined) {
    throw createLlmRequestError(t("error.llmRequestFailed"));
  }
  const usage = asRecord(payload)?.usage;
  return {
    text,
    inputTokens: numberField(usage, "prompt_tokens"),
    outputTokens: numberField(usage, "completion_tokens"),
  };
}

async function completeAnthropic(input: {
  fetchImpl: typeof fetch;
  apiKey: string;
  apiModel: string;
  messages: ChatMessage[];
}): Promise<ChatCompletion> {
  const system = joinContents(input.messages, "system");
  const conversation = input.messages.filter(
    (message) => message.role !== "system",
  );
  const payload = await postJson(
    input.fetchImpl,
    "https://api.anthropic.com/v1/messages",
    {
      "x-api-key": input.apiKey,
      "anthropic-version": "2023-06-01",
    },
    {
      model: input.apiModel,
      max_tokens: ANTHROPIC_MAX_TOKENS,
      ...(system ? { system } : {}),
      messages:
        conversation.length > 0
          ? conversation
          : [{ role: "user", content: system || " " }],
    },
  );
  const text = anthropicText(payload);
  if (text === undefined) {
    throw createLlmRequestError(t("error.llmRequestFailed"));
  }
  const usage = asRecord(payload)?.usage;
  return {
    text,
    inputTokens: numberField(usage, "input_tokens"),
    outputTokens: numberField(usage, "output_tokens"),
  };
}

async function completeGemini(input: {
  fetchImpl: typeof fetch;
  apiKey: string;
  apiModel: string;
  messages: ChatMessage[];
}): Promise<ChatCompletion> {
  const system = joinContents(input.messages, "system");
  const contents = input.messages
    .filter((message) => message.role !== "system")
    .map((message) => ({
      role: message.role === "assistant" ? "model" : "user",
      parts: [{ text: message.content }],
    }));
  const payload = await postJson(
    input.fetchImpl,
    `https://generativelanguage.googleapis.com/v1beta/models/${input.apiModel}:generateContent`,
    { "x-goog-api-key": input.apiKey },
    {
      ...(system ? { systemInstruction: { parts: [{ text: system }] } } : {}),
      contents:
        contents.length > 0
          ? contents
          : [{ role: "user", parts: [{ text: system || " " }] }],
    },
  );
  const text = geminiText(payload);
  if (text === undefined) {
    throw createLlmRequestError(t("error.llmRequestFailed"));
  }
  const usage = asRecord(payload)?.usageMetadata;
  return {
    text,
    inputTokens: numberField(usage, "promptTokenCount"),
    outputTokens: numberField(usage, "candidatesTokenCount"),
  };
}

async function postJson(
  fetchImpl: typeof fetch,
  url: string,
  headers: Record<string, string>,
  body: unknown,
): Promise<unknown> {
  let response: Response;
  try {
    response = await fetchImpl(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...headers,
      },
      body: JSON.stringify(body),
    });
  } catch {
    throw createLlmRequestError(t("error.llmRequestFailed"));
  }

  if (!response.ok) {
    throw createLlmRequestError(t("error.llmRequestFailed"));
  }

  try {
    return await response.json();
  } catch {
    throw createLlmRequestError(t("error.llmRequestFailed"));
  }
}

function openaiText(payload: unknown): string | undefined {
  const content = asRecord(asArray(asRecord(payload)?.choices)?.[0])?.message;
  const text = asRecord(content)?.content;
  return nonemptyString(text);
}

function anthropicText(payload: unknown): string | undefined {
  const parts = asArray(asRecord(payload)?.content) ?? [];
  const texts = parts
    .map((part) => asRecord(part)?.text)
    .filter((text): text is string => typeof text === "string" && text !== "");
  return texts.length > 0 ? texts.join("") : undefined;
}

function geminiText(payload: unknown): string | undefined {
  const parts =
    asArray(
      asRecord(asRecord(asArray(asRecord(payload)?.candidates)?.[0])?.content)
        ?.parts,
    ) ?? [];
  const texts = parts
    .map((part) => asRecord(part)?.text)
    .filter((text): text is string => typeof text === "string" && text !== "");
  return texts.length > 0 ? texts.join("") : undefined;
}

function joinContents(
  messages: ChatMessage[],
  role: ChatMessage["role"],
): string {
  return messages
    .filter((message) => message.role === role)
    .map((message) => message.content)
    .join("\n\n");
}

function numberField(value: unknown, key: string): number | null {
  const raw = asRecord(value)?.[key];
  return typeof raw === "number" && Number.isFinite(raw) ? raw : null;
}

function nonemptyString(value: unknown): string | undefined {
  return typeof value === "string" && value !== "" ? value : undefined;
}

function asRecord(value: unknown): Record<string, unknown> | undefined {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    return undefined;
  }
  return value as Record<string, unknown>;
}

function asArray(value: unknown): unknown[] | undefined {
  return Array.isArray(value) ? value : undefined;
}
