import { describe, expect, it } from "vitest";
import { t } from "@/lib/i18n/t";
import { parseCreatePromptInput, parseRecordRunInput } from "./input";

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

  it("accepts an optional project id", () => {
    expect(
      parseCreatePromptInput({
        title: "Greeting",
        body: "Hello",
        projectId: " project-1 ",
      }),
    ).toEqual({
      title: "Greeting",
      body: "Hello",
      projectId: "project-1",
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

describe("parseRecordRunInput", () => {
  it("defaults to an empty variable map", () => {
    expect(parseRecordRunInput({})).toEqual({ variables: {} });
    expect(parseRecordRunInput(undefined)).toEqual({ variables: {} });
  });

  it("accepts string variable values", () => {
    expect(
      parseRecordRunInput({ variables: { name: "Ada", topic: "math" } }),
    ).toEqual({
      variables: { name: "Ada", topic: "math" },
    });
  });

  it("rejects a non-object variables map", () => {
    expect(() => parseRecordRunInput({ variables: "Ada" })).toThrowError(
      t("validation.variablesObject"),
    );
  });

  it("rejects an invalid variable name", () => {
    expect(() =>
      parseRecordRunInput({ variables: { "foo-bar": "Ada" } }),
    ).toThrowError(t("validation.variableNameInvalid", { name: "foo-bar" }));
  });

  it("rejects a non-string variable value", () => {
    expect(() => parseRecordRunInput({ variables: { name: 1 } })).toThrowError(
      t("validation.variableValueMustBeString", { name: "name" }),
    );
  });

  it("accepts an optional model override", () => {
    expect(parseRecordRunInput({ model: "gpt-5.6" })).toEqual({
      variables: {},
      model: "gpt-5.6",
    });
    expect(
      parseRecordRunInput({
        model: "  grok-4.6  ",
        variables: { name: "Ada" },
      }),
    ).toEqual({
      variables: { name: "Ada" },
      model: "grok-4.6",
    });
  });
});
