"use client";

import { useState } from "react";
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
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <header className="flex shrink-0 flex-wrap items-center justify-between gap-4 border-b border-zinc-200 bg-white px-6 py-3">
      <p className="text-sm font-medium">{t("app.title")}</p>
      {user ? (
        <div className="relative">
          <button
            className="rounded-md px-2 py-1 text-left text-sm hover:bg-zinc-50"
            type="button"
            aria-expanded={menuOpen}
            aria-haspopup="menu"
            onClick={() => setMenuOpen((open) => !open)}
          >
            {user.name} <span className="text-zinc-500">{user.email}</span>
          </button>
          {menuOpen ? (
            <div
              role="menu"
              className="absolute right-0 z-20 mt-1 min-w-52 rounded-md border border-[var(--line)] bg-white p-1 shadow-sm"
            >
              {provider === "dummy"
                ? dummyUsers
                    .filter((dummyUser) => dummyUser.id !== user.id)
                    .map((dummyUser) => (
                      <button
                        key={dummyUser.id}
                        className="block w-full rounded-md px-3 py-2 text-left text-sm hover:bg-zinc-50"
                        type="button"
                        role="menuitem"
                        onClick={() => {
                          void switchUser(dummyUser.email);
                        }}
                      >
                        {t("account.useUser", { name: dummyUser.name })}
                      </button>
                    ))
                : null}
              <button
                className="block w-full rounded-md px-3 py-2 text-left text-sm hover:bg-zinc-50"
                type="button"
                role="menuitem"
                onClick={() => {
                  void signOut();
                }}
              >
                {t("account.signOut")}
              </button>
            </div>
          ) : null}
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
