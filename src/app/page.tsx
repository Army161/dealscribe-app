"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { SAMPLE_CALLS } from "@/lib/demoData";
import type { Extraction, SyncPlan } from "@/lib/types";
import { ExtractionView } from "@/components/ExtractionView";
import { SyncPlanView } from "@/components/SyncPlanView";
import { Card, Spinner } from "@/components/Ui";

interface ExtractResponse {
  extraction: Extraction;
  plan: SyncPlan;
  demoMode: boolean;
}

export default function Workbench() {
  const [transcript, setTranscript] = useState("");
  const [sampleId, setSampleId] = useState<string | null>(null);

  const [configured, setConfigured] = useState<boolean | null>(null);
  const [model, setModel] = useState("");

  const [extracting, setExtracting] = useState(false);
  const [result, setResult] = useState<ExtractResponse | null>(null);
  const [accepted, setAccepted] = useState<Set<string>>(new Set());
  const [error, setError] = useState<string | null>(null);

  const [syncing, setSyncing] = useState(false);
  const [synced, setSynced] = useState<number | null>(null);

  // Tells us whether custom transcripts are usable, so the UI can say so
  // up front rather than failing at submit time.
  useEffect(() => {
    fetch("/api/extract")
      .then((r) => r.json())
      .then((d: { configured: boolean; model: string }) => {
        setConfigured(d.configured);
        setModel(d.model);
      })
      .catch(() => setConfigured(false));
  }, []);

  const pickSample = useCallback((id: string) => {
    const sample = SAMPLE_CALLS.find((s) => s.id === id);
    if (!sample) return;
    setSampleId(id);
    setTranscript(sample.transcript);
    setResult(null);
    setSynced(null);
    setError(null);
  }, []);

  async function runExtract() {
    setExtracting(true);
    setError(null);
    setResult(null);
    setSynced(null);

    try {
      const res = await fetch("/api/extract", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(sampleId ? { sampleId } : { transcript }),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? "Extraction failed.");
        return;
      }

      const payload = data as ExtractResponse;
      setResult(payload);
      // Pre-select everything actionable — the rep unchecks what they disagree
      // with, rather than rebuilding the record by hand.
      setAccepted(
        new Set(
          payload.plan.changes
            .filter((c) => c.kind !== "unchanged")
            .map((c) => c.key),
        ),
      );
    } catch {
      setError("Could not reach the server.");
    } finally {
      setExtracting(false);
    }
  }

  async function runSync() {
    if (!result) return;
    setSyncing(true);
    setError(null);

    try {
      const res = await fetch("/api/sync", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          extraction: result.extraction,
          accepted: [...accepted],
        }),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? "Sync failed.");
        return;
      }
      setSynced(data.applied as number);
    } catch {
      setError("Could not reach the server.");
    } finally {
      setSyncing(false);
    }
  }

  const toggle = (key: string) =>
    setAccepted((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold tracking-tight">
          Turn a call into a CRM record
        </h1>
        <p className="mt-1 text-sm text-ink-600">
          Paste a transcript, review what would be written, then approve it. The
          rep never fills in a form.
        </p>
      </div>

      {configured === false && (
        <div className="rounded-md border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          <strong className="font-semibold">Demo mode.</strong> No{" "}
          <code className="rounded bg-amber-100 px-1">ANTHROPIC_API_KEY</code> is
          set, so the three sample calls serve pre-computed records and custom
          transcripts are disabled. Add a key to{" "}
          <code className="rounded bg-amber-100 px-1">.env.local</code> to run
          extraction live.
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-[minmax(0,420px)_minmax(0,1fr)]">
        {/* ---------------- Input ---------------- */}
        <div className="space-y-4 lg:sticky lg:top-6 lg:self-start">
          <Card title="Call transcript">
            <div className="space-y-3 p-4">
              <div>
                <div className="label mb-2">Sample calls</div>
                <div className="space-y-1.5">
                  {SAMPLE_CALLS.map((s) => (
                    <button
                      key={s.id}
                      type="button"
                      onClick={() => pickSample(s.id)}
                      aria-pressed={sampleId === s.id}
                      className={`block w-full rounded-md border px-3 py-2 text-left transition-colors ${
                        sampleId === s.id
                          ? "border-ink-900 bg-ink-900 text-white"
                          : "border-ink-200 bg-white hover:bg-ink-50"
                      }`}
                    >
                      <span className="block text-sm font-medium">
                        {s.title}
                      </span>
                      <span
                        className={`mt-0.5 block text-xs ${
                          sampleId === s.id ? "text-ink-200" : "text-ink-500"
                        }`}
                      >
                        {s.blurb}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label htmlFor="transcript" className="label">
                  Transcript
                </label>
                <textarea
                  id="transcript"
                  value={transcript}
                  onChange={(e) => {
                    setTranscript(e.target.value);
                    setSampleId(null); // edited — no longer a bundled sample
                  }}
                  rows={14}
                  spellCheck={false}
                  placeholder="Paste a call transcript, or pick a sample above…"
                  className="mt-1 w-full resize-y rounded-md border border-ink-300 bg-white px-3 py-2 font-mono text-xs leading-relaxed placeholder:text-ink-400"
                />
              </div>

              <button
                type="button"
                onClick={runExtract}
                disabled={extracting || transcript.trim().length === 0}
                className="btn-primary w-full"
              >
                {extracting && <Spinner />}
                {extracting ? "Reading the call…" : "Extract CRM record"}
              </button>

              {configured && model && (
                <p className="text-center text-xs text-ink-500">
                  Live extraction via <code>{model}</code>
                </p>
              )}
            </div>
          </Card>
        </div>

        {/* ---------------- Output ---------------- */}
        <div className="space-y-4">
          {error && (
            <div
              role="alert"
              className="rounded-md border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-900"
            >
              {error}
            </div>
          )}

          {synced !== null && (
            <div
              role="status"
              className="flex flex-wrap items-center gap-3 rounded-md border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900"
            >
              <span>
                <strong className="font-semibold">
                  {synced} record{synced === 1 ? "" : "s"} written.
                </strong>{" "}
                The rep typed nothing.
              </span>
              <Link
                href="/crm"
                className="ml-auto font-medium underline underline-offset-2"
              >
                View in CRM →
              </Link>
            </div>
          )}

          {!result && !extracting && (
            <Card>
              <div className="px-6 py-16 text-center">
                <p className="text-sm font-medium text-ink-700">
                  Nothing extracted yet
                </p>
                <p className="mx-auto mt-1 max-w-sm text-sm text-ink-500">
                  Pick a sample call on the left and hit extract. Try Northwind
                  discovery first, then the pricing review — the second one
                  updates the record the first one created.
                </p>
              </div>
            </Card>
          )}

          {extracting && (
            <Card>
              <div className="flex items-center justify-center gap-3 px-6 py-16 text-sm text-ink-600">
                <Spinner />
                Reading the transcript and building the record…
              </div>
            </Card>
          )}

          {result && (
            <>
              {result.demoMode && (
                <p className="text-xs text-ink-500">
                  Pre-computed record (demo mode) — no model call was made.
                </p>
              )}
              <ExtractionView extraction={result.extraction} />
              <SyncPlanView
                plan={result.plan}
                accepted={accepted}
                onToggle={toggle}
                onSync={runSync}
                syncing={syncing}
              />
            </>
          )}
        </div>
      </div>
    </div>
  );
}
