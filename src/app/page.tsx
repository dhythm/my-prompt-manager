import { redirect } from "next/navigation";
import { getCurrentUser } from "@/server/auth/current-user";

export const dynamic = "force-dynamic";

export default async function Home() {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/sign-in");
  }

  return (
    <main className="flex h-full flex-col justify-center gap-3 px-8 py-16">
      <h1 className="text-3xl font-semibold tracking-tight">Prompts</h1>
      <p className="max-w-md text-[var(--muted)]">
        Choose a prompt from the library, or create one to edit system and user
        messages, history, and run logs.
      </p>
    </main>
  );
}
