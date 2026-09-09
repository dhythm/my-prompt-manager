export type Prompt = {
  id: string;
  title: string;
  body: string;
  ownerUserId: string | null;
  teamId: string | null;
  teamName: string | null;
  createdAt: string;
  updatedAt: string;
};

export type CreatePromptInput = {
  title: string;
  body: string;
  teamId?: string;
};

export type PromptVersion = {
  id: string;
  versionNumber: number;
  model: string;
  note: string | null;
  createdAt: string;
};

export type PromptRun = {
  id: string;
  promptId: string;
  model: string;
  input: string;
  output: string;
  status: string;
  createdAt: string;
};
