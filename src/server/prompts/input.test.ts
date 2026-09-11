import { describe, expect, it } from "vitest";
import { t } from "@/lib/i18n/t";
import {
  parseCreatePromptInput,
  parseListRunsQuery,
  parseRecordRunInput,
} from "./input";

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
    expect(parseRecordRunInput({})).toEqual({
      variables: {},
      source: "playground",
    });
    expect(parseRecordRunInput(undefined)).toEqual({
      variables: {},
      source: "playground",
    });
  });

  it("accepts string variable values", () => {
    expect(
      parseRecordRunInput({ variables: { name: "Ada", topic: "math" } }),
    ).toEqual({
      variables: { name: "Ada", topic: "math" },
      source: "playground",
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
      source: "playground",
    });
    expect(
      parseRecordRunInput({
        model: "  grok-4.6  ",
        variables: { name: "Ada" },
      }),
    ).toEqual({
      variables: { name: "Ada" },
      model: "grok-4.6",
      source: "playground",
    });
  });

  it("defaults source to playground", () => {
    expect(parseRecordRunInput({})).toEqual({
      variables: {},
      source: "playground",
    });
    expect(parseRecordRunInput({ source: "playground" })).toEqual({
      variables: {},
      source: "playground",
    });
  });

  it("rejects api, editor, and unknown sources on the session run route", () => {
    expect(() => parseRecordRunInput({ source: "api" })).toThrowError(
      t("validation.runSourceInvalid"),
    );
    expect(() => parseRecordRunInput({ source: "editor" })).toThrowError(
      t("validation.runSourceInvalid"),
    );
    expect(() => parseRecordRunInput({ source: "sdk" })).toThrowError(
      t("validation.runSourceInvalid"),
    );
  });
});

describe("parseListRunsQuery", () => {
  it("defaults to an empty filter and the standard page size", () => {
    expect(parseListRunsQuery(new URLSearchParams())).toEqual({
      limit: 20,
    });
  });

  it("reads prompt, model, cursor, and limit", () => {
    expect(
      parseListRunsQuery(
        new URLSearchParams({
          promptId: "11111111-1111-4111-8111-111111111111",
          model: "gpt-5.6",
          cursor:
            "2026-01-02T03:04:05.000Z::22222222-2222-4222-8222-222222222222",
          limit: "10",
        }),
      ),
    ).toEqual({
      promptId: "11111111-1111-4111-8111-111111111111",
      model: "gpt-5.6",
      cursor: "2026-01-02T03:04:05.000Z::22222222-2222-4222-8222-222222222222",
      limit: 10,
    });
  });
});
