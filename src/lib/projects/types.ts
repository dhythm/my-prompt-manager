export type Project = {
  id: string;
  name: string;
  ownerUserId: string | null;
  teamId: string | null;
  teamName: string | null;
};

export type CreateProjectInput = {
  name: string;
  teamId?: string;
};
