import { t } from "@/lib/i18n/t";

export default function NotFound() {
  return (
    <main className="flex h-full flex-col justify-center gap-3 px-8 py-16">
      <h1 className="text-3xl font-semibold tracking-tight">
        {t("notFound.title")}
      </h1>
    </main>
  );
}
