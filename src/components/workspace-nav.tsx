"use client";

import {
  useMutation,
  useQueryClient,
  useSuspenseQuery,
} from "@tanstack/react-query";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { createPromptRequest, promptsQuery } from "@/lib/queries/prompts";

export function WorkspaceNav() {
  const pathname = usePathname();
  const router = useRouter();
  const queryClient = useQueryClient();
  const { data: prompts } = useSuspenseQuery(promptsQuery.options());

  const createPrompt = useMutation({
    mutationFn: () => createPromptRequest({ title: "Untitled", body: "" }),
    onSuccess: async (prompt) => {
      await queryClient.invalidateQueries({ queryKey: promptsQuery.key });
      router.push(`/prompts/${prompt.id}`);
    },
  });

  return (
    <aside className="flex w-64 shrink-0 flex-col gap-6 bg-[var(--panel)] px-4 py-5 text-sm text-zinc-200">
      <nav className="flex flex-col gap-1">
        <SideLink href="/" active={pathname === "/"}>
          Prompts
        </SideLink>
        <SideLink href="/runs" active={pathname === "/runs"}>
          Logs
        </SideLink>
        <SideLink href="/teams" active={pathname.startsWith("/teams")}>
          Teams
        </SideLink>
      </nav>

      <button
        className="rounded-md bg-[var(--accent)] px-3 py-2 text-left text-white"
        type="button"
        onClick={() => createPrompt.mutate()}
        disabled={createPrompt.isPending}
      >
        {createPrompt.isPending ? "Creating..." : "New prompt"}
      </button>

      <div className="flex min-h-0 flex-1 flex-col gap-2 overflow-y-auto">
        <p className="text-xs text-zinc-400">Library</p>
        {prompts.length === 0 ? (
          <p className="text-zinc-500">No prompts yet.</p>
        ) : (
          <ul className="flex flex-col gap-1">
            {prompts.map((prompt) => {
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
                      {prompt.teamName ?? "Personal"}
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
    >
      {children}
    </Link>
  );
}
