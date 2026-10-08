// ─────────────────────────────────────────────────────────────────────────
// Self-contained mirror of Tom's authorized-disclosure engine.
//
// WHY THIS DUPLICATES DATA FROM src/game/caseData.ts / witnessEngine.ts:
// api/witness-chat.ts previously imported getAuthorizedDisclosures and
// WITNESS_BY_ID.tom directly from src/game/*. That worked under local tsx
// execution but caused the deployed Vercel function to crash with
// FUNCTION_INVOCATION_FAILED on every request — renaming api/_lib to
// api/lib (ruling out an underscore-prefix bundling quirk) did NOT fix it,
// which narrows the cause to Vercel's function bundler not reliably
// tracing/including this specific cross-directory (api/ -> src/) import
// graph. Rather than keep guessing at Vercel-bundler internals, this file
// makes api/ fully self-contained: no import reaches outside api/ anymore.
//
// The cost is a real one: TOM_TOPICS below is a hand-kept mirror of the
// gating fields (text/requiresEvidence/requiresWitnessStage/minAskCount)
// on WITNESS_BY_ID.tom.topics in ../../src/game/caseData.ts. It is NOT new
// content — every stage text and gate here is copied verbatim from that
// file — but it IS a second source of truth. If Tom's topics in
// caseData.ts ever change, this file must be updated to match, or the
// server-side authorization check will silently drift from the client's.
// scripts/selftest.ts does not currently cross-check the two against each
// other; that would be the right follow-up if Tom's testimony data starts
// changing often.
// ─────────────────────────────────────────────────────────────────────────

export interface TomStageGate {
  text: string;
  requiresEvidence?: string[];
  /** Tom-only scope: every prerequisite in the authored data references Tom's own topics, never another witness. */
  requiresWitnessStage?: { topic: string; minStage: number };
  minAskCount?: number;
}

export interface TomTopicMirror {
  id: string;
  chipLabel: string;
  stages: TomStageGate[];
}

export const TOM_TOPICS: TomTopicMirror[] = [
  {
    id: "earlier_visit",
    chipLabel: "What did you talk about earlier that evening?",
    stages: [
      {
        text: "I went over around 7:30. I told him — again — that he needed to stop giving Elena and Sofia two different stories. He said he knew. I told him to fix it that night, one way or another.",
      },
    ],
  },
  {
    id: "after_that",
    chipLabel: "Where did you really go after you left, Tom?",
    stages: [
      { text: "I went home. I didn't go back." },
      {
        text: "...Alright. I went back. Around midnight. I was worried about how the night was going to go.",
        requiresEvidence: ["E07_tom_phone_records"],
      },
    ],
  },
  {
    id: "saw_sofia",
    chipLabel: "Did you see anyone when you got there?",
    stages: [
      {
        text: "I don't remember.",
        requiresWitnessStage: { topic: "after_that", minStage: 1 },
      },
      {
        text: "I saw Sofia leaving as I was coming in through the garage. We didn't really speak.",
        requiresWitnessStage: { topic: "after_that", minStage: 1 },
        requiresEvidence: ["E08_garage_access_log"],
      },
    ],
  },
  {
    id: "went_up",
    chipLabel: "Did you go up to his apartment?",
    stages: [
      {
        text: "I needed to talk to him. Yes, I went up.",
        requiresWitnessStage: { topic: "after_that", minStage: 1 },
      },
    ],
  },
  {
    id: "the_argument",
    chipLabel: "What really happened between you two up there?",
    stages: [
      {
        text: "We argued. He said I'd made things worse by interfering, by talking to both of them. It got heated. I shoved him, he shoved me back.",
        requiresWitnessStage: { topic: "after_that", minStage: 1 },
        minAskCount: 1,
      },
    ],
  },
  {
    id: "the_knife",
    chipLabel: "Did you kill him, Tom?",
    stages: [
      {
        text: "I don't know what you're asking me.",
        requiresWitnessStage: { topic: "the_argument", minStage: 0 },
      },
      {
        text: "He grabbed the knife off the counter — he was pointing at me with it, shouting at me to get out. I tried to push past him, get the door. We were tangled up for a second and… he had the knife. It went into him. I didn't stab him. I didn't touch that knife. I swear to you, I didn't mean for any of it.",
        requiresWitnessStage: { topic: "the_argument", minStage: 0 },
        requiresEvidence: ["E01_knife", "E04_forensic_prelim"],
        minAskCount: 1,
      },
      {
        text: "I already told you what happened. I panicked. I left. I should have called someone — I know that. I think about it every day.",
        requiresWitnessStage: { topic: "the_argument", minStage: 0 },
        requiresEvidence: ["E01_knife", "E04_forensic_prelim"],
        minAskCount: 2,
      },
    ],
  },
  {
    id: "why_no_help",
    chipLabel: "Why didn't you call for help?",
    stages: [
      {
        text: "I panicked. I know how that sounds. I know I should have. I've never been more scared in my life and I ran, and I will regret that forever.",
        requiresWitnessStage: { topic: "the_knife", minStage: 1 },
      },
    ],
  },
];

function stageRequirementsMet(
  stage: TomStageGate,
  askCountAfterThis: number,
  discoveredEvidence: ReadonlySet<string>,
  tomStages: Readonly<Record<string, number>>
): boolean {
  if (stage.requiresEvidence) {
    for (const ev of stage.requiresEvidence) {
      if (!discoveredEvidence.has(ev)) return false;
    }
  }
  if (stage.requiresWitnessStage) {
    const reached = tomStages[stage.requiresWitnessStage.topic] ?? -1;
    if (reached < stage.requiresWitnessStage.minStage) return false;
  }
  if (stage.minAskCount && askCountAfterThis < stage.minAskCount) {
    return false;
  }
  return true;
}

function resolveStage(
  topic: TomTopicMirror,
  previousStage: number,
  askCountAfterThis: number,
  discoveredEvidence: ReadonlySet<string>,
  tomStages: Readonly<Record<string, number>>
): number {
  let reachable = -1;
  for (let i = 0; i < topic.stages.length; i++) {
    if (stageRequirementsMet(topic.stages[i], askCountAfterThis, discoveredEvidence, tomStages)) {
      reachable = i;
    }
  }
  return Math.max(reachable, previousStage);
}

export interface TomAuthorizedDisclosure {
  topicId: string;
  chipLabel: string;
  stageIndex: number;
  text: string | null;
  locked: boolean;
}

/** Same math/shape as witnessEngine.ts's getAuthorizedDisclosures, specialized to Tom so this file never has to import across the api/ -> src/ boundary. */
export function getTomAuthorizedDisclosures(
  tomStages: Readonly<Record<string, number>>,
  askCounts: Readonly<Record<string, number>>,
  discoveredEvidence: ReadonlySet<string>,
  defensiveTopics: ReadonlySet<string>
): TomAuthorizedDisclosure[] {
  return TOM_TOPICS.map((topic) => {
    const prevStage = tomStages[topic.id] ?? -1;
    const askCount = askCounts[topic.id] ?? 0;
    const stageIndex = resolveStage(topic, prevStage, askCount, discoveredEvidence, tomStages);
    const locked = defensiveTopics.has(topic.id);
    return {
      topicId: topic.id,
      chipLabel: topic.chipLabel,
      stageIndex: locked ? -1 : stageIndex,
      text: locked || stageIndex < 0 ? null : topic.stages[stageIndex].text,
      locked,
    };
  });
}
