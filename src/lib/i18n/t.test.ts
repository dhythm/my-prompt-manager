import { describe, expect, it } from "vitest";
import { t } from "./t";

describe("t", () => {
  it("returns a Japanese UI string for a known key", () => {
    expect(t("nav.newPrompt")).toBe("新規作成");
  });

  it("interpolates placeholders", () => {
    expect(t("account.useUser", { name: "Developer" })).toBe(
      "Developerに切り替え",
    );
    expect(t("prompt.version", { number: 2 })).toBe("バージョン 2");
  });

  it("keeps unknown placeholders intact", () => {
    expect(t("validation.required", { field: "タイトル" })).toBe(
      "タイトルは必須です",
    );
  });

  it("formats the missing-variables list", () => {
    expect(t("prompt.missingVariables", { names: "name、topic" })).toBe(
      "未入力: name、topic",
    );
  });
});
