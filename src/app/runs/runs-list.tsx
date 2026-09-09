"use client";

import { useSuspenseQuery } from "@tanstack/react-query";
import Link from "next/link";
import { workspaceRunsQuery } from "@/lib/queries/prompt-detail";

export function RunsList() {
  const { data: runs } = useSuspenseQuery(workspaceRunsQuery.options());

  if (runs.length === 0) {
    return <p className="text-sm text-[var(--muted)]">No runs yet.</p>;
  }

  return (
    <ul className="flex flex-col gap-3">
      {runs.map((run) => (
        <li
          key={run.id}
          className="rounded-md border border-[var(--line)] bg-white p-4"
        >
          <div className="flex items-baseline justify-between gap-2">
            <p className="font-medium">{run.model}</p>
            <Link
              className="text-sm text-[var(--accent)]"
              href={`/prompts/${run.promptId}`}
            >
              Open prompt
            </Link>
          </div>
          <pre className="prompt-mono mt-2 overflow-x-auto text-xs text-[var(--muted)]">
            {run.output}
          </pre>
        </li>
      ))}
    </ul>
  );
}
