import type { Metadata } from "next";
import { AccountBar } from "@/components/account-bar";
import { getCurrentUser } from "@/server/auth/current-user";
import { listDummyUsers } from "@/server/auth/dummy/users";
import { resolveAuthConfig } from "@/server/auth/env";
import { getDb } from "@/server/db/client";
import { Providers } from "./providers";
import "./globals.css";

export const metadata: Metadata = {
  title: "Prompt Manager",
  description: "Manage prompts with PostgreSQL or PGlite",
};

export default async function RootLayout({ children }: LayoutProps<"/">) {
  const config = resolveAuthConfig(process.env);
  const user = await getCurrentUser();
  const dummyUsers =
    config.provider === "dummy" ? await listDummyUsers(await getDb()) : [];

  return (
    <html lang="en">
      <body className="min-h-screen bg-zinc-50 text-zinc-900 antialiased">
        <Providers>
          <AccountBar
            user={user}
            dummyUsers={dummyUsers}
            provider={config.provider}
          />
          {children}
        </Providers>
      </body>
    </html>
  );
}
