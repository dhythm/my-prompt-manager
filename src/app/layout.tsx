import { dehydrate, HydrationBoundary } from "@tanstack/react-query";
import type { Metadata } from "next";
import { IBM_Plex_Mono, Schibsted_Grotesk } from "next/font/google";
import { Suspense } from "react";
import { AccountBar } from "@/components/account-bar";
import { WorkspaceNav } from "@/components/workspace-nav";
import { t } from "@/lib/i18n/t";
import { projectsQuery } from "@/lib/queries/projects";
import { promptsQuery } from "@/lib/queries/prompts";
import { getQueryClient } from "@/lib/query/get-query-client";
import { getCurrentUser } from "@/server/auth/current-user";
import { listDummyUsers } from "@/server/auth/dummy/users";
import { resolveAuthConfig } from "@/server/auth/env";
import { getDb } from "@/server/db/client";
import { listProjects } from "@/server/projects/repository";
import { listPrompts } from "@/server/prompts/repository";
import { serializePrompt } from "@/server/prompts/serialize";
import { Providers } from "./providers";
import "./globals.css";

const sans = Schibsted_Grotesk({
  subsets: ["latin"],
  variable: "--font-sans",
});

const mono = IBM_Plex_Mono({
  subsets: ["latin"],
  weight: ["400", "500"],
  variable: "--font-mono",
});

export const metadata: Metadata = {
  title: t("app.title"),
  description: t("app.description"),
};

export default async function RootLayout({ children }: LayoutProps<"/">) {
  const config = resolveAuthConfig(process.env);
  const user = await getCurrentUser();
  const dummyUsers =
    config.provider === "dummy" ? await listDummyUsers(await getDb()) : [];
  const queryClient = getQueryClient();

  if (user) {
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
        ...projectsQuery.options(),
        queryFn: () => listProjects(db, user.id),
      }),
    ]);
  }

  return (
    <html lang="ja" className={`${sans.variable} ${mono.variable}`}>
      <body className="flex h-dvh flex-col overflow-hidden bg-[var(--paper)] text-[var(--ink)] antialiased">
        <Providers>
          <AccountBar
            user={user}
            dummyUsers={dummyUsers}
            provider={config.provider}
          />
          {user ? (
            <HydrationBoundary state={dehydrate(queryClient)}>
              <div className="flex min-h-0 flex-1">
                <Suspense
                  fallback={
                    <aside className="h-full w-64 shrink-0 bg-[var(--panel)]" />
                  }
                >
                  <WorkspaceNav />
                </Suspense>
                <div className="min-h-0 min-w-0 flex-1 overflow-y-auto">
                  {children}
                </div>
              </div>
            </HydrationBoundary>
          ) : (
            <div className="min-h-0 flex-1 overflow-y-auto">{children}</div>
          )}
        </Providers>
      </body>
    </html>
  );
}
