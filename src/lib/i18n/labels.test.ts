import { describe, expect, it } from "vitest";
import { messageRoleLabel, teamRoleLabel } from "./labels";

describe("labels", () => {
  it("maps message roles to Japanese", () => {
    expect(messageRoleLabel("system")).toBe("システム");
    expect(messageRoleLabel("user")).toBe("ユーザー");
    expect(messageRoleLabel("assistant")).toBe("アシスタント");
  });

  it("maps team roles to Japanese", () => {
    expect(teamRoleLabel("owner")).toBe("オーナー");
    expect(teamRoleLabel("member")).toBe("メンバー");
  });
});
