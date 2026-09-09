import { dehydrate, HydrationBoundary } from "@tanstack/react-query";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { PromptsPanel } from "@/components/prompts-panel";
import { TeamsPanel } from "@/components/teams-panel";
import { invitesQuery } from "@/lib/queries/invites";
import { promptsQuery } from "@/lib/queries/prompts";
import { teamsQuery } from "@/lib/queries/teams";
import { getQueryClient } from "@/lib/query/get-query-client";
import { getCurrentUser } from "@/server/auth/current-user";
import { getDb } from "@/server/db/client";
import { listPrompts } from "@/server/prompts/repository";
import { serializePrompt } from "@/server/prompts/serialize";
import { listPendingInvites, listTeams } from "@/server/teams/repository";

export const dynamic = "force-dynamic";

export default async function Home() {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/sign-in");
  }

  const queryClient = getQueryClient();
  const db = await getDb();

  await Promise.all([
    queryClient.prefetchQuery({
      ...promptsQuery.options(),
      queryFn: async () => {
        const records = await listPrompts(db, user.id);
        return records.map(serializePrompt);
      },
    }),
    queryClient.prefetchQuery({
      ...teamsQuery.options(),
      queryFn: () => listTeams(db, user.id),
    }),
    queryClient.prefetchQuery({
      ...invitesQuery.options(),
      queryFn: async () => {
        const invites = await listPendingInvites(db, user.email);
        return invites.map((invite) => ({
          id: invite.id,
          teamId: invite.teamId,
          teamName: invite.teamName,
        }));
      },
    }),
  ]);

  return (
    <main className="mx-auto flex w-full max-w-5xl flex-col gap-8 px-6 py-12">
      <h1 className="text-2xl font-semibold tracking-tight">Prompt Manager</h1>
      <HydrationBoundary state={dehydrate(queryClient)}>
        <Suspense
          fallback={<p className="text-sm text-zinc-600">Loading...</p>}
        >
          <TeamsPanel />
          <PromptsPanel />
        </Suspense>
      </HydrationBoundary>
    </main>
  );
}
