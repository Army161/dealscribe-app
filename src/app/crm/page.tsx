"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import type { CrmDatabase } from "@/lib/types";
import {
  Badge,
  Card,
  Empty,
  Field,
  Spinner,
  formatMoney,
  titleCase,
  toneFor,
} from "@/components/Ui";

export default function CrmPage() {
  const [db, setDb] = useState<CrmDatabase | null>(null);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    const res = await fetch("/api/crm");
    const data = await res.json();
    setDb(data.db as CrmDatabase);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function reset() {
    setBusy(true);
    try {
      const res = await fetch("/api/crm", { method: "DELETE" });
      const data = await res.json();
      setDb(data.db as CrmDatabase);
    } finally {
      setBusy(false);
    }
  }

  if (!db) {
    return (
      <div className="flex items-center justify-center gap-3 py-24 text-sm text-ink-600">
        <Spinner />
        Loading CRM…
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end gap-4">
        <div>
          <h1 className="text-xl font-semibold tracking-tight">CRM</h1>
          <p className="mt-1 text-sm text-ink-600">
            Everything here was written from a call transcript. Nobody filled in
            a form.
          </p>
        </div>
        <button
          type="button"
          onClick={reset}
          disabled={busy || db.accounts.length === 0}
          className="btn-secondary ml-auto"
        >
          {busy && <Spinner />}
          Reset CRM
        </button>
      </div>

      {db.accounts.length === 0 ? (
        <Card>
          <div className="px-6 py-16 text-center">
            <p className="text-sm font-medium text-ink-700">No records yet</p>
            <p className="mt-1 text-sm text-ink-500">
              Extract a call and approve the changes to populate this.
            </p>
            <Link href="/" className="btn-primary mt-4">
              Go to workbench
            </Link>
          </div>
        </Card>
      ) : (
        <div className="space-y-6">
          {db.accounts.map((account) => {
            const deals = db.deals.filter((d) => d.accountId === account.id);
            const contacts = db.contacts.filter(
              (c) => c.accountId === account.id,
            );
            const tasks = db.tasks.filter((t) => t.accountId === account.id);
            const activities = db.activities
              .filter((a) => a.accountId === account.id)
              .slice()
              .reverse();

            return (
              <Card
                key={account.id}
                title={account.name}
                action={
                  <span className="text-xs text-ink-500">
                    {account.domain ?? "no domain"}
                  </span>
                }
              >
                <div className="space-y-5 p-4">
                  {deals.map((deal) => (
                    <div
                      key={deal.id}
                      className="grid grid-cols-2 gap-4 rounded-md bg-ink-50 p-3 sm:grid-cols-4"
                    >
                      <Field label="Deal" value={deal.name} />
                      <Field label="Stage" value={titleCase(deal.stage)} />
                      <Field
                        label="Amount"
                        mono
                        value={formatMoney(deal.amount, deal.currency)}
                      />
                      <Field
                        label="Close / confidence"
                        mono
                        value={`${deal.closeDate ?? "—"} · ${deal.confidence}%`}
                      />
                    </div>
                  ))}

                  <div className="grid gap-5 md:grid-cols-2">
                    <div>
                      <div className="label mb-2">
                        Contacts ({contacts.length})
                      </div>
                      {contacts.length === 0 ? (
                        <p className="text-sm text-ink-500">None</p>
                      ) : (
                        <ul className="space-y-1.5">
                          {contacts.map((c) => (
                            <li key={c.id} className="text-sm">
                              <span className="font-medium">{c.name}</span>
                              <span className="text-ink-500">
                                {" "}
                                — {c.title ?? "no title"}
                              </span>{" "}
                              <Badge
                                tone={
                                  c.role === "economic_buyer"
                                    ? "blue"
                                    : "neutral"
                                }
                              >
                                {titleCase(c.role)}
                              </Badge>
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>

                    <div>
                      <div className="label mb-2">
                        Open tasks ({tasks.filter((t) => t.status === "open").length})
                      </div>
                      {tasks.length === 0 ? (
                        <p className="text-sm text-ink-500">None</p>
                      ) : (
                        <ul className="space-y-1.5">
                          {tasks.map((t) => (
                            <li key={t.id} className="flex items-start gap-2 text-sm">
                              <Badge tone={t.owner === "us" ? "blue" : "neutral"}>
                                {t.owner}
                              </Badge>
                              <span>
                                {t.description}
                                {t.dueDate && (
                                  <span className="tnum text-ink-500">
                                    {" "}
                                    · {t.dueDate}
                                  </span>
                                )}
                              </span>
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  </div>

                  {activities.length > 0 && (
                    <div className="border-t border-ink-200 pt-4">
                      <div className="label mb-2">
                        Activity ({activities.length})
                      </div>
                      <ul className="space-y-3">
                        {activities.map((a) => (
                          <li key={a.id} className="text-sm">
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="font-medium">{a.subject}</span>
                              <Badge tone={toneFor(a.sentiment)}>
                                {a.sentiment}
                              </Badge>
                              <span className="tnum text-xs text-ink-500">
                                {new Date(a.loggedAt).toLocaleString()}
                              </span>
                            </div>
                            <p className="mt-1 text-ink-600">{a.summary}</p>
                            {a.risks.length > 0 && (
                              <ul className="mt-1.5 space-y-1">
                                {a.risks.map((r, i) => (
                                  <li
                                    key={i}
                                    className="flex items-start gap-2 text-xs text-ink-600"
                                  >
                                    <Badge tone={toneFor(r.severity)}>
                                      {titleCase(r.type)}
                                    </Badge>
                                    <span>{r.evidence}</span>
                                  </li>
                                ))}
                              </ul>
                            )}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {db.accounts.length > 0 && (
        <Empty>
          Stored in <code>.data/crm.json</code> — swap{" "}
          <code>src/lib/crmStore.ts</code> for a HubSpot or Salesforce client and
          the rest of the app is unchanged.
        </Empty>
      )}
    </div>
  );
}
