"use client";

import {
  useMutation,
  useQueryClient,
  useSuspenseQuery,
} from "@tanstack/react-query";
import { useState } from "react";
import { isHttpError } from "@/lib/api/http";
import { promptModels } from "@/lib/prompts/models";
import type { PromptMessage } from "@/lib/prompts/types";
import {
  promptDetailQuery,
  promptRunsQuery,
  promptVersionsQuery,
  recordRunRequest,
  savePromptRequest,
} from "@/lib/queries/prompt-detail";
import { promptsQuery } from "@/lib/queries/prompts";

type Tab = "editor" | "history" | "logs";

export function PromptWorkspace({ promptId }: { promptId: string }) {
  const queryClient = useQueryClient();
  const { data } = useSuspenseQuery(promptDetailQuery.options(promptId));
  const { data: versions } = useSuspenseQuery(
    promptVersionsQuery.options(promptId),
  );
  const { data: runs } = useSuspenseQuery(promptRunsQuery.options(promptId));
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
  const [error, setError] = useState<string | undefined>();

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
      setError(isHttpError(err) ? err.message : "Failed to save");
    },
  });

  const recordRun = useMutation({
    mutationFn: () => recordRunRequest(promptId),
    onSuccess: async () => {
      setError(undefined);
      await queryClient.invalidateQueries({
        queryKey: promptRunsQuery.key(promptId),
      });
    },
    onError: (err) => {
      setError(isHttpError(err) ? err.message : "Failed to record run");
    },
  });

  return (
    <section className="flex min-h-full flex-col gap-6 p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <input
          className="min-w-60 flex-1 bg-transparent text-2xl font-semibold tracking-tight outline-none"
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          aria-label="Prompt title"
        />
        <p className="text-sm text-[var(--muted)]">
          Version {data.version.versionNumber}
        </p>
      </div>

      <div className="flex gap-2">
        <TabButton current={tab} id="editor" onSelect={setTab}>
          Editor
        </TabButton>
        <TabButton current={tab} id="history" onSelect={setTab}>
          History
        </TabButton>
        <TabButton current={tab} id="logs" onSelect={setTab}>
          Logs
        </TabButton>
      </div>

      {tab === "editor" ? (
        <div className="flex flex-col gap-4">
          <label className="flex flex-col gap-2 text-sm">
            Model
            <select
              className="max-w-xs rounded-md border border-[var(--line)] bg-white px-3 py-2"
              value={model}
              onChange={(event) => setModel(event.target.value)}
            >
              {promptModels.map((item) => (
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
                    Role
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
                      <option value="system">System</option>
                      <option value="user">User</option>
                      <option value="assistant">Assistant</option>
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
                      Remove
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
                  aria-label={`${message.role} prompt`}
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
            Add message
          </button>

          <label className="flex flex-col gap-2 text-sm">
            History note
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
              {save.isPending ? "Saving..." : "Save version"}
            </button>
            <button
              className="rounded-md border border-[var(--line)] px-4 py-2 text-sm"
              type="button"
              onClick={() => recordRun.mutate()}
              disabled={recordRun.isPending}
            >
              {recordRun.isPending ? "Recording..." : "Record run"}
            </button>
          </div>
        </div>
      ) : null}

      {tab === "history" ? (
        <ol className="flex flex-col gap-3">
          {versions.map((version) => (
            <li
              key={version.id}
              className="rounded-md border border-[var(--line)] bg-white p-4"
            >
              <p className="font-medium">Version {version.versionNumber}</p>
              <p className="text-sm text-[var(--muted)]">{version.model}</p>
              {version.note ? (
                <p className="mt-1 text-sm">{version.note}</p>
              ) : null}
            </li>
          ))}
        </ol>
      ) : null}

      {tab === "logs" ? (
        <div className="flex flex-col gap-3">
          {runs.length === 0 ? (
            <p className="text-sm text-[var(--muted)]">No runs yet.</p>
          ) : (
            runs.map((run) => (
              <article
                key={run.id}
                className="rounded-md border border-[var(--line)] bg-white p-4"
              >
                <p className="text-sm font-medium">{run.model}</p>
                <pre className="prompt-mono mt-2 overflow-x-auto text-xs text-[var(--muted)]">
                  {run.output}
                </pre>
              </article>
            ))
          )}
        </div>
      ) : null}
    </section>
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
