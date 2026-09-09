import { queryOptions } from "@tanstack/react-query";
import { getJson, patchJson, postJson } from "@/lib/api/http";
import type {
  PromptDetail,
  PromptRun,
  PromptVersion,
  PromptVersionDetail,
} from "@/lib/prompts/types";

export const promptDetailQuery = {
  key: (id: string) => ["prompt", id] as const,
  options: (id: string) =>
    queryOptions({
      queryKey: promptDetailQuery.key(id),
      queryFn: async () => getJson<PromptDetail>(`/api/prompts/${id}`),
      staleTime: 60_000,
    }),
};

export const promptVersionsQuery = {
  key: (id: string) => ["prompt-versions", id] as const,
  options: (id: string) =>
    queryOptions({
      queryKey: promptVersionsQuery.key(id),
      queryFn: async () => {
        const data = await getJson<{ versions: PromptVersion[] }>(
          `/api/prompts/${id}/versions`,
        );
        return data.versions;
      },
      staleTime: 60_000,
    }),
};

export const promptVersionDetailQuery = {
  key: (id: string, versionNumber: number) =>
    ["prompt-version", id, versionNumber] as const,
  options: (id: string, versionNumber: number) =>
    queryOptions({
      queryKey: promptVersionDetailQuery.key(id, versionNumber),
      queryFn: async () =>
        getJson<PromptVersionDetail>(
          `/api/prompts/${id}/versions/${versionNumber}`,
        ),
      staleTime: 60_000,
    }),
};

export const promptRunsQuery = {
  key: (id: string) => ["prompt-runs", id] as const,
  options: (id: string) =>
    queryOptions({
      queryKey: promptRunsQuery.key(id),
      queryFn: async () => {
        const data = await getJson<{ runs: PromptRun[] }>(
          `/api/prompts/${id}/runs`,
        );
        return data.runs;
      },
      staleTime: 60_000,
    }),
};

export const workspaceRunsQuery = {
  key: ["runs"] as const,
  options: () =>
    queryOptions({
      queryKey: workspaceRunsQuery.key,
      queryFn: async () => {
        const data = await getJson<{ runs: PromptRun[] }>("/api/runs");
        return data.runs;
      },
      staleTime: 60_000,
    }),
};

export async function savePromptRequest(
  id: string,
  input: {
    title: string;
    model: string;
    messages: Array<{ role: "system" | "user" | "assistant"; content: string }>;
    note?: string;
  },
) {
  return patchJson(`/api/prompts/${id}`, input);
}

export async function recordRunRequest(
  id: string,
  variables: Record<string, string> = {},
) {
  const data = await postJson<{ run: PromptRun }>(`/api/prompts/${id}/runs`, {
    variables,
  });
  return data.run;
}
