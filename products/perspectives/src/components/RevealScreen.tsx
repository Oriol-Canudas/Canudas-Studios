import { useState } from "react";
import { GROUND_TRUTH, TIMELINE } from "../game/caseData";
import { useGameStore } from "../game/store";
import { ELENA_REVEAL_NOTES, RESPONSIBLE_REVEAL_NOTES, gradeVerdict, type Judgment } from "../game/verdictGrading";
import { sessionDurationMs } from "../game/analytics";

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

export default function RevealScreen({ onReset }: RevealScreenProps) {
  const verdict = useGameStore((s) => s.verdict);
  const board = useGameStore((s) => s.board);
  const inspectedEvidence = useGameStore((s) => s.inspectedEvidence);
  const [showFullStory, setShowFullStory] = useState(false);
  if (!verdict) return null;

  const graded = gradeVerdict(verdict);
  const duration = formatDuration(sessionDurationMs());

  return (
    <div className="flex h-full flex-col overflow-y-auto px-6 pb-16 pt-10 text-white">
      <p className="text-xs uppercase tracking-[0.3em] text-amber-300/80">Verdict delivered</p>
      <h1 className="mt-2 text-3xl font-semibold leading-tight">{graded.headline}</h1>

      <div className="mt-5 grid grid-cols-2 gap-3">
        <div className={`rounded-xl border p-3.5 ${JUDGMENT_STYLE[graded.responsibleJudgment]}`}>
          <p className="text-sm text-white/60">Responsible</p>
          <p className="mt-0.5 text-base font-medium capitalize text-white">{verdict.responsible.replace("_", " ")}</p>
          <p className="mt-1 text-sm font-medium">{JUDGMENT_LABEL[graded.responsibleJudgment]}</p>
        </div>
        <div className={`rounded-xl border p-3.5 ${JUDGMENT_STYLE[graded.elenaJudgment]}`}>
          <p className="text-sm text-white/60">Elena</p>
          <p className="mt-0.5 text-base font-medium capitalize text-white">{verdict.elenaVerdict.replace("_", " ")}</p>
          <p className="mt-1 text-sm font-medium">{JUDGMENT_LABEL[graded.elenaJudgment]}</p>
        </div>
      </div>

      <div className="mt-4 rounded-2xl border border-white/10 bg-white/[0.03] p-4">
        <p className="text-base font-medium text-white/70">On your choices</p>
        <p className="mt-2 text-[17px] leading-relaxed text-white/85">{RESPONSIBLE_REVEAL_NOTES[verdict.responsible]}</p>
        <p className="mt-2 text-[17px] leading-relaxed text-white/85">{ELENA_REVEAL_NOTES[verdict.elenaVerdict]}</p>
      </div>

      {verdict.theory.trim() && (
        <div className="mt-4 rounded-2xl border border-white/10 bg-white/[0.03] p-4">
          <p className="text-base font-medium text-white/70">What you wrote at the time</p>
          <p className="mt-2 text-[17px] leading-relaxed text-white/75 italic">“{verdict.theory.trim()}”</p>
          <p className="mt-2 text-sm text-white/40">Shown as you left it — not scored against the account below.</p>
        </div>
      )}

      {board.length > 0 && (
        <div className="mt-4 rounded-2xl border border-white/10 bg-white/[0.03] p-4">
          <p className="text-base font-medium text-white/70">What you had to work with — {board.length} item{board.length === 1 ? "" : "s"}</p>
          <p className="mt-1 text-sm text-white/45">Everything you pinned, for your own reference — not a scorecard.</p>
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
            <p className="mt-2 text-[17px] leading-relaxed text-white/85">{GROUND_TRUTH.relationshipTruth}</p>
            <p className="mt-3 text-[17px] leading-relaxed text-white/85">{GROUND_TRUTH.theNight}</p>
            <p className="mt-3 text-[17px] leading-relaxed text-white/60 italic">{GROUND_TRUTH.culpability}</p>
          </div>

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

          <div className="mt-2 rounded-2xl border border-white/10 bg-white/[0.03] p-4">
            <p className="text-base font-medium text-white/70">The misleading signals</p>
            <ul className="mt-2 space-y-2 text-[17px] leading-relaxed text-white/75">
              <li>• Daniel's 23:06 text to Sofia ("it's getting ugly") sounds damning — but it's timestamped while Elena was still there, and she left Daniel alive 46 minutes later.</li>
              <li>• The knife carries only Elena's and Daniel's prints — because Tom never gripped the handle, not because he wasn't there.</li>
              <li>• The entrance camera shows almost nothing after 23:52 — because Sofia and Tom both used the underground garage, which it doesn't cover.</li>
              <li>• Julia's "woman in a dark coat around midnight" is an honest but imprecise sighting — easy to misread as Elena, actually consistent with Sofia leaving at 23:57.</li>
            </ul>
          </div>
        </>
      )}

      <div className="mt-4 text-center text-sm text-white/35">
        You pinned {board.length} item{board.length === 1 ? "" : "s"} to the case board · actually read {inspectedEvidence.size} of 8 documents · session {duration}
      </div>

      <button
        onClick={onReset}
        className="mt-8 w-full rounded-2xl bg-white/10 py-4 text-lg font-semibold text-white active:scale-[0.98] transition-transform"
      >
        Play again
      </button>
    </div>
  );
}
