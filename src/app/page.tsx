import { redirect } from "next/navigation";
import { t } from "@/lib/i18n/t";
import { getCurrentUser } from "@/server/auth/current-user";

export const dynamic = "force-dynamic";

export default async function Home() {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/sign-in");
  }

  return (
    <main className="flex h-full flex-col justify-center gap-3 px-8 py-16">
      <h1 className="text-3xl font-semibold tracking-tight">
        {t("home.title")}
      </h1>
      <p className="max-w-md text-[var(--muted)]">{t("home.lead")}</p>
    </main>
  );
}
