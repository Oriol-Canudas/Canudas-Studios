import type { PlayerVerdict } from "./types";

export const TRUE_RESPONSIBLE = "tom";
export const TRUE_ELENA_VERDICT = "not_guilty";

export interface GradedVerdict {
  responsibleCorrect: boolean;
  elenaVerdictCorrect: boolean;
  headline: string;
}

export function gradeVerdict(v: PlayerVerdict): GradedVerdict {
  const responsibleCorrect = v.responsible === TRUE_RESPONSIBLE;
  const elenaVerdictCorrect = v.elenaVerdict === TRUE_ELENA_VERDICT;

  let headline: string;
  if (responsibleCorrect && elenaVerdictCorrect) {
    headline = "You reconstructed it. Elena didn't do this — and you knew who did.";
  } else if (elenaVerdictCorrect && !responsibleCorrect) {
    headline = "You cleared the right person — but the real story still slipped past you.";
  } else if (!elenaVerdictCorrect && responsibleCorrect) {
    headline = "You knew who was really responsible — but still couldn't quite let Elena off the hook.";
  } else {
    headline = "The story the prosecution told you is exactly the one you walked away believing.";
  }

  return { responsibleCorrect, elenaVerdictCorrect, headline };
}
