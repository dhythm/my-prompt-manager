import { describe, expect, it } from "vitest";
import {
  extractVariables,
  extractVariablesFromTexts,
  filledValues,
  missingVariables,
  substitute,
} from "./template";

describe("extractVariables", () => {
  it("finds simple identifiers in first-seen order", () => {
    expect(extractVariables("Hello {{name}}, talk about {{topic}}.")).toEqual([
      "name",
      "topic",
    ]);
  });

  it("deduplicates repeated names", () => {
    expect(extractVariables("{{name}} and {{name}} again")).toEqual(["name"]);
  });

  it("allows digits and underscores in identifiers", () => {
    expect(extractVariables("{{user_1}} {{_id}} {{2fa}}")).toEqual([
      "user_1",
      "_id",
      "2fa",
    ]);
  });

  it("allows optional whitespace inside braces", () => {
    expect(extractVariables("{{ name }} {{topic}}")).toEqual(["name", "topic"]);
  });

  it("ignores invalid identifiers and unclosed braces", () => {
    expect(
      extractVariables("{{foo-bar}} {{foo.bar}} {{}} {{ name {{open}}"),
    ).toEqual(["open"]);
  });

  it("treats nested braces as the first complete {{ident}}", () => {
    expect(
      extractVariables("{{{name}}} {{{{topic}}}} {{outer{{inner}}}}"),
    ).toEqual(["name", "topic", "inner"]);
  });
});

describe("extractVariablesFromTexts", () => {
  it("merges names across messages without reordering later first-seen names", () => {
    expect(
      extractVariablesFromTexts([
        "Hi {{name}}",
        "Ask about {{topic}} and {{name}}",
      ]),
    ).toEqual(["name", "topic"]);
  });
});

describe("substitute", () => {
  it("replaces known variables", () => {
    expect(substitute("Hello {{name}}", { name: "Ada" })).toBe("Hello Ada");
  });

  it("keeps unknown placeholders intact", () => {
    expect(substitute("Hello {{name}}", {})).toBe("Hello {{name}}");
    expect(substitute("Hello {{ name }}", { topic: "math" })).toBe(
      "Hello {{ name }}",
    );
  });

  it("does not expand values that contain placeholders", () => {
    expect(substitute("Hello {{name}}", { name: "{{topic}}" })).toBe(
      "Hello {{topic}}",
    );
  });

  it("does not treat leftover nested braces as a second pass", () => {
    expect(substitute("{{{name}}}", { name: "Ada" })).toBe("{Ada}");
    expect(substitute("{{outer{{inner}}}}", { inner: "x", outer: "y" })).toBe(
      "{{outerx}}",
    );
  });

  it("inserts empty string when the key is present", () => {
    expect(substitute("Hello {{name}}!", { name: "" })).toBe("Hello !");
  });
});

describe("missingVariables", () => {
  it("lists omitted and whitespace-only values", () => {
    expect(
      missingVariables(["name", "topic", "tone"], {
        name: "Ada",
        topic: "   ",
      }),
    ).toEqual(["topic", "tone"]);
  });

  it("treats a provided empty string as missing", () => {
    expect(missingVariables(["name"], { name: "" })).toEqual(["name"]);
  });
});

describe("filledValues", () => {
  it("drops blank values so preview can leave those placeholders", () => {
    expect(filledValues({ name: "Ada", topic: "  " })).toEqual({ name: "Ada" });
  });
});
