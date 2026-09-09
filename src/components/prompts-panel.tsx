"use client";

import {
  useMutation,
  useQueryClient,
  useSuspenseQuery,
} from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { isHttpError } from "@/lib/api/http";
import { invitesQuery } from "@/lib/queries/invites";
import {
  createPromptRequest,
  promptsQuery,
  transferPromptRequest,
} from "@/lib/queries/prompts";
import { teamsQuery } from "@/lib/queries/teams";

const personalScope = "personal";

export function PromptsPanel() {
  const queryClient = useQueryClient();
  const { data: prompts } = useSuspenseQuery(promptsQuery.options());
  const { data: teams } = useSuspenseQuery(teamsQuery.options());
  useSuspenseQuery(invitesQuery.options());
  const [scope, setScope] = useState(personalScope);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [formError, setFormError] = useState<string | undefined>();

  const visiblePrompts = useMemo(() => {
    if (scope === personalScope) {
      return prompts.filter((prompt) => prompt.ownerUserId);
    }
    return prompts.filter((prompt) => prompt.teamId === scope);
  }, [prompts, scope]);

  const createPrompt = useMutation({
    mutationFn: createPromptRequest,
    onSuccess: async () => {
      setTitle("");
      setBody("");
      setFormError(undefined);
      await queryClient.invalidateQueries({ queryKey: promptsQuery.key });
    },
    onError: (error) => {
      setFormError(
        isHttpError(error) ? error.message : "Failed to create prompt",
      );
    },
  });

  const transferPrompt = useMutation({
    mutationFn: ({ promptId, teamId }: { promptId: string; teamId: string }) =>
      transferPromptRequest(promptId, teamId),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: promptsQuery.key });
    },
    onError: (error) => {
      setFormError(
        isHttpError(error) ? error.message : "Failed to transfer prompt",
      );
    },
  });

  return (
    <div className="grid gap-10 lg:grid-cols-[minmax(0,22rem)_minmax(0,1fr)]">
      <form
        className="flex flex-col gap-4"
        onSubmit={(event) => {
          event.preventDefault();
          createPrompt.mutate({
            title,
            body,
            ...(scope === personalScope ? {} : { teamId: scope }),
          });
        }}
      >
        <label className="flex flex-col gap-2 text-sm">
          Scope
          <select
            className="rounded-md border border-zinc-300 bg-white px-3 py-2 text-base"
            name="scope"
            value={scope}
            onChange={(event) => setScope(event.target.value)}
          >
            <option value={personalScope}>Personal</option>
            {teams.map((team) => (
              <option key={team.id} value={team.id}>
                {team.name}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-2 text-sm">
          Title
          <input
            className="rounded-md border border-zinc-300 bg-white px-3 py-2 text-base text-zinc-900 outline-none focus:border-zinc-900"
            name="title"
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            required
            maxLength={200}
          />
        </label>
        <label className="flex flex-col gap-2 text-sm">
          Body
          <textarea
            className="min-h-40 rounded-md border border-zinc-300 bg-white px-3 py-2 text-base text-zinc-900 outline-none focus:border-zinc-900"
            name="body"
            value={body}
            onChange={(event) => setBody(event.target.value)}
            required
            maxLength={10000}
          />
        </label>
        {formError ? <p className="text-sm text-red-700">{formError}</p> : null}
        <button
          className="rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-60"
          type="submit"
          disabled={createPrompt.isPending}
        >
          {createPrompt.isPending ? "Saving..." : "Save prompt"}
        </button>
      </form>

      <section className="flex flex-col gap-4">
        {visiblePrompts.length === 0 ? (
          <p className="text-sm text-zinc-600">No prompts yet.</p>
        ) : (
          <ul className="flex flex-col gap-4">
            {visiblePrompts.map((prompt) => (
              <li
                key={prompt.id}
                className="rounded-md border border-zinc-200 bg-white p-4"
              >
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <h2 className="font-medium text-zinc-900">{prompt.title}</h2>
                  <p className="text-xs text-zinc-500">
                    {prompt.teamName ?? "Personal"}
                  </p>
                </div>
                <p className="mt-2 whitespace-pre-wrap text-sm text-zinc-700">
                  {prompt.body}
                </p>
                {prompt.ownerUserId && teams.length > 0 ? (
                  <form
                    className="mt-3"
                    onSubmit={(event) => {
                      event.preventDefault();
                      const form = event.currentTarget;
                      const teamId = new FormData(form).get("teamId");
                      if (typeof teamId === "string" && teamId) {
                        transferPrompt.mutate({ promptId: prompt.id, teamId });
                      }
                    }}
                  >
                    <label className="flex items-center gap-2 text-xs">
                      Transfer
                      <select
                        className="rounded-md border border-zinc-300 bg-white px-2 py-1"
                        name="teamId"
                        defaultValue={teams[0]?.id}
                      >
                        {teams.map((team) => (
                          <option key={team.id} value={team.id}>
                            {team.name}
                          </option>
                        ))}
                      </select>
                      <button
                        className="rounded-md border border-zinc-300 px-2 py-1"
                        type="submit"
                        disabled={transferPrompt.isPending}
                      >
                        Move
                      </button>
                    </label>
                  </form>
                ) : null}
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
