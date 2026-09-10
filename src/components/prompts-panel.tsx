"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { t } from "@/lib/i18n/t";
import type { Project } from "@/lib/projects/types";
import { useCurrentProjectId } from "@/lib/projects/use-current-project-id";
import { promptModelLabel } from "@/lib/prompts/models";
import type { Prompt } from "@/lib/prompts/types";
import { projectsQuery } from "@/lib/queries/projects";
import { createPromptRequest, promptsQuery } from "@/lib/queries/prompts";

export function PromptsPanel() {
  const promptsResult = useQuery(promptsQuery.options());
  const projectsResult = useQuery(projectsQuery.options());
  const prompts = promptsResult.data;
  const projects = projectsResult.data;

  return (
    <section className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold tracking-tight">
          {t("home.title")}
        </h1>
        {projects ? (
          <CreatePromptButton projects={projects} />
        ) : (
          <button
            className="rounded-md bg-[var(--ink)] px-3 py-2 text-sm text-white disabled:opacity-60"
            type="button"
            disabled
          >
            {t("nav.newPrompt")}
          </button>
        )}
      </div>

      {!prompts || !projects ? (
        <p className="text-sm text-[var(--muted)]" role="status">
          {t("prompt.loading")}
        </p>
      ) : (
        <PromptsList prompts={prompts} projects={projects} />
      )}
    </section>
  );
}

function CreatePromptButton({ projects }: { projects: Project[] }) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { projectId } = useCurrentProjectId(projects);
  const createPrompt = useMutation({
    mutationFn: () =>
      createPromptRequest({
        title: t("prompt.untitled"),
        body: "",
        ...(projectId ? { projectId } : {}),
      }),
    onSuccess: async (prompt) => {
      await queryClient.invalidateQueries({ queryKey: promptsQuery.key });
      router.push(`/prompts/${prompt.id}`);
    },
  });

  return (
    <button
      className="rounded-md bg-[var(--ink)] px-3 py-2 text-sm text-white disabled:opacity-60"
      type="button"
      onClick={() => createPrompt.mutate()}
      disabled={createPrompt.isPending}
    >
      {createPrompt.isPending ? t("nav.creating") : t("nav.newPrompt")}
    </button>
  );
}

function PromptsList({
  prompts,
  projects,
}: {
  prompts: Prompt[];
  projects: Project[];
}) {
  const { projectId } = useCurrentProjectId(projects);
  const visiblePrompts = projectId
    ? prompts.filter((prompt) => prompt.projectId === projectId)
    : prompts;

  if (visiblePrompts.length === 0) {
    return (
      <p className="text-sm text-[var(--muted)]">{t("nav.emptyPrompts")}</p>
    );
  }

  return (
    <ul className="flex flex-col gap-3">
      {visiblePrompts.map((prompt) => (
        <li key={prompt.id}>
          <Link
            href={`/prompts/${prompt.id}`}
            className="block rounded-md border border-[var(--line)] bg-white p-4 hover:border-[var(--ink)]/25"
          >
            <div className="flex flex-wrap items-baseline justify-between gap-3">
              <p className="truncate font-medium">{prompt.title}</p>
              <p className="shrink-0 text-sm text-[var(--muted)]">
                {promptModelLabel(prompt.model)}
              </p>
            </div>
            <p className="mt-1 text-sm text-[var(--muted)]">
              {formatDateTime(prompt.updatedAt)}
              <span className="mx-2">·</span>
              {prompt.teamName ?? t("nav.personal")}
            </p>
          </Link>
        </li>
      ))}
    </ul>
  );
}

function formatDateTime(iso: string): string {
  return new Intl.DateTimeFormat("ja-JP", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(iso));
}
