import { describe, expect, it } from "vitest";
import { promptsQuery } from "./prompts";

describe("promptsQuery", () => {
  it("keeps a stable query key for cache reuse", () => {
    expect(promptsQuery.key).toEqual(["prompts"]);
    expect(promptsQuery.options().queryKey).toEqual(["prompts"]);
  });

  it("keeps hydrated data fresh for 60 seconds", () => {
    expect(promptsQuery.options().staleTime).toBe(60_000);
  });
});
