import { describe, expect, it } from "vitest";
import {
  listWorkspaces,
  PERSONAL_WORKSPACE,
  projectsInWorkspace,
  workspaceKey,
} from "./workspace";

const personal = {
  id: "p1",
  teamId: null,
  teamName: null,
};
const coreDefault = {
  id: "p2",
  teamId: "team-core",
  teamName: "Core",
};
const coreDev = {
  id: "p3",
  teamId: "team-core",
  teamName: "Core",
};
const design = {
  id: "p4",
  teamId: "team-design",
  teamName: "Design",
};

describe("workspace grouping", () => {
  const projects = [personal, coreDefault, coreDev, design];

  it("treats a project without a team as personal", () => {
    expect(workspaceKey(personal)).toBe(PERSONAL_WORKSPACE);
    expect(workspaceKey(coreDefault)).toBe("team-core");
  });

  it("lists personal first, then each team once", () => {
    expect(listWorkspaces(projects, "個人")).toEqual([
      { key: PERSONAL_WORKSPACE, label: "個人" },
      { key: "team-core", label: "Core" },
      { key: "team-design", label: "Design" },
    ]);
  });

  it("filters projects to the selected workspace", () => {
    expect(projectsInWorkspace(projects, PERSONAL_WORKSPACE)).toEqual([
      personal,
    ]);
    expect(projectsInWorkspace(projects, "team-core")).toEqual([
      coreDefault,
      coreDev,
    ]);
  });
});
