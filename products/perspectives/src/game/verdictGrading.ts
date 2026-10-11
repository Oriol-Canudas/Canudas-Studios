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

/**
 * TContext is optional, extra playthrough state a case's judge may need
 * beyond the player's raw choice — e.g. which facts were actually
 * discovered, which commitments were actually secured, how much fictional
 * time was left. Case 002's judge ignores it entirely (defaults to
 * `void`, and a function with fewer declared params than its type still
 * satisfies that type), so this is a pure addition — zero behavior change
 * for any config that doesn't opt in.
 */
export interface VerdictGradingConfig<TContext = void> {
  axes: VerdictAxis[];
  /** Judgment for the player's chosen optionId on one axis, given the rest of the playthrough's context. Called once per axis. */
  judge: (axisId: string, chosenOptionId: string, context: TContext) => Judgment;
  /** Headline text, keyed by the axis grades joined with ":" in axes-array order (e.g. "correct:wrong" for a 2-axis case). */
  headlines: Record<string, string>;
}

export function gradeVerdict<TContext = void>(
  config: VerdictGradingConfig<TContext>,
  v: PlayerVerdict,
  context?: TContext
): GradedVerdict {
  const axisGrades: AxisGrade[] = config.axes.map((axis) => ({
    axisId: axis.id,
    judgment: config.judge(axis.id, v.choices[axis.id], context as TContext),
  }));
  const key = axisGrades.map((g) => g.judgment).join(":");
  const headline = config.headlines[key] ?? "—";
  return { axisGrades, headline };
}
