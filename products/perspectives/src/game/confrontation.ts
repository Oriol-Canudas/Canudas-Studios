// ─────────────────────────────────────────────────────────────────────────
// The confrontation scene — Case 003 ("Untouchable") only. See
// CASE_003_SCENE_STRUCTURE.md's "The confrontation scene" section.
//
// Deliberately its own small module, not folded into interpreter.ts:
// converse/relay there are generic, reusable-by-any-case primitives;
// "confront" is a one-case mechanic (server-enforced — see
// api/witness-chat.ts's handleConfront, which rejects any witnessId other
// than "marcus"). Keeping it separate means a future case's own bespoke
// climax doesn't have to retrofit itself into this one's shape, the same
// way Flight 702's different grammar never tried to fit Case 002's.
//
// Same fallback discipline as the rest of the AI layer: any failure here
// (no key, network error, malformed response) degrades to an authored
// fallback line, never a broken scene.
// ─────────────────────────────────────────────────────────────────────────

import type { PerformanceCue } from "./types";

const REQUEST_TIMEOUT_MS = 15000;
const MAX_MESSAGE_CHARS = 600;
const MAX_HISTORY_MESSAGES = 10;

/** Collapses the 7 authored demeanor states into the 3 buckets the confrontation scene actually selects on — see CASE_003_SCENE_STRUCTURE.md. */
export function demeanorToConfrontBucket(demeanor: string): "receptive" | "guarded" | "raw" {
  if (demeanor === "composed" || demeanor === "guarded") return "receptive";
  if (demeanor === "defensive" || demeanor === "nervous") return "guarded";
  return "raw"; // shaken, panicking, resigned
}

// Authored fallback, mirrored from api/witness-chat.ts's CONFRONT_FALLBACK
// so the scene degrades gracefully even when the network call fails
// before the server ever runs (not just when the server itself falls
// back) — the two copies are small and deliberately kept in sync by hand,
// same pattern as DEFAULT_CUES in interpreter.ts being witness-neutral
// client-side flavor distinct from the server's own richer text.
const CLIENT_FALLBACK: Record<string, string> = {
  "proceed_with_pip:receptive": "...Okay. I still think the timing was wrong. That doesn't mean I think you're wrong about the rest of it.",
  "proceed_with_pip:guarded": "Fine. I'll go through the process. I still don't think this is fair, whatever you've decided about the rest.",
  "proceed_with_pip:raw": "...I don't have anything left to argue with. I hear you.",
  "block_and_reset:receptive": "...I didn't expect that. I still have things I need to actually sit with, whatever happens to the process.",
  "block_and_reset:guarded": "So I was right about the timing. I'm not going to pretend that's the only thing that was true in that file.",
  "block_and_reset:raw": "...I don't know what to do with being right about one thing and wrong about everything else.",
  "modify_process:receptive": "That's fair, I think. Both things being true at once isn't really a loophole. I get that now.",
  "modify_process:guarded": "I hear you. I'm still not all the way there on the rest of it.",
  "modify_process:raw": "...Okay. Both things. I can hold both things.",
};

export interface ConfrontTurnOutcome {
  dialogue: string;
  cue: PerformanceCue | null;
  source: "ai" | "fallback";
}

async function fetchJsonWithTimeout(body: unknown, timeoutMs: number): Promise<Response> {
  const controller = new AbortController();
  const t = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch("/api/witness-chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      signal: controller.signal,
    });
  } finally {
    clearTimeout(t);
  }
}

/**
 * Generic confrontation turn for any SECOND (non-Marcus) witness in a
 * case's CONFRONTATION_WITNESS_IDS sequence — e.g. Priya in "Untouchable".
 * Unlike runConfrontTurn, this is not bound to a finalCall/demeanor-bucket
 * variant matrix and doesn't hit the server's marcus-only "confront"
 * action; it reuses the same generic "converse" action every ordinary
 * freeform witness chat already goes through (api/witness-chat.ts), with
 * no topic/evidence gating — this is a closing conversation after the
 * investigation phase is over, not a gated one. Falls back the same way
 * every other AI call in this codebase does: silently, to a neutral line,
 * never a broken scene.
 */
export async function runGenericConfrontTurn(
  witnessId: string,
  history: { role: string; text: string }[],
  message: string
): Promise<ConfrontTurnOutcome> {
  const fallbackLine = "...I don't really know what else to say to that.";
  try {
    const res = await fetchJsonWithTimeout(
      {
        action: "converse",
        witnessId,
        message: message.slice(0, MAX_MESSAGE_CHARS) || "...",
        history: history.slice(-MAX_HISTORY_MESSAGES),
        topics: [],
        knownEvidenceIds: [],
        evidenceTitles: {},
        witnessStages: {},
        askCounts: {},
        defensiveTopicIds: [],
        conversationMemory: [],
        defensiveLines: [],
        deflections: [],
      },
      REQUEST_TIMEOUT_MS
    );
    if (!res.ok) throw new Error(`converse http ${res.status}`);
    const data = await res.json();
    const dialogue = typeof data.dialogue === "string" && data.dialogue.trim() ? data.dialogue : fallbackLine;
    return {
      dialogue,
      cue: typeof data.cue === "string" && data.cue.trim() ? { action: data.cue } : null,
      source: data.dialogue ? "ai" : "fallback",
    };
  } catch {
    return { dialogue: fallbackLine, cue: null, source: "fallback" };
  }
}

export async function runConfrontTurn(
  finalCall: string,
  demeanor: string,
  history: { role: string; text: string }[],
  message: string,
  aiEnabled: boolean
): Promise<ConfrontTurnOutcome> {
  const bucket = demeanorToConfrontBucket(demeanor);
  const fallbackKey = `${finalCall}:${bucket}`;
  const fallbackLine = CLIENT_FALLBACK[fallbackKey] ?? "...";

  if (!aiEnabled) {
    return { dialogue: fallbackLine, cue: null, source: "fallback" };
  }

  try {
    const res = await fetchJsonWithTimeout(
      {
        action: "confront",
        witnessId: "marcus",
        finalCall,
        demeanorBucket: bucket,
        history: history.slice(-MAX_HISTORY_MESSAGES),
        message: message.slice(0, MAX_MESSAGE_CHARS),
      },
      REQUEST_TIMEOUT_MS
    );
    if (!res.ok) throw new Error(`confront http ${res.status}`);
    const data = await res.json();
    const dialogue = typeof data.dialogue === "string" && data.dialogue.trim() ? data.dialogue : fallbackLine;
    return {
      dialogue,
      cue: typeof data.cue === "string" && data.cue.trim() ? { action: data.cue } : null,
      source: data.dialogue ? "ai" : "fallback",
    };
  } catch {
    return { dialogue: fallbackLine, cue: null, source: "fallback" };
  }
}
