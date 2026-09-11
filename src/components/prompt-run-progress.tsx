import { t } from "@/lib/i18n/t";

export function RunBusyButton({
  pending,
  onClick,
  variant = "solid",
}: {
  pending: boolean;
  onClick: () => void;
  variant?: "solid" | "outline";
}) {
  const solid = variant === "solid";
  return (
    <button
      className={`inline-flex items-center gap-2 self-start rounded-md px-4 py-2 text-sm disabled:opacity-60 ${
        solid
          ? "bg-[var(--ink)] text-white"
          : "border border-[var(--line)] bg-white"
      }`}
      type="button"
      onClick={onClick}
      disabled={pending}
      aria-busy={pending}
    >
      {pending ? t("prompt.recording") : t("prompt.recordRun")}
    </button>
  );
}

export function RunBusyStatus({ pending }: { pending: boolean }) {
  if (!pending) {
    return null;
  }

  return (
    <section
      className="flex items-center gap-3 rounded-md border border-[var(--line)] bg-white px-4 py-5 text-sm text-[var(--muted)]"
      role="status"
      aria-live="polite"
      aria-busy="true"
    >
      <RunSpinner />
      {t("prompt.recording")}
    </section>
  );
}

function RunSpinner() {
  return (
    <svg
      className="h-4 w-4 shrink-0 animate-spin"
      viewBox="0 0 16 16"
      aria-hidden="true"
    >
      <circle
        cx="8"
        cy="8"
        r="6"
        fill="none"
        stroke="currentColor"
        strokeOpacity="0.25"
        strokeWidth="2"
      />
      <path
        d="M14 8a6 6 0 0 0-6-6"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}
