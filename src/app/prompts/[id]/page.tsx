import { dehydrate, HydrationBoundary } from "@tanstack/react-query";
import { notFound, redirect } from "next/navigation";
import { Suspense } from "react";
import { PromptWorkspace } from "@/components/prompt-workspace";
import { t } from "@/lib/i18n/t";
import {
  promptDetailQuery,
  promptRunsQuery,
  promptVersionsQuery,
} from "@/lib/queries/prompt-detail";
import { getQueryClient } from "@/lib/query/get-query-client";
import { getCurrentUser } from "@/server/auth/current-user";
import { getDb } from "@/server/db/client";
import { isNotFoundError } from "@/server/errors";
import { listPromptRuns } from "@/server/prompts/runs";
import {
  serializeMessage,
  serializePrompt,
  serializeRun,
  serializeVersion,
} from "@/server/prompts/serialize";
import { getPromptDetail, listPromptVersions } from "@/server/prompts/versions";

export const dynamic = "force-dynamic";

export default async function PromptPage({
  params,
}: PageProps<"/prompts/[id]">) {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/sign-in");
  }

  const { id } = await params;
  const db = await getDb();
  const queryClient = getQueryClient();

  try {
    const detail = await getPromptDetail(db, user.id, id);
    queryClient.setQueryData(promptDetailQuery.key(id), {
      prompt: serializePrompt({ ...detail.prompt, teamName: null }),
      version: serializeVersion(detail.version),
      messages: detail.messages.map(serializeMessage),
    });
    const versions = await listPromptVersions(db, user.id, id);
    queryClient.setQueryData(
      promptVersionsQuery.key(id),
      versions.map(serializeVersion),
    );
    const runs = await listPromptRuns(db, user.id, id);
    queryClient.setQueryData(promptRunsQuery.key(id), runs.map(serializeRun));
  } catch (error) {
    if (isNotFoundError(error)) {
      notFound();
    }
    throw error;
  }

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <Suspense fallback={<p className="p-6 text-sm">{t("prompt.loading")}</p>}>
        <PromptWorkspace promptId={id} />
      </Suspense>
    </HydrationBoundary>
  );
}
