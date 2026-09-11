import type { PromptModelId } from "@/lib/prompts/models";
import type { PromptRunSource } from "@/lib/prompts/types";
import type { PromptMessageInput } from "./versions";

export type SampleRun = {
  id: string;
  source: PromptRunSource;
  output: string;
  inputTokens: number;
  outputTokens: number;
};

export type SamplePrompt = {
  id: string;
  title: string;
  model: PromptModelId;
  messages: PromptMessageInput[];
  runs: SampleRun[];
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
    runs: [
      {
        id: "20000000-0000-4000-8000-000000000011",
        source: "playground",
        output: [
          "Subject: Tuesday 10:00 JST delivery window",
          "",
          "The hardware is ready for Tuesday 10:00 JST. Please confirm that slot still works.",
        ].join("\n"),
        inputTokens: 186,
        outputTokens: 42,
      },
      {
        id: "20000000-0000-4000-8000-000000000012",
        source: "api",
        output: [
          "Subject: Ready for Tuesday 10:00 JST",
          "",
          "Parts are packed for Tuesday 10:00 JST. Reply if you need a different window.",
        ].join("\n"),
        inputTokens: 192,
        outputTokens: 38,
      },
    ],
  },
  {
    id: "10000000-0000-4000-8000-000000000002",
    title: "PR差分をレビューする",
    model: "gpt-5.6-sol",
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
    runs: [
      {
        id: "20000000-0000-4000-8000-000000000021",
        source: "playground",
        output: [
          'Blocker: parseId maps null to "unknown", so callers cannot tell a missing ID from a real value.',
          "Should-fix: reject empty strings too.",
          "Solid: the helper is local and easy to replace.",
        ].join("\n"),
        inputTokens: 214,
        outputTokens: 61,
      },
      {
        id: "20000000-0000-4000-8000-000000000022",
        source: "api",
        output: [
          'Blocker: null becomes "unknown".',
          "Should-fix: add a test for empty input.",
          "Solid: small surface area.",
        ].join("\n"),
        inputTokens: 208,
        outputTokens: 34,
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
    runs: [
      {
        id: "20000000-0000-4000-8000-000000000031",
        source: "playground",
        output: [
          "Decisions: pricing page moves to Thursday.",
          "Open: banner copy is undecided.",
          "Tasks: Sam drafts pricing copy (unassigned due date).",
        ].join("\n"),
        inputTokens: 164,
        outputTokens: 47,
      },
      {
        id: "20000000-0000-4000-8000-000000000032",
        source: "api",
        output: [
          "Decision: Thursday for the pricing page.",
          "Question: banner — no owner.",
          "Task: Sam / draft copy.",
        ].join("\n"),
        inputTokens: 170,
        outputTokens: 31,
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
    runs: [
      {
        id: "20000000-0000-4000-8000-000000000041",
        source: "playground",
        output: [
          "Ambiguity: can a guest unstar, or only star?",
          "Missing path: what happens when a prompt is deleted while starred.",
          'Metric: "appear first" needs a sort rule when many people star.',
        ].join("\n"),
        inputTokens: 198,
        outputTokens: 58,
      },
      {
        id: "20000000-0000-4000-8000-000000000042",
        source: "api",
        output: [
          "Ask: is starring per-user or global?",
          "Exception: anonymous quota.",
          'Metric: time-to-first-starred-prompt is measurable; "appear first" is not.',
        ].join("\n"),
        inputTokens: 201,
        outputTokens: 44,
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
