import { Extraction } from "@/lib/types";
import { Badge, Card, Field, formatMoney, titleCase, toneFor } from "./Ui";

export function ExtractionView({ extraction }: { extraction: Extraction }) {
  const { deal } = extraction;

  return (
    <div className="space-y-4">
      <Card
        title="Call summary"
        action={
          <Badge tone={toneFor(extraction.sentiment)}>
            {extraction.sentiment}
          </Badge>
        }
      >
        <div className="space-y-4 p-4">
          <p className="text-sm leading-relaxed text-ink-700">
            {extraction.summary}
          </p>

          <div className="grid grid-cols-2 gap-4 border-t border-ink-200 pt-4 sm:grid-cols-4">
            <Field label="Account" value={extraction.accountName} />
            <Field label="Stage" value={titleCase(deal.stage)} />
            <Field
              label="Amount"
              mono
              value={formatMoney(deal.amount, deal.currency)}
            />
            <Field label="Close date" mono value={deal.closeDate ?? "—"} />
          </div>

          <div>
            <div className="flex items-baseline justify-between">
              <span className="label">Confidence</span>
              <span className="tnum text-sm font-medium">
                {deal.confidence}%
              </span>
            </div>
            <div
              className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-ink-200"
              role="meter"
              aria-valuenow={deal.confidence}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-label="Deal confidence"
            >
              <div
                className={`h-full rounded-full ${
                  deal.confidence >= 65
                    ? "bg-emerald-500"
                    : deal.confidence >= 40
                      ? "bg-amber-500"
                      : "bg-rose-500"
                }`}
                style={{ width: `${Math.min(100, Math.max(0, deal.confidence))}%` }}
              />
            </div>
          </div>
        </div>
      </Card>

      {extraction.risks.length > 0 && (
        <Card title={`Risks (${extraction.risks.length})`}>
          <ul className="divide-y divide-ink-200">
            {extraction.risks.map((risk, i) => (
              <li key={i} className="flex gap-3 px-4 py-3">
                <Badge tone={toneFor(risk.severity)}>{risk.severity}</Badge>
                <div className="min-w-0">
                  <p className="text-sm font-medium">{titleCase(risk.type)}</p>
                  <p className="mt-0.5 text-sm text-ink-600">{risk.evidence}</p>
                </div>
              </li>
            ))}
          </ul>
        </Card>
      )}

      <div className="grid gap-4 md:grid-cols-2">
        <Card title={`People (${extraction.contacts.length})`}>
          <ul className="divide-y divide-ink-200">
            {extraction.contacts.map((c, i) => (
              <li key={i} className="px-4 py-3">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">{c.name}</span>
                  <Badge
                    tone={c.role === "economic_buyer" ? "blue" : "neutral"}
                  >
                    {titleCase(c.role)}
                  </Badge>
                </div>
                <p className="mt-0.5 text-sm text-ink-600">
                  {c.title ?? "Title not stated"}
                  {c.email ? ` · ${c.email}` : ""}
                </p>
              </li>
            ))}
          </ul>
        </Card>

        <Card title={`Next steps (${extraction.nextSteps.length})`}>
          <ul className="divide-y divide-ink-200">
            {extraction.nextSteps.map((s, i) => (
              <li key={i} className="flex items-start gap-3 px-4 py-3">
                <Badge tone={s.owner === "us" ? "blue" : "neutral"}>
                  {s.owner === "us" ? "us" : "them"}
                </Badge>
                <div className="min-w-0">
                  <p className="text-sm">{s.description}</p>
                  {s.dueDate && (
                    <p className="tnum mt-0.5 text-xs text-ink-500">
                      Due {s.dueDate}
                    </p>
                  )}
                </div>
              </li>
            ))}
          </ul>
        </Card>
      </div>

      {(extraction.competitors.length > 0 ||
        extraction.notableQuotes.length > 0) && (
        <Card title="Signals">
          <div className="space-y-4 p-4">
            {extraction.competitors.length > 0 && (
              <div>
                <div className="label">Competitors named</div>
                <div className="mt-1.5 flex flex-wrap gap-1.5">
                  {extraction.competitors.map((c) => (
                    <Badge key={c} tone="amber">
                      {c}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {extraction.notableQuotes.map((q, i) => (
              <blockquote
                key={i}
                className="border-l-2 border-ink-300 pl-3 text-sm text-ink-700"
              >
                <p className="italic">&ldquo;{q.quote}&rdquo;</p>
                <cite className="mt-1 block text-xs not-italic text-ink-500">
                  — {q.speaker}
                </cite>
              </blockquote>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}
