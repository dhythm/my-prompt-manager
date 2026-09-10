import { messageRoleLabel } from "@/lib/i18n/labels";
import { t } from "@/lib/i18n/t";
import type { PromptMessage } from "@/lib/prompts/types";

export function PromptVariableNames({ names }: { names: string[] }) {
  if (names.length === 0) {
    return null;
  }

  return (
    <section
      className="flex flex-col gap-3 rounded-md border border-[var(--line)] bg-white p-4"
      aria-label={t("prompt.variables")}
    >
      <h2 className="text-sm font-medium">{t("prompt.variables")}</h2>
      <ul className="flex flex-wrap gap-2">
        {names.map((name) => (
          <li key={name}>
            <code className="prompt-mono rounded-md bg-[var(--paper)] px-2 py-1 text-sm">
              {`{{${name}}}`}
            </code>
          </li>
        ))}
      </ul>
    </section>
  );
}

export function PromptVariablesPanel({
  names,
  values,
  missing,
  previewMessages,
  disabled = false,
  onChange,
}: {
  names: string[];
  values: Record<string, string>;
  missing: string[];
  previewMessages: PromptMessage[];
  disabled?: boolean;
  onChange: (name: string, value: string) => void;
}) {
  if (names.length === 0) {
    return null;
  }

  const missingSet = new Set(missing);

  return (
    <div className="flex flex-col gap-4">
      <section className="flex flex-col gap-3 rounded-md border border-[var(--line)] bg-white p-4">
        <h2 className="text-sm font-medium">{t("prompt.variables")}</h2>
        <ul className="flex flex-col gap-3">
          {names.map((name) => {
            const invalid = missingSet.has(name);
            return (
              <li key={name}>
                <label className="flex flex-col gap-1 text-sm">
                  {t("prompt.variableValue", { name })}
                  <input
                    className={`rounded-md border px-3 py-2 ${
                      invalid ? "border-red-600" : "border-[var(--line)]"
                    }`}
                    value={values[name] ?? ""}
                    onChange={(event) => onChange(name, event.target.value)}
                    disabled={disabled}
                    aria-invalid={invalid}
                    aria-label={t("prompt.variableValue", { name })}
                    name={`variable-${name}`}
                  />
                </label>
              </li>
            );
          })}
        </ul>
        {missing.length > 0 ? (
          <p className="text-sm text-red-700">
            {t("prompt.missingVariables", { names: missing.join("、") })}
          </p>
        ) : null}
      </section>

      <section
        className="flex flex-col gap-3 rounded-md border border-[var(--line)] bg-white p-4"
        aria-label={t("prompt.preview")}
      >
        <h2 className="text-sm font-medium">{t("prompt.preview")}</h2>
        <ul className="flex flex-col gap-3">
          {previewMessages.map((message) => (
            <li key={message.id ?? `${message.role}-${message.content}`}>
              <p className="text-xs text-[var(--muted)]">
                {messageRoleLabel(message.role)}
              </p>
              <pre className="prompt-mono mt-1 whitespace-pre-wrap text-sm">
                {message.content}
              </pre>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
