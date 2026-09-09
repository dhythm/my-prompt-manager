import { dehydrate, HydrationBoundary } from "@tanstack/react-query";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { ProjectsPanel } from "@/components/projects-panel";
import { t } from "@/lib/i18n/t";
import { projectsQuery } from "@/lib/queries/projects";
import { teamsQuery } from "@/lib/queries/teams";
import { getQueryClient } from "@/lib/query/get-query-client";
import { getCurrentUser } from "@/server/auth/current-user";
import { getDb } from "@/server/db/client";
import { listProjects } from "@/server/projects/repository";
import { listTeams } from "@/server/teams/repository";

export const dynamic = "force-dynamic";

export default async function ProjectsPage() {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/sign-in");
  }

  const db = await getDb();
  const queryClient = getQueryClient();
  await Promise.all([
    queryClient.prefetchQuery({
      ...projectsQuery.options(),
      queryFn: () => listProjects(db, user.id),
    }),
    queryClient.prefetchQuery({
      ...teamsQuery.options(),
      queryFn: () => listTeams(db, user.id),
    }),
  ]);

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <main className="p-6">
        <h1 className="mb-4 text-2xl font-semibold tracking-tight">
          {t("project.title")}
        </h1>
        <Suspense fallback={<p className="text-sm">{t("project.loading")}</p>}>
          <ProjectsPanel />
        </Suspense>
      </main>
    </HydrationBoundary>
  );
}
