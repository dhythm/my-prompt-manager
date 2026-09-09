import { describe, expect, it } from "vitest";
import { diffLines, formatHunkHeader, splitLines } from "./line-diff";

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
