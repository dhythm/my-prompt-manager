import { dehydrate, HydrationBoundary } from "@tanstack/react-query";
import { Suspense } from "react";
import { PromptsPanel } from "@/components/prompts-panel";
import { promptsQuery } from "@/lib/queries/prompts";
import { getQueryClient } from "@/lib/query/get-query-client";
import { getDb } from "@/server/db/client";
import { listPrompts } from "@/server/prompts/repository";
import { serializePrompt } from "@/server/prompts/serialize";

export const dynamic = "force-dynamic";

export default async function Home() {
  const queryClient = getQueryClient();

  await queryClient.prefetchQuery({
    ...promptsQuery.options(),
    queryFn: async () => {
      const db = await getDb();
      const records = await listPrompts(db);
      return records.map(serializePrompt);
    },
  });

  return (
    <main className="mx-auto flex w-full max-w-5xl flex-col gap-8 px-6 py-12">
      <h1 className="text-2xl font-semibold tracking-tight">Prompt Manager</h1>
      <HydrationBoundary state={dehydrate(queryClient)}>
        <Suspense
          fallback={<p className="text-sm text-zinc-600">Loading...</p>}
        >
          <PromptsPanel />
        </Suspense>
      </HydrationBoundary>
    </main>
  );
}
