import { NextResponse } from "next/server";
import { readDb, resetDb } from "@/lib/crmStore";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export function GET() {
  return NextResponse.json({ db: readDb() });
}

export function DELETE() {
  return NextResponse.json({ db: resetDb() });
}
