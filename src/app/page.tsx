import { redirect } from "next/navigation";
import { PromptsPanel } from "@/components/prompts-panel";
import { getCurrentUser } from "@/server/auth/current-user";

export const dynamic = "force-dynamic";

export default async function Home() {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/sign-in");
  }

  return (
    <main className="flex flex-col gap-4 p-6">
      <PromptsPanel />
    </main>
  );
}
