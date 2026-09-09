import { dehydrate, HydrationBoundary } from "@tanstack/react-query";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { TeamsPanel } from "@/components/teams-panel";
import { t } from "@/lib/i18n/t";
import { invitesQuery } from "@/lib/queries/invites";
import { teamsQuery } from "@/lib/queries/teams";
import { getQueryClient } from "@/lib/query/get-query-client";
import { getCurrentUser } from "@/server/auth/current-user";
import { getDb } from "@/server/db/client";
import { listPendingInvites, listTeams } from "@/server/teams/repository";

export const dynamic = "force-dynamic";

export default async function TeamsPage() {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/sign-in");
  }

  const db = await getDb();
  const queryClient = getQueryClient();
  await Promise.all([
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
    <HydrationBoundary state={dehydrate(queryClient)}>
      <main className="p-6">
        <h1 className="mb-4 text-2xl font-semibold tracking-tight">
          {t("team.title")}
        </h1>
        <Suspense fallback={<p className="text-sm">{t("team.loading")}</p>}>
          <TeamsPanel />
        </Suspense>
      </main>
    </HydrationBoundary>
  );
}
