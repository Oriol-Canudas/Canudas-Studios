// ─────────────────────────────────────────────────────────────────────────
// PERSPECTIVES — Case 003 — Flight 702 — authored content for the
// Cold Open -> Act I -> Act II -> D1 -> consequence slice.
//
// Every number here is a BASELINE value from the frozen external spec
// (PERSPECTIVES_CASE_003_Flight_702.md), not something invented for this
// build. Where I've proposed an amendment (D1's cost), it's marked
// explicitly and defaults OFF — see D1_VISUAL_CHECK_COST below.
// ─────────────────────────────────────────────────────────────────────────

import type { AgentDef } from "./types";

export const PRESSURE_START = 40;
export const EXCHANGE_COST = 2;
export const D1_FORCE_THRESHOLD = 28;
export const ROUTE_B_FLOOR = 20;

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
  deflection: "I don't know what else to tell you from up here. Ask Maya — she might have more from the ground.",
  suggestedPrompt: "What exactly happened?",
  topics: [
    {
      id: "injuries_accusatory",
      keywords: ["whose fault", "screwed up", "your fault", "blame", "did you mess", "did someone mess"],
      response: "That's not where I'd start right now. Nobody's hurt. I'm telling you what I know, not looking for someone to pin this on.",
    },
    {
      id: "injuries_checklist",
      keywords: ["hurt", "injured", "injuries", "checklist", "procedure", "by the book", "anyone hurt", "ok back there"],
      response: "Nobody's hurt. ...And if I'm honest, we didn't go strictly by the book back there. My first officer skipped a step, under pressure. I'd rather you hear that from me than find it later.",
      plainLanguageCheck: "no procedure jargon named; 'skipped a step' not 'checklist item 4.2'",
    },
    {
      id: "cargo_light",
      keywords: ["cargo", "light", "sensor", "fire", "warning", "smoke"],
      response: "There's a light on the board I don't love — a cargo smoke warning. I can't tell you myself whether it's real. That's not something I can see from here.",
    },
    {
      id: "what_happened",
      keywords: ["bang", "what happened", "explain", "what did you see", "talk me through", "walk me through"],
      response: "A bang, aft, maybe twenty seconds before I reached you. Half our systems went quiet right after — no data link, radio barely holding. We're flying fine, I want to be clear about that.",
    },
  ],
};

export const MAYA: AgentDef = {
  id: "maya",
  name: "Maya",
  role: "Ground engineer — secondary telemetry only",
  portrait: "/case3/maya.png",
  deflection: "I don't have more than that from here. Hale's the one who can actually see what's happening on board.",
  suggestedPrompt: "Could that sensor reading be wrong?",
  topics: [
    {
      id: "engine_bang",
      keywords: ["engine", "explosion", "blew up", "engine failure"],
      response: "No — I can rule that out. Engines are fine, both of them. Whatever went bang back there isn't what's keeping that plane in the air.",
    },
    {
      id: "what_was_it",
      keywords: ["what was it", "backup", "power unit", "what failed", "what broke", "apu"],
      response: "My best read — and I want to be honest it's a read, not a certainty — is a backup power unit. It doesn't fly the plane. But it runs a chunk of their comms and instruments, which is why you've suddenly got half the picture you used to.",
      plainLanguageCheck: "'backup power unit' used instead of APU acronym",
    },
    {
      id: "sensor_reliable",
      keywords: ["sensor", "reliable", "wrong", "faulty", "could it be wrong", "accurate", "trust that reading"],
      response: "Could be wrong. Sensors drift, especially after something's rattled the plane that hard. I can't tell you from here whether that's a real fire or a sensor having a bad day. If you need to know for certain, someone has to go back and actually look.",
      plainLanguageCheck: "explicitly does not substitute for D1 visual check",
    },
    {
      id: "old_writeup",
      keywords: ["before", "trouble before", "history", "write-up", "writeup", "prior issue", "happened before"],
      response: "...There's a write-up on this unit from a few months back. Got closed out, paperwork said resolved. Worth knowing — it doesn't tell us what's happening right now, though.",
      plainLanguageCheck: "no claim Maya suspected an ongoing problem — color only, per frozen truth (organizational gap, nobody's fault)",
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

export const ACT2_TRANSITION_LINE = "From here, each exchange uses 2 operational margin.";

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
