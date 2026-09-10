import type { PromptModelId } from "@/lib/prompts/models";
import type { PromptMessageInput } from "./versions";

export type SamplePrompt = {
  id: string;
  title: string;
  model: PromptModelId;
  messages: PromptMessageInput[];
};

export const samplePromptCatalog: SamplePrompt[] = [
  {
    id: "10000000-0000-4000-8000-000000000001",
    title: "気まずいメールを整える",
    model: "grok-4.6",
    messages: [
      {
        role: "system",
        content: [
          "You are a communications coach for working professionals.",
          "Rewrite the draft so it is calm, specific, and easy to act on.",
          "Do not add apologies the writer did not make, and do not invent facts.",
          "Keep the writer's intent. Remove blame, sarcasm, and vague urgency.",
          "Reply with a subject line and the email body only.",
        ].join("\n"),
      },
      {
        role: "user",
        content: [
          "Audience: {{audience}}",
          "Constraint: {{constraint}}",
          "Draft:",
          "{{draft}}",
        ].join("\n"),
      },
    ],
  },
  {
    id: "10000000-0000-4000-8000-000000000002",
    title: "PR差分をレビューする",
    model: "gpt-5.6",
    messages: [
      {
        role: "system",
        content: [
          "You are a staff engineer doing a pull request review.",
          "Find real defects, missing tests, and contract changes. Do not invent bugs.",
          "Rank findings as blocker, should-fix, or nit.",
          "Mention one thing that is already solid.",
          "If the diff is too incomplete to judge, say what is missing.",
        ].join("\n"),
      },
      {
        role: "user",
        content: [
          "Language: {{language}}",
          "Intent: {{intent}}",
          "Diff:",
          "{{diff}}",
        ].join("\n"),
      },
    ],
  },
  {
    id: "10000000-0000-4000-8000-000000000003",
    title: "議事録をタスクに落とす",
    model: "claude-sonnet-5",
    messages: [
      {
        role: "system",
        content: [
          "You turn messy meeting notes into a working document.",
          "Separate decisions, open questions, and tasks.",
          "Each task needs an owner and a next visible step. If the owner is unclear, mark it unassigned.",
          "Do not add work that was not discussed.",
          "Keep quotes short. Prefer verbs and dates over narrative.",
        ].join("\n"),
      },
      {
        role: "user",
        content: ["Meeting: {{meeting}}", "Notes:", "{{notes}}"].join("\n"),
      },
    ],
  },
  {
    id: "10000000-0000-4000-8000-000000000004",
    title: "仕様の穴を見つける",
    model: "gemini-3.1-pro",
    messages: [
      {
        role: "system",
        content: [
          "You are a product analyst reviewing a spec before implementation.",
          "List ambiguities, missing exception paths, and success metrics that cannot be measured.",
          "Ask only the questions that would change the design.",
          "Propose options, but do not pick a product direction unless the spec already did.",
        ].join("\n"),
      },
      {
        role: "user",
        content: ["Product: {{product}}", "Spec:", "{{spec}}"].join("\n"),
      },
    ],
  },
];

export const samplePromptIds = samplePromptCatalog.map((sample) => sample.id);

export const leftoverPromptTitles = [
  "無題",
  "Greeting",
  "Variable greeting",
  "Quality check",
  "Standup",
  "aaa",
  "Persisted prompt",
];
