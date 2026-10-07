import type { ElenaVerdict, PlayerVerdict, ResponsibleParty } from "./types";

export const TRUE_RESPONSIBLE = "tom";
export const TRUE_ELENA_VERDICT = "not_guilty";

export type Judgment = "correct" | "wrong" | "insufficient";

export interface GradedVerdict {
  responsibleJudgment: Judgment;
  elenaJudgment: Judgment;
  /** Kept for callers that only need a strict correctness check (e.g. badges). */
  responsibleCorrect: boolean;
  elenaVerdictCorrect: boolean;
  headline: string;
}

function judgeResponsible(r: ResponsibleParty): Judgment {
  if (r === "insufficient_evidence") return "insufficient";
  return r === TRUE_RESPONSIBLE ? "correct" : "wrong";
}

function judgeElena(e: ElenaVerdict): Judgment {
  if (e === "insufficient_evidence") return "insufficient";
  return e === TRUE_ELENA_VERDICT ? "correct" : "wrong";
}

// Keyed `${responsibleJudgment}:${elenaJudgment}` — every combination gets
// its own honest headline. "Insufficient" is never phrased as a failure:
// declining to convict without enough evidence is a legitimate outcome,
// distinct from actively getting it wrong.
const HEADLINES: Record<string, string> = {
  "correct:correct": "You reconstructed it. Elena didn't do this — and you knew who did.",
  "correct:wrong": "You knew who was really responsible — but still couldn't quite let Elena off the hook.",
  "correct:insufficient": "You knew who was really responsible, and rightly wouldn't commit on Elena without being sure — a defensible, cautious read.",
  "wrong:correct": "You cleared the right person — but the real story still slipped past you.",
  "wrong:wrong": "The story the prosecution told you is exactly the one you walked away believing.",
  "wrong:insufficient": "You weren't ready to convict Elena, which is the right instinct — but you pointed the finger at the wrong person anyway.",
  "insufficient:correct": "You cleared Elena and rightly stopped short of naming who was responsible — honest, if incomplete.",
  "insufficient:wrong": "You convicted Elena, yet weren't confident enough in who was actually responsible to say — those two don't sit well together.",
  "insufficient:insufficient": "You called it open on both counts. Fair, given how the evidence is laid out — but the case was more resolvable than that.",
};

export function gradeVerdict(v: PlayerVerdict): GradedVerdict {
  const responsibleJudgment = judgeResponsible(v.responsible);
  const elenaJudgment = judgeElena(v.elenaVerdict);
  const headline = HEADLINES[`${responsibleJudgment}:${elenaJudgment}`];

  return {
    responsibleJudgment,
    elenaJudgment,
    responsibleCorrect: responsibleJudgment === "correct",
    elenaVerdictCorrect: elenaJudgment === "correct",
    headline,
  };
}

// Small, hand-authored notes per structured verdict choice — not inferred
// from the player's board, which can't honestly establish "this supports
// my conclusion" on its own. Shown in the Reveal alongside the headline.
export const RESPONSIBLE_REVEAL_NOTES: Record<ResponsibleParty, string> = {
  tom: "You landed on Tom. The garage log placing him back at the apartment at 23:59, his own phone records contradicting his first “I went straight home,” and his eventual account of the knife all point the same way.",
  elena: "You landed on Elena. But she left at 23:52 — before the fatal struggle ever happened — and the entrance camera and her own phone records both put her away from the building afterward.",
  sofia: "You landed on Sofia. She was there, and the conversation that night was raw, but every record has her leaving by 23:57, before Tom ever arrived.",
  someone_else: "You pointed past the three people in this case. Nothing in the evidence suggests anyone beyond Elena, Sofia, and Tom was in that apartment that night.",
  insufficient_evidence: "You judged the evidence on who was responsible as incomplete. It's dense, but the garage log and Tom's own account do converge on one person.",
};

export const ELENA_REVEAL_NOTES: Record<ElenaVerdict, string> = {
  not_guilty: "You cleared Elena. She left the apartment well before the fatal struggle began, with the entrance camera and the garage log agreeing on the timing.",
  guilty: "You convicted Elena. But she was gone by 23:52 — before Sofia even arrived, let alone Tom.",
  insufficient_evidence: "You called the evidence on Elena insufficient. There's actually a clean, corroborated exit time for her — 23:52, confirmed by both the entrance camera and her own phone activity.",
};
