import {
  type InfiniteData,
  infiniteQueryOptions,
  type QueryClient,
  queryOptions,
} from "@tanstack/react-query";
import { getJson, patchJson, postJson } from "@/lib/api/http";
import { RUNS_PAGE_SIZE } from "@/lib/prompts/runs-page";
import type {
  PromptDetail,
  PromptRun,
  PromptVersion,
  PromptVersionDetail,
} from "@/lib/prompts/types";

export type RunsPage = {
  runs: PromptRun[];
  nextCursor: string | null;
};

function runsSearch(filter: {
  promptId?: string;
  model?: string;
  cursor?: string | null;
}) {
  const params = new URLSearchParams();
  if (filter.promptId) {
    params.set("promptId", filter.promptId);
  }
  if (filter.model) {
    params.set("model", filter.model);
  }
  if (filter.cursor) {
    params.set("cursor", filter.cursor);
  }
  params.set("limit", String(RUNS_PAGE_SIZE));
  const query = params.toString();
  return query === "" ? "" : `?${query}`;
}

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
    infiniteQueryOptions({
      queryKey: promptRunsQuery.key(id),
      queryFn: async ({ pageParam }) =>
        getJson<RunsPage>(
          `/api/prompts/${id}/runs${runsSearch({ cursor: pageParam })}`,
        ),
      initialPageParam: null as string | null,
      getNextPageParam: (page) => page.nextCursor,
      staleTime: 60_000,
    }),
};

export const workspaceRunsQuery = {
  key: ["runs"] as const,
  pageKey: (filter: { promptId?: string; model?: string } = {}) =>
    ["runs", filter.promptId ?? "", filter.model ?? ""] as const,
  options: (filter: { promptId?: string; model?: string } = {}) =>
    infiniteQueryOptions({
      queryKey: workspaceRunsQuery.pageKey(filter),
      queryFn: async ({ pageParam }) =>
        getJson<RunsPage>(
          `/api/runs${runsSearch({ ...filter, cursor: pageParam })}`,
        ),
      initialPageParam: null as string | null,
      getNextPageParam: (page) => page.nextCursor,
      staleTime: 60_000,
    }),
};

export const runDetailQuery = {
  key: (id: string) => ["run", id] as const,
  options: (id: string) =>
    queryOptions({
      queryKey: runDetailQuery.key(id),
      queryFn: async () => {
        const data = await getJson<{ run: PromptRun }>(`/api/runs/${id}`);
        return data.run;
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
  input: {
    variables?: Record<string, string>;
    model?: string;
    source?: PromptRun["source"];
  } = {},
) {
  const data = await postJson<{ run: PromptRun }>(`/api/prompts/${id}/runs`, {
    variables: input.variables ?? {},
    ...(input.model ? { model: input.model } : {}),
    ...(input.source ? { source: input.source } : {}),
  });
  return data.run;
}

export function prependRunToPages(
  data: InfiniteData<RunsPage> | undefined,
  run: PromptRun,
): InfiniteData<RunsPage> | undefined {
  if (!data?.pages.length) {
    return data;
  }
  const [first, ...rest] = data.pages;
  if (first.runs.some((item) => item.id === run.id)) {
    return data;
  }
  return {
    pages: [{ ...first, runs: [run, ...first.runs] }, ...rest],
    pageParams: data.pageParams,
  };
}

function workspaceRunCacheIncludes(queryKey: unknown, run: PromptRun) {
  if (!Array.isArray(queryKey) || queryKey[0] !== "runs") {
    return false;
  }
  const filteredPromptId = queryKey[1];
  const filteredModel = queryKey[2];
  if (
    typeof filteredPromptId === "string" &&
    filteredPromptId !== "" &&
    filteredPromptId !== run.promptId
  ) {
    return false;
  }
  if (
    typeof filteredModel === "string" &&
    filteredModel !== "" &&
    filteredModel !== run.model
  ) {
    return false;
  }
  return true;
}

export function rememberRecordedRun(queryClient: QueryClient, run: PromptRun) {
  queryClient.setQueryData(runDetailQuery.key(run.id), run);
  queryClient.setQueryData(
    promptRunsQuery.key(run.promptId),
    (current: InfiniteData<RunsPage> | undefined) =>
      prependRunToPages(current, run),
  );
  for (const query of queryClient
    .getQueryCache()
    .findAll({ queryKey: workspaceRunsQuery.key })) {
    if (!workspaceRunCacheIncludes(query.queryKey, run)) {
      continue;
    }
    queryClient.setQueryData(
      query.queryKey,
      (current: InfiniteData<RunsPage> | undefined) =>
        prependRunToPages(current, run),
    );
  }
}
