export const PERSONAL_WORKSPACE = "personal";

export function workspaceKey(project: { teamId: string | null }): string {
  return project.teamId ?? PERSONAL_WORKSPACE;
}

export function listWorkspaces(
  projects: Array<{ teamId: string | null; teamName: string | null }>,
  personalLabel: string,
): Array<{ key: string; label: string }> {
  const options: Array<{ key: string; label: string }> = [];
  const seen = new Set<string>();

  if (projects.some((project) => project.teamId === null)) {
    options.push({ key: PERSONAL_WORKSPACE, label: personalLabel });
  }

  for (const project of projects) {
    if (!project.teamId || seen.has(project.teamId)) {
      continue;
    }
    seen.add(project.teamId);
    options.push({
      key: project.teamId,
      label: project.teamName ?? project.teamId,
    });
  }

  return options;
}

export function projectsInWorkspace<T extends { teamId: string | null }>(
  projects: T[],
  key: string,
): T[] {
  return projects.filter((project) => workspaceKey(project) === key);
}
