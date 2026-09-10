import { defaultPromptModel } from "@/lib/prompts/models";
import type {
  Prompt,
  PromptMessage,
  PromptRun,
  PromptVersion,
} from "@/lib/prompts/types";

export function serializePrompt(prompt: {
  id: string;
  title: string;
  body: string;
  model?: string | null;
  ownerUserId: string | null;
  teamId: string | null;
  teamName?: string | null;
  projectId?: string | null;
  projectName?: string | null;
  createdAt: Date;
  updatedAt: Date;
}): Prompt {
  return {
    id: prompt.id,
    title: prompt.title,
    body: prompt.body,
    model: prompt.model ?? defaultPromptModel,
    ownerUserId: prompt.ownerUserId,
    teamId: prompt.teamId,
    teamName: prompt.teamName ?? null,
    projectId: prompt.projectId ?? null,
    projectName: prompt.projectName ?? null,
    createdAt: prompt.createdAt.toISOString(),
    updatedAt: prompt.updatedAt.toISOString(),
  };
}

export function serializeVersion(version: {
  id: string;
  versionNumber: number;
  model: string;
  note: string | null;
  createdAt: Date;
}): PromptVersion {
  return {
    id: version.id,
    versionNumber: version.versionNumber,
    model: version.model,
    note: version.note,
    createdAt: version.createdAt.toISOString(),
  };
}

export function serializeMessage(message: {
  id: string;
  role: string;
  content: string;
  position: number;
}): PromptMessage {
  return {
    id: message.id,
    role: message.role as PromptMessage["role"],
    content: message.content,
    position: message.position,
  };
}

export function serializeRun(run: {
  id: string;
  promptId: string;
  promptTitle: string;
  model: string;
  input: string;
  output: string;
  status: string;
  inputTokens: number | null;
  outputTokens: number | null;
  costUsd: string | null;
  createdAt: Date;
}): PromptRun {
  return {
    id: run.id,
    promptId: run.promptId,
    promptTitle: run.promptTitle,
    model: run.model,
    input: run.input,
    output: run.output,
    status: run.status,
    inputTokens: run.inputTokens,
    outputTokens: run.outputTokens,
    costUsd: run.costUsd,
    createdAt: run.createdAt.toISOString(),
  };
}
