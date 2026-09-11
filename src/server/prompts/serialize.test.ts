import { describe, expect, it } from "vitest";
import { serializePrompt, serializeRun } from "./serialize";

describe("serializePrompt", () => {
  it("converts timestamps to ISO strings for the API", () => {
    const createdAt = new Date("2026-01-02T03:04:05.000Z");
    const updatedAt = new Date("2026-01-03T04:05:06.000Z");

    expect(
      serializePrompt({
        id: "11111111-1111-4111-8111-111111111111",
        title: "Greeting",
        body: "Hello",
        model: "gpt-5.6",
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
      model: "gpt-5.6",
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

describe("serializeRun", () => {
  it("includes tokens and cost for the API", () => {
    expect(
      serializeRun({
        id: "33333333-3333-4333-8333-333333333333",
        promptId: "11111111-1111-4111-8111-111111111111",
        promptTitle: "Greeting",
        model: "grok-4.6",
        input: "user: Hello",
        output: "Hi",
        status: "succeeded",
        inputTokens: 12,
        outputTokens: 34,
        costUsd: "0.0002280000",
        source: "playground",
        createdAt: new Date("2026-01-02T03:04:05.000Z"),
      }),
    ).toEqual({
      id: "33333333-3333-4333-8333-333333333333",
      promptId: "11111111-1111-4111-8111-111111111111",
      promptTitle: "Greeting",
      model: "grok-4.6",
      input: "user: Hello",
      output: "Hi",
      status: "succeeded",
      inputTokens: 12,
      outputTokens: 34,
      costUsd: "0.0002280000",
      source: "playground",
      createdAt: "2026-01-02T03:04:05.000Z",
    });
  });
});
