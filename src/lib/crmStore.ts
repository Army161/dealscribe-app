import fs from "node:fs";
import path from "node:path";
import {
  CrmDatabase,
  EMPTY_DB,
  Extraction,
  SyncChange,
  SyncPlan,
  FieldDelta,
} from "./types";

/* A JSON file standing in for the CRM. Swapping this module for a HubSpot or
 * Salesforce client is the only change needed to make the demo write for real —
 * everything above it works against `CrmDatabase`, not the file. */

const DATA_DIR = path.join(process.cwd(), ".data");
const DB_PATH = path.join(DATA_DIR, "crm.json");

export function readDb(): CrmDatabase {
  try {
    const raw = fs.readFileSync(DB_PATH, "utf8");
    const parsed = JSON.parse(raw) as Partial<CrmDatabase>;
    return { ...EMPTY_DB, ...parsed };
  } catch {
    return { ...EMPTY_DB };
  }
}

export function writeDb(db: CrmDatabase): void {
  fs.mkdirSync(DATA_DIR, { recursive: true });
  // Write-then-rename so a crash mid-write can't leave a truncated file.
  const tmp = `${DB_PATH}.tmp`;
  fs.writeFileSync(tmp, JSON.stringify(db, null, 2), "utf8");
  fs.renameSync(tmp, DB_PATH);
}

export function resetDb(): CrmDatabase {
  const fresh = { ...EMPTY_DB };
  writeDb(fresh);
  return fresh;
}

/* -------------------------------------------------------------------------- */

const slug = (s: string) =>
  s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

const nameTokens = (s: string) =>
  s
    .toLowerCase()
    .replace(/[^a-z\s]/g, "")
    .split(/\s+/)
    .filter(Boolean);

/**
 * Whether two spoken names refer to the same person.
 *
 * A first call often only gets a first name ("bring in Sofia, our CFO"); the
 * next call gets the full one. Slug equality would file those as two contacts,
 * and duplicate people are the fastest way to lose a rep's trust in this. So a
 * shorter name matches a longer one when the first name agrees and every token
 * it does have appears in the other.
 */
function sameParticipant(a: string, b: string): boolean {
  const ta = nameTokens(a);
  const tb = nameTokens(b);
  if (ta.length === 0 || tb.length === 0) return false;
  if (ta.join(" ") === tb.join(" ")) return true;
  if (ta[0] !== tb[0]) return false;
  const [short, long] = ta.length <= tb.length ? [ta, tb] : [tb, ta];
  return short.every((t) => long.includes(t));
}

/** Prefer whichever version of the name carries more information. */
const fullerName = (existing: string, incoming: string) =>
  nameTokens(incoming).length > nameTokens(existing).length ? incoming : existing;

const money = (amount: number | null, currency: string) =>
  amount === null
    ? "—"
    : new Intl.NumberFormat("en-US", {
        style: "currency",
        currency,
        maximumFractionDigits: 0,
      }).format(amount);

const show = (v: string | number | null) =>
  v === null || v === "" ? "—" : String(v);

function delta(field: string, before: string, after: string): FieldDelta | null {
  return before === after ? null : { field, before, after };
}

/* -------------------------------------------------------------------------- */

/**
 * Work out what this extraction would do to the CRM, without touching it.
 *
 * `planSync` and `applySync` walk the same matching rules in the same order, so
 * what the rep approves is what gets written.
 */
export function planSync(extraction: Extraction, db: CrmDatabase): SyncPlan {
  const changes: SyncChange[] = [];
  const accountKey = slug(extraction.accountName);

  const account = db.accounts.find((a) => slug(a.name) === accountKey);

  if (!account) {
    changes.push({
      key: "account",
      kind: "create",
      entity: "account",
      label: extraction.accountName,
      detail: "New account",
      deltas: [],
    });
  } else {
    const d = delta("domain", show(account.domain), show(extraction.accountDomain));
    changes.push({
      key: "account",
      kind: d ? "update" : "unchanged",
      entity: "account",
      label: extraction.accountName,
      detail: d ? "Fill in missing domain" : "Already up to date",
      deltas: d && !account.domain ? [d] : [],
    });
  }

  for (const contact of extraction.contacts) {
    const existing = account
      ? db.contacts.find(
          (c) => c.accountId === account.id && sameParticipant(c.name, contact.name),
        )
      : undefined;

    if (!existing) {
      changes.push({
        key: `contact:${slug(contact.name)}`,
        kind: "create",
        entity: "contact",
        label: contact.name,
        detail: [contact.title, contact.role.replace(/_/g, " ")]
          .filter(Boolean)
          .join(" · "),
        deltas: [],
      });
      continue;
    }

    const deltas = [
      delta("name", existing.name, fullerName(existing.name, contact.name)),
      delta("title", show(existing.title), show(contact.title)),
      delta("email", show(existing.email), show(contact.email)),
      delta("role", existing.role.replace(/_/g, " "), contact.role.replace(/_/g, " ")),
    ].filter((d): d is FieldDelta => d !== null);

    changes.push({
      key: `contact:${slug(contact.name)}`,
      kind: deltas.length ? "update" : "unchanged",
      entity: "contact",
      // Show who this actually matches in the CRM, not just what was said.
      label: existing.name,
      detail: deltas.length ? "Field changes" : "Already up to date",
      deltas,
    });
  }

  const dealName = `${extraction.accountName} — New Business`;
  const existingDeal = account
    ? db.deals.find((d) => d.accountId === account.id)
    : undefined;

  if (!existingDeal) {
    changes.push({
      key: "deal",
      kind: "create",
      entity: "deal",
      label: dealName,
      detail: `${extraction.deal.stage.replace(/_/g, " ")} · ${money(
        extraction.deal.amount,
        extraction.deal.currency,
      )}`,
      deltas: [],
    });
  } else {
    const deltas = [
      delta("stage", existingDeal.stage.replace(/_/g, " "), extraction.deal.stage.replace(/_/g, " ")),
      delta(
        "amount",
        money(existingDeal.amount, existingDeal.currency),
        money(extraction.deal.amount, extraction.deal.currency),
      ),
      delta("close date", show(existingDeal.closeDate), show(extraction.deal.closeDate)),
      delta("confidence", `${existingDeal.confidence}%`, `${extraction.deal.confidence}%`),
    ].filter((d): d is FieldDelta => d !== null);

    changes.push({
      key: "deal",
      kind: deltas.length ? "update" : "unchanged",
      entity: "deal",
      label: existingDeal.name,
      detail: deltas.length ? "Field changes" : "Already up to date",
      deltas,
    });
  }

  extraction.nextSteps.forEach((step, i) => {
    changes.push({
      key: `task:${i}`,
      kind: "create",
      entity: "task",
      label: step.description,
      detail: `${step.owner === "us" ? "Our action" : "Their action"}${
        step.dueDate ? ` · due ${step.dueDate}` : ""
      }`,
      deltas: [],
    });
  });

  changes.push({
    key: "activity",
    kind: "create",
    entity: "activity",
    label: "Log call activity",
    detail: `${extraction.sentiment} sentiment · ${extraction.risks.length} risk${
      extraction.risks.length === 1 ? "" : "s"
    } flagged`,
    deltas: [],
  });

  return { changes, accountName: extraction.accountName };
}

/**
 * Apply the extraction, honouring the set of change keys the rep approved.
 * Anything not in `accepted` is skipped.
 */
export function applySync(
  extraction: Extraction,
  accepted: string[],
  db: CrmDatabase,
): { db: CrmDatabase; applied: number } {
  const ok = new Set(accepted);
  const now = new Date().toISOString();
  const accountKey = slug(extraction.accountName);
  let applied = 0;

  let account = db.accounts.find((a) => slug(a.name) === accountKey);

  if (!account) {
    if (!ok.has("account")) {
      // Nothing else can be attached without the account, so stop here.
      return { db, applied: 0 };
    }
    account = {
      id: `acc_${accountKey}`,
      name: extraction.accountName,
      domain: extraction.accountDomain,
      createdAt: now,
    };
    db.accounts.push(account);
    applied++;
  } else if (ok.has("account") && !account.domain && extraction.accountDomain) {
    account.domain = extraction.accountDomain;
    applied++;
  }

  for (const contact of extraction.contacts) {
    const key = `contact:${slug(contact.name)}`;
    if (!ok.has(key)) continue;

    const existing = db.contacts.find(
      (c) => c.accountId === account.id && sameParticipant(c.name, contact.name),
    );

    if (existing) {
      existing.name = fullerName(existing.name, contact.name);
      existing.title = contact.title ?? existing.title;
      existing.email = contact.email ?? existing.email;
      existing.role = contact.role;
    } else {
      db.contacts.push({
        id: `con_${accountKey}_${slug(contact.name)}`,
        accountId: account.id,
        name: contact.name,
        title: contact.title,
        email: contact.email,
        role: contact.role,
      });
    }
    applied++;
  }

  let deal = db.deals.find((d) => d.accountId === account.id);
  if (ok.has("deal")) {
    if (deal) {
      deal.stage = extraction.deal.stage;
      deal.amount = extraction.deal.amount ?? deal.amount;
      deal.currency = extraction.deal.currency;
      deal.closeDate = extraction.deal.closeDate ?? deal.closeDate;
      deal.confidence = extraction.deal.confidence;
      deal.updatedAt = now;
    } else {
      deal = {
        id: `deal_${accountKey}`,
        accountId: account.id,
        name: `${extraction.accountName} — New Business`,
        stage: extraction.deal.stage,
        amount: extraction.deal.amount,
        currency: extraction.deal.currency,
        closeDate: extraction.deal.closeDate,
        confidence: extraction.deal.confidence,
        updatedAt: now,
      };
      db.deals.push(deal);
    }
    applied++;
  }

  // Tasks and the activity log both hang off a deal; if there isn't one yet
  // (rep declined it) there's nothing coherent to attach them to.
  const dealId = deal?.id ?? "";

  extraction.nextSteps.forEach((step, i) => {
    if (!ok.has(`task:${i}`) || !dealId) return;
    db.tasks.push({
      id: `task_${accountKey}_${Date.now()}_${i}`,
      accountId: account.id,
      dealId,
      description: step.description,
      owner: step.owner,
      dueDate: step.dueDate,
      status: "open",
    });
    applied++;
  });

  if (ok.has("activity") && dealId) {
    db.activities.push({
      id: `act_${accountKey}_${Date.now()}`,
      accountId: account.id,
      dealId,
      subject: `Call — ${extraction.accountName}`,
      summary: extraction.summary,
      sentiment: extraction.sentiment,
      risks: extraction.risks,
      competitors: extraction.competitors,
      loggedAt: now,
    });
    applied++;
  }

  return { db, applied };
}
