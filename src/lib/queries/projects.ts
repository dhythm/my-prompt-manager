import { queryOptions } from "@tanstack/react-query";
import { deleteJson, getJson, patchJson, postJson } from "@/lib/api/http";
import type { CreateProjectInput, Project } from "@/lib/projects/types";
import type { Prompt } from "@/lib/prompts/types";

export const projectsQuery = {
  key: ["projects"] as const,
  options: () =>
    queryOptions({
      queryKey: projectsQuery.key,
      queryFn: async () => {
        const data = await getJson<{ projects: Project[] }>("/api/projects");
        return data.projects;
      },
      staleTime: 60_000,
    }),
};

export async function createProjectRequest(input: CreateProjectInput) {
  const data = await postJson<{ project: Project }>("/api/projects", input);
  return data.project;
}

export async function renameProjectRequest(id: string, name: string) {
  const data = await patchJson<{ project: Project }>(`/api/projects/${id}`, {
    name,
  });
  return data.project;
}

export async function deleteProjectRequest(id: string) {
  await deleteJson(`/api/projects/${id}`);
}

export async function copyPromptRequest(promptId: string, projectId: string) {
  const data = await postJson<{ prompt: Prompt }>(
    `/api/prompts/${promptId}/copy`,
    { projectId },
  );
  return data.prompt;
}
