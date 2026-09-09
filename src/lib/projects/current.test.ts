import { describe, expect, it } from "vitest";
import { resolveCurrentProjectId } from "./current";

describe("resolveCurrentProjectId", () => {
  const projects = [{ id: "p1" }, { id: "p2" }];

  it("keeps the stored project when it still exists", () => {
    expect(resolveCurrentProjectId(projects, "p2")).toBe("p2");
  });

  it("falls back to the first project when stored is missing", () => {
    expect(resolveCurrentProjectId(projects, "gone")).toBe("p1");
    expect(resolveCurrentProjectId(projects, null)).toBe("p1");
    expect(resolveCurrentProjectId([], null)).toBe("");
  });
});
