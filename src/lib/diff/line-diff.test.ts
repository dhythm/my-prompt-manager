import { describe, expect, it } from "vitest";
import {
  diffLines,
  formatHunkHeader,
  splitLines,
  toSplitRows,
} from "./line-diff";

describe("splitLines", () => {
  it("treats empty text as no lines", () => {
    expect(splitLines("")).toEqual([]);
  });

  it("splits on LF and CRLF without keeping a trailing empty line", () => {
    expect(splitLines("a\nb")).toEqual(["a", "b"]);
    expect(splitLines("a\r\nb\r\n")).toEqual(["a", "b"]);
  });
});

describe("diffLines", () => {
  it("returns no hunks when texts match", () => {
    expect(diffLines("same\nline", "same\nline")).toEqual([]);
  });

  it("marks a replacement as a remove then an add", () => {
    const [hunk] = diffLines("hello", "world");

    expect(hunk).toMatchObject({
      oldStart: 1,
      oldLines: 1,
      newStart: 1,
      newLines: 1,
    });
    expect(hunk?.lines).toEqual([
      { type: "remove", text: "hello", oldNumber: 1, newNumber: null },
      { type: "add", text: "world", oldNumber: null, newNumber: 1 },
    ]);
  });

  it("keeps shared context around a changed line", () => {
    const oldText = ["keep", "old", "tail"].join("\n");
    const newText = ["keep", "new", "tail"].join("\n");
    const [hunk] = diffLines(oldText, newText);

    expect(hunk?.lines.map((line) => [line.type, line.text])).toEqual([
      ["context", "keep"],
      ["remove", "old"],
      ["add", "new"],
      ["context", "tail"],
    ]);
  });

  it("shows a brand-new file as additions from line 0", () => {
    const [hunk] = diffLines("", "hello");

    expect(hunk).toMatchObject({
      oldStart: 0,
      oldLines: 0,
      newStart: 1,
      newLines: 1,
    });
    expect(hunk?.lines).toEqual([
      { type: "add", text: "hello", oldNumber: null, newNumber: 1 },
    ]);
  });

  it("splits distant edits into separate hunks", () => {
    const oldText = ["a", "b", "c", "d", "e", "f", "g", "h", "i"].join("\n");
    const newText = ["A", "b", "c", "d", "e", "f", "g", "h", "I"].join("\n");
    const hunks = diffLines(oldText, newText);

    expect(hunks).toHaveLength(2);
    expect(hunks[0]?.lines.some((line) => line.text === "A")).toBe(true);
    expect(hunks[1]?.lines.some((line) => line.text === "I")).toBe(true);
  });
});

describe("toSplitRows", () => {
  it("pairs a replacement onto one left/right row", () => {
    const [hunk] = diffLines("hello", "world");

    expect(toSplitRows(hunk?.lines ?? [])).toEqual([
      {
        left: { type: "remove", text: "hello", number: 1 },
        right: { type: "add", text: "world", number: 1 },
      },
    ]);
  });

  it("keeps context on both sides", () => {
    const [hunk] = diffLines("keep\nold\ntail", "keep\nnew\ntail");

    expect(toSplitRows(hunk?.lines ?? [])).toEqual([
      {
        left: { type: "context", text: "keep", number: 1 },
        right: { type: "context", text: "keep", number: 1 },
      },
      {
        left: { type: "remove", text: "old", number: 2 },
        right: { type: "add", text: "new", number: 2 },
      },
      {
        left: { type: "context", text: "tail", number: 3 },
        right: { type: "context", text: "tail", number: 3 },
      },
    ]);
  });

  it("leaves the opposite side empty for addition-only lines", () => {
    const [hunk] = diffLines("", "hello");

    expect(toSplitRows(hunk?.lines ?? [])).toEqual([
      {
        left: { type: "empty", text: "", number: null },
        right: { type: "add", text: "hello", number: 1 },
      },
    ]);
  });

  it("leaves the opposite side empty for deletion-only lines", () => {
    const [hunk] = diffLines("keep\ngone", "keep");

    expect(toSplitRows(hunk?.lines ?? [])).toEqual([
      {
        left: { type: "context", text: "keep", number: 1 },
        right: { type: "context", text: "keep", number: 1 },
      },
      {
        left: { type: "remove", text: "gone", number: 2 },
        right: { type: "empty", text: "", number: null },
      },
    ]);
  });
});

describe("formatHunkHeader", () => {
  it("formats a unified-diff header", () => {
    expect(
      formatHunkHeader({
        oldStart: 2,
        oldLines: 4,
        newStart: 2,
        newLines: 5,
        lines: [],
      }),
    ).toBe("@@ -2,4 +2,5 @@");
  });
});
