import { dehydrate, HydrationBoundary } from "@tanstack/react-query";
import { notFound, redirect } from "next/navigation";
import { Suspense } from "react";
import { t } from "@/lib/i18n/t";
import { runDetailQuery } from "@/lib/queries/prompt-detail";
import { getQueryClient } from "@/lib/query/get-query-client";
import { getCurrentUser } from "@/server/auth/current-user";
import { getDb } from "@/server/db/client";
import { isNotFoundError } from "@/server/errors";
import { getPromptRun } from "@/server/prompts/runs";
import { serializeRun } from "@/server/prompts/serialize";
import { RunDetail } from "./run-detail";

export const dynamic = "force-dynamic";

export default async function RunDetailPage({
  params,
}: PageProps<"/runs/[id]">) {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/sign-in");
  }

  const { id } = await params;
  const db = await getDb();
  const queryClient = getQueryClient();

  try {
    const run = await getPromptRun(db, user.id, id);
    queryClient.setQueryData(runDetailQuery.key(id), serializeRun(run));
  } catch (error) {
    if (isNotFoundError(error)) {
      notFound();
    }
    throw error;
  }

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <main className="flex flex-col gap-4 p-6">
        <Suspense fallback={<p className="text-sm">{t("runs.loading")}</p>}>
          <RunDetail runId={id} />
        </Suspense>
      </main>
    </HydrationBoundary>
  );
}
