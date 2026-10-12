// ─────────────────────────────────────────────────────────────────────────
// PERSPECTIVES — Case 003 — Flight 702 — authored content for the
// Cold Open -> Act I -> Act II -> D1 -> consequence slice.
//
// C003-AMD-004 (this round): the slice is deterministic, authored
// content — there's no live model behind it. Presenting that as an open
// text box (even with an optional pre-fill suggestion, the previous
// round's amendment) promises conversational freedom the interaction
// doesn't actually support. Every question the player can ask is now an
// explicit, authored choice, directly bound to its response by topic id
// — never routed through keyword matching. This also removes the need
// for an "accusatory phrasing" variant on Hale's injury question (that
// branch only existed to handle free-text tone); the player can now only
// ever select the neutral, authored version.
//
// Every number here is a BASELINE value from the frozen external spec
// (PERSPECTIVES_CASE_003_Flight_702.md), not something invented for this
// build. Where I've proposed an amendment (D1's cost), it's marked
// explicitly and defaults OFF — see D1_VISUAL_CHECK_COST below.
// ─────────────────────────────────────────────────────────────────────────

import type { AgentDef, D4Option, Route } from "./types";

export const PRESSURE_START = 40;
export const EXCHANGE_COST = 2;
export const D1_FORCE_THRESHOLD = 28;
export const D2_FORCE_THRESHOLD = 15;
export const ROUTE_B_FLOOR = 20;
export const RORY_WARNING_THRESHOLD = 25;

/**
 * Baseline (LOCKED SOURCE, per the external canon): 10.
 * C003-AMD-003 (my own proposal, NOT approved): 6 — found while stress-
 * testing a 6-exchange Act II path closing Route B with little warning.
 * Dev-only comparison switch, per BUILD_BRIEF §3: "Permetre comparació de
 * disseny en configuració de desenvolupament, sense control extra visible
 * al jugador" — no player-facing toggle. Change this constant to compare;
 * ships at the approved baseline (10) until Oriol approves the amendment.
 */
export const D1_VISUAL_CHECK_COST = 10;
// export const D1_VISUAL_CHECK_COST = 6; // C003-AMD-003, proposed, not approved

export const HALE: AgentDef = {
  id: "hale",
  name: "Hale",
  role: "Captain, radio only — signal cuts in and out",
  portrait: "/case3/hale.png",
  act1Topics: ["what_happened", "injuries_checklist", "cargo_light"],
  topics: [
    {
      id: "what_happened",
      prompt: "What exactly happened?",
      response: "A bang, aft, maybe twenty seconds before I reached you. Half our systems went quiet right after — no data link, radio barely holding. We're flying fine, I want to be clear about that.",
      cost: EXCHANGE_COST,
    },
    {
      id: "what_happened_clarify",
      prompt: "Which systems, exactly?",
      response: "Comms, mostly. Data link's gone, radio's thin. Flight controls are untouched — I want you to hear that clearly.",
      cost: EXCHANGE_COST,
      requiresAsked: { topicId: "what_happened" },
    },
    {
      id: "injuries_checklist",
      prompt: "Is everyone okay up there?",
      response: "Nobody's hurt. ...And if I'm honest, we didn't go strictly by the book back there. My first officer skipped a step, under pressure. I'd rather you hear that from me than find it later.",
      cost: EXCHANGE_COST,
      // plain-language check: 'skipped a step' not 'checklist item 4.2'; no accusatory variant needed, see header comment
    },
    {
      id: "cargo_light",
      prompt: "What does that cargo light mean?",
      response: "There's a light on the board I don't love — a cargo smoke warning. I can't tell you myself whether it's real. That's not something I can see from here.",
      cost: EXCHANGE_COST,
    },
    {
      id: "cargo_light_certainty",
      prompt: "How sure are you about that reading?",
      response: "Not sure at all, honestly. It's a light on a board. I can't see the hold from here — I'm reading the same instrument you'd be reading.",
      cost: EXCHANGE_COST,
      requiresAsked: { topicId: "cargo_light" },
    },
    {
      id: "writeup_reaction",
      prompt: "Maya mentioned a prior issue with this unit — did you know?",
      response: "No — first I'm hearing about a write-up. That's news to me too. If something like that existed, I wish I'd known before tonight.",
      cost: EXCHANGE_COST,
      // Cross-agent "challenge a contradiction the player has actually
      // encountered" — only unlocks once Maya's old_writeup has actually
      // been asked, never assumed. Doesn't invent new ground truth: the
      // frozen truth is an organizational gap nobody individually caused,
      // and Hale's honest surprise is consistent with that.
      requiresAsked: { agent: "maya", topicId: "old_writeup" },
    },
  ],
};

export const MAYA: AgentDef = {
  id: "maya",
  name: "Maya",
  role: "Ground engineer — secondary telemetry only",
  portrait: "/case3/maya.png",
  topics: [
    {
      id: "engine_bang",
      prompt: "Could that have been an engine failure?",
      response: "No — I can rule that out. Engines are fine, both of them. Whatever went bang back there isn't what's keeping that plane in the air.",
      cost: EXCHANGE_COST,
    },
    {
      id: "what_was_it",
      prompt: "What do you think actually failed?",
      response: "My best read — and I want to be honest it's a read, not a certainty — is a backup power unit. It doesn't fly the plane. But it runs a chunk of their comms and instruments, which is why you've suddenly got half the picture you used to.",
      cost: EXCHANGE_COST,
      // plain language: 'backup power unit' used instead of the APU acronym
    },
    {
      id: "what_was_it_recommend",
      prompt: "So what do you recommend?",
      response: "Get eyes on it directly if you can afford the time. I can give you my best guess, but a read from telemetry isn't the same as someone actually looking.",
      cost: EXCHANGE_COST,
      requiresAsked: { topicId: "what_was_it" },
    },
    {
      id: "sensor_reliable",
      prompt: "Could that sensor reading be wrong?",
      response: "Could be wrong. Sensors drift, especially after something's rattled the plane that hard. I can't tell you from here whether that's a real fire or a sensor having a bad day. If you need to know for certain, someone has to go back and actually look.",
      cost: EXCHANGE_COST,
      // explicitly does not substitute for D1's visual check
    },
    {
      id: "sensor_certainty",
      prompt: "How confident are you in that?",
      response: "Honestly? Not very. I'm working off secondhand data. I wouldn't bet the landing on my hunch alone.",
      cost: EXCHANGE_COST,
      requiresAsked: { topicId: "sensor_reliable" },
    },
    {
      id: "old_writeup",
      prompt: "Has this happened before?",
      response: "...There's a write-up on this unit from a few months back. Got closed out, paperwork said resolved. Worth knowing — it doesn't tell us what's happening right now, though.",
      cost: EXCHANGE_COST,
      // color only, per frozen truth (organizational gap, nobody's fault) — no claim Maya suspected an ongoing problem
    },
  ],
};

export const RORY: AgentDef = {
  id: "rory",
  name: "Rory",
  role: "Air traffic control — routes and weather only",
  portrait: "/case3/rory.png",
  topics: [
    {
      id: "margin_routes",
      prompt: "How does margin affect the routes?",
      response: "Route B — the long field — needs real margin to stay reachable; it's further out and burns more of your window just getting there. Route A's always there as a fallback, margin or not.",
      cost: EXCHANGE_COST,
    },
    {
      id: "route_a_risk",
      prompt: "What's the real risk on Route A?",
      response: "Shorter runway, less margin if anything's off, and nobody's pre-positioned there. It's not reckless. It's just thinner.",
      cost: EXCHANGE_COST,
    },
    {
      id: "rory_recommend",
      prompt: "What would you do?",
      response: "If I had full margin, I'd take the long field every time. Right now? That's your call, not mine — I just fly the numbers.",
      cost: EXCHANGE_COST,
    },
  ],
};

export const ACT1_HALE_OPENING =
  "Operations, this is 702. We've had a bang. I need you with me.";

export const ACT1_MAYA_INTERRUPT = {
  cue: "SECONDARY TELEMETRY RECEIVED",
  line: "The smoke indication and the electrical failure need separate checks. I can help you work through them.",
};

export const ACT1_RORY_INTERRUPT = {
  cue: "REVIEW ROUTES",
  line: "I have two diversion options. Their windows won't stay equally good.",
};

export const ACT2_TRANSITION_LINE = "From here, each new question uses 2 operational margin.";

export const D1_OPTIONS = {
  visual_check: {
    label: "Send someone back to check the cargo hold directly.",
    cost: D1_VISUAL_CHECK_COST,
  },
  instruments_only: {
    label: "Go with what the instruments already show.",
    cost: 0,
  },
} as const;

// Delivered as an Incoming Event from ops, NOT as a Hale dialogue line —
// per the frozen rule "Hale does not automatically receive the result if
// the player doesn't tell him." Keeping this off Hale's channel is a
// deliberate fix for a continuity error flagged in review.
export const D1_VISUAL_CHECK_RESULT = {
  cue: "CARGO HOLD — VISUAL CHECK COMPLETE",
  line: "Smoke confirmed. Not out — smoldering, contained for now.",
};

export const D1_INSTRUMENTS_RESULT = {
  cue: "PROCEEDING ON INSTRUMENTS",
  line: "Cargo indication remains unconfirmed.",
};

export const ACT3_TRANSITION_LINE = "Choose where this plane goes before the weather chooses for you.";

// Separate from ACT1_RORY_INTERRUPT (scripted, free, Act I orientation).
// This is the REAL pressure-threshold escalation — fires exactly once,
// only if margin has actually crossed below RORY_WARNING_THRESHOLD by
// the time Act III opens (whether that happened during D1 or during
// Act II conversation). Never fires twice — see store.ts's
// rorysWarningFired flag.
export const RORY_THRESHOLD_WARNING = {
  cue: "ROUTE WINDOW CLOSING",
  line: "The short field's weather is fine, but the long one's crosswind is creeping up. If you want it, decide soon — it won't stay available.",
};

export const D2_OPTIONS = {
  route_A: {
    label: "Commit to the short field.",
    sublabel: "Closer, tighter, no crew pre-positioned.",
    cost: 5,
  },
  route_B: {
    label: "Commit to the long field.",
    sublabel: "Further out, full equipment standing by.",
    cost: 14,
  },
} as const;

export const D4_OPTIONS: Record<D4Option, { label: string }> = {
  full_prep: { label: "Order full emergency response and a precautionary evacuation." },
  standard: { label: "Treat this as a routine landing." },
};

// Route-aware preview, shown BEFORE the player commits to D4 — the
// review's own explicit catch on the earlier draft: "the player doesn't
// receive the injury risk before choosing." This is the fix: full_prep's
// guaranteed-but-small cost and standard's route-dependent risk are both
// stated plainly up front, not revealed only at the consequence screen.
export const D4_PREVIEW: Record<Route, Record<D4Option, string>> = {
  A: {
    full_prep: "Guarantees no fire-related harm if anything's wrong. The evacuation itself will cause some minor injuries — that part is certain either way.",
    standard: "No forced evacuation. This route has little margin if the smoke warning turns out to be real.",
  },
  B: {
    full_prep: "This route already has full equipment standing by. Ordering an evacuation on top adds a small, guaranteed injury risk for no real extra protection.",
    standard: "This route's own equipment and margin are built to catch a problem like this without anyone needing to evacuate.",
  },
};

export const ACT4_HALE_LINE: Record<Route, string> = {
  A: "Short final, won't be long now. How do you want the ground set up?",
  B: "We're on the long final now. Last thing from me — how do you want the ground set up?",
};

export interface OutcomeResult {
  label: string;
  narrative: string;
}

// The physical result depends only on Route x D4 — never on whether the
// player actually confirmed the fire. The ground truth (smoldering,
// reignites mildly under landing stress on every branch) doesn't change
// because of what the player happened to learn; only their preparedness
// for it does. fireStatus affects grading, never this.
export const OUTCOME_MATRIX: Record<Route, Record<D4Option, OutcomeResult>> = {
  A: {
    standard: {
      label: "Worst",
      narrative: "The short runway left little margin. The fire reignited during the landing roll, and with no crews pre-positioned, it caused real injuries and significant damage before it was brought under control.",
    },
    full_prep: {
      label: "Managed",
      narrative: "The short runway was tight, but the fire crews were already in position when the fire reignited. No one was hurt by the fire itself — though a handful of passengers picked up minor injuries coming down the evacuation slides.",
    },
  },
  B: {
    standard: {
      label: "Clean",
      narrative: "The long runway's full equipment and margin caught the reignition through routine response alone. No drama, no injuries, no evacuation.",
    },
    full_prep: {
      label: "Overcautious",
      narrative: "The long runway's margin would have been enough on its own. The precautionary evacuation you ordered was unnecessary in hindsight — it caused a handful of avoidable minor injuries, for no added safety benefit.",
    },
  },
};

// Never shown directly during play — only at the reveal. Fixed, same
// every playthrough; the player's choices determine how prepared they
// were for it, never what it was.
export const GROUND_TRUTH_REVEAL: string[] = [
  "The bang was the backup power unit rupturing — triggered by a rushed, not malicious, emergency electrical isolation. It's mechanically unrelated to the fire risk.",
  "The cargo-hold fire was smoldering the entire time. The suppression system reduced it but never fully extinguished it — it reignites mildly under the stress of landing, on every branch of this story.",
  "A write-up on that unit existed from months earlier, closed out in a gap between maintenance shifts. No one person is at fault for it.",
  "The first officer's skipped checklist step never actually mattered to anything that happened.",
];
