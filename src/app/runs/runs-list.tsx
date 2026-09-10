"use client";

import { useInfiniteQuery, useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { PromptRunSummary } from "@/components/prompt-run-card";
import { t } from "@/lib/i18n/t";
import { promptModels } from "@/lib/prompts/models";
import { workspaceRunsQuery } from "@/lib/queries/prompt-detail";
import { promptsQuery } from "@/lib/queries/prompts";

export function RunsList() {
  const { data: prompts = [] } = useQuery(promptsQuery.options());
  const [promptId, setPromptId] = useState("");
  const [model, setModel] = useState("");
  const filter = {
    ...(promptId ? { promptId } : {}),
    ...(model ? { model } : {}),
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap gap-3">
        <label className="flex flex-col gap-1 text-sm">
          {t("prompt.titleLabel")}
          <select
            className="rounded-md border border-[var(--line)] bg-white px-3 py-2"
            value={promptId}
            onChange={(event) => setPromptId(event.target.value)}
            aria-label={t("prompt.titleLabel")}
          >
            <option value="">{t("runs.filterAll")}</option>
            {prompts.map((prompt) => (
              <option key={prompt.id} value={prompt.id}>
                {prompt.title}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1 text-sm">
          {t("prompt.model")}
          <select
            className="rounded-md border border-[var(--line)] bg-white px-3 py-2"
            value={model}
            onChange={(event) => setModel(event.target.value)}
            aria-label={t("prompt.model")}
          >
            <option value="">{t("runs.filterAll")}</option>
            {promptModels.map((item) => (
              <option key={item.id} value={item.id}>
                {item.label}
              </option>
            ))}
          </select>
        </label>
      </div>
      <RunsResults filter={filter} />
    </div>
  );
}

function RunsResults({
  filter,
}: {
  filter: { promptId?: string; model?: string };
}) {
  const runsQuery = useInfiniteQuery(workspaceRunsQuery.options(filter));
  const runs = runsQuery.data?.pages.flatMap((page) => page.runs) ?? [];

  if (runsQuery.isPending) {
    return (
      <p className="text-sm text-[var(--muted)]" aria-busy="true" role="status">
        {t("runs.loading")}
      </p>
    );
  }

  if (runs.length === 0) {
    return <p className="text-sm text-[var(--muted)]">{t("runs.empty")}</p>;
  }

  return (
    <div className="flex flex-col gap-1.5">
      <ul className="flex flex-col gap-1.5">
        {runs.map((run) => (
          <li key={run.id}>
            <PromptRunSummary
              run={run}
              heading={run.promptTitle}
              href={`/runs/${run.id}`}
            />
          </li>
        ))}
      </ul>
      {runsQuery.hasNextPage ? (
        <button
          className="self-start rounded-md border border-[var(--line)] px-3 py-2 text-sm"
          type="button"
          onClick={() => runsQuery.fetchNextPage()}
          disabled={runsQuery.isFetchingNextPage}
        >
          {runsQuery.isFetchingNextPage
            ? t("runs.loadingMore")
            : t("runs.loadMore")}
        </button>
      ) : null}
    </div>
  );
}
