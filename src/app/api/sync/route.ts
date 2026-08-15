import { NextResponse } from "next/server";
import { applySync, readDb, writeDb } from "@/lib/crmStore";
import { extractionSchema } from "@/lib/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const { extraction: rawExtraction, accepted } = (body ?? {}) as {
    extraction?: unknown;
    accepted?: unknown;
  };

  const parsed = extractionSchema.safeParse(rawExtraction);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "The record to sync is malformed. Re-run the extraction." },
      { status: 400 },
    );
  }

  if (!Array.isArray(accepted) || accepted.some((k) => typeof k !== "string")) {
    return NextResponse.json(
      { error: "`accepted` must be an array of change keys." },
      { status: 400 },
    );
  }

  if (accepted.length === 0) {
    return NextResponse.json(
      { error: "Nothing selected — approve at least one change to sync." },
      { status: 400 },
    );
  }

  const { db, applied } = applySync(parsed.data, accepted as string[], readDb());

  if (applied === 0) {
    return NextResponse.json(
      {
        error:
          "Nothing was written. The account itself was declined, so there is nowhere to attach the rest.",
      },
      { status: 409 },
    );
  }

  writeDb(db);
  return NextResponse.json({ applied, db });
}
