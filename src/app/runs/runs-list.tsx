"use client";

import { useSuspenseQuery } from "@tanstack/react-query";
import { PromptRunSummary } from "@/components/prompt-run-card";
import { t } from "@/lib/i18n/t";
import { workspaceRunsQuery } from "@/lib/queries/prompt-detail";

export function RunsList() {
  const { data: runs } = useSuspenseQuery(workspaceRunsQuery.options());

  if (runs.length === 0) {
    return <p className="text-sm text-[var(--muted)]">{t("runs.empty")}</p>;
  }

  return (
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
  );
}
