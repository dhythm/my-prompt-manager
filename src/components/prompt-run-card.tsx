import Link from "next/link";
import type { ReactNode } from "react";
import { t } from "@/lib/i18n/t";
import { formatCostUsd, promptModelLabel } from "@/lib/prompts/models";
import type { PromptRun } from "@/lib/prompts/types";

export function PromptRunSummary({
  run,
  heading,
  href,
}: {
  run: PromptRun;
  heading?: string;
  href: string;
}) {
  const model = promptModelLabel(run.model);
  const recordedAt = formatRunAt(run.createdAt);
  return (
    <Link
      href={href}
      className="block rounded-md border border-[var(--line)] bg-white px-3 py-2 hover:border-[var(--ink)]/25"
    >
      <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-0.5">
        <p className="truncate font-medium">{heading ?? model}</p>
        <p className="shrink-0 text-sm text-[var(--muted)]">
          {heading ? model : recordedAt}
        </p>
      </div>
      <p className="mt-0.5 text-sm text-[var(--muted)]">
        {runMeta(
          run,
          heading ? undefined : model,
          heading ? recordedAt : undefined,
        )}
      </p>
    </Link>
  );
}

export function PromptRunCard({
  run,
  heading,
  action,
}: {
  run: PromptRun;
  heading?: string;
  action?: ReactNode;
}) {
  const model = promptModelLabel(run.model);

  return (
    <article className="rounded-md border border-[var(--line)] bg-white p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="font-medium">{heading ?? model}</p>
          <p className="mt-1 text-sm text-[var(--muted)]">
            {runMeta(
              run,
              heading ? model : undefined,
              formatRunAt(run.createdAt),
            )}
          </p>
        </div>
        {action}
      </div>
      <pre className="prompt-mono mt-3 overflow-x-auto whitespace-pre-wrap text-xs">
        {run.input}
      </pre>
      <section className="mt-3" aria-label={t("prompt.runOutput")}>
        <pre className="prompt-mono overflow-x-auto whitespace-pre-wrap text-xs">
          {run.output}
        </pre>
      </section>
    </article>
  );
}

export function OpenPromptLink({
  promptId,
  label,
}: {
  promptId: string;
  label: string;
}) {
  return (
    <Link
      className="shrink-0 text-sm text-[var(--accent)]"
      href={`/prompts/${promptId}`}
    >
      {label}
    </Link>
  );
}

function runMeta(run: PromptRun, model?: string, recordedAt?: string): string {
  const tokens =
    run.inputTokens !== null && run.outputTokens !== null
      ? t("prompt.runTokens", {
          input: run.inputTokens,
          output: run.outputTokens,
        })
      : undefined;
  const cost = formatCostUsd(run.costUsd);
  return [
    recordedAt,
    model,
    run.status === "failed" ? t("prompt.runFailed") : undefined,
    tokens,
    cost,
  ]
    .filter((part): part is string => Boolean(part))
    .join(" · ");
}

function formatRunAt(iso: string): string {
  return new Intl.DateTimeFormat("ja-JP", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(iso));
}
