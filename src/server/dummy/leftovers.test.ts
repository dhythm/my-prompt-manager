import { describe, expect, it } from "vitest";
import { isLeftoverProjectName, isLeftoverTeamName } from "./leftovers";

describe("dummy leftover names", () => {
  it("matches e2e team names", () => {
    expect(isLeftoverTeamName("Core")).toBe(true);
    expect(isLeftoverTeamName("Core 1788952250858")).toBe(true);
    expect(isLeftoverTeamName("Design Review")).toBe(true);
    expect(isLeftoverTeamName("営業")).toBe(false);
  });

  it("matches e2e project names", () => {
    expect(isLeftoverProjectName("開発 1788998931392")).toBe(true);
    expect(isLeftoverProjectName("本番 1789029668702")).toBe(true);
    expect(isLeftoverProjectName("デフォルト")).toBe(false);
  });
});
