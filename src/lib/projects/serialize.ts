import type { Project } from "./types";

export function toClientProject(project: {
  id: string;
  name: string;
  ownerUserId: string | null;
  teamId: string | null;
  teamName?: string | null;
  createdAt: Date | string;
}): Project {
  return {
    id: project.id,
    name: project.name,
    ownerUserId: project.ownerUserId,
    teamId: project.teamId,
    teamName: project.teamName ?? null,
    createdAt:
      typeof project.createdAt === "string"
        ? project.createdAt
        : project.createdAt.toISOString(),
  };
}
