// Judgment grading — deliberately separate from OUTCOME_MATRIX (data.ts).
// A bad outcome doesn't prove bad judgment; a good one doesn't prove good
// judgment. Each axis cites what was actually known/done at the time,
// never credits the player with a choice they didn't make.

import type { D4Option, FireStatus, JudgmentAxis, Route } from "./types";

export interface GradingInput {
  d1Choice: "visual_check" | "instruments_only";
  fireStatus: FireStatus;
  route: Route;
  d4Choice: D4Option;
  d1WasForced: boolean;
  d2WasForced: boolean;
}

function verificationAxis(input: GradingInput): JudgmentAxis {
  if (input.d1Choice === "visual_check") {
    return {
      label: "Verification",
      level: "strong",
      reasoning: "You sent someone to check the cargo hold directly instead of guessing — you knew the fire was real before committing to anything else.",
    };
  }
  return {
    label: "Verification",
    level: "mixed",
    reasoning: "You went with the instruments alone. That's a legitimate way to preserve margin — but it left the actual risk unconfirmed for the rest of the flight.",
  };
}

function cautionAxis(input: GradingInput): JudgmentAxis {
  const known = input.fireStatus === "confirmed_smoldering";
  if (input.d4Choice === "full_prep") {
    return {
      label: "Caution under uncertainty",
      level: "strong",
      reasoning: known
        ? "You knew the fire was real and prepared the ground for it directly."
        : "You hadn't confirmed the fire, but you prepared for the risk anyway — a sound hedge against what you didn't know.",
    };
  }
  if (input.route === "B") {
    return {
      label: "Caution under uncertainty",
      level: "mixed",
      reasoning: known
        ? "You knew the fire was real but trusted the long runway's own margin instead of ordering extra preparation. Reasonable — and it held."
        : "You hadn't confirmed the fire, but the long runway's own margin gave you real room either way.",
    };
  }
  return {
    label: "Caution under uncertainty",
    level: "weak",
    reasoning: known
      ? "You knew the fire was real, chose the tighter runway, and ordered no extra preparation."
      : "You hadn't confirmed the fire, chose the tighter runway, and ordered no extra preparation — a real gamble without anything to justify it.",
  };
}

function decisivenessAxis(input: GradingInput): JudgmentAxis {
  const forcedCount = Number(input.d1WasForced) + Number(input.d2WasForced);
  if (forcedCount === 0) {
    return {
      label: "Decisiveness",
      level: "strong",
      reasoning: "Every call was made before the window closed on its own.",
    };
  }
  if (forcedCount === 1) {
    return {
      label: "Decisiveness",
      level: "mixed",
      reasoning: "One decision was made for you by the clock, not chosen in time.",
    };
  }
  return {
    label: "Decisiveness",
    level: "weak",
    reasoning: "Both major decisions were forced by the clock rather than chosen in time.",
  };
}

export function computeGrading(input: GradingInput): JudgmentAxis[] {
  return [verificationAxis(input), cautionAxis(input), decisivenessAxis(input)];
}
