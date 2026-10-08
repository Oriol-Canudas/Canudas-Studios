// ─────────────────────────────────────────────────────────────────────────
// Free-text conversation for Tom.
//
// Two paths share one contract: a deterministic, zero-dependency fallback
// that always works (interpretDeterministic — classification only, no
// dialogue), and an AI-backed path (converseWithTom) that calls the
// server-side /api/witness-chat "converse" action, which both interprets
// AND generates validated in-character dialogue in one round trip — see
// that file for the full pipeline (interpret → authorize → generate →
// validate).
//
// validateInterpretation() in witnessEngine.ts still runs on whatever
// {intent, topicId, citedEvidenceIds} comes back from EITHER path before
// anything acts on it — this module never gets to skip that check. The
// server has already validated the generated DIALOGUE itself before
// returning it (or substituted its own safe fallback); the client's job
// is only to decide whether that dialogue is usable here (same topic the
// client independently resolved to — see store.ts's runFreeformTurn).
//
// If the AI call fails for ANY reason (no key configured, network error,
// malformed response, timeout) this silently degrades to the deterministic
// path. The scene must never break because a live model call failed — it
// just runs at the same quality as every other witness in that case.
// ─────────────────────────────────────────────────────────────────────────

import type { EvidenceId, InterpretationResult, PerformanceCue, TurnEventKind, WitnessConfig } from "./types";
import { matchTopic } from "./witnessEngine";

const REQUEST_TIMEOUT_MS = 15000;
const MAX_MESSAGE_CHARS = 600;
const MAX_HISTORY_MESSAGES = 10;

const ACCUSATION_MARKERS = [
  "kill",
  "killed",
  "murder",
  "murdered",
  "you did it",
  "did you do it",
  "you're lying",
  "you are lying",
  "stop lying",
  "quit lying",
  "guilty",
  "confess",
  "admit it",
  "you stabbed",
  "you killed him",
  "coward",
  "cobard",
  "ho vas matar",
  "vas matar",
  "mens",
  "mentint",
];

const EMPATHY_MARKERS = [
  "understand",
  "i know this is hard",
  "must have been",
  "it's okay",
  "its okay",
  "not here to hurt",
  "i believe you",
  "take your time",
  "i get it",
  "must be scary",
  "must have been scary",
  "i'm not trying to",
  "im not trying to",
  "no estas en problemes",
  "no pasa nada",
  "entenc",
  "ho entenc",
  "se que es dificil",
];

function normalize(text: string): string {
  return text.toLowerCase();
}

/** Crude but honest: a reference counts only if it names something distinctive from a document's own title. */
function detectCitedEvidence(
  text: string,
  candidateIds: EvidenceId[],
  evidenceTitles: Record<string, string>
): EvidenceId[] {
  const normalized = normalize(text);
  return candidateIds.filter((id) => {
    const title = evidenceTitles[id]?.toLowerCase();
    if (!title) return false;
    return title.split(/\s+/).some((word) => word.replace(/[^a-z0-9]/g, "").length > 4 && normalized.includes(word));
  });
}

export interface InterpretContext {
  witness: WitnessConfig;
  rawText: string;
  /** Evidence actually known in THIS conversation — the only ones a citation can validly reference. */
  knownEvidenceIds: EvidenceId[];
  evidenceTitles: Record<string, string>;
}

/** Deterministic, zero-dependency fallback. Always available, always testable, always the thing a failed AI call degrades to. */
export function interpretDeterministic(ctx: InterpretContext): InterpretationResult {
  const text = ctx.rawText.slice(0, MAX_MESSAGE_CHARS);
  const normalized = normalize(text);
  const topic = matchTopic(ctx.witness, text);
  const citedEvidenceIds = detectCitedEvidence(text, ctx.knownEvidenceIds, ctx.evidenceTitles);

  const hasAccusation = ACCUSATION_MARKERS.some((m) => normalized.includes(m));
  const hasEmpathy = EMPATHY_MARKERS.some((m) => normalized.includes(m));

  let intent: InterpretationResult["intent"] = "general_question";
  if (citedEvidenceIds.length > 0 && hasEmpathy) intent = "empathetic_appeal";
  else if (citedEvidenceIds.length > 0) intent = "evidence_challenge";
  else if (hasAccusation) intent = "accusation";
  else if (hasEmpathy) intent = "empathetic_appeal";
  else if (!topic) intent = "off_topic";

  return { intent, topicId: topic?.id ?? null, citedEvidenceIds, confidence: topic ? 0.55 : 0.3 };
}

async function fetchJsonWithTimeout(url: string, body: unknown, timeoutMs: number): Promise<Response> {
  const controller = new AbortController();
  const t = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      signal: controller.signal,
    });
  } finally {
    clearTimeout(t);
  }
}

export interface ConverseContext {
  witness: WitnessConfig;
  rawText: string;
  /** Recent chat history, oldest first — gives the model enough to understand "why?" or "what do you mean?". */
  history: { role: string; text: string }[];
  knownEvidenceIds: EvidenceId[];
  evidenceTitles: Record<string, string>;
  /** This witness's own topicId -> stage map and ask counts — raw inputs the server re-derives authorization from, never trusted as already-unlocked. */
  witnessStages: Record<string, number>;
  askCounts: Record<string, number>;
  defensiveTopicIds: string[];
}

export interface ConverseOutcome {
  result: InterpretationResult;
  /** Validated, ready-to-display dialogue from the model — null if unavailable (fallback path, or the server itself had to substitute its own safe text, which it returns here already). */
  dialogue: string | null;
  cue: PerformanceCue | null;
  source: "ai" | "fallback";
}

const DEFAULT_CUES: Partial<Record<TurnEventKind, PerformanceCue>> = {
  defensive_lock: { action: "Tom's jaw tightens.", pauseMs: 500 },
  evidence_admission: { action: "Tom looks away, then meets your eyes.", pauseMs: 700 },
  empathetic_recovery: { action: "Tom exhales, some of the tension leaving his shoulders.", pauseMs: 500 },
  normal_advance: { pauseMs: 300 },
  no_change: undefined,
};

/** The authored fallback cue for a given event kind, when no generated one is available. */
export function defaultCueFor(eventKind: TurnEventKind): PerformanceCue | undefined {
  return DEFAULT_CUES[eventKind];
}

/**
 * Attempts the live, context-aware conversation; always falls back
 * silently to the deterministic classifier (and null dialogue, signaling
 * "use the authored resolution text") on any failure. The server has
 * already validated any dialogue it returns against what Tom is actually
 * authorized to say right now — this function doesn't re-derive that, it
 * only decides whether to trust the network call at all.
 */
export async function converseWithTom(ctx: ConverseContext, aiEnabled: boolean): Promise<ConverseOutcome> {
  if (!aiEnabled) {
    return {
      result: interpretDeterministic(ctx),
      dialogue: null,
      cue: null,
      source: "fallback",
    };
  }

  try {
    const res = await fetchJsonWithTimeout(
      "/api/witness-chat",
      {
        action: "converse",
        witnessId: ctx.witness.id,
        message: ctx.rawText.slice(0, MAX_MESSAGE_CHARS),
        history: ctx.history.slice(-MAX_HISTORY_MESSAGES),
        topics: ctx.witness.topics.map((t) => ({ id: t.id, chipLabel: t.chipLabel })),
        knownEvidenceIds: ctx.knownEvidenceIds,
        evidenceTitles: ctx.evidenceTitles,
        witnessStages: ctx.witnessStages,
        askCounts: ctx.askCounts,
        defensiveTopicIds: ctx.defensiveTopicIds,
      },
      REQUEST_TIMEOUT_MS
    );
    if (!res.ok) throw new Error(`converse http ${res.status}`);
    const data = await res.json();
    if (typeof data?.intent !== "string") throw new Error("malformed converse payload");
    return {
      result: {
        intent: data.intent,
        topicId: typeof data.topicId === "string" ? data.topicId : null,
        citedEvidenceIds: Array.isArray(data.citedEvidenceIds) ? data.citedEvidenceIds : [],
        confidence: 0.6,
      },
      dialogue: typeof data.dialogue === "string" && data.dialogue.trim() ? data.dialogue : null,
      cue: typeof data.cue === "string" && data.cue.trim() ? { action: data.cue } : null,
      source: "ai",
    };
  } catch {
    return {
      result: interpretDeterministic(ctx),
      dialogue: null,
      cue: null,
      source: "fallback",
    };
  }
}
