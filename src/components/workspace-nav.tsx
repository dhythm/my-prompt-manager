"use client";

import {
  useMutation,
  useQueryClient,
  useSuspenseQuery,
} from "@tanstack/react-query";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { t } from "@/lib/i18n/t";
import {
  readCurrentProjectId,
  resolveCurrentProjectId,
} from "@/lib/projects/current";
import { useCurrentProjectId } from "@/lib/projects/use-current-project-id";
import {
  listWorkspaces,
  projectsInWorkspace,
  workspaceKey,
} from "@/lib/projects/workspace";
import { projectsQuery } from "@/lib/queries/projects";
import { createPromptRequest, promptsQuery } from "@/lib/queries/prompts";

export function WorkspaceNav() {
  const pathname = usePathname();
  const router = useRouter();
  const queryClient = useQueryClient();
  const { data: prompts } = useSuspenseQuery(promptsQuery.options());
  const { data: projects } = useSuspenseQuery(projectsQuery.options());
  const { projectId, selectProjectId } = useCurrentProjectId(projects);
  const currentProject = projects.find((project) => project.id === projectId);
  const workspace = currentProject
    ? workspaceKey(currentProject)
    : listWorkspaces(projects, t("nav.personal"))[0]?.key;
  const workspaces = listWorkspaces(projects, t("nav.personal"));
  const workspaceProjects = workspace
    ? projectsInWorkspace(projects, workspace)
    : projects;

  const visiblePrompts = projectId
    ? prompts.filter((prompt) => prompt.projectId === projectId)
    : prompts;

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
    <aside className="flex h-full w-64 shrink-0 flex-col gap-6 overflow-hidden bg-[var(--panel)] px-4 py-5 text-sm text-zinc-200">
      {workspaces.length > 0 ? (
        <label className="flex flex-col gap-1 text-xs text-zinc-400">
          {t("nav.workspace")}
          <select
            className="rounded-md border border-white/10 bg-white/5 px-2 py-2 text-sm text-zinc-100"
            value={workspace ?? ""}
            aria-label={t("nav.workspace")}
            onChange={(event) => {
              const next = resolveCurrentProjectId(
                projectsInWorkspace(projects, event.target.value),
                readCurrentProjectId(),
              );
              if (next) {
                selectProjectId(next);
              }
            }}
          >
            {workspaces.map((item) => (
              <option key={item.key} value={item.key}>
                {item.label}
              </option>
            ))}
          </select>
        </label>
      ) : null}

      <nav className="flex flex-col gap-1">
        <SideLink href="/" active={pathname === "/"}>
          {t("nav.prompts")}
        </SideLink>
        <SideLink href="/runs" active={pathname === "/runs"}>
          {t("nav.logs")}
        </SideLink>
        <SideLink href="/teams" active={pathname.startsWith("/teams")}>
          {t("nav.teams")}
        </SideLink>
        <SideLink href="/projects" active={pathname.startsWith("/projects")}>
          {t("nav.projects")}
        </SideLink>
      </nav>

      {workspaceProjects.length > 0 ? (
        <label className="flex flex-col gap-1 text-xs text-zinc-400">
          {t("project.switcher")}
          <select
            className="rounded-md border border-white/10 bg-white/5 px-2 py-2 text-sm text-zinc-100"
            value={projectId}
            aria-label={t("project.switcher")}
            onChange={(event) => {
              selectProjectId(event.target.value);
            }}
          >
            {workspaceProjects.map((project) => (
              <option key={project.id} value={project.id}>
                {project.name}
              </option>
            ))}
          </select>
        </label>
      ) : null}

      <button
        className="rounded-md border border-white/15 px-3 py-2 text-left text-zinc-100 hover:bg-white/5"
        type="button"
        onClick={() => createPrompt.mutate()}
        disabled={createPrompt.isPending}
      >
        {createPrompt.isPending ? t("nav.creating") : t("nav.newPrompt")}
      </button>

      <div className="flex min-h-0 flex-1 flex-col gap-2 overflow-y-auto">
        <p className="text-xs text-zinc-400">{t("nav.library")}</p>
        {visiblePrompts.length === 0 ? (
          <p className="text-zinc-500">{t("nav.emptyPrompts")}</p>
        ) : (
          <ul className="flex flex-col gap-1">
            {visiblePrompts.map((prompt) => {
              const href = `/prompts/${prompt.id}`;
              const active = pathname === href;
              return (
                <li key={prompt.id}>
                  <Link
                    href={href}
                    className={`block rounded-md px-2 py-2 ${
                      active
                        ? "bg-white/10 text-white"
                        : "text-zinc-300 hover:bg-white/5"
                    }`}
                  >
                    <span className="block truncate">{prompt.title}</span>
                    <span className="block truncate text-xs text-zinc-500">
                      {prompt.teamName ?? t("nav.personal")}
                    </span>
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </aside>
  );
}

function SideLink({
  href,
  active,
  children,
}: {
  href: string;
  active: boolean;
  children: string;
}) {
  return (
    <Link
      href={href}
      className={`rounded-md px-2 py-2 ${
        active ? "bg-white/10 text-white" : "text-zinc-300 hover:bg-white/5"
      }`}
      aria-current={active ? "page" : undefined}
    >
      {children}
    </Link>
  );
}
