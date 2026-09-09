"use client";

import {
  useMutation,
  useQueryClient,
  useSuspenseQuery,
} from "@tanstack/react-query";
import { useState } from "react";
import { isHttpError } from "@/lib/api/http";
import { createPromptRequest, promptsQuery } from "@/lib/queries/prompts";

export function PromptsPanel() {
  const queryClient = useQueryClient();
  const { data: prompts } = useSuspenseQuery(promptsQuery.options());
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [formError, setFormError] = useState<string | undefined>();

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

  return (
    <div className="grid gap-10 lg:grid-cols-[minmax(0,22rem)_minmax(0,1fr)]">
      <form
        className="flex flex-col gap-4"
        onSubmit={(event) => {
          event.preventDefault();
          createPrompt.mutate({ title, body });
        }}
      >
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
        {prompts.length === 0 ? (
          <p className="text-sm text-zinc-600">No prompts yet.</p>
        ) : (
          <ul className="flex flex-col gap-4">
            {prompts.map((prompt) => (
              <li
                key={prompt.id}
                className="rounded-md border border-zinc-200 bg-white p-4"
              >
                <h2 className="font-medium text-zinc-900">{prompt.title}</h2>
                <p className="mt-2 whitespace-pre-wrap text-sm text-zinc-700">
                  {prompt.body}
                </p>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
