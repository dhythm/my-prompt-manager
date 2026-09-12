"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { SidebarSelect } from "@/components/sidebar-select";
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
  const { data: projects = [] } = useQuery(projectsQuery.options());
  const { projectId, selectProjectId } = useCurrentProjectId(projects);
  const currentProject = projects.find((project) => project.id === projectId);
  const workspace = currentProject
    ? workspaceKey(currentProject)
    : listWorkspaces(projects, t("nav.personal"))[0]?.key;
  const workspaces = listWorkspaces(projects, t("nav.personal"));
  const workspaceProjects = workspace
    ? projectsInWorkspace(projects, workspace)
    : projects;

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
      {workspaces.length > 1 ? (
        <SidebarSelect
          label={t("nav.workspace")}
          value={workspace ?? ""}
          options={workspaces.map((item) => ({
            value: item.key,
            label: item.label,
          }))}
          onChange={(nextWorkspace) => {
            const next = resolveCurrentProjectId(
              projectsInWorkspace(projects, nextWorkspace),
              readCurrentProjectId(),
            );
            if (next) {
              selectProjectId(next);
            }
          }}
        />
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
        <SidebarSelect
          label={t("project.switcher")}
          value={projectId}
          options={workspaceProjects.map((project) => ({
            value: project.id,
            label: project.name,
          }))}
          onChange={selectProjectId}
        />
      ) : null}

      <button
        className="rounded-md border border-white/15 px-3 py-2 text-left text-zinc-100 hover:bg-white/5"
        type="button"
        onClick={() => createPrompt.mutate()}
        disabled={createPrompt.isPending}
      >
        {createPrompt.isPending ? t("nav.creating") : t("nav.newPrompt")}
      </button>
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
