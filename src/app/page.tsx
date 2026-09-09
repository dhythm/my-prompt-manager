import { redirect } from "next/navigation";
import { Suspense } from "react";
import { PromptsPanel } from "@/components/prompts-panel";
import { t } from "@/lib/i18n/t";
import { getCurrentUser } from "@/server/auth/current-user";

export const dynamic = "force-dynamic";

export default async function Home() {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/sign-in");
  }

  return (
    <main className="flex flex-col gap-4 p-6">
      <Suspense
        fallback={
          <>
            <h1 className="text-2xl font-semibold tracking-tight">
              {t("home.title")}
            </h1>
            <p className="text-sm">{t("prompt.loading")}</p>
          </>
        }
      >
        <PromptsPanel />
      </Suspense>
    </main>
  );
}
