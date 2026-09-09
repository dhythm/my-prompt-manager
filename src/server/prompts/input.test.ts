import { describe, expect, it } from "vitest";
import { parseCreatePromptInput } from "./input";

describe("parseCreatePromptInput", () => {
  it("accepts a valid payload", () => {
    expect(
      parseCreatePromptInput({ title: "Greeting", body: "Hello" }),
    ).toEqual({
      title: "Greeting",
      body: "Hello",
    });
  });

  it("trims title and body", () => {
    expect(
      parseCreatePromptInput({ title: "  Greeting  ", body: "  Hello  " }),
    ).toEqual({
      title: "Greeting",
      body: "Hello",
    });
  });

  it("rejects a non-object body", () => {
    expect(() => parseCreatePromptInput("prompt")).toThrowError(
      /Request body must be a JSON object/,
    );
  });

  it("rejects an empty title", () => {
    expect(() =>
      parseCreatePromptInput({ title: "  ", body: "Hello" }),
    ).toThrowError(/title is required/);
  });

  it("rejects a title longer than 200 characters", () => {
    expect(() =>
      parseCreatePromptInput({ title: "a".repeat(201), body: "Hello" }),
    ).toThrowError(/title must be 200 characters or fewer/);
  });

  it("allows an empty body", () => {
    expect(parseCreatePromptInput({ title: "Greeting", body: "" })).toEqual({
      title: "Greeting",
      body: "",
    });
  });

  it("rejects a body longer than 10000 characters", () => {
    expect(() =>
      parseCreatePromptInput({ title: "Greeting", body: "a".repeat(10_001) }),
    ).toThrowError(/body must be 10000 characters or fewer/);
  });
});
