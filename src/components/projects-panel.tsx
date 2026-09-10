"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { isHttpError } from "@/lib/api/http";
import { t } from "@/lib/i18n/t";
import {
  createProjectRequest,
  deleteProjectRequest,
  projectsQuery,
  renameProjectRequest,
} from "@/lib/queries/projects";
import { promptsQuery } from "@/lib/queries/prompts";
import { teamsQuery } from "@/lib/queries/teams";

export function ProjectsPanel() {
  const queryClient = useQueryClient();
  const { data: projects, isPending: projectsPending } = useQuery(
    projectsQuery.options(),
  );
  const { data: teams = [] } = useQuery(teamsQuery.options());
  const [name, setName] = useState("");
  const [teamId, setTeamId] = useState("");
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const [error, setError] = useState<string | undefined>();

  async function invalidateWorkspace() {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: projectsQuery.key }),
      queryClient.invalidateQueries({ queryKey: promptsQuery.key }),
    ]);
  }

  const createProject = useMutation({
    mutationFn: createProjectRequest,
    onSuccess: async () => {
      setError(undefined);
      setName("");
      await invalidateWorkspace();
    },
    onError: (err) => {
      setError(isHttpError(err) ? err.message : t("project.createFailed"));
    },
  });

  const renameProject = useMutation({
    mutationFn: ({ id, nextName }: { id: string; nextName: string }) =>
      renameProjectRequest(id, nextName),
    onSuccess: async () => {
      setError(undefined);
      await invalidateWorkspace();
    },
    onError: (err) => {
      setError(isHttpError(err) ? err.message : t("project.renameFailed"));
    },
  });

  const removeProject = useMutation({
    mutationFn: deleteProjectRequest,
    onSuccess: async () => {
      setError(undefined);
      await invalidateWorkspace();
    },
    onError: (err) => {
      setError(isHttpError(err) ? err.message : t("project.deleteFailed"));
    },
  });

  return (
    <section className="flex flex-col gap-6 rounded-md border border-zinc-200 bg-white p-4">
      <ul className="flex flex-col gap-3 text-sm">
        {projectsPending || !projects ? (
          <li className="text-zinc-600" role="status">
            {t("project.loading")}
          </li>
        ) : projects.length === 0 ? (
          <li className="text-zinc-600">{t("project.empty")}</li>
        ) : (
          projects.map((project) => (
            <li key={project.id} className="flex flex-wrap items-center gap-2">
              <input
                className="min-w-40 flex-1 rounded-md border border-zinc-300 px-3 py-2"
                name={`project-name-${project.id}`}
                value={drafts[project.id] ?? project.name}
                onChange={(event) =>
                  setDrafts((current) => ({
                    ...current,
                    [project.id]: event.target.value,
                  }))
                }
                aria-label={t("field.name")}
              />
              <span className="text-zinc-500">
                {project.teamName ?? t("nav.personal")}
              </span>
              <button
                className="rounded-md border border-zinc-300 px-3 py-2"
                type="button"
                onClick={() =>
                  renameProject.mutate({
                    id: project.id,
                    nextName: drafts[project.id] ?? project.name,
                  })
                }
                disabled={renameProject.isPending}
              >
                {t("project.rename")}
              </button>
              <button
                className="rounded-md border border-zinc-300 px-3 py-2"
                type="button"
                onClick={() => removeProject.mutate(project.id)}
                disabled={removeProject.isPending}
              >
                {t("project.delete")}
              </button>
            </li>
          ))
        )}
      </ul>

      <form
        className="flex flex-wrap gap-2"
        onSubmit={(event) => {
          event.preventDefault();
          createProject.mutate({
            name,
            ...(teamId ? { teamId } : {}),
          });
        }}
      >
        <input
          className="rounded-md border border-zinc-300 px-3 py-2 text-sm"
          name="name"
          value={name}
          onChange={(event) => setName(event.target.value)}
          placeholder={t("project.namePlaceholder")}
          required
        />
        <select
          className="rounded-md border border-zinc-300 px-3 py-2 text-sm"
          name="teamId"
          value={teamId}
          onChange={(event) => setTeamId(event.target.value)}
          aria-label={t("field.teamId")}
        >
          <option value="">{t("nav.personal")}</option>
          {teams.map((team) => (
            <option key={team.id} value={team.id}>
              {team.name}
            </option>
          ))}
        </select>
        <button
          className="rounded-md bg-zinc-900 px-3 py-2 text-sm text-white"
          type="submit"
          disabled={createProject.isPending}
        >
          {t("project.create")}
        </button>
      </form>

      {error ? <p className="text-sm text-red-700">{error}</p> : null}
    </section>
  );
}
