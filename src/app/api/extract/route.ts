import { NextResponse } from "next/server";
import { extractFromTranscript } from "@/lib/extract";
import { findSample } from "@/lib/demoData";
import { planSync, readDb } from "@/lib/crmStore";
import type { Extraction } from "@/lib/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  let body: { transcript?: string; sampleId?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const sample = body.sampleId ? findSample(body.sampleId) : undefined;
  const transcript = (sample?.transcript ?? body.transcript ?? "").trim();

  if (!transcript) {
    return NextResponse.json(
      { error: "Paste a transcript or pick one of the sample calls." },
      { status: 400 },
    );
  }

  const hasKey = Boolean(process.env.ANTHROPIC_API_KEY);
  let extraction: Extraction;
  let demoMode = false;

  if (hasKey) {
    try {
      extraction = await extractFromTranscript(transcript);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Extraction failed unexpectedly.";
      return NextResponse.json({ error: message }, { status: 502 });
    }
  } else if (sample) {
    // No key, but a bundled call — serve the pre-computed record so the rest of
    // the flow is still exercisable.
    extraction = sample.extraction;
    demoMode = true;
  } else {
    return NextResponse.json(
      {
        error:
          "No ANTHROPIC_API_KEY set, so custom transcripts can't be processed. Pick a sample call to try the flow, or add a key to .env.local.",
      },
      { status: 400 },
    );
  }

  const plan = planSync(extraction, readDb());
  return NextResponse.json({ extraction, plan, demoMode });
}

export function GET() {
  return NextResponse.json({
    configured: Boolean(process.env.ANTHROPIC_API_KEY),
    model: process.env.ANTHROPIC_MODEL || "claude-opus-5",
  });
}

// Explicitly reject the verbs the App Router would otherwise 405 anonymously.
export const PUT = () =>
  NextResponse.json({ error: "Method not allowed." }, { status: 405 });
