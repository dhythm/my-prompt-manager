import { describe, expect, it } from "vitest";
import { t } from "@/lib/i18n/t";
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
      t("validation.jsonObject"),
    );
  });

  it("rejects an empty title", () => {
    expect(() =>
      parseCreatePromptInput({ title: "  ", body: "Hello" }),
    ).toThrowError(t("validation.required", { field: t("field.title") }));
  });

  it("rejects a title longer than 200 characters", () => {
    expect(() =>
      parseCreatePromptInput({ title: "a".repeat(201), body: "Hello" }),
    ).toThrowError(
      t("validation.maxLength", { field: t("field.title"), max: 200 }),
    );
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
    ).toThrowError(
      t("validation.maxLength", { field: t("field.body"), max: 10_000 }),
    );
  });
});
