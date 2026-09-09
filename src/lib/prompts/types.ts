export type Prompt = {
  id: string;
  title: string;
  body: string;
  createdAt: string;
  updatedAt: string;
};

export type CreatePromptInput = {
  title: string;
  body: string;
};
