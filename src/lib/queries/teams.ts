import { queryOptions } from "@tanstack/react-query";
import { getJson, postJson } from "@/lib/api/http";
import type { Team } from "@/lib/teams/types";

export const teamsQuery = {
  key: ["teams"] as const,
  options: () =>
    queryOptions({
      queryKey: teamsQuery.key,
      queryFn: async () => {
        const data = await getJson<{ teams: Team[] }>("/api/teams");
        return data.teams;
      },
      staleTime: 60_000,
    }),
};

export async function createTeamRequest(name: string) {
  const data = await postJson<{ team: Team }>("/api/teams", { name });
  return data.team;
}

export async function inviteToTeamRequest(teamId: string, email: string) {
  await postJson(`/api/teams/${teamId}/invites`, { email });
}
