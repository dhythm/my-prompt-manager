import { t } from "./t";

export function messageRoleLabel(
  role: "system" | "user" | "assistant",
): string {
  if (role === "system") {
    return t("prompt.roleSystem");
  }
  if (role === "user") {
    return t("prompt.roleUser");
  }
  return t("prompt.roleAssistant");
}

export function teamRoleLabel(role: string): string {
  if (role === "owner") {
    return t("team.roleOwner");
  }
  if (role === "member") {
    return t("team.roleMember");
  }
  return role;
}
