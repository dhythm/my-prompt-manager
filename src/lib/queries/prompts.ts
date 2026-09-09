import { queryOptions } from "@tanstack/react-query";
import { getJson, postJson } from "@/lib/api/http";
import type { CreatePromptInput, Prompt } from "@/lib/prompts/types";

export const promptsQuery = {
  key: ["prompts"] as const,
  options: () =>
    queryOptions({
      queryKey: promptsQuery.key,
      queryFn: async () => {
        const data = await getJson<{ prompts: Prompt[] }>("/api/prompts");
        return data.prompts;
      },
      staleTime: 60_000,
    }),
};

export async function createPromptRequest(input: CreatePromptInput) {
  const data = await postJson<{ prompt: Prompt }>("/api/prompts", input);
  return data.prompt;
}

export async function transferPromptRequest(promptId: string, teamId: string) {
  const data = await postJson<{ prompt: Prompt }>(
    `/api/prompts/${promptId}/transfer`,
    { teamId },
  );
  return data.prompt;
}
