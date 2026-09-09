import { describe, expect, it } from "vitest";
import { t } from "@/lib/i18n/t";
import {
  parseCopyPromptInput,
  parseCreateProjectInput,
  parseRenameProjectInput,
} from "./input";

describe("project input", () => {
  it("accepts a personal project name", () => {
    expect(parseCreateProjectInput({ name: "  Development  " })).toEqual({
      name: "Development",
    });
  });

  it("accepts an optional team id", () => {
    expect(
      parseCreateProjectInput({
        name: "Production",
        teamId: " team-1 ",
      }),
    ).toEqual({
      name: "Production",
      teamId: "team-1",
    });
  });

  it("rejects an empty name", () => {
    expect(() => parseCreateProjectInput({ name: "  " })).toThrowError(
      t("validation.required", { field: t("field.name") }),
    );
  });

  it("requires a project id for copy", () => {
    expect(() => parseCopyPromptInput({})).toThrowError(
      t("validation.required", { field: t("field.projectId") }),
    );
    expect(parseCopyPromptInput({ projectId: " project-1 " })).toEqual({
      projectId: "project-1",
    });
  });

  it("renames with a trimmed name", () => {
    expect(parseRenameProjectInput({ name: "  Production  " })).toEqual({
      name: "Production",
    });
  });
});
