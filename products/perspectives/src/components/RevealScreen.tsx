import { GROUND_TRUTH, TIMELINE } from "../game/caseData";
import { useGameStore } from "../game/store";
import { gradeVerdict } from "../game/verdictGrading";
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

export default function RevealScreen({ onReset }: RevealScreenProps) {
  const verdict = useGameStore((s) => s.verdict);
  const board = useGameStore((s) => s.board);
  const discoveredEvidence = useGameStore((s) => s.discoveredEvidence);
  if (!verdict) return null;

  const graded = gradeVerdict(verdict);
  const duration = formatDuration(sessionDurationMs());

  return (
    <div className="flex h-full flex-col overflow-y-auto px-6 pb-16 pt-10 text-white">
      <p className="text-xs uppercase tracking-[0.3em] text-amber-300/80">Verdict delivered</p>
      <h1 className="mt-2 text-3xl font-semibold leading-tight">{graded.headline}</h1>

      <div className="mt-5 grid grid-cols-2 gap-3">
        <div className={`rounded-xl border p-3 ${graded.responsibleCorrect ? "border-emerald-400/30 bg-emerald-400/10" : "border-red-400/30 bg-red-400/10"}`}>
          <p className="text-xs text-white/60">Responsible</p>
          <p className="mt-0.5 text-sm font-medium capitalize text-white">{verdict.responsible.replace("_", " ")}</p>
          <p className={`mt-1 text-xs font-medium ${graded.responsibleCorrect ? "text-emerald-300" : "text-red-300"}`}>
            {graded.responsibleCorrect ? "Correct — it was Tom" : "It was actually Tom"}
          </p>
        </div>
        <div className={`rounded-xl border p-3 ${graded.elenaVerdictCorrect ? "border-emerald-400/30 bg-emerald-400/10" : "border-red-400/30 bg-red-400/10"}`}>
          <p className="text-xs text-white/60">Elena</p>
          <p className="mt-0.5 text-sm font-medium capitalize text-white">{verdict.elenaVerdict.replace("_", " ")}</p>
          <p className={`mt-1 text-xs font-medium ${graded.elenaVerdictCorrect ? "text-emerald-300" : "text-red-300"}`}>
            {graded.elenaVerdictCorrect ? "Correct — not guilty" : "She was actually not guilty"}
          </p>
        </div>
      </div>

      <div className="mt-6 rounded-2xl border border-white/10 bg-white/[0.03] p-4">
        <p className="text-sm font-medium text-amber-200">What actually happened</p>
        <p className="mt-2 text-[15px] leading-relaxed text-white/85">{GROUND_TRUTH.relationshipTruth}</p>
        <p className="mt-3 text-[15px] leading-relaxed text-white/85">{GROUND_TRUTH.theNight}</p>
        <p className="mt-3 text-[15px] leading-relaxed text-white/60 italic">{GROUND_TRUTH.culpability}</p>
      </div>

      <div className="mt-6">
        <p className="text-sm font-medium text-white/70 mb-2">The real timeline</p>
        <div className="space-y-0">
          {TIMELINE.map((ev, i) => (
            <div key={i} className="flex gap-3">
              <div className="flex flex-col items-center">
                <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-white/40" />
                {i < TIMELINE.length - 1 && <span className="w-px flex-1 bg-white/10" />}
              </div>
              <div className="pb-3">
                <p className="text-xs font-mono text-white/40">{ev.time}</p>
                <p className="mt-0.5 text-[14px] leading-snug text-white/75">{ev.label}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-2 rounded-2xl border border-white/10 bg-white/[0.03] p-4">
        <p className="text-sm font-medium text-white/70">The misleading signals</p>
        <ul className="mt-2 space-y-2 text-[15px] leading-relaxed text-white/75">
          <li>• Daniel's 23:06 text to Sofia ("it's getting ugly") sounds damning — but it's timestamped while Elena was still there, and she left Daniel alive six minutes later.</li>
          <li>• The knife carries only Elena's and Daniel's prints — because Tom never gripped the handle, not because he wasn't there.</li>
          <li>• The entrance camera shows almost nothing after 23:52 — because Sofia and Tom both used the underground garage, which it doesn't cover.</li>
          <li>• Julia's "woman in a dark coat around midnight" is an honest but imprecise sighting — easy to misread as Elena, actually consistent with Sofia leaving at 23:57.</li>
        </ul>
      </div>

      <div className="mt-4 text-center text-xs text-white/35">
        You pinned {board.length} item{board.length === 1 ? "" : "s"} to the case board · discovered {discoveredEvidence.size} of 8 pieces of evidence · session {duration}
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
