# DealScribe

Sales reps don't update the CRM. Managers then forecast off stale pipelines and
find out a deal died three weeks after it did.

DealScribe takes a call transcript, extracts the CRM record, shows the rep
exactly what would be written, and writes only what they approve. Nobody fills
in a form.

## Run it

```bash
npm install
npm run dev
```

Open http://localhost:3000.

It runs without an API key: the three bundled sample calls serve pre-computed
records so the whole flow is exercisable. To process your own transcripts, add
a key:

```bash
cp .env.example .env.local   # then set ANTHROPIC_API_KEY
```

## The flow

1. **Pick or paste a transcript.** Left column.
2. **Extract.** One model call returns a structured record — summary, people
   and their buying roles, deal stage/amount/close date, next steps with owners,
   and risks with the evidence from the call that supports them.
3. **Review.** Every proposed CRM write is listed as a create or an update, with
   field-level before → after diffs. Uncheck anything you disagree with.
4. **Sync.** Only the approved changes are written.

Try **Northwind — Discovery** first, then **Northwind — Pricing review**. The
second call updates the record the first one created:

```
[update] Deal    Northwind Logistics — New Business
                 stage:      discovery → proposal
                 amount:     —         → $96,000
                 confidence: 45%       → 75%
[update] Contact Sofia
                 name:       Sofia     → Sofia Marchetti
```

That last one matters: the discovery call only caught a first name ("bring in
Sofia, our CFO"), the pricing call got the full one. Naive matching files those
as two people, and duplicate contacts are the fastest way to lose a rep's trust
in an automation like this.

## What's real and what's a stand-in

**Real:** the extraction, the schema and its validation, the sync planner and
its diffing, the approve-before-write flow, and the entity matching.

**Stand-in:** the CRM itself is a JSON file at `.data/crm.json`. Everything above
it works against the `CrmDatabase` type rather than the file, so replacing
`src/lib/crmStore.ts` with a HubSpot or Salesforce client is the only change
needed to make it write for real.

## Layout

```
src/
  lib/
    types.ts       Extraction schema (zod → structured outputs) + CRM types
    extract.ts     The model call
    crmStore.ts    Store, entity matching, planSync / applySync
    demoData.ts    Three sample calls + pre-computed records
  app/
    page.tsx       Workbench
    crm/page.tsx   The resulting records
    api/           extract · sync · crm
```

`planSync` and `applySync` walk the same matching rules in the same order, so
what the rep approves is what gets written.

## Notes

- Extraction is grounded: fields not discussed come back `null` or empty rather
  than guessed. "No risks found" is a valid answer and the prompt says so — a
  sparse record a rep trusts beats a complete one they re-check.
- Declining the account change declines everything downstream, since there's
  nowhere to attach contacts or a deal. The API returns 409 rather than writing
  a partial graph.
- Writes are atomic (write-then-rename), so a crash can't truncate the store.
