"use client";

import {
  useMutation,
  useQueryClient,
  useSuspenseQuery,
} from "@tanstack/react-query";
import { useState } from "react";
import { isHttpError } from "@/lib/api/http";
import { teamRoleLabel } from "@/lib/i18n/labels";
import { t } from "@/lib/i18n/t";
import { acceptInviteRequest, invitesQuery } from "@/lib/queries/invites";
import { promptsQuery } from "@/lib/queries/prompts";
import {
  createTeamRequest,
  inviteToTeamRequest,
  teamsQuery,
} from "@/lib/queries/teams";
import type { Team } from "@/lib/teams/types";

export function TeamsPanel() {
  const queryClient = useQueryClient();
  const { data: teams } = useSuspenseQuery(teamsQuery.options());
  const { data: invites } = useSuspenseQuery(invitesQuery.options());
  const [teamName, setTeamName] = useState("");
  const [inviteEmails, setInviteEmails] = useState<Record<string, string>>({});
  const [error, setError] = useState<string | undefined>();

  async function invalidateWorkspace() {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: teamsQuery.key }),
      queryClient.invalidateQueries({ queryKey: invitesQuery.key }),
      queryClient.invalidateQueries({ queryKey: promptsQuery.key }),
    ]);
  }

  const createTeam = useMutation({
    mutationFn: createTeamRequest,
    onSuccess: async () => {
      setTeamName("");
      setError(undefined);
      await invalidateWorkspace();
    },
    onError: (err) => {
      setError(isHttpError(err) ? err.message : t("team.createFailed"));
    },
  });

  const invite = useMutation({
    mutationFn: ({ teamId, email }: { teamId: string; email: string }) =>
      inviteToTeamRequest(teamId, email),
    onSuccess: async (_data, variables) => {
      setInviteEmails((current) => ({ ...current, [variables.teamId]: "" }));
      setError(undefined);
      await invalidateWorkspace();
    },
    onError: (err) => {
      setError(isHttpError(err) ? err.message : t("team.inviteFailed"));
    },
  });

  const accept = useMutation({
    mutationFn: acceptInviteRequest,
    onSuccess: async () => {
      setError(undefined);
      await invalidateWorkspace();
    },
    onError: (err) => {
      setError(isHttpError(err) ? err.message : t("team.acceptFailed"));
    },
  });

  return (
    <section className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold tracking-tight">
          {t("team.title")}
        </h1>
        <form
          className="flex flex-wrap gap-2"
          onSubmit={(event) => {
            event.preventDefault();
            createTeam.mutate(teamName);
          }}
        >
          <input
            className="min-w-48 rounded-md border border-[var(--line)] bg-white px-3 py-2 text-sm"
            name="name"
            value={teamName}
            onChange={(event) => setTeamName(event.target.value)}
            placeholder={t("team.namePlaceholder")}
            required
          />
          <button
            className="rounded-md bg-[var(--ink)] px-3 py-2 text-sm text-white disabled:opacity-60"
            type="submit"
            disabled={createTeam.isPending}
          >
            {t("team.create")}
          </button>
        </form>
      </div>

      {error ? <p className="text-sm text-red-700">{error}</p> : null}

      {invites.length > 0 ? (
        <div className="flex flex-col gap-3">
          <h2 className="text-sm font-medium">{t("team.pendingInvites")}</h2>
          <ul className="flex flex-col gap-3">
            {invites.map((item) => (
              <li
                key={item.id}
                className="flex flex-wrap items-center justify-between gap-3 rounded-md border border-[var(--line)] bg-white px-4 py-3 shadow-[inset_3px_0_0_0_var(--accent)]"
              >
                <p className="font-medium">{item.teamName}</p>
                <button
                  className="shrink-0 rounded-md bg-[var(--ink)] px-3 py-1.5 text-sm text-white disabled:opacity-60"
                  type="button"
                  onClick={() => accept.mutate(item.id)}
                  disabled={accept.isPending}
                >
                  {t("team.accept")}
                </button>
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      {teams.length === 0 ? (
        <p className="text-sm text-[var(--muted)]">{t("team.empty")}</p>
      ) : (
        <ul className="flex flex-col gap-3">
          {teams.map((team) => (
            <TeamRow
              key={team.id}
              team={team}
              email={inviteEmails[team.id] ?? ""}
              onEmailChange={(email) =>
                setInviteEmails((current) => ({ ...current, [team.id]: email }))
              }
              onInvite={() =>
                invite.mutate({
                  teamId: team.id,
                  email: inviteEmails[team.id] ?? "",
                })
              }
              inviting={
                invite.isPending && invite.variables?.teamId === team.id
              }
            />
          ))}
        </ul>
      )}
    </section>
  );
}

function TeamRow({
  team,
  email,
  onEmailChange,
  onInvite,
  inviting,
}: {
  team: Team;
  email: string;
  onEmailChange: (email: string) => void;
  onInvite: () => void;
  inviting: boolean;
}) {
  const owner = team.role === "owner";
  const initial = [...team.name.trim()][0] ?? "?";

  return (
    <li className="rounded-md border border-[var(--line)] bg-white p-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <span
            aria-hidden="true"
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-[var(--panel)] text-sm font-medium text-white"
          >
            {initial}
          </span>
          <p className="font-medium">{team.name}</p>
        </div>
        <span
          className={
            owner
              ? "rounded-md bg-[var(--ink)] px-2 py-0.5 text-xs text-white"
              : "rounded-md border border-[var(--line)] px-2 py-0.5 text-xs text-[var(--muted)]"
          }
        >
          {teamRoleLabel(team.role)}
        </span>
      </div>
      {owner ? (
        <form
          className="mt-3 flex flex-wrap gap-2 border-t border-[var(--line)] pt-3"
          onSubmit={(event) => {
            event.preventDefault();
            onInvite();
          }}
        >
          <input
            className="min-w-48 rounded-md border border-[var(--line)] bg-white px-3 py-2 text-sm"
            name="email"
            type="email"
            value={email}
            onChange={(event) => onEmailChange(event.target.value)}
            placeholder={t("team.emailPlaceholder")}
            required
          />
          <button
            className="rounded-md border border-[var(--line)] px-3 py-2 text-sm disabled:opacity-60"
            type="submit"
            disabled={inviting}
          >
            {t("team.invite")}
          </button>
        </form>
      ) : null}
    </li>
  );
}
