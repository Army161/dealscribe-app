import Anthropic from "@anthropic-ai/sdk";
import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod";
import { Extraction, extractionSchema } from "./types";

export class MissingApiKeyError extends Error {
  constructor() {
    super("ANTHROPIC_API_KEY is not set");
    this.name = "MissingApiKeyError";
  }
}

const SYSTEM_PROMPT = `You read sales call transcripts and turn them into CRM records.

Ground every field in the transcript. If something was not said, use null or an
empty array — never a plausible guess. A sparse record a rep can trust beats a
complete one they have to re-check.

Two judgement calls carry most of the value:

Stage is where the deal sits after this call, read from what actually happened,
not from what the seller hoped. A demo that surfaced a blocking objection may
leave the deal in discovery. Pricing sent and under review is proposal;
back-and-forth on terms is negotiation.

Risks are things a manager would want to intervene on: no agreed next step, a
budget that was never confirmed, a competitor already in a paid trial, the only
advocate about to change jobs. Each one needs specific evidence from the call.
No risks found is a real and useful answer — do not manufacture them to fill
the array.

Confidence is your read of whether this closes, from the transcript alone.
Enthusiasm without a budget holder or a date is not a high number.`;

export async function extractFromTranscript(transcript: string): Promise<Extraction> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) throw new MissingApiKeyError();

  const client = new Anthropic({ apiKey });

  const response = await client.messages.parse({
    model: process.env.ANTHROPIC_MODEL || "claude-opus-5",
    max_tokens: 16000,
    system: SYSTEM_PROMPT,
    output_config: {
      format: zodOutputFormat(extractionSchema),
    },
    messages: [
      {
        role: "user",
        content: `Extract the CRM record from this call transcript.\n\n<transcript>\n${transcript}\n</transcript>`,
      },
    ],
  });

  if (response.stop_reason === "refusal") {
    throw new Error("The model declined to process this transcript.");
  }
  if (!response.parsed_output) {
    throw new Error(
      response.stop_reason === "max_tokens"
        ? "Transcript too long — the response was truncated before it finished."
        : "The model did not return a usable record.",
    );
  }

  return response.parsed_output;
}
