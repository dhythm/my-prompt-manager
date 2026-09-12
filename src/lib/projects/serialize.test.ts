import { describe, expect, it } from "vitest";
import { toClientProject } from "./serialize";

describe("toClientProject", () => {
  it("serializes Date createdAt to ISO", () => {
    expect(
      toClientProject({
        id: "p1",
        name: "Dev",
        ownerUserId: "u1",
        teamId: null,
        teamName: null,
        createdAt: new Date("2026-09-13T00:00:00.000Z"),
      }).createdAt,
    ).toBe("2026-09-13T00:00:00.000Z");
  });
});
