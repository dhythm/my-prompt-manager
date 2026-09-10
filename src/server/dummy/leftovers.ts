export function isLeftoverTeamName(name: string) {
  return name === "Core" || name === "Design Review" || /^Core \d+$/.test(name);
}

export function isLeftoverProjectName(name: string) {
  return /^(開発|本番) \d+$/.test(name);
}
