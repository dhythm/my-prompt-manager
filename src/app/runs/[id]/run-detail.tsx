"use client";

import { useSuspenseQuery } from "@tanstack/react-query";
import Link from "next/link";
import { OpenPromptLink, PromptRunCard } from "@/components/prompt-run-card";
import { t } from "@/lib/i18n/t";
import { runDetailQuery } from "@/lib/queries/prompt-detail";

export function RunDetail({ runId }: { runId: string }) {
  const { data: run } = useSuspenseQuery(runDetailQuery.options(runId));

  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold tracking-tight">
          {run.promptTitle}
        </h1>
        <div className="flex flex-wrap items-center gap-3">
          <Link className="text-sm text-[var(--accent)]" href="/runs">
            {t("runs.backToList")}
          </Link>
          <OpenPromptLink
            promptId={run.promptId}
            label={t("runs.openPrompt")}
          />
        </div>
      </div>
      <PromptRunCard run={run} />
    </>
  );
}
