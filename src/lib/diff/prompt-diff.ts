import type { PromptMessage, PromptVersion } from "@/lib/prompts/types";
import { type DiffHunk, diffLines } from "./line-diff";

export type CompareRange = {
  from: number | null;
  to: number;
};

type MessageDiffStatus = "unchanged" | "changed" | "added" | "removed";

export type MessageDiff = {
  index: number;
  status: MessageDiffStatus;
  oldRole?: PromptMessage["role"];
  newRole?: PromptMessage["role"];
  hunks: DiffHunk[];
};

export type PromptVersionDiff = {
  modelChanged: boolean;
  oldModel: string;
  newModel: string;
  messages: MessageDiff[];
};

type VersionDetail = {
  version: PromptVersion;
  messages: PromptMessage[];
};

export function defaultCompareRange(
  versions: Array<{ versionNumber: number }>,
): CompareRange | null {
  if (versions.length === 0) {
    return null;
  }
  const numbers = [...versions]
    .map((version) => version.versionNumber)
    .sort((left, right) => right - left);
  return {
    from: numbers[1] ?? null,
    to: numbers[0] ?? 1,
  };
}

export function compareRangeForVersion(
  selected: number,
  versionNumbers: number[],
): CompareRange {
  const older = versionNumbers
    .filter((number) => number < selected)
    .sort((left, right) => right - left);
  return { from: older[0] ?? null, to: selected };
}

export function diffPromptVersions(
  oldDetail: VersionDetail,
  newDetail: VersionDetail,
): PromptVersionDiff {
  const oldMessages = [...oldDetail.messages].sort(
    (left, right) => (left.position ?? 0) - (right.position ?? 0),
  );
  const newMessages = [...newDetail.messages].sort(
    (left, right) => (left.position ?? 0) - (right.position ?? 0),
  );
  const length = Math.max(oldMessages.length, newMessages.length);

  const messages: MessageDiff[] = [];
  for (let index = 0; index < length; index += 1) {
    const oldMessage = oldMessages[index];
    const newMessage = newMessages[index];
    messages.push(diffMessagePair(index, oldMessage, newMessage));
  }

  return {
    modelChanged: oldDetail.version.model !== newDetail.version.model,
    oldModel: oldDetail.version.model,
    newModel: newDetail.version.model,
    messages,
  };
}

function diffMessagePair(
  index: number,
  oldMessage: PromptMessage | undefined,
  newMessage: PromptMessage | undefined,
): MessageDiff {
  if (!oldMessage && newMessage) {
    return {
      index,
      status: "added",
      newRole: newMessage.role,
      hunks: diffLines("", newMessage.content),
    };
  }
  if (oldMessage && !newMessage) {
    return {
      index,
      status: "removed",
      oldRole: oldMessage.role,
      hunks: diffLines(oldMessage.content, ""),
    };
  }
  if (!oldMessage || !newMessage) {
    return { index, status: "unchanged", hunks: [] };
  }

  const hunks = diffLines(oldMessage.content, newMessage.content);
  const roleChanged = oldMessage.role !== newMessage.role;
  return {
    index,
    status: hunks.length > 0 || roleChanged ? "changed" : "unchanged",
    oldRole: oldMessage.role,
    newRole: newMessage.role,
    hunks,
  };
}
