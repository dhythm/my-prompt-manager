"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { type ReactNode, useEffect, useId, useRef, useState } from "react";
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
  const [kind, setKind] = useState<"personal" | "team">("personal");
  const [teamId, setTeamId] = useState("");
  const [renameId, setRenameId] = useState<string | undefined>();
  const [renameName, setRenameName] = useState("");
  const [deleteId, setDeleteId] = useState<string | undefined>();
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
      setKind("personal");
      setTeamId("");
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
      setRenameId(undefined);
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
      setDeleteId(undefined);
      await invalidateWorkspace();
    },
    onError: (err) => {
      setDeleteId(undefined);
      setError(isHttpError(err) ? err.message : t("project.deleteFailed"));
    },
  });

  const renaming = projects?.find((project) => project.id === renameId);
  const deleting = projects?.find((project) => project.id === deleteId);

  return (
    <div className="flex flex-col gap-4">
      <section className="rounded-md border border-zinc-200 bg-white p-4">
        <h2 className="mb-3 text-sm font-semibold">{t("project.create")}</h2>
        <form
          className="flex flex-wrap items-end gap-2"
          onSubmit={(event) => {
            event.preventDefault();
            createProject.mutate({
              name,
              ...(kind === "team" && teamId ? { teamId } : {}),
            });
          }}
        >
          <label className="flex min-w-40 flex-1 flex-col gap-1 text-xs text-zinc-600">
            {t("field.name")}
            <input
              className="rounded-md border border-zinc-300 px-3 py-2 text-sm text-zinc-900"
              name="name"
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder={t("project.namePlaceholder")}
              required
            />
          </label>
          {teams.length > 0 ? (
            <label className="flex flex-col gap-1 text-xs text-zinc-600">
              {t("project.kind")}
              <select
                className="rounded-md border border-zinc-300 px-3 py-2 text-sm text-zinc-900"
                name="kind"
                value={kind}
                onChange={(event) => {
                  const next =
                    event.target.value === "team" ? "team" : "personal";
                  setKind(next);
                  if (next === "personal") {
                    setTeamId("");
                  }
                }}
              >
                <option value="personal">{t("nav.personal")}</option>
                <option value="team">{t("project.kindTeam")}</option>
              </select>
            </label>
          ) : null}
          {kind === "team" && teams.length > 0 ? (
            <label className="flex flex-col gap-1 text-xs text-zinc-600">
              {t("field.teamId")}
              <select
                className="rounded-md border border-zinc-300 px-3 py-2 text-sm text-zinc-900"
                name="teamId"
                value={teamId}
                onChange={(event) => setTeamId(event.target.value)}
                required
              >
                <option value="">{t("field.teamId")}</option>
                {teams.map((team) => (
                  <option key={team.id} value={team.id}>
                    {team.name}
                  </option>
                ))}
              </select>
            </label>
          ) : null}
          <button
            className="rounded-md bg-zinc-900 px-3 py-2 text-sm text-white"
            type="submit"
            disabled={createProject.isPending}
          >
            {t("project.submit")}
          </button>
        </form>
      </section>

      <section className="overflow-hidden rounded-md border border-zinc-200 bg-white">
        {projectsPending || !projects ? (
          <p className="p-4 text-sm text-zinc-600" role="status">
            {t("project.loading")}
          </p>
        ) : projects.length === 0 ? (
          <p className="p-4 text-sm text-zinc-600">{t("project.empty")}</p>
        ) : (
          <table className="w-full text-left text-sm">
            <thead className="bg-zinc-50 text-xs font-medium text-zinc-500">
              <tr>
                <th className="px-4 py-2.5 font-medium">{t("field.name")}</th>
                <th className="px-4 py-2.5 font-medium">
                  {t("project.ownerColumn")}
                </th>
                <th className="px-4 py-2.5 font-medium">
                  {t("project.createdAt")}
                </th>
                <th className="px-4 py-2.5 font-medium">
                  <span className="sr-only">{t("project.actions")}</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {projects.map((project) => (
                <tr key={project.id} className="border-t border-zinc-200">
                  <td className="px-4 py-2.5 font-medium">{project.name}</td>
                  <td className="px-4 py-2.5 text-zinc-600">
                    {project.teamName ?? t("nav.personal")}
                  </td>
                  <td className="px-4 py-2.5 text-zinc-600">
                    {formatProjectDate(project.createdAt)}
                  </td>
                  <td className="px-4 py-2.5">
                    <div className="flex justify-end gap-1">
                      <IconButton
                        label={t("project.rename")}
                        onClick={() => {
                          setRenameId(project.id);
                          setRenameName(project.name);
                        }}
                      >
                        <PencilIcon />
                      </IconButton>
                      <IconButton
                        label={t("project.delete")}
                        onClick={() => setDeleteId(project.id)}
                      >
                        <TrashIcon />
                      </IconButton>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>

      {error ? <p className="text-sm text-red-700">{error}</p> : null}

      <ProjectDialog
        title={t("project.rename")}
        open={Boolean(renaming)}
        onClose={() => setRenameId(undefined)}
      >
        <form
          className="flex flex-col gap-3"
          onSubmit={(event) => {
            event.preventDefault();
            if (!renameId) {
              return;
            }
            renameProject.mutate({ id: renameId, nextName: renameName });
          }}
        >
          <input
            className="rounded-md border border-zinc-300 px-3 py-2 text-sm"
            name="rename-name"
            value={renameName}
            onChange={(event) => setRenameName(event.target.value)}
            aria-label={t("field.name")}
            required
          />
          <div className="flex justify-end gap-2">
            <button
              className="rounded-md border border-zinc-300 px-3 py-2 text-sm"
              type="button"
              onClick={() => setRenameId(undefined)}
            >
              {t("project.cancel")}
            </button>
            <button
              className="rounded-md bg-zinc-900 px-3 py-2 text-sm text-white"
              type="submit"
              disabled={renameProject.isPending}
            >
              {t("project.save")}
            </button>
          </div>
        </form>
      </ProjectDialog>

      <ProjectDialog
        title={t("project.delete")}
        open={Boolean(deleting)}
        onClose={() => setDeleteId(undefined)}
      >
        <p className="mb-4 text-sm text-zinc-700">
          {t("project.confirmDelete")}
        </p>
        <div className="flex justify-end gap-2">
          <button
            className="rounded-md border border-zinc-300 px-3 py-2 text-sm"
            type="button"
            onClick={() => setDeleteId(undefined)}
          >
            {t("project.cancel")}
          </button>
          <button
            className="rounded-md bg-zinc-900 px-3 py-2 text-sm text-white"
            type="button"
            onClick={() => {
              if (deleteId) {
                removeProject.mutate(deleteId);
              }
            }}
            disabled={removeProject.isPending}
          >
            {t("project.delete")}
          </button>
        </div>
      </ProjectDialog>
    </div>
  );
}

function formatProjectDate(iso: string) {
  const date = new Date(iso);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}/${month}/${day}`;
}

function ProjectDialog({
  title,
  open,
  onClose,
  children,
}: {
  title: string;
  open: boolean;
  onClose: () => void;
  children: ReactNode;
}) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const titleId = useId();

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) {
      return;
    }
    if (open && !dialog.open) {
      dialog.showModal();
    }
    if (!open && dialog.open) {
      dialog.close();
    }
  }, [open]);

  return (
    <dialog
      ref={dialogRef}
      className="fixed left-1/2 top-1/2 z-50 w-[min(calc(100%-2rem),28rem)] -translate-x-1/2 -translate-y-1/2 rounded-md border border-zinc-200 bg-white p-4 text-zinc-900 shadow-lg backdrop:bg-black/40"
      aria-labelledby={titleId}
      onClose={onClose}
    >
      <h2 id={titleId} className="mb-3 text-base font-semibold">
        {title}
      </h2>
      {children}
    </dialog>
  );
}

function IconButton({
  label,
  onClick,
  children,
}: {
  label: string;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      className="inline-flex h-8 w-8 items-center justify-center rounded-md text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900"
      type="button"
      aria-label={label}
      title={label}
      onClick={onClick}
    >
      {children}
    </button>
  );
}

function PencilIcon() {
  return (
    <svg viewBox="0 0 16 16" className="h-4 w-4" aria-hidden="true">
      <path
        d="M11.4 2.6a1.4 1.4 0 0 1 2 2L6.2 11.8 3 12.7l.9-3.2z"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function TrashIcon() {
  return (
    <svg viewBox="0 0 16 16" className="h-4 w-4" aria-hidden="true">
      <path
        d="M3.5 4.5h9M6 4.5V3h4v1.5M4.5 4.5l.6 8h5.8l.6-8"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
