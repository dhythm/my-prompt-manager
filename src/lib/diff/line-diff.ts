type DiffLineType = "context" | "add" | "remove";

type DiffLine = {
  type: DiffLineType;
  text: string;
  oldNumber: number | null;
  newNumber: number | null;
};

export type DiffHunk = {
  oldStart: number;
  oldLines: number;
  newStart: number;
  newLines: number;
  lines: DiffLine[];
};

type SplitCellType = "context" | "add" | "remove" | "empty";

export type SplitCell = {
  type: SplitCellType;
  text: string;
  number: number | null;
};

export type SplitRow = {
  left: SplitCell;
  right: SplitCell;
};

const CONTEXT = 3;

export function splitLines(text: string): string[] {
  if (text === "") {
    return [];
  }
  return text.replace(/\r\n/g, "\n").replace(/\n$/, "").split("\n");
}

export function formatHunkHeader(hunk: DiffHunk): string {
  return `@@ -${hunk.oldStart},${hunk.oldLines} +${hunk.newStart},${hunk.newLines} @@`;
}

export function toSplitRows(lines: DiffLine[]): SplitRow[] {
  const rows: SplitRow[] = [];
  let index = 0;

  while (index < lines.length) {
    const line = lines[index];
    if (line === undefined) {
      break;
    }

    if (line.type === "context") {
      rows.push({
        left: { type: "context", text: line.text, number: line.oldNumber },
        right: { type: "context", text: line.text, number: line.newNumber },
      });
      index += 1;
      continue;
    }

    const removes: DiffLine[] = [];
    const adds: DiffLine[] = [];
    while (index < lines.length && lines[index]?.type === "remove") {
      const current = lines[index];
      if (current === undefined) {
        break;
      }
      removes.push(current);
      index += 1;
    }
    while (index < lines.length && lines[index]?.type === "add") {
      const current = lines[index];
      if (current === undefined) {
        break;
      }
      adds.push(current);
      index += 1;
    }

    const count = Math.max(removes.length, adds.length);
    for (let pair = 0; pair < count; pair += 1) {
      const remove = removes[pair];
      const add = adds[pair];
      rows.push({
        left: remove
          ? { type: "remove", text: remove.text, number: remove.oldNumber }
          : { type: "empty", text: "", number: null },
        right: add
          ? { type: "add", text: add.text, number: add.newNumber }
          : { type: "empty", text: "", number: null },
      });
    }
  }

  return rows;
}

export function diffLines(oldText: string, newText: string): DiffHunk[] {
  return toHunks(diffTokens(splitLines(oldText), splitLines(newText)));
}

function cell(table: number[][], row: number, column: number): number {
  return table[row]?.[column] ?? 0;
}

function setCell(
  table: number[][],
  row: number,
  column: number,
  value: number,
) {
  const current = table[row];
  if (current) {
    current[column] = value;
  }
}

function diffTokens(oldLines: string[], newLines: string[]): DiffLine[] {
  const oldCount = oldLines.length;
  const newCount = newLines.length;
  const table: number[][] = Array.from({ length: oldCount + 1 }, () =>
    Array<number>(newCount + 1).fill(0),
  );

  for (let oldIndex = oldCount - 1; oldIndex >= 0; oldIndex -= 1) {
    for (let newIndex = newCount - 1; newIndex >= 0; newIndex -= 1) {
      setCell(
        table,
        oldIndex,
        newIndex,
        oldLines[oldIndex] === newLines[newIndex]
          ? cell(table, oldIndex + 1, newIndex + 1) + 1
          : Math.max(
              cell(table, oldIndex + 1, newIndex),
              cell(table, oldIndex, newIndex + 1),
            ),
      );
    }
  }

  const lines: DiffLine[] = [];
  let oldIndex = 0;
  let newIndex = 0;
  let oldNumber = 1;
  let newNumber = 1;

  while (oldIndex < oldCount && newIndex < newCount) {
    if (oldLines[oldIndex] === newLines[newIndex]) {
      lines.push({
        type: "context",
        text: oldLines[oldIndex] ?? "",
        oldNumber,
        newNumber,
      });
      oldIndex += 1;
      newIndex += 1;
      oldNumber += 1;
      newNumber += 1;
    } else if (
      cell(table, oldIndex + 1, newIndex) >= cell(table, oldIndex, newIndex + 1)
    ) {
      lines.push({
        type: "remove",
        text: oldLines[oldIndex] ?? "",
        oldNumber,
        newNumber: null,
      });
      oldIndex += 1;
      oldNumber += 1;
    } else {
      lines.push({
        type: "add",
        text: newLines[newIndex] ?? "",
        oldNumber: null,
        newNumber,
      });
      newIndex += 1;
      newNumber += 1;
    }
  }

  while (oldIndex < oldCount) {
    lines.push({
      type: "remove",
      text: oldLines[oldIndex] ?? "",
      oldNumber,
      newNumber: null,
    });
    oldIndex += 1;
    oldNumber += 1;
  }

  while (newIndex < newCount) {
    lines.push({
      type: "add",
      text: newLines[newIndex] ?? "",
      oldNumber: null,
      newNumber,
    });
    newIndex += 1;
    newNumber += 1;
  }

  return lines;
}

function toHunks(all: DiffLine[]): DiffHunk[] {
  const changeIndexes = all.flatMap((line, index) =>
    line.type === "context" ? [] : [index],
  );
  if (changeIndexes.length === 0) {
    return [];
  }

  const ranges: Array<{ start: number; end: number }> = [];
  let start = Math.max(0, (changeIndexes[0] ?? 0) - CONTEXT);
  let end = Math.min(all.length, (changeIndexes[0] ?? 0) + 1 + CONTEXT);

  for (const index of changeIndexes.slice(1)) {
    const nextStart = Math.max(0, index - CONTEXT);
    const nextEnd = Math.min(all.length, index + 1 + CONTEXT);
    if (nextStart <= end) {
      end = nextEnd;
    } else {
      ranges.push({ start, end });
      start = nextStart;
      end = nextEnd;
    }
  }
  ranges.push({ start, end });

  return ranges.map((range) => {
    const lines = all.slice(range.start, range.end);
    const oldNumbers = lines.flatMap((line) =>
      line.oldNumber === null ? [] : [line.oldNumber],
    );
    const newNumbers = lines.flatMap((line) =>
      line.newNumber === null ? [] : [line.newNumber],
    );

    return {
      oldStart: oldNumbers[0] ?? 0,
      oldLines: lines.filter((line) => line.type !== "add").length,
      newStart: newNumbers[0] ?? 0,
      newLines: lines.filter((line) => line.type !== "remove").length,
      lines,
    };
  });
}
