"use client";

import { SyncPlan } from "@/lib/types";
import { Badge, Card, Spinner, Tone } from "./Ui";

const KIND_TONE: Record<string, Tone> = {
  create: "green",
  update: "amber",
  unchanged: "neutral",
};

const ENTITY_LABEL: Record<string, string> = {
  account: "Account",
  contact: "Contact",
  deal: "Deal",
  task: "Task",
  activity: "Activity",
};

export function SyncPlanView({
  plan,
  accepted,
  onToggle,
  onSync,
  syncing,
}: {
  plan: SyncPlan;
  accepted: Set<string>;
  onToggle: (key: string) => void;
  onSync: () => void;
  syncing: boolean;
}) {
  // Nothing to do for records already matching the CRM — show them greyed so
  // the rep can see they were considered, but don't let them be selected.
  const actionable = plan.changes.filter((c) => c.kind !== "unchanged");
  const unchanged = plan.changes.filter((c) => c.kind === "unchanged");
  const selectedCount = actionable.filter((c) => accepted.has(c.key)).length;

  return (
    <Card
      title="Review CRM changes"
      action={
        <span className="tnum text-xs text-ink-500">
          {selectedCount} of {actionable.length} selected
        </span>
      }
    >
      <ul className="divide-y divide-ink-200">
        {actionable.map((change) => {
          const checked = accepted.has(change.key);
          return (
            <li key={change.key}>
              <label className="flex cursor-pointer items-start gap-3 px-4 py-3 hover:bg-ink-50">
                <input
                  type="checkbox"
                  checked={checked}
                  onChange={() => onToggle(change.key)}
                  className="mt-1 h-4 w-4 rounded border-ink-300 accent-ink-900"
                />
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge tone={KIND_TONE[change.kind]}>{change.kind}</Badge>
                    <span className="text-xs text-ink-500">
                      {ENTITY_LABEL[change.entity]}
                    </span>
                    <span className="text-sm font-medium">{change.label}</span>
                  </div>

                  <p className="mt-0.5 text-sm text-ink-600">{change.detail}</p>

                  {change.deltas.length > 0 && (
                    <dl className="mt-2 space-y-1">
                      {change.deltas.map((d) => (
                        <div
                          key={d.field}
                          className="flex flex-wrap items-baseline gap-x-2 text-xs"
                        >
                          <dt className="text-ink-500">{d.field}</dt>
                          <dd className="tnum text-ink-500 line-through">
                            {d.before}
                          </dd>
                          <span aria-hidden className="text-ink-400">
                            →
                          </span>
                          <dd className="tnum font-medium text-ink-900">
                            {d.after}
                          </dd>
                        </div>
                      ))}
                    </dl>
                  )}
                </div>
              </label>
            </li>
          );
        })}

        {unchanged.map((change) => (
          <li
            key={change.key}
            className="flex items-center gap-3 px-4 py-2.5 text-sm text-ink-400"
          >
            <span className="ml-7">
              {ENTITY_LABEL[change.entity]} · {change.label}
            </span>
            <span className="ml-auto text-xs">already up to date</span>
          </li>
        ))}
      </ul>

      <div className="flex items-center gap-3 border-t border-ink-200 px-4 py-3">
        <button
          type="button"
          onClick={onSync}
          disabled={syncing || selectedCount === 0}
          className="btn-primary"
        >
          {syncing && <Spinner />}
          {syncing ? "Writing…" : `Sync ${selectedCount} to CRM`}
        </button>
        <p className="text-xs text-ink-500">
          Nothing is written until you approve it.
        </p>
      </div>
    </Card>
  );
}
