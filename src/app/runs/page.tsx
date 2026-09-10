import { dehydrate, HydrationBoundary } from "@tanstack/react-query";
import { redirect } from "next/navigation";
import { t } from "@/lib/i18n/t";
import { workspaceRunsQuery } from "@/lib/queries/prompt-detail";
import { getQueryClient } from "@/lib/query/get-query-client";
import { getCurrentUser } from "@/server/auth/current-user";
import { getDb } from "@/server/db/client";
import { listWorkspaceRuns } from "@/server/prompts/runs";
import { serializeRun } from "@/server/prompts/serialize";
import { RunsList } from "./runs-list";

export const dynamic = "force-dynamic";

export default async function RunsPage() {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/sign-in");
  }

  const db = await getDb();
  const queryClient = getQueryClient();
  const page = await listWorkspaceRuns(db, user.id);
  queryClient.setQueryData(workspaceRunsQuery.pageKey({}), {
    pages: [
      {
        runs: page.runs.map(serializeRun),
        nextCursor: page.nextCursor,
      },
    ],
    pageParams: [null],
  });

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <main className="flex flex-col gap-4 p-6">
        <h1 className="text-2xl font-semibold tracking-tight">
          {t("runs.title")}
        </h1>
        <RunsList />
      </main>
    </HydrationBoundary>
  );
}
