import { queryOptions } from "@tanstack/react-query";
import { getJson, postJson } from "@/lib/api/http";
import type { TeamInvite } from "@/lib/teams/types";

export const invitesQuery = {
  key: ["invites"] as const,
  options: () =>
    queryOptions({
      queryKey: invitesQuery.key,
      queryFn: async () => {
        const data = await getJson<{ invites: TeamInvite[] }>("/api/invites");
        return data.invites;
      },
      staleTime: 60_000,
    }),
};

export async function acceptInviteRequest(inviteId: string) {
  await postJson(`/api/invites/${inviteId}/accept`, {});
}
