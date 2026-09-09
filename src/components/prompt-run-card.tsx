import Link from "next/link";
import type { ReactNode } from "react";
import { promptModelLabel } from "@/lib/prompts/models";
import type { PromptRun } from "@/lib/prompts/types";

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
  const recordedAt = formatRunAt(run.createdAt);

  return (
    <article className="rounded-md border border-[var(--line)] bg-white p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="font-medium">{heading ?? model}</p>
          <p className="mt-1 text-sm text-[var(--muted)]">
            {heading ? `${model} · ${recordedAt}` : recordedAt}
          </p>
        </div>
        {action}
      </div>
      <pre className="prompt-mono mt-3 overflow-x-auto whitespace-pre-wrap text-xs">
        {run.input}
      </pre>
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

function formatRunAt(iso: string): string {
  return new Intl.DateTimeFormat("ja-JP", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(iso));
}
