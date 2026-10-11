// ─────────────────────────────────────────────────────────────────────────
// Shareable result text for the Reveal screen.
//
// Deliberately spoiler-safe by construction: never names WHO was
// responsible or restates any case fact — only the player's OWN graded
// performance (correct/wrong/insufficient, not the answer itself) and a
// process highlight (HOW they got there, pulled from their own
// conversationEventLog). Someone who hasn't played yet and reads a
// shared result learns nothing about the actual case.
// ─────────────────────────────────────────────────────────────────────────

import type { ConversationEvent } from "./types";
import type { GradedVerdict, Judgment } from "./verdictGrading";

const JUDGMENT_WORD: Record<Judgment, string> = {
  correct: "Correct",
  wrong: "Incorrect",
  insufficient: "Called insufficient",
};

// Checked in priority order — the most specific, most "earned" highlight
// wins, so a session with multiple kinds of event doesn't just report
// whichever happened to be logged first.
const HIGHLIGHT_BY_KIND: { kind: ConversationEvent["kind"]; text: string }[] = [
  { kind: "voluntary_disclosure", text: "Got a witness to open up through conversation alone — no evidence needed." },
  { kind: "evidence_admission", text: "Caught a contradiction and pushed a witness into admitting it." },
  { kind: "empathetic_recovery", text: "Talked a defensive witness back open with empathy, backed by real proof." },
];

function pickHighlight(log: ConversationEvent[]): string | null {
  for (const { kind, text } of HIGHLIGHT_BY_KIND) {
    if (log.some((e) => e.kind === kind)) return text;
  }
  return null;
}

export interface ShareCardInput {
  graded: GradedVerdict;
  documentsRead: number;
  totalDocuments: number;
  witnessesQuestioned: number;
  totalWitnesses: number;
  durationLabel: string;
  conversationEventLog: ConversationEvent[];
}

export function buildShareText(input: ShareCardInput): string {
  const highlight = pickHighlight(input.conversationEventLog);
  const lines = [
    'I just closed "The Last Message" on Perspectives.',
    `Responsible: ${JUDGMENT_WORD[input.graded.responsibleJudgment]} · Elena: ${JUDGMENT_WORD[input.graded.elenaJudgment]}`,
    `${input.documentsRead}/${input.totalDocuments} documents · ${input.witnessesQuestioned}/${input.totalWitnesses} witnesses · ${input.durationLabel}`,
  ];
  if (highlight) lines.push(highlight);
  lines.push("Think you can do better? https://gamexperspectives.vercel.app");
  return lines.join("\n");
}
