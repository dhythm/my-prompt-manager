"use client";

import {
  useMutation,
  useQueryClient,
  useSuspenseQuery,
} from "@tanstack/react-query";
import { useState } from "react";
import { isHttpError } from "@/lib/api/http";
import { acceptInviteRequest, invitesQuery } from "@/lib/queries/invites";
import { promptsQuery } from "@/lib/queries/prompts";
import {
  createTeamRequest,
  inviteToTeamRequest,
  teamsQuery,
} from "@/lib/queries/teams";

export function TeamsPanel() {
  const queryClient = useQueryClient();
  const { data: teams } = useSuspenseQuery(teamsQuery.options());
  const { data: invites } = useSuspenseQuery(invitesQuery.options());
  const [teamName, setTeamName] = useState("");
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteTeamId, setInviteTeamId] = useState("");
  const [error, setError] = useState<string | undefined>();

  const ownedTeams = teams.filter((team) => team.role === "owner");

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
      setError(isHttpError(err) ? err.message : "Failed to create team");
    },
  });

  const invite = useMutation({
    mutationFn: ({ teamId, email }: { teamId: string; email: string }) =>
      inviteToTeamRequest(teamId, email),
    onSuccess: async () => {
      setInviteEmail("");
      setError(undefined);
      await invalidateWorkspace();
    },
    onError: (err) => {
      setError(isHttpError(err) ? err.message : "Failed to invite");
    },
  });

  const accept = useMutation({
    mutationFn: acceptInviteRequest,
    onSuccess: async () => {
      setError(undefined);
      await invalidateWorkspace();
    },
    onError: (err) => {
      setError(isHttpError(err) ? err.message : "Failed to accept invite");
    },
  });

  return (
    <section className="flex flex-col gap-6 rounded-md border border-zinc-200 bg-white p-4">
      <h2 className="font-medium">Teams</h2>
      <ul className="text-sm">
        {teams.length === 0 ? (
          <li className="text-zinc-600">No teams yet.</li>
        ) : (
          teams.map((team) => (
            <li key={team.id}>
              {team.name}
              <span className="ml-2 text-zinc-500">{team.role}</span>
            </li>
          ))
        )}
      </ul>

      <form
        className="flex flex-wrap gap-2"
        onSubmit={(event) => {
          event.preventDefault();
          createTeam.mutate(teamName);
        }}
      >
        <input
          className="rounded-md border border-zinc-300 px-3 py-2 text-sm"
          name="name"
          value={teamName}
          onChange={(event) => setTeamName(event.target.value)}
          placeholder="Team name"
          required
        />
        <button
          className="rounded-md bg-zinc-900 px-3 py-2 text-sm text-white"
          type="submit"
          disabled={createTeam.isPending}
        >
          Create team
        </button>
      </form>

      {ownedTeams.length > 0 ? (
        <form
          className="flex flex-wrap gap-2"
          onSubmit={(event) => {
            event.preventDefault();
            const teamId = inviteTeamId || ownedTeams[0]?.id;
            if (teamId) {
              invite.mutate({ teamId, email: inviteEmail });
            }
          }}
        >
          <select
            className="rounded-md border border-zinc-300 px-3 py-2 text-sm"
            name="teamId"
            value={inviteTeamId || ownedTeams[0]?.id}
            onChange={(event) => setInviteTeamId(event.target.value)}
          >
            {ownedTeams.map((team) => (
              <option key={team.id} value={team.id}>
                {team.name}
              </option>
            ))}
          </select>
          <input
            className="rounded-md border border-zinc-300 px-3 py-2 text-sm"
            name="email"
            type="email"
            value={inviteEmail}
            onChange={(event) => setInviteEmail(event.target.value)}
            placeholder="email"
            required
          />
          <button
            className="rounded-md border border-zinc-300 px-3 py-2 text-sm"
            type="submit"
            disabled={invite.isPending}
          >
            Invite
          </button>
        </form>
      ) : null}

      {invites.length > 0 ? (
        <ul className="flex flex-col gap-2 text-sm">
          {invites.map((item) => (
            <li key={item.id} className="flex items-center gap-2">
              {item.teamName}
              <button
                className="rounded-md border border-zinc-300 px-2 py-1"
                type="button"
                onClick={() => accept.mutate(item.id)}
                disabled={accept.isPending}
              >
                Accept
              </button>
            </li>
          ))}
        </ul>
      ) : null}

      {error ? <p className="text-sm text-red-700">{error}</p> : null}
    </section>
  );
}
