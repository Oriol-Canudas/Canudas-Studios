import { useState } from "react";
import {
  CASE_META,
  EVIDENCE,
  GROUND_TRUTH_REVEAL,
  MISLEADING_SIGNALS,
  REVEAL_SLIDES,
  TIMELINE,
  VERDICT_AXES,
  VERDICT_CONFIG,
  VERDICT_REVEAL_NOTES,
  WITNESSES,
  buildRevealNarrative,
  buildVerdictContext,
} from "../game/caseData";
import { useGameStore } from "../game/store";
import { gradeVerdict, type Judgment } from "../game/verdictGrading";
import { sessionDurationMs, track } from "../game/analytics";
import { buildShareText } from "../game/shareCard";
import IntroSequence from "./IntroSequence";

interface RevealScreenProps {
  onReset: () => void;
}

function formatDuration(ms: number | null): string {
  if (ms == null) return "—";
  const totalSeconds = Math.round(ms / 1000);
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;
  return `${m}m ${s}s`;
}

const JUDGMENT_STYLE: Record<Judgment, string> = {
  correct: "border-emerald-400/30 bg-emerald-400/10 text-emerald-300",
  wrong: "border-red-400/30 bg-red-400/10 text-red-300",
  insufficient: "border-amber-300/30 bg-amber-300/10 text-amber-200",
};

const JUDGMENT_LABEL: Record<Judgment, string> = {
  correct: "Correct",
  wrong: "Incorrect",
  insufficient: "Called insufficient",
};

const MEANINGFUL_EVENT_KINDS = new Set([
  "defensive_lock",
  "evidence_admission",
  "empathetic_recovery",
  "voluntary_disclosure",
]);

export default function RevealScreen({ onReset }: RevealScreenProps) {
  const verdict = useGameStore((s) => s.verdict);
  const board = useGameStore((s) => s.board);
  const inspectedEvidence = useGameStore((s) => s.inspectedEvidence);
  const conversationEventLog = useGameStore((s) => s.conversationEventLog);
  const chatHistory = useGameStore((s) => s.chatHistory);
  const [showFullStory, setShowFullStory] = useState(false);
  const [shareState, setShareState] = useState<"idle" | "copied">("idle");
  const [cinematicDone, setCinematicDone] = useState(false);
  if (!verdict) return null;

  if (!cinematicDone) {
    return <IntroSequence slides={REVEAL_SLIDES} onDone={() => setCinematicDone(true)} />;
  }

  const verdictContext = buildVerdictContext(useGameStore.getState());
  const graded = gradeVerdict(VERDICT_CONFIG, verdict, verdictContext);
  const narrative = buildRevealNarrative(useGameStore.getState(), verdict, graded);
  const duration = formatDuration(sessionDurationMs());
  const meaningfulEvents = conversationEventLog.filter((e) => MEANINGFUL_EVENT_KINDS.has(e.kind));
  const witnessesQuestioned = Object.values(chatHistory).filter((h) => h.length > 0).length;

  // Spoiler-safe by construction — see shareCard.ts. Tries the native
  // share sheet first (best on mobile); falls back to clipboard with
  // visible confirmation when the Share API isn't available (most
  // desktop browsers) or when it throws for any reason OTHER than the
  // user simply cancelling the native sheet, which is left alone.
  async function handleShare() {
    const text = buildShareText({
      caseTitle: CASE_META.title,
      shareUrl: "https://gamexperspectives.vercel.app",
      axes: VERDICT_AXES,
      graded,
      documentsRead: inspectedEvidence.size,
      totalDocuments: EVIDENCE.length,
      witnessesQuestioned,
      totalWitnesses: WITNESSES.length,
      durationLabel: duration,
      conversationEventLog,
    });
    if (typeof navigator !== "undefined" && navigator.share) {
      try {
        await navigator.share({ text });
        track("result_shared", { method: "share_api" });
      } catch {
        // Cancelled or failed silently — respect it, don't fall back.
      }
      return;
    }
    try {
      await navigator.clipboard.writeText(text);
      track("result_shared", { method: "clipboard" });
      setShareState("copied");
      setTimeout(() => setShareState("idle"), 2000);
    } catch {
      // Clipboard unavailable too — nothing more to do silently.
    }
  }

  return (
    <div className="flex h-full flex-col overflow-y-auto px-6 pb-16 pt-10 text-white">
      <p className="text-xs uppercase tracking-[0.3em] text-amber-300/80">{CASE_META.revealKicker}</p>
      <h1 className="mt-2 text-3xl font-semibold leading-tight">{graded.headline}</h1>

      <div className="mt-5 grid grid-cols-2 gap-3">
        {VERDICT_AXES.map((axis) => {
          const grade = graded.axisGrades.find((g) => g.axisId === axis.id);
          const judgment = grade?.judgment ?? "wrong";
          const chosenLabel = axis.options.find((o) => o.id === verdict.choices[axis.id])?.label ?? "—";
          return (
            <div key={axis.id} className={`rounded-xl border p-3.5 ${JUDGMENT_STYLE[judgment]}`}>
              <p className="text-sm text-white/60">{axis.shortLabel ?? axis.question}</p>
              <p className="mt-0.5 text-base font-medium text-white">{chosenLabel}</p>
              <p className="mt-1 text-sm font-medium">{JUDGMENT_LABEL[judgment]}</p>
            </div>
          );
        })}
      </div>

      <div className="mt-4 rounded-2xl border border-white/10 bg-white/[0.03] p-4">
        <p className="text-base font-medium text-white/70">On your choices</p>
        {VERDICT_AXES.map((axis) => (
          <p key={axis.id} className="mt-2 text-[17px] leading-relaxed text-white/85">
            {VERDICT_REVEAL_NOTES[axis.id]?.[verdict.choices[axis.id]]}
          </p>
        ))}
      </div>

      {verdict.theory.trim() && (
        <div className="mt-4 rounded-2xl border border-white/10 bg-white/[0.03] p-4">
          <p className="text-base font-medium text-white/70">What you wrote at the time</p>
          <p className="mt-2 text-[17px] leading-relaxed text-white/75 italic">“{verdict.theory.trim()}”</p>
          <p className="mt-2 text-sm text-white/40">Shown as you left it — not scored against the account below.</p>
        </div>
      )}

      {meaningfulEvents.length > 0 && (
        <div className="mt-4 rounded-2xl border border-white/10 bg-white/[0.03] p-4">
          <p className="text-base font-medium text-white/70">What your questioning established</p>
          <ul className="mt-2 space-y-2 text-[17px] leading-relaxed text-white/85">
            {meaningfulEvents.map((e, i) => (
              <li key={i}>• {e.summary}</li>
            ))}
          </ul>
          <p className="mt-2 text-sm text-white/40">
            These are their own disclosures, not independently verified facts — the Case Board separates claims from
            confirmed evidence.
          </p>
        </div>
      )}

      {board.length > 0 && (
        <div className="mt-4 rounded-2xl border border-white/10 bg-white/[0.03] p-4">
          <p className="text-base font-medium text-white/70">What you had to work with — {board.length} item{board.length === 1 ? "" : "s"}</p>
          <p className="mt-1 text-sm text-white/45">Everything you pinned, for your own reference — not a scorecard.</p>
        </div>
      )}

      {narrative && (
        <div className="mt-4 space-y-4">
          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
            <p className="text-base font-medium text-white/70">Before you arrived</p>
            <ul className="mt-2 space-y-2 text-[17px] leading-relaxed text-white/80">
              {narrative.before.map((line, i) => (
                <li key={i}>• {line}</li>
              ))}
            </ul>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
            <p className="text-base font-medium text-white/70">What you discovered</p>
            <ul className="mt-2 space-y-2 text-[17px] leading-relaxed text-white/80">
              {narrative.discovered.map((line, i) => (
                <li key={i}>• {line}</li>
              ))}
            </ul>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
            <p className="text-base font-medium text-white/70">What you changed</p>
            <ul className="mt-2 space-y-2 text-[17px] leading-relaxed text-white/80">
              {narrative.changed.map((line, i) => (
                <li key={i}>• {line}</li>
              ))}
            </ul>
          </div>
          <div className="rounded-2xl border border-amber-300/20 bg-amber-300/[0.04] p-4">
            <p className="text-base font-medium text-amber-200">How it played out</p>
            <ul className="mt-2 space-y-2 text-[17px] leading-relaxed text-white/85">
              {narrative.outcome.map((line, i) => (
                <li key={i}>• {line}</li>
              ))}
            </ul>
          </div>
        </div>
      )}

      {!showFullStory ? (
        <button
          onClick={() => setShowFullStory(true)}
          className="mt-6 w-full rounded-2xl border border-white/15 bg-white/[0.04] py-3.5 text-base font-medium text-white active:scale-[0.99] transition-transform"
        >
          Show the complete story
        </button>
      ) : (
        <>
          <div className="mt-6 rounded-2xl border border-white/10 bg-white/[0.03] p-4">
            <p className="text-base font-medium text-amber-200">What actually happened</p>
            {GROUND_TRUTH_REVEAL.map((paragraph, i) => (
              <p
                key={i}
                className={`mt-2 text-[17px] leading-relaxed ${i === GROUND_TRUTH_REVEAL.length - 1 ? "text-white/60 italic" : "text-white/85"}`}
              >
                {paragraph}
              </p>
            ))}
          </div>

          {TIMELINE.length > 0 && (
            <div className="mt-6">
              <p className="text-base font-medium text-white/70 mb-2">The real timeline</p>
              <div className="space-y-0">
                {TIMELINE.map((ev, i) => (
                  <div key={i} className="flex gap-3">
                    <div className="flex flex-col items-center">
                      <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-white/40" />
                      {i < TIMELINE.length - 1 && <span className="w-px flex-1 bg-white/10" />}
                    </div>
                    <div className="pb-3">
                      <p className="text-sm font-mono text-white/40">{ev.time}</p>
                      <p className="mt-0.5 text-base leading-snug text-white/75">{ev.label}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {MISLEADING_SIGNALS.length > 0 && (
            <div className="mt-2 rounded-2xl border border-white/10 bg-white/[0.03] p-4">
              <p className="text-base font-medium text-white/70">The misleading signals</p>
              <ul className="mt-2 space-y-2 text-[17px] leading-relaxed text-white/75">
                {MISLEADING_SIGNALS.map((line, i) => (
                  <li key={i}>• {line}</li>
                ))}
              </ul>
            </div>
          )}
        </>
      )}

      <div className="mt-4 text-center text-sm text-white/35">
        You pinned {board.length} item{board.length === 1 ? "" : "s"} to the case board · actually read {inspectedEvidence.size} of {EVIDENCE.length} documents · session {duration}
      </div>

      <button
        onClick={() => void handleShare()}
        className="mt-6 w-full rounded-2xl border border-amber-300/30 bg-amber-300/10 py-3.5 text-base font-semibold text-amber-200 active:scale-[0.98] transition-transform"
      >
        {shareState === "copied" ? "Copied — paste it anywhere" : "Share your result"}
      </button>
      <p className="mt-1.5 text-center text-xs text-white/30">Shares your own performance only — never spoils who's actually responsible.</p>

      <button
        onClick={onReset}
        className="mt-4 w-full rounded-2xl bg-white/10 py-4 text-lg font-semibold text-white active:scale-[0.98] transition-transform"
      >
        Play again
      </button>
    </div>
  );
}
