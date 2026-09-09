import { describe, expect, it } from "vitest";
import { projectsQuery } from "./projects";

describe("projectsQuery", () => {
  it("keeps a stable query key for cache reuse", () => {
    expect(projectsQuery.key).toEqual(["projects"]);
    expect(projectsQuery.options().queryKey).toEqual(["projects"]);
  });

  it("keeps hydrated data fresh for 60 seconds", () => {
    expect(projectsQuery.options().staleTime).toBe(60_000);
  });
});
