"use client";

import {
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
  useSuspenseQuery,
} from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { PromptHistory } from "@/components/prompt-history";
import { PromptPlayground } from "@/components/prompt-playground";
import { PromptRunSummary } from "@/components/prompt-run-card";
import { RunBusyButton, RunBusyStatus } from "@/components/prompt-run-progress";
import { PromptVariableNames } from "@/components/prompt-variables";
import { isHttpError } from "@/lib/api/http";
import { messageRoleLabel } from "@/lib/i18n/labels";
import { t } from "@/lib/i18n/t";
import { writeCurrentProjectId } from "@/lib/projects/current";
import { promptModelOptions } from "@/lib/prompts/models";
import { extractVariablesFromTexts } from "@/lib/prompts/template";
import type { PromptMessage, PromptVersionDetail } from "@/lib/prompts/types";
import { copyPromptRequest, projectsQuery } from "@/lib/queries/projects";
import {
  promptDetailQuery,
  promptRunsQuery,
  promptVersionsQuery,
  recordRunRequest,
  rememberRecordedRun,
  savePromptRequest,
  workspaceRunsQuery,
} from "@/lib/queries/prompt-detail";
import { promptsQuery } from "@/lib/queries/prompts";

type Tab = "editor" | "playground" | "history" | "logs";

export function PromptWorkspace({ promptId }: { promptId: string }) {
  const queryClient = useQueryClient();
  const router = useRouter();
  const { data } = useSuspenseQuery(promptDetailQuery.options(promptId));
  const { data: versions = [] } = useQuery(
    promptVersionsQuery.options(promptId),
  );
  const { data: projects = [] } = useQuery(projectsQuery.options());
  const [tab, setTab] = useState<Tab>("editor");
  const [title, setTitle] = useState(data.prompt.title);
  const [model, setModel] = useState(data.version.model);
  const [note, setNote] = useState("");
  const [messages, setMessages] = useState<PromptMessage[]>(
    data.messages.map((message) => ({
      ...message,
      id: message.id ?? crypto.randomUUID(),
    })),
  );
  const copyTargets = projects.filter(
    (project) => project.id !== data.prompt.projectId,
  );
  const [targetProjectId, setTargetProjectId] = useState(
    copyTargets[0]?.id ?? "",
  );
  const [error, setError] = useState<string | undefined>();
  const variableNames = useMemo(
    () => extractVariablesFromTexts(messages.map((message) => message.content)),
    [messages],
  );

  const save = useMutation({
    mutationFn: () =>
      savePromptRequest(promptId, {
        title,
        model,
        note,
        messages: messages.map((message) => ({
          role: message.role,
          content: message.content,
        })),
      }),
    onSuccess: async () => {
      setNote("");
      setError(undefined);
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: promptDetailQuery.key(promptId),
        }),
        queryClient.invalidateQueries({
          queryKey: promptVersionsQuery.key(promptId),
        }),
        queryClient.invalidateQueries({ queryKey: promptsQuery.key }),
      ]);
    },
    onError: (err) => {
      setError(isHttpError(err) ? err.message : t("prompt.saveFailed"));
    },
  });

  function loadVersion(detail: PromptVersionDetail) {
    setModel(detail.version.model);
    setMessages(
      detail.messages.map((message) => ({
        ...message,
        id: message.id ?? crypto.randomUUID(),
      })),
    );
    setTab("editor");
  }

  const recordRun = useMutation({
    mutationFn: () =>
      recordRunRequest(promptId, {
        variables: {},
        model,
        source: "editor",
      }),
    onSuccess: async (created) => {
      setError(undefined);
      rememberRecordedRun(queryClient, created);
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: promptRunsQuery.key(promptId),
          refetchType: "all",
        }),
        queryClient.invalidateQueries({
          queryKey: workspaceRunsQuery.key,
          refetchType: "all",
        }),
      ]);
    },
    onError: (err) => {
      setError(isHttpError(err) ? err.message : t("prompt.recordFailed"));
    },
  });

  const copyPrompt = useMutation({
    mutationFn: () => copyPromptRequest(promptId, targetProjectId),
    onSuccess: async (prompt) => {
      setError(undefined);
      if (prompt.projectId) {
        writeCurrentProjectId(prompt.projectId);
      }
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: promptsQuery.key }),
        queryClient.invalidateQueries({ queryKey: projectsQuery.key }),
      ]);
      router.push(`/prompts/${prompt.id}`);
    },
    onError: (err) => {
      setError(isHttpError(err) ? err.message : t("project.copyFailed"));
    },
  });

  return (
    <section className="flex min-h-full flex-col gap-6 p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <input
          className="min-w-60 flex-1 bg-transparent text-2xl font-semibold tracking-tight outline-none"
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          aria-label={t("prompt.titleLabel")}
        />
        <p className="text-sm text-[var(--muted)]">
          {t("prompt.version", { number: data.version.versionNumber })}
        </p>
        {copyTargets.length > 0 ? (
          <div className="flex flex-wrap items-center gap-2">
            <select
              className="rounded-md border border-[var(--line)] bg-white px-3 py-2 text-sm"
              value={targetProjectId}
              onChange={(event) => setTargetProjectId(event.target.value)}
              aria-label={t("project.copyTarget")}
            >
              {copyTargets.map((project) => (
                <option key={project.id} value={project.id}>
                  {project.teamName
                    ? `${project.name} · ${project.teamName}`
                    : project.name}
                </option>
              ))}
            </select>
            <button
              className="rounded-md border border-[var(--line)] px-3 py-2 text-sm"
              type="button"
              onClick={() => copyPrompt.mutate()}
              disabled={copyPrompt.isPending || !targetProjectId}
            >
              {copyPrompt.isPending ? t("project.copying") : t("project.copy")}
            </button>
          </div>
        ) : null}
      </div>

      <div className="flex gap-2">
        <TabButton current={tab} id="editor" onSelect={setTab}>
          {t("prompt.editor")}
        </TabButton>
        <TabButton current={tab} id="playground" onSelect={setTab}>
          {t("prompt.playground")}
        </TabButton>
        <TabButton current={tab} id="history" onSelect={setTab}>
          {t("prompt.history")}
        </TabButton>
        <TabButton current={tab} id="logs" onSelect={setTab}>
          {t("prompt.logs")}
        </TabButton>
      </div>

      {tab === "editor" ? (
        <div className="flex flex-col gap-4">
          <label className="flex flex-col gap-2 text-sm">
            {t("prompt.model")}
            <select
              className="max-w-xs rounded-md border border-[var(--line)] bg-white px-3 py-2"
              value={model}
              onChange={(event) => setModel(event.target.value)}
            >
              {promptModelOptions(model).map((item) => (
                <option key={item.id} value={item.id}>
                  {item.label}
                </option>
              ))}
            </select>
          </label>

          <ul className="flex flex-col gap-4">
            {messages.map((message) => (
              <li
                key={message.id}
                className="rounded-md border border-[var(--line)] bg-white p-4"
              >
                <div className="mb-2 flex items-center justify-between gap-2">
                  <label className="text-sm">
                    {t("prompt.role")}
                    <select
                      className="ml-2 rounded-md border border-[var(--line)] px-2 py-1"
                      value={message.role}
                      onChange={(event) => {
                        const role = event.target
                          .value as PromptMessage["role"];
                        setMessages((current) =>
                          current.map((item) =>
                            item.id === message.id ? { ...item, role } : item,
                          ),
                        );
                      }}
                    >
                      <option value="system">{t("prompt.roleSystem")}</option>
                      <option value="user">{t("prompt.roleUser")}</option>
                      <option value="assistant">
                        {t("prompt.roleAssistant")}
                      </option>
                    </select>
                  </label>
                  {messages.length > 1 ? (
                    <button
                      className="text-sm text-[var(--muted)]"
                      type="button"
                      onClick={() =>
                        setMessages((current) =>
                          current.filter((item) => item.id !== message.id),
                        )
                      }
                    >
                      {t("prompt.remove")}
                    </button>
                  ) : null}
                </div>
                <textarea
                  className="prompt-body min-h-32 w-full rounded-md border border-[var(--line)] px-3 py-2 text-sm"
                  value={message.content}
                  onChange={(event) => {
                    const content = event.target.value;
                    setMessages((current) =>
                      current.map((item) =>
                        item.id === message.id ? { ...item, content } : item,
                      ),
                    );
                  }}
                  aria-label={t("prompt.rolePrompt", {
                    role: messageRoleLabel(message.role),
                  })}
                />
              </li>
            ))}
          </ul>

          <button
            className="self-start text-sm text-[var(--accent)]"
            type="button"
            onClick={() =>
              setMessages((current) => [
                ...current,
                { id: crypto.randomUUID(), role: "user", content: "" },
              ])
            }
          >
            {t("prompt.addMessage")}
          </button>

          <PromptVariableNames names={variableNames} />

          <label className="flex flex-col gap-2 text-sm">
            {t("prompt.historyNote")}
            <input
              className="rounded-md border border-[var(--line)] bg-white px-3 py-2"
              value={note}
              onChange={(event) => setNote(event.target.value)}
              name="note"
            />
          </label>

          {error ? <p className="text-sm text-red-700">{error}</p> : null}

          <div className="flex gap-2">
            <button
              className="rounded-md bg-[var(--ink)] px-4 py-2 text-sm text-white"
              type="button"
              onClick={() => save.mutate()}
              disabled={save.isPending}
            >
              {save.isPending ? t("prompt.saving") : t("prompt.saveVersion")}
            </button>
            <RunBusyButton
              pending={recordRun.isPending}
              onClick={() => recordRun.mutate()}
              variant="outline"
            />
          </div>
          <RunBusyStatus pending={recordRun.isPending} />
        </div>
      ) : null}

      {tab === "playground" ? (
        <PromptPlayground
          promptId={promptId}
          model={model}
          messages={data.messages}
        />
      ) : null}

      {tab === "history" ? (
        <PromptHistory
          promptId={promptId}
          versions={versions}
          onLoadIntoEditor={loadVersion}
        />
      ) : null}

      {tab === "logs" ? <PromptLogs promptId={promptId} /> : null}
    </section>
  );
}

function PromptLogs({ promptId }: { promptId: string }) {
  const runsQuery = useInfiniteQuery(promptRunsQuery.options(promptId));
  const runs = runsQuery.data?.pages.flatMap((page) => page.runs) ?? [];

  if (runsQuery.isPending) {
    return (
      <p className="text-sm text-[var(--muted)]" aria-busy="true" role="status">
        {t("prompt.loading")}
      </p>
    );
  }

  if (runs.length === 0) {
    return (
      <p className="text-sm text-[var(--muted)]">{t("prompt.emptyRuns")}</p>
    );
  }

  return (
    <div className="flex flex-col gap-1.5">
      {runs.map((run) => (
        <PromptRunSummary key={run.id} run={run} href={`/runs/${run.id}`} />
      ))}
      {runsQuery.hasNextPage ? (
        <button
          className="self-start rounded-md border border-[var(--line)] px-3 py-2 text-sm"
          type="button"
          onClick={() => runsQuery.fetchNextPage()}
          disabled={runsQuery.isFetchingNextPage}
        >
          {runsQuery.isFetchingNextPage
            ? t("runs.loadingMore")
            : t("runs.loadMore")}
        </button>
      ) : null}
    </div>
  );
}

function TabButton({
  current,
  id,
  onSelect,
  children,
}: {
  current: Tab;
  id: Tab;
  onSelect: (tab: Tab) => void;
  children: string;
}) {
  const active = current === id;
  return (
    <button
      className={`rounded-md px-3 py-1.5 text-sm ${
        active
          ? "bg-[var(--ink)] text-white"
          : "border border-[var(--line)] bg-white"
      }`}
      type="button"
      onClick={() => onSelect(id)}
    >
      {children}
    </button>
  );
}
