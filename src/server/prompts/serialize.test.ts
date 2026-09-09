import { describe, expect, it } from "vitest";
import { serializePrompt } from "./serialize";

describe("serializePrompt", () => {
  it("converts timestamps to ISO strings for the API", () => {
    const createdAt = new Date("2026-01-02T03:04:05.000Z");
    const updatedAt = new Date("2026-01-03T04:05:06.000Z");

    expect(
      serializePrompt({
        id: "11111111-1111-4111-8111-111111111111",
        title: "Greeting",
        body: "Hello",
        ownerUserId: "00000000-0000-4000-8000-000000000001",
        teamId: null,
        teamName: null,
        projectId: "22222222-2222-4222-8222-222222222222",
        projectName: "Development",
        createdAt,
        updatedAt,
      }),
    ).toEqual({
      id: "11111111-1111-4111-8111-111111111111",
      title: "Greeting",
      body: "Hello",
      ownerUserId: "00000000-0000-4000-8000-000000000001",
      teamId: null,
      teamName: null,
      projectId: "22222222-2222-4222-8222-222222222222",
      projectName: "Development",
      createdAt: "2026-01-02T03:04:05.000Z",
      updatedAt: "2026-01-03T04:05:06.000Z",
    });
  });
});
