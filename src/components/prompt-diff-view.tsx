import { formatHunkHeader } from "@/lib/diff/line-diff";
import type { MessageDiff, PromptVersionDiff } from "@/lib/diff/prompt-diff";
import { messageRoleLabel } from "@/lib/i18n/labels";
import { t } from "@/lib/i18n/t";
import type { PromptMessage } from "@/lib/prompts/types";

export function PromptDiffView({ diff }: { diff: PromptVersionDiff }) {
  const hasMessageDiff = diff.messages.some(
    (message) => message.status !== "unchanged",
  );

  return (
    <div className="flex flex-col gap-4">
      {diff.modelChanged ? (
        <p className="text-sm text-[var(--muted)]">
          {diff.oldModel} → {diff.newModel}
        </p>
      ) : null}

      {!hasMessageDiff && !diff.modelChanged ? (
        <p className="text-sm text-[var(--muted)]">{t("prompt.noDiff")}</p>
      ) : null}

      {diff.messages
        .filter((message) => message.status !== "unchanged")
        .map((message) => (
          <MessageDiffBlock key={message.index} message={message} />
        ))}
    </div>
  );
}

export function VersionMessages({ messages }: { messages: PromptMessage[] }) {
  return (
    <ul className="flex flex-col gap-3">
      {messages.map((message, index) => (
        <li
          key={message.id ?? index}
          className="rounded-md border border-[var(--line)] bg-white p-4"
        >
          <p className="mb-2 text-sm font-medium">
            {t("prompt.messageIndex", { number: index + 1 })} ·{" "}
            {messageRoleLabel(message.role)}
          </p>
          <pre className="prompt-mono whitespace-pre-wrap text-sm">
            {message.content}
          </pre>
        </li>
      ))}
    </ul>
  );
}

function MessageDiffBlock({ message }: { message: MessageDiff }) {
  const role = messageHeading(message);
  const status =
    message.status === "added"
      ? t("prompt.messageAdded")
      : message.status === "removed"
        ? t("prompt.messageRemoved")
        : null;

  return (
    <section className="overflow-hidden rounded-md border border-[var(--line)] bg-white">
      <header className="flex items-center justify-between gap-2 border-b border-[var(--line)] bg-[#f6f8fa] px-3 py-2 text-sm">
        <p className="font-medium">
          {t("prompt.messageIndex", { number: message.index + 1 })}
          {role ? ` · ${role}` : ""}
        </p>
        {status ? <p className="text-[var(--muted)]">{status}</p> : null}
      </header>
      {message.hunks.length > 0 ? (
        <div>
          {message.hunks.map((hunk) => (
            <div key={formatHunkHeader(hunk)}>
              <p className="prompt-mono bg-[#f6f8fa] px-3 py-1 text-xs text-[var(--muted)]">
                {formatHunkHeader(hunk)}
              </p>
              {hunk.lines.map((line) => (
                <div
                  key={`${line.type}-${line.oldNumber}-${line.newNumber}`}
                  data-diff-type={line.type}
                  className={`prompt-mono grid grid-cols-[2.5rem_2.5rem_1rem_minmax(0,1fr)] gap-2 px-3 py-0.5 text-xs ${lineClass(
                    line.type,
                  )}`}
                >
                  <span className="text-right text-[var(--muted)]">
                    {line.oldNumber ?? ""}
                  </span>
                  <span className="text-right text-[var(--muted)]">
                    {line.newNumber ?? ""}
                  </span>
                  <span>{prefix(line.type)}</span>
                  <span className="whitespace-pre-wrap break-all">
                    {line.text}
                  </span>
                </div>
              ))}
            </div>
          ))}
        </div>
      ) : null}
    </section>
  );
}

function messageHeading(message: MessageDiff): string {
  if (
    message.oldRole &&
    message.newRole &&
    message.oldRole !== message.newRole
  ) {
    return `${messageRoleLabel(message.oldRole)} → ${messageRoleLabel(message.newRole)}`;
  }
  const role = message.newRole ?? message.oldRole;
  return role ? messageRoleLabel(role) : "";
}

function prefix(type: "context" | "add" | "remove"): string {
  if (type === "add") {
    return "+";
  }
  if (type === "remove") {
    return "-";
  }
  return " ";
}

function lineClass(type: "context" | "add" | "remove"): string {
  if (type === "add") {
    return "bg-[#e6ffec] text-[#116329]";
  }
  if (type === "remove") {
    return "bg-[#ffebe9] text-[#82071e]";
  }
  return "bg-white";
}
