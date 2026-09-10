"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";
import { PromptRunCard } from "@/components/prompt-run-card";
import { RunBusyButton, RunBusyStatus } from "@/components/prompt-run-progress";
import { PromptVariablesPanel } from "@/components/prompt-variables";
import { isHttpError } from "@/lib/api/http";
import { messageRoleLabel } from "@/lib/i18n/labels";
import { t } from "@/lib/i18n/t";
import { promptModelLabel } from "@/lib/prompts/models";
import {
  extractVariablesFromTexts,
  substitute,
  withDummyVariableValues,
} from "@/lib/prompts/template";
import type { PromptMessage, PromptRun } from "@/lib/prompts/types";
import {
  promptRunsQuery,
  recordRunRequest,
  workspaceRunsQuery,
} from "@/lib/queries/prompt-detail";

export function PromptPlayground({
  promptId,
  model,
  messages,
}: {
  promptId: string;
  model: string;
  messages: PromptMessage[];
}) {
  const queryClient = useQueryClient();
  const variableNames = useMemo(
    () => extractVariablesFromTexts(messages.map((message) => message.content)),
    [messages],
  );
  const [values, setValues] = useState(() =>
    withDummyVariableValues(variableNames, {}),
  );
  const [result, setResult] = useState<PromptRun | undefined>();
  const [error, setError] = useState<string | undefined>();

  useEffect(() => {
    setValues((current) => withDummyVariableValues(variableNames, current));
  }, [variableNames]);

  const runValues = withDummyVariableValues(variableNames, values);
  const previewMessages = useMemo(
    () =>
      messages.map((message) => ({
        ...message,
        content: substitute(message.content, runValues),
      })),
    [messages, runValues],
  );

  const run = useMutation({
    mutationFn: () =>
      recordRunRequest(promptId, {
        variables: runValues,
        model,
      }),
    onSuccess: async (created) => {
      setError(undefined);
      setResult(created);
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: promptRunsQuery.key(promptId),
        }),
        queryClient.invalidateQueries({ queryKey: workspaceRunsQuery.key }),
      ]);
    },
    onError: (err) => {
      setError(isHttpError(err) ? err.message : t("prompt.recordFailed"));
    },
  });

  return (
    <div className="flex flex-col gap-4">
      <p className="text-sm text-[var(--muted)]">{promptModelLabel(model)}</p>
      <PromptVariablesPanel
        names={variableNames}
        values={values}
        missing={[]}
        previewMessages={previewMessages}
        disabled={run.isPending}
        onChange={(name, value) =>
          setValues((current) => ({ ...current, [name]: value }))
        }
      />
      {variableNames.length === 0 ? (
        <PromptPreview messages={previewMessages} />
      ) : null}
      {error ? <p className="text-sm text-red-700">{error}</p> : null}
      <RunBusyButton pending={run.isPending} onClick={() => run.mutate()} />
      <RunBusyStatus pending={run.isPending} />
      {run.isPending ? null : result ? (
        <PromptRunCard run={result} showInput={false} />
      ) : null}
    </div>
  );
}

function PromptPreview({ messages }: { messages: PromptMessage[] }) {
  return (
    <section
      className="flex flex-col gap-3 rounded-md border border-[var(--line)] bg-white p-4"
      aria-label={t("prompt.preview")}
    >
      <h2 className="text-sm font-medium">{t("prompt.preview")}</h2>
      <ul className="flex flex-col gap-3">
        {messages.map((message) => (
          <li key={message.id ?? `${message.role}-${message.content}`}>
            <p className="text-xs text-[var(--muted)]">
              {messageRoleLabel(message.role)}
            </p>
            <pre className="prompt-mono mt-1 whitespace-pre-wrap text-sm">
              {message.content}
            </pre>
          </li>
        ))}
      </ul>
    </section>
  );
}
