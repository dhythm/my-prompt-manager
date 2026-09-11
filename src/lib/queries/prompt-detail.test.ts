import { type InfiniteData, QueryClient } from "@tanstack/react-query";
import { describe, expect, it } from "vitest";
import type { PromptRun } from "@/lib/prompts/types";
import {
  prependRunToPages,
  promptRunsQuery,
  promptVersionDetailQuery,
  promptVersionsQuery,
  type RunsPage,
  rememberRecordedRun,
  runDetailQuery,
  workspaceRunsQuery,
} from "./prompt-detail";

function sampleRun(overrides: Partial<PromptRun> = {}): PromptRun {
  return {
    id: "run-1",
    promptId: "prompt-1",
    promptTitle: "Greeting",
    model: "grok-4.6",
    input: "user: Hello Ada",
    output: "Hi Ada",
    status: "succeeded",
    inputTokens: 10,
    outputTokens: 4,
    costUsd: "0.0001",
    source: "playground",
    createdAt: "2026-09-10T00:00:00.000Z",
    ...overrides,
  };
}

function runsData(runs: PromptRun[]): InfiniteData<RunsPage> {
  return {
    pages: [{ runs, nextCursor: null }],
    pageParams: [null],
  };
}

describe("prompt version queries", () => {
  it("keeps a stable versions list key", () => {
    expect(promptVersionsQuery.key("prompt-1")).toEqual([
      "prompt-versions",
      "prompt-1",
    ]);
  });

  it("keys version detail by prompt and version number", () => {
    expect(promptVersionDetailQuery.key("prompt-1", 2)).toEqual([
      "prompt-version",
      "prompt-1",
      2,
    ]);
    expect(promptVersionDetailQuery.options("prompt-1", 2).staleTime).toBe(
      60_000,
    );
  });

  it("keys run detail by run id", () => {
    expect(runDetailQuery.key("run-1")).toEqual(["run", "run-1"]);
  });

  it("keys workspace runs by prompt and model filters", () => {
    expect(workspaceRunsQuery.pageKey()).toEqual(["runs", "", ""]);
    expect(
      workspaceRunsQuery.pageKey({ promptId: "p1", model: "grok-4.6" }),
    ).toEqual(["runs", "p1", "grok-4.6"]);
  });
});

describe("rememberRecordedRun", () => {
  it("puts a new run at the front of the first page", () => {
    const older = sampleRun({ id: "run-old" });
    const created = sampleRun({ id: "run-new" });
    const next = prependRunToPages(runsData([older]), created);
    expect(next?.pages[0]?.runs.map((run) => run.id)).toEqual([
      "run-new",
      "run-old",
    ]);
  });

  it("does not duplicate a run that is already on the first page", () => {
    const run = sampleRun();
    const current = runsData([run]);
    expect(prependRunToPages(current, run)).toBe(current);
  });

  it("leaves an empty cache alone so later pages can still load", () => {
    expect(prependRunToPages(undefined, sampleRun())).toBeUndefined();
  });

  it("writes the run into prompt logs, matching workspace logs, and run detail", () => {
    const queryClient = new QueryClient();
    const older = sampleRun({ id: "run-old" });
    const created = sampleRun({ id: "run-new" });
    const otherPrompt = sampleRun({
      id: "run-other",
      promptId: "prompt-2",
    });
    const otherModel = sampleRun({
      id: "run-model",
      model: "gpt-5.6-sol",
    });

    queryClient.setQueryData(
      promptRunsQuery.key("prompt-1"),
      runsData([older]),
    );
    queryClient.setQueryData(workspaceRunsQuery.pageKey({}), runsData([older]));
    queryClient.setQueryData(
      workspaceRunsQuery.pageKey({ promptId: "prompt-1" }),
      runsData([older]),
    );
    queryClient.setQueryData(
      workspaceRunsQuery.pageKey({ promptId: "prompt-2" }),
      runsData([otherPrompt]),
    );
    queryClient.setQueryData(
      workspaceRunsQuery.pageKey({ model: "gpt-5.6-sol" }),
      runsData([otherModel]),
    );

    rememberRecordedRun(queryClient, created);

    expect(
      queryClient
        .getQueryData<InfiniteData<RunsPage>>(promptRunsQuery.key("prompt-1"))
        ?.pages[0]?.runs.map((run) => run.id),
    ).toEqual(["run-new", "run-old"]);
    expect(
      queryClient
        .getQueryData<InfiniteData<RunsPage>>(workspaceRunsQuery.pageKey({}))
        ?.pages[0]?.runs.map((run) => run.id),
    ).toEqual(["run-new", "run-old"]);
    expect(
      queryClient
        .getQueryData<InfiniteData<RunsPage>>(
          workspaceRunsQuery.pageKey({ promptId: "prompt-1" }),
        )
        ?.pages[0]?.runs.map((run) => run.id),
    ).toEqual(["run-new", "run-old"]);
    expect(
      queryClient
        .getQueryData<InfiniteData<RunsPage>>(
          workspaceRunsQuery.pageKey({ promptId: "prompt-2" }),
        )
        ?.pages[0]?.runs.map((run) => run.id),
    ).toEqual(["run-other"]);
    expect(
      queryClient
        .getQueryData<InfiniteData<RunsPage>>(
          workspaceRunsQuery.pageKey({ model: "gpt-5.6-sol" }),
        )
        ?.pages[0]?.runs.map((run) => run.id),
    ).toEqual(["run-model"]);
    expect(queryClient.getQueryData(runDetailQuery.key("run-new"))).toEqual(
      created,
    );
  });
});
