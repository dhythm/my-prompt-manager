import type { SessionUser } from "@/lib/auth/types";

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
    <header className="flex flex-wrap items-center justify-between gap-4 border-b border-zinc-200 bg-white px-6 py-3">
      <p className="text-sm font-medium">Prompt Manager</p>
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
                  <form
                    key={dummyUser.id}
                    action="/api/auth/sign-in"
                    method="post"
                  >
                    <input type="hidden" name="email" value={dummyUser.email} />
                    <button
                      className="rounded-md border border-zinc-300 px-3 py-1"
                      type="submit"
                    >
                      Use {dummyUser.name}
                    </button>
                  </form>
                ))
            : null}
          <form action="/api/auth/sign-out" method="post">
            <button
              className="rounded-md border border-zinc-300 px-3 py-1"
              type="submit"
            >
              Sign out
            </button>
          </form>
        </div>
      ) : (
        <a className="text-sm underline" href="/sign-in">
          Sign in
        </a>
      )}
    </header>
  );
}
