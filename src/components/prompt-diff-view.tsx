import {
  formatHunkHeader,
  type SplitCell,
  toSplitRows,
} from "@/lib/diff/line-diff";
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
          key={message.id ?? `${message.role}-${message.content}`}
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
          <div className="grid grid-cols-2 border-b border-[var(--line)] bg-[#f6f8fa] text-xs text-[var(--muted)]">
            <p className="border-r border-[var(--line)] px-3 py-1">
              {t("prompt.compareFrom")}
            </p>
            <p className="px-3 py-1">{t("prompt.compareTo")}</p>
          </div>
          {message.hunks.map((hunk) => (
            <div key={formatHunkHeader(hunk)}>
              <p className="prompt-mono border-b border-[var(--line)] bg-[#f6f8fa] px-3 py-1 text-xs text-[var(--muted)]">
                {formatHunkHeader(hunk)}
              </p>
              {toSplitRows(hunk.lines).map((row) => (
                <div
                  key={`${row.left.type}-${row.left.number}-${row.left.text}-${row.right.type}-${row.right.number}-${row.right.text}`}
                  className="grid grid-cols-2"
                >
                  <SplitSide cell={row.left} side="left" />
                  <SplitSide cell={row.right} side="right" />
                </div>
              ))}
            </div>
          ))}
        </div>
      ) : null}
    </section>
  );
}

function SplitSide({
  cell,
  side,
}: {
  cell: SplitCell;
  side: "left" | "right";
}) {
  return (
    <div
      data-diff-side={side}
      data-diff-type={cell.type === "empty" ? undefined : cell.type}
      className={`prompt-mono grid grid-cols-[2.25rem_minmax(0,1fr)] gap-2 px-2 py-0.5 text-xs ${
        side === "left" ? "border-r border-[var(--line)]" : ""
      } ${sideClass(cell.type)}`}
    >
      <span className="text-right text-[var(--muted)]">
        {cell.number ?? ""}
      </span>
      <span className="whitespace-pre-wrap break-all">{cell.text}</span>
    </div>
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

function sideClass(type: SplitCell["type"]): string {
  if (type === "add") {
    return "bg-[#e6ffec] text-[#116329]";
  }
  if (type === "remove") {
    return "bg-[#ffebe9] text-[#82071e]";
  }
  if (type === "empty") {
    return "bg-[#f6f8fa]";
  }
  return "bg-white";
}
