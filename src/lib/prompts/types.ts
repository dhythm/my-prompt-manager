export type Prompt = {
  id: string;
  title: string;
  body: string;
  model: string;
  ownerUserId: string | null;
  teamId: string | null;
  teamName: string | null;
  projectId: string | null;
  projectName: string | null;
  createdAt: string;
  updatedAt: string;
};

export type CreatePromptInput = {
  title: string;
  body: string;
  teamId?: string;
  projectId?: string;
};

export type PromptMessage = {
  id?: string;
  role: "system" | "user" | "assistant";
  content: string;
  position?: number;
};

export type PromptVersion = {
  id: string;
  versionNumber: number;
  model: string;
  note: string | null;
  createdAt: string;
};

export type PromptDetail = {
  prompt: Prompt;
  version: PromptVersion;
  messages: PromptMessage[];
};

export type PromptVersionDetail = {
  version: PromptVersion;
  messages: PromptMessage[];
};

export type PromptRun = {
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
  createdAt: string;
};
