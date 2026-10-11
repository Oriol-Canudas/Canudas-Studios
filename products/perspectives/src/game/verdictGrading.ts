// ─────────────────────────────────────────────────────────────────────────
// Generic verdict grading engine — runs ANY case's N-axis verdict, not
// hardcoded to Case 002's two (responsible/elenaVerdict). Each case
// authors its own VerdictGradingConfig (axes, a judge function, and a
// headline per combination of judgments) and exports it; this file only
// knows how to run that config against what the player actually chose.
// ─────────────────────────────────────────────────────────────────────────

import type { PlayerVerdict, VerdictAxis } from "./types";

export type Judgment = "correct" | "wrong" | "insufficient";

export interface AxisGrade {
  axisId: string;
  judgment: Judgment;
}

export interface GradedVerdict {
  axisGrades: AxisGrade[];
  headline: string;
}

export interface VerdictGradingConfig {
  axes: VerdictAxis[];
  /** Judgment for the player's chosen optionId on one axis. Called once per axis. */
  judge: (axisId: string, chosenOptionId: string) => Judgment;
  /** Headline text, keyed by the axis grades joined with ":" in axes-array order (e.g. "correct:wrong" for a 2-axis case). */
  headlines: Record<string, string>;
}

export function gradeVerdict(config: VerdictGradingConfig, v: PlayerVerdict): GradedVerdict {
  const axisGrades: AxisGrade[] = config.axes.map((axis) => ({
    axisId: axis.id,
    judgment: config.judge(axis.id, v.choices[axis.id]),
  }));
  const key = axisGrades.map((g) => g.judgment).join(":");
  const headline = config.headlines[key] ?? "—";
  return { axisGrades, headline };
}
