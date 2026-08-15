import { Extraction } from "./types";

export interface SampleCall {
  id: string;
  title: string;
  blurb: string;
  transcript: string;
  /** Pre-computed so the demo runs end-to-end with no API key. */
  extraction: Extraction;
}

/* Sample 1 and 2 are the same account, in order. Sync the discovery call, then
 * run the pricing call: the review screen fills with updates instead of
 * creates, which is the part of this that's actually hard. */

export const SAMPLE_CALLS: SampleCall[] = [
  {
    id: "northwind-discovery",
    title: "Northwind Logistics — Discovery",
    blurb: "First call. Real pain, no budget holder in the room yet.",
    transcript: `[Discovery call — 34 min]

Dana Whitfield (AE): Thanks for making time. Before I show you anything — what made you take this call?

Marcus Bell (VP Operations, Northwind Logistics): Our dispatch board is three spreadsheets and a Slack channel. We moved 40,000 loads last year and I genuinely could not tell you our on-time rate without someone spending a day on it.

Dana: What happens when it goes wrong?

Marcus: We eat it. Last quarter we paid about 180 grand in late-delivery penalties. That's the number that got my CFO's attention.

Dana: Is anyone owning that internally right now?

Marcus: Priya's team built a dashboard that helps, but it's held together with tape.

Priya Raghavan (Director of Data Eng): It's a nightly batch. By the time anyone looks at it the load's already late. I've been asking for a real-time feed for two years.

Dana: If you had that feed, what changes?

Priya: We could route around a delay instead of writing it up afterwards.

Marcus: That's the whole thing. We're reactive. I want to be predictive.

Dana: What's the timeline you're working against?

Marcus: Our peak is November. If we're not live before then it's another year of penalties.

Dana: And on budget — is there a number attached to this?

Marcus: There will be. I'd have to bring in Sofia, our CFO. She hasn't been part of this yet.

Dana: Makes sense. What would she need to see?

Marcus: Payback inside a year. If it costs a hundred and saves one-eighty, that's an easy conversation.

Dana: Let me get you a technical walkthrough with Priya's team, and let's plan to bring Sofia in after that.

Priya: Send me API docs beforehand. I want to check it against our TMS before we spend anyone's time.

Dana: I'll have those over tomorrow. Can we hold Thursday the 20th for the deep dive?

Marcus: Thursday works.`,
    extraction: {
      summary:
        "Northwind is losing roughly $180k a quarter to late-delivery penalties and runs dispatch off spreadsheets plus a nightly batch dashboard. Strong operational pain and a hard November peak-season deadline. No budget confirmed and the CFO has not been involved yet.",
      accountName: "Northwind Logistics",
      accountDomain: null,
      sentiment: "positive",
      contacts: [
        {
          name: "Marcus Bell",
          title: "VP Operations",
          email: null,
          role: "champion",
        },
        {
          name: "Priya Raghavan",
          title: "Director of Data Engineering",
          email: null,
          role: "technical_evaluator",
        },
        {
          name: "Sofia",
          title: "CFO",
          email: null,
          role: "economic_buyer",
        },
      ],
      deal: {
        stage: "discovery",
        amount: null,
        currency: "USD",
        closeDate: "2026-10-31",
        confidence: 45,
      },
      nextSteps: [
        { description: "Send API documentation to Priya", owner: "us", dueDate: "2026-08-11" },
        {
          description: "Run technical deep dive with Priya's team",
          owner: "us",
          dueDate: "2026-08-20",
        },
        {
          description: "Review API docs against the existing TMS",
          owner: "them",
          dueDate: null,
        },
      ],
      risks: [
        {
          type: "authority",
          severity: "high",
          evidence:
            'Marcus: "I\'d have to bring in Sofia, our CFO. She hasn\'t been part of this yet." No economic buyer has been engaged.',
        },
        {
          type: "budget",
          severity: "medium",
          evidence:
            'No budget exists yet — Marcus said only "There will be" when asked about a number.',
        },
        {
          type: "timeline",
          severity: "medium",
          evidence:
            'Must be live before the November peak or the deal slips a full year: "another year of penalties."',
        },
      ],
      competitors: [],
      notableQuotes: [
        {
          speaker: "Marcus Bell",
          quote:
            "Last quarter we paid about 180 grand in late-delivery penalties. That's the number that got my CFO's attention.",
        },
        { speaker: "Marcus Bell", quote: "We're reactive. I want to be predictive." },
      ],
    },
  },

  {
    id: "northwind-pricing",
    title: "Northwind Logistics — Pricing review",
    blurb: "Follow-up with the CFO. Sync the discovery call first to see the diff.",
    transcript: `[Pricing review — 28 min]

Dana Whitfield (AE): Sofia, thanks for joining. Marcus tells me you've seen the penalty numbers.

Sofia Marchetti (CFO, Northwind Logistics): I've seen them for six quarters. What I haven't seen is a fix that pays for itself.

Dana: Then let's start there. Based on the deep dive with Priya, we scoped this at 96,000 a year — that's the platform plus the TMS connector.

Sofia: Against 180 a quarter in penalties.

Priya Raghavan (Director of Data Eng): We won't recover all of it. The integration tested clean, but realistically we're looking at cutting late loads by half in the first year.

Sofia: Half is 360 a year against a 96 cost. That works. What's the catch?

Dana: The honest catch is implementation. You need Priya's team for about three weeks in September.

Priya: I can carve that out. It's the same team that would've built it anyway.

Marcus Bell (VP Operations): And we're not starting from scratch — the connector already talks to our TMS.

Sofia: I'll want it through procurement. Our threshold for a new vendor is a security review and two references. That's usually four weeks.

Dana: We can start the security packet this week. On references, I've got two logistics customers of similar size.

Sofia: Send them. If the review is clean I'm comfortable signing before the end of October.

Dana: Anything that would stop this?

Sofia: We're also mid-evaluation with Freightline on the routing piece. Different scope, but the same budget line.

Marcus: They don't do the real-time feed. That's the whole reason we're here.

Sofia: Agreed, but I have to be able to say I looked.

Dana: Understood. I'll have the security packet and references over by Friday.`,
    extraction: {
      summary:
        "CFO Sofia Marchetti engaged and accepted the ROI case: $96k annual cost against an expected halving of $180k-per-quarter penalties. Deal moves to proposal pending a four-week procurement cycle covering security review and two references. Freightline is competing for the same budget line on a narrower scope.",
      accountName: "Northwind Logistics",
      accountDomain: null,
      sentiment: "positive",
      contacts: [
        {
          name: "Sofia Marchetti",
          title: "CFO",
          email: null,
          role: "economic_buyer",
        },
        {
          name: "Marcus Bell",
          title: "VP Operations",
          email: null,
          role: "champion",
        },
        {
          name: "Priya Raghavan",
          title: "Director of Data Engineering",
          email: null,
          role: "technical_evaluator",
        },
      ],
      deal: {
        stage: "proposal",
        amount: 96000,
        currency: "USD",
        closeDate: "2026-10-31",
        confidence: 75,
      },
      nextSteps: [
        {
          description: "Send security review packet to procurement",
          owner: "us",
          dueDate: "2026-08-14",
        },
        {
          description: "Provide two reference customers of similar size",
          owner: "us",
          dueDate: "2026-08-14",
        },
        {
          description: "Reserve three weeks of data engineering time in September",
          owner: "them",
          dueDate: null,
        },
      ],
      risks: [
        {
          type: "competition",
          severity: "medium",
          evidence:
            'Sofia: "We\'re also mid-evaluation with Freightline on the routing piece. Different scope, but the same budget line."',
        },
        {
          type: "timeline",
          severity: "medium",
          evidence:
            "Procurement takes about four weeks (security review plus two references) against a hard pre-November go-live.",
        },
      ],
      competitors: ["Freightline"],
      notableQuotes: [
        {
          speaker: "Sofia Marchetti",
          quote:
            "Half is 360 a year against a 96 cost. That works. What's the catch?",
        },
        {
          speaker: "Sofia Marchetti",
          quote: "If the review is clean I'm comfortable signing before the end of October.",
        },
      ],
    },
  },

  {
    id: "vertex-health",
    title: "Vertex Health — Renewal at risk",
    blurb: "Champion is leaving and a competitor is already in a paid trial.",
    transcript: `[Check-in — 22 min]

Tom Iverson (CSM): I wanted to get ahead of the renewal — it's up in October.

Rachel Okonjo (Director of Clinical Ops, Vertex Health): I should tell you upfront, I'm moving to a different org in six weeks. Internal transfer.

Tom: Congratulations. Who picks this up?

Rachel: Probably Devin, but honestly it hasn't been decided. That's part of why I'm being careful about what I commit to.

Tom: Understood. How has the platform been for the team?

Rachel: The scheduling module is genuinely good. Nobody wants to give that up. The reporting side is where we've struggled — we're exporting to Excel every week, which defeats the point.

Tom: How long has that been the workaround?

Rachel: Since we onboarded. It came up in the QBR twice.

Tom: That's on us. Is that driving the Medisys conversation?

Rachel: You've heard about that. Yes — they're doing a paid pilot with two of our units. Their reporting is stronger out of the box.

Tom: What's the scope of that pilot?

Rachel: Sixty days, started three weeks ago. If it goes well, procurement will want a bake-off at renewal.

Tom: What would make you comfortable renewing without a bake-off?

Rachel: I don't think I can answer that anymore. Devin will own it, and I don't want to hand him a decision I made on my way out.

Tom: Fair. Can I get thirty minutes with Devin before you transfer?

Rachel: I'll ask. No promises — he's inheriting a lot.

Tom: I'll also put together what the reporting roadmap actually looks like, with dates.

Rachel: That would help whoever ends up owning it.`,
    extraction: {
      summary:
        "October renewal is at serious risk. Champion Rachel Okonjo transfers out in six weeks with no confirmed successor, and Medisys is three weeks into a paid 60-day pilot in two units. Long-standing reporting gaps forced an Excel workaround since onboarding and were raised twice in QBRs without resolution.",
      accountName: "Vertex Health",
      accountDomain: null,
      sentiment: "negative",
      contacts: [
        {
          name: "Rachel Okonjo",
          title: "Director of Clinical Operations",
          email: null,
          role: "champion",
        },
        {
          name: "Devin",
          title: null,
          email: null,
          role: "unknown",
        },
      ],
      deal: {
        stage: "evaluation",
        amount: null,
        currency: "USD",
        closeDate: "2026-10-31",
        confidence: 30,
      },
      nextSteps: [
        {
          description: "Build reporting roadmap with committed dates",
          owner: "us",
          dueDate: null,
        },
        {
          description: "Request 30 minutes with Devin before Rachel transfers",
          owner: "us",
          dueDate: null,
        },
        {
          description: "Ask Devin whether he will take the intro call",
          owner: "them",
          dueDate: null,
        },
      ],
      risks: [
        {
          type: "champion_departure",
          severity: "high",
          evidence:
            'Rachel: "I\'m moving to a different org in six weeks." Successor is unconfirmed — "Probably Devin, but honestly it hasn\'t been decided."',
        },
        {
          type: "competition",
          severity: "high",
          evidence:
            "Medisys is 3 weeks into a paid 60-day pilot across two units, with stronger out-of-the-box reporting. A bake-off at renewal is likely.",
        },
        {
          type: "technical",
          severity: "medium",
          evidence:
            'Reporting gap has forced a weekly Excel export since onboarding and was raised in two QBRs without a fix.',
        },
        {
          type: "authority",
          severity: "high",
          evidence:
            'Rachel will not commit: "I don\'t want to hand him a decision I made on my way out."',
        },
      ],
      competitors: ["Medisys"],
      notableQuotes: [
        {
          speaker: "Rachel Okonjo",
          quote:
            "The scheduling module is genuinely good. Nobody wants to give that up. The reporting side is where we've struggled.",
        },
        {
          speaker: "Rachel Okonjo",
          quote: "I don't want to hand him a decision I made on my way out.",
        },
      ],
    },
  },
];

export function findSample(id: string): SampleCall | undefined {
  return SAMPLE_CALLS.find((s) => s.id === id);
}
