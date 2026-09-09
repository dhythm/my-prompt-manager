"use client";

import { postJson } from "@/lib/api/http";
import type { SessionUser } from "@/lib/auth/types";
import { t } from "@/lib/i18n/t";

export function AccountBar({
  user,
  dummyUsers,
  provider,
}: {
  user: SessionUser | undefined;
  dummyUsers: SessionUser[];
  provider: "dummy" | "clerk";
}) {
  return (
    <header className="flex shrink-0 flex-wrap items-center justify-between gap-4 border-b border-zinc-200 bg-white px-6 py-3">
      <p className="text-sm font-medium">{t("app.title")}</p>
      {user ? (
        <div className="flex flex-wrap items-center gap-3 text-sm">
          <p>
            {user.name}
            <span className="ml-2 text-zinc-500">{user.email}</span>
          </p>
          {provider === "dummy"
            ? dummyUsers
                .filter((dummyUser) => dummyUser.id !== user.id)
                .map((dummyUser) => (
                  <button
                    key={dummyUser.id}
                    className="rounded-md border border-zinc-300 px-3 py-1"
                    type="button"
                    onClick={() => {
                      void switchUser(dummyUser.email);
                    }}
                  >
                    {t("account.useUser", { name: dummyUser.name })}
                  </button>
                ))
            : null}
          <button
            className="rounded-md border border-zinc-300 px-3 py-1"
            type="button"
            onClick={() => {
              void signOut();
            }}
          >
            {t("account.signOut")}
          </button>
        </div>
      ) : (
        <a className="text-sm underline" href="/sign-in">
          {t("account.signIn")}
        </a>
      )}
    </header>
  );
}

async function switchUser(email: string) {
  await postJson("/api/auth/sign-in", { email });
  window.location.reload();
}

async function signOut() {
  await postJson("/api/auth/sign-out", {});
  window.location.assign("/sign-in");
}
