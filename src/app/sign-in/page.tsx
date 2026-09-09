import { redirect } from "next/navigation";
import { t } from "@/lib/i18n/t";
import { getCurrentUser } from "@/server/auth/current-user";
import { listDummyUsers } from "@/server/auth/dummy/users";
import { resolveAuthConfig } from "@/server/auth/env";
import { getDb } from "@/server/db/client";

export const dynamic = "force-dynamic";

export default async function SignInPage() {
  const user = await getCurrentUser();
  if (user) {
    redirect("/");
  }

  const config = resolveAuthConfig(process.env);
  if (config.provider !== "dummy") {
    return (
      <main className="mx-auto max-w-lg px-6 py-12">
        <h1 className="text-2xl font-semibold">{t("signIn.title")}</h1>
        <p className="mt-4 text-sm text-zinc-600">
          {t("signIn.clerkDisabled")}
        </p>
      </main>
    );
  }

  const dummyUsers = await listDummyUsers(await getDb());

  return (
    <main className="mx-auto flex max-w-lg flex-col gap-6 px-6 py-12">
      <h1 className="text-2xl font-semibold">{t("signIn.title")}</h1>
      <ul className="flex flex-col gap-3">
        {dummyUsers.map((dummyUser) => (
          <li key={dummyUser.id}>
            <form action="/api/auth/sign-in" method="post">
              <input type="hidden" name="email" value={dummyUser.email} />
              <button
                className="w-full rounded-md border border-zinc-300 bg-white px-4 py-3 text-left"
                type="submit"
              >
                {dummyUser.name}
                <span className="ml-2 text-zinc-500">{dummyUser.email}</span>
              </button>
            </form>
          </li>
        ))}
      </ul>
    </main>
  );
}
