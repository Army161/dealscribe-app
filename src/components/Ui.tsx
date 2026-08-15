import React from "react";

export function Card({
  title,
  action,
  children,
  className = "",
}: {
  title?: string;
  action?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section className={`card ${className}`}>
      {title && (
        <header className="flex items-center gap-3 border-b border-ink-200 px-4 py-2.5">
          <h2 className="text-sm font-semibold">{title}</h2>
          {action && <div className="ml-auto">{action}</div>}
        </header>
      )}
      {children}
    </section>
  );
}

const TONES = {
  neutral: "bg-ink-100 text-ink-700 border-ink-200",
  green: "bg-emerald-50 text-emerald-800 border-emerald-200",
  amber: "bg-amber-50 text-amber-800 border-amber-200",
  red: "bg-rose-50 text-rose-800 border-rose-200",
  blue: "bg-sky-50 text-sky-800 border-sky-200",
} as const;

export type Tone = keyof typeof TONES;

export function Badge({
  tone = "neutral",
  children,
}: {
  tone?: Tone;
  children: React.ReactNode;
}) {
  return (
    <span
      className={`inline-flex items-center rounded border px-1.5 py-0.5 text-[11px] font-medium ${TONES[tone]}`}
    >
      {children}
    </span>
  );
}

export function Field({
  label,
  value,
  mono = false,
}: {
  label: string;
  value: React.ReactNode;
  mono?: boolean;
}) {
  return (
    <div>
      <div className="label">{label}</div>
      <div className={`mt-0.5 text-sm ${mono ? "tnum" : ""}`}>{value}</div>
    </div>
  );
}

export function Empty({ children }: { children: React.ReactNode }) {
  return (
    <p className="px-4 py-6 text-center text-sm text-ink-500">{children}</p>
  );
}

export function Spinner() {
  return (
    <span
      aria-hidden
      className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-current border-t-transparent"
    />
  );
}

/** Severity and sentiment share a scale, so they share a mapping. */
export function toneFor(value: string): Tone {
  switch (value) {
    case "high":
    case "negative":
      return "red";
    case "medium":
    case "neutral":
      return "amber";
    case "low":
    case "positive":
      return "green";
    default:
      return "neutral";
  }
}

export const titleCase = (s: string) => s.replace(/_/g, " ");

export function formatMoney(amount: number | null, currency: string) {
  if (amount === null) return "—";
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(amount);
}
