// ─────────────────────────────────────────────────────────────────────────
// Flight 702 v2 — EXPERIMENTAL authored content. Route A only.
//
// Two explicit, labeled experimental amendments to the /case3 canon this
// is derived from (neither is silent, both are scoped to this isolated
// module only — /case3 itself is untouched):
//
//   AMD-A — a new middle Commitment, "crew_only": emergency crews
//   positioned along the field BEFORE touchdown (same mechanism /case3's
//   full_prep already uses to prevent landing-roll damage), WITHOUT the
//   evacuation bundled on top. Lets the negotiation reach something
//   between "do nothing" and "evacuate," instead of a single binary.
//
//   AMD-B — a new authored uncertainty: nobody has confirmed the cargo
//   hold is still sealed after the bang. This is NOT evidence of
//   severity and does not strengthen the old write-up (that stays an
//   earlier closed-out issue, nothing more). It's a genuinely open
//   question to both Hale and the player at decision time. Ground truth
//   (GROUND_TRUTH_V2 below, never shown during play): the seal holds on
//   every run. Neither character can know that.
//
// Causality fix carried over from the design review: whatever prevents
// landing-roll damage has to be in position BEFORE the aircraft touches
// down, during that same roll — never "meets the aircraft at the gate"
// (that happens after the fact and could not possibly matter).
// ─────────────────────────────────────────────────────────────────────────

import type { Commitment } from "./types";

export const OPENING_LINE =
  "Smoke indication in the cargo hold — confirmed smoldering, contained for now. The short field is the only option in this window: Route A, no crew pre-positioned there by default. Hale needs an answer in a few minutes.";

export interface MayaTopic {
  id: "sensor_doubt" | "seal_request" | "history";
  prompt: string;
  response: string;
}

export const MAYA_TOPICS: MayaTopic[] = [
  {
    id: "sensor_doubt",
    prompt: "Could that sensor reading be wrong?",
    response:
      "Could be. Sensors drift, especially after something's rattled the plane that hard. I can't tell you for certain whether it's a real fire or a sensor having a bad day.",
  },
  {
    id: "seal_request",
    prompt: "Can you check whether the hold's still sealed?",
    response:
      "I don't have a way to confirm that from here — nobody's looked. If it's been breached, I can't rule out smoke working forward before anyone outside can reach it. I just don't know.",
  },
  {
    id: "history",
    prompt: "Has this happened before?",
    response:
      "There's a write-up on this unit from months back. Closed out, resolved on paper. Doesn't tell us what's happening right now, though.",
  },
];

export const RELAY_COPY: Record<keyof import("./types").HaleKnows, { label: string; haleAck: string; requiresTopic: MayaTopic["id"] }> = {
  sensorDoubt: {
    label: "Tell Hale: the sensor reading could be unreliable",
    haleAck: "Good to know. Doesn't change what I'm seeing on my end, but good to know.",
    requiresTopic: "sensor_doubt",
  },
  sealUncertainty: {
    label: "Tell Hale: nobody's confirmed the hold's still sealed",
    haleAck: "...That's worth knowing. I hadn't thought about it that way.",
    requiresTopic: "seal_request",
  },
};

export const TURN_LIMIT = 4;

export const ESCALATION_ORDER: Commitment[] = ["standard", "crew_only", "full_prep"];

export function commitmentRank(c: Commitment): number {
  return ESCALATION_ORDER.indexOf(c);
}

export interface OutcomeText {
  label: string;
  narrative: string;
}

export const OUTCOME_TEXT: Record<Commitment, OutcomeText> = {
  standard: {
    label: "Worst",
    narrative:
      "During the landing roll, the smoldering fire reignited. With no emergency crews positioned and nothing further requested, it caused real injuries and significant damage before it was brought under control.",
  },
  crew_only: {
    label: "Managed, no evacuation",
    narrative:
      "You got emergency crews positioned along the field before touchdown. When the fire reignited during the landing roll, they were already there to contain it — it never got the chance to cause real damage. No evacuation was ordered. The hold's seal held throughout; no smoke reached the cabin.",
  },
  full_prep: {
    label: "Managed",
    narrative:
      "Crews were positioned and the fire was contained the moment it reignited — no one was hurt by the fire itself. A handful of passengers picked up minor injuries coming down the evacuation slides. The hold's seal held throughout, so the evacuation turned out not to have been strictly necessary.",
  },
};

/** Never shown during play — reveal only, behind an explicit expand, same
 * pattern as /case3's GROUND_TRUTH_REVEAL. */
export const GROUND_TRUTH_V2: string[] = [
  "The cargo-hold fire reignited mildly during the landing roll, exactly as it had on every prior check — the same way it does on this branch of the story every time.",
  "The hold's seal held the entire time. Smoke never reached the cabin, under any commitment. Neither the player nor Hale could know that in advance — it was a real, open question at the time, not a hidden test either of them should have solved.",
  "The write-up Maya found describes a single closed-out issue from months earlier — not a history of repeated or worsening failures. It was never used as evidence of severity, by design.",
];

export const JUDGMENT_TEXT: Record<Commitment, string> = {
  standard:
    "You didn't make a case Hale found convincing enough to change anything — a fair, if risky, place to land given what you'd actually gathered.",
  crew_only: "You asked for protection proportionate to what you actually knew — not more, not less.",
  full_prep:
    "You hedged against a specific uncertainty neither of you could rule out — a defensible call, even though it didn't end up mattering this time.",
};
