import { describe, expect, it } from "vitest";
import type { PromptMessage, PromptVersion } from "@/lib/prompts/types";
import {
  compareRangeForVersion,
  defaultCompareRange,
  diffPromptVersions,
} from "./prompt-diff";

const version = (
  versionNumber: number,
  extras: Partial<PromptVersion> = {},
): PromptVersion => ({
  id: `v${versionNumber}`,
  versionNumber,
  model: "gpt-4.1",
  note: null,
  createdAt: "2026-09-09T00:00:00.000Z",
  ...extras,
});

const message = (
  role: PromptMessage["role"],
  content: string,
  position: number,
): PromptMessage => ({
  id: `${role}-${position}`,
  role,
  content,
  position,
});

describe("defaultCompareRange", () => {
  it("compares the latest version to the previous one", () => {
    expect(defaultCompareRange([version(3), version(1), version(2)])).toEqual({
      from: 2,
      to: 3,
    });
  });

  it("has no base when only one version exists", () => {
    expect(defaultCompareRange([version(1)])).toEqual({ from: null, to: 1 });
  });

  it("returns null when there are no versions", () => {
    expect(defaultCompareRange([])).toBeNull();
  });
});

describe("compareRangeForVersion", () => {
  it("uses the nearest older version as the base", () => {
    expect(compareRangeForVersion(3, [1, 2, 3])).toEqual({ from: 2, to: 3 });
    expect(compareRangeForVersion(1, [1, 2, 3])).toEqual({ from: null, to: 1 });
  });
});

describe("diffPromptVersions", () => {
  it("aligns messages by position and diffs content", () => {
    const result = diffPromptVersions(
      {
        version: version(1),
        messages: [
          message("system", "Be kind.", 0),
          message("user", "Say hello", 1),
        ],
      },
      {
        version: version(2, { model: "claude-sonnet-4", note: "Switch" }),
        messages: [
          message("system", "Be kind.", 0),
          message("user", "Say hello there", 1),
        ],
      },
    );

    expect(result.modelChanged).toBe(true);
    expect(result.messages).toHaveLength(2);
    expect(result.messages[0]?.status).toBe("unchanged");
    expect(result.messages[1]?.status).toBe("changed");
    expect(
      result.messages[1]?.hunks[0]?.lines.map((line) => [line.type, line.text]),
    ).toEqual([
      ["remove", "Say hello"],
      ["add", "Say hello there"],
    ]);
  });

  it("treats extra messages as added or removed", () => {
    const result = diffPromptVersions(
      {
        version: version(1),
        messages: [message("user", "only old", 0)],
      },
      {
        version: version(2),
        messages: [
          message("user", "only old", 0),
          message("assistant", "reply", 1),
        ],
      },
    );

    expect(result.messages[1]).toMatchObject({
      status: "added",
      newRole: "assistant",
    });
    expect(result.messages[1]?.hunks[0]?.lines[0]).toMatchObject({
      type: "add",
      text: "reply",
    });
  });

  it("marks a role change even when content is the same", () => {
    const result = diffPromptVersions(
      {
        version: version(1),
        messages: [message("user", "same", 0)],
      },
      {
        version: version(2),
        messages: [message("assistant", "same", 0)],
      },
    );

    expect(result.messages[0]).toMatchObject({
      status: "changed",
      oldRole: "user",
      newRole: "assistant",
    });
    expect(result.messages[0]?.hunks).toEqual([]);
  });
});
