import { describe, expect, it } from "vitest";
import {
  promptVersionDetailQuery,
  promptVersionsQuery,
  runDetailQuery,
} from "./prompt-detail";

describe("prompt version queries", () => {
  it("keeps a stable versions list key", () => {
    expect(promptVersionsQuery.key("prompt-1")).toEqual([
      "prompt-versions",
      "prompt-1",
    ]);
  });

  it("keys version detail by prompt and version number", () => {
    expect(promptVersionDetailQuery.key("prompt-1", 2)).toEqual([
      "prompt-version",
      "prompt-1",
      2,
    ]);
    expect(promptVersionDetailQuery.options("prompt-1", 2).staleTime).toBe(
      60_000,
    );
  });

  it("keys run detail by run id", () => {
    expect(runDetailQuery.key("run-1")).toEqual(["run", "run-1"]);
  });
});
