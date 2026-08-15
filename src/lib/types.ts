import { z } from "zod";

/* ---------------------------------------------------------------------------
 * What we pull out of a call transcript.
 *
 * Every field is required and nullable rather than optional: the structured
 * output schema forbids `additionalProperties`, and a model that can answer
 * "not mentioned" with an explicit null gives cleaner downstream handling than
 * one that silently omits keys.
 * ------------------------------------------------------------------------- */

export const DEAL_STAGES = [
  "discovery",
  "demo",
  "evaluation",
  "proposal",
  "negotiation",
  "closed_won",
  "closed_lost",
] as const;

export const CONTACT_ROLES = [
  "champion",
  "economic_buyer",
  "technical_evaluator",
  "blocker",
  "unknown",
] as const;

export const RISK_TYPES = [
  "budget",
  "timeline",
  "competition",
  "authority",
  "technical",
  "no_next_step",
  "champion_departure",
] as const;

export const contactSchema = z.object({
  name: z.string().describe("Full name as spoken on the call."),
  title: z.string().nullable().describe("Job title, or null if never stated."),
  email: z.string().nullable().describe("Email address, or null if not mentioned."),
  role: z
    .enum(CONTACT_ROLES)
    .describe(
      "Their role in the buying process, inferred from what they actually say and decide on the call.",
    ),
});

export const dealSchema = z.object({
  stage: z
    .enum(DEAL_STAGES)
    .describe("The stage the deal is in AFTER this call, not before it."),
  amount: z
    .number()
    .nullable()
    .describe("Annual contract value in whole currency units. Null if no number was discussed."),
  currency: z.string().describe('ISO currency code, e.g. "USD". Default to "USD" if unstated.'),
  closeDate: z
    .string()
    .nullable()
    .describe('Expected close date as YYYY-MM-DD, or null if no timeline was given.'),
  confidence: z
    .number()
    .describe("Your confidence this deal closes, 0-100, based only on evidence in the transcript."),
});

export const nextStepSchema = z.object({
  description: z.string().describe("The action, phrased as an imperative."),
  owner: z
    .enum(["us", "them"])
    .describe('"us" if the seller committed to it, "them" if the buyer did.'),
  dueDate: z.string().nullable().describe("YYYY-MM-DD if a date was agreed, otherwise null."),
});

export const riskSchema = z.object({
  type: z.enum(RISK_TYPES),
  severity: z.enum(["low", "medium", "high"]),
  evidence: z
    .string()
    .describe("The specific thing said on the call that supports this risk. Quote or paraphrase."),
});

export const quoteSchema = z.object({
  speaker: z.string(),
  quote: z.string().describe("Verbatim from the transcript."),
});

export const extractionSchema = z.object({
  summary: z.string().describe("Two or three sentences a manager could read instead of the call."),
  accountName: z.string().describe("The prospect company name."),
  accountDomain: z.string().nullable().describe("Company web domain if inferable, else null."),
  sentiment: z.enum(["positive", "neutral", "negative"]),
  contacts: z.array(contactSchema),
  deal: dealSchema,
  nextSteps: z.array(nextStepSchema),
  risks: z
    .array(riskSchema)
    .describe("Only real risks with evidence on the call. An empty array is a valid answer."),
  competitors: z.array(z.string()).describe("Named competing vendors mentioned."),
  notableQuotes: z.array(quoteSchema),
});

export type Contact = z.infer<typeof contactSchema>;
export type Deal = z.infer<typeof dealSchema>;
export type NextStep = z.infer<typeof nextStepSchema>;
export type Risk = z.infer<typeof riskSchema>;
export type Extraction = z.infer<typeof extractionSchema>;

/* ---------------------------------------------------------------------------
 * The CRM side. A deliberately small shape — enough to show a real write,
 * small enough that a JSON file is an honest stand-in for HubSpot/Salesforce.
 * ------------------------------------------------------------------------- */

export interface CrmAccount {
  id: string;
  name: string;
  domain: string | null;
  createdAt: string;
}

export interface CrmContact {
  id: string;
  accountId: string;
  name: string;
  title: string | null;
  email: string | null;
  role: (typeof CONTACT_ROLES)[number];
}

export interface CrmDeal {
  id: string;
  accountId: string;
  name: string;
  stage: (typeof DEAL_STAGES)[number];
  amount: number | null;
  currency: string;
  closeDate: string | null;
  confidence: number;
  updatedAt: string;
}

export interface CrmTask {
  id: string;
  accountId: string;
  dealId: string;
  description: string;
  owner: "us" | "them";
  dueDate: string | null;
  status: "open" | "done";
}

export interface CrmActivity {
  id: string;
  accountId: string;
  dealId: string;
  subject: string;
  summary: string;
  sentiment: "positive" | "neutral" | "negative";
  risks: Risk[];
  competitors: string[];
  loggedAt: string;
}

export interface CrmDatabase {
  accounts: CrmAccount[];
  contacts: CrmContact[];
  deals: CrmDeal[];
  tasks: CrmTask[];
  activities: CrmActivity[];
}

export const EMPTY_DB: CrmDatabase = {
  accounts: [],
  contacts: [],
  deals: [],
  tasks: [],
  activities: [],
};

/* ---------------------------------------------------------------------------
 * The sync plan. This is what the rep approves — never a blind write.
 * ------------------------------------------------------------------------- */

export type ChangeKind = "create" | "update" | "unchanged";

export interface FieldDelta {
  field: string;
  before: string;
  after: string;
}

export interface SyncChange {
  /** Stable key so the UI can toggle individual changes. */
  key: string;
  kind: ChangeKind;
  entity: "account" | "contact" | "deal" | "task" | "activity";
  label: string;
  detail: string;
  deltas: FieldDelta[];
}

export interface SyncPlan {
  changes: SyncChange[];
  accountName: string;
}
