import { CASE_META, WITNESSES } from "../game/caseData";
import Portrait from "./Portrait";

interface CaseHomeProps {
  onBegin: () => void;
}

export default function CaseHome({ onBegin }: CaseHomeProps) {
  return (
    <div className="flex min-h-full flex-col bg-gradient-to-b from-[#0a0a0d] via-[#0a0a0d] to-[#121018] px-6 pb-10 pt-14 text-white">
      <div className="mx-auto w-full max-w-md flex-1">
        <p className="text-xs uppercase tracking-[0.3em] text-amber-300/80">Perspective — Case 002</p>
        <h1 className="mt-3 text-4xl font-semibold leading-tight">{CASE_META.title}</h1>

        <div className="mt-6 rounded-2xl border border-white/10 bg-white/[0.03] p-4">
          <p className="text-sm uppercase tracking-wide text-red-300/80">The Charge</p>
          <p className="mt-2 text-[15px] leading-relaxed text-white/90">{CASE_META.charge}</p>
          <p className="mt-3 text-[15px] leading-relaxed text-white/70">
            Cause of death: {CASE_META.causeOfDeath}
          </p>
        </div>

        <div className="mt-4 rounded-2xl border border-white/10 bg-white/[0.03] p-4">
          <p className="text-sm uppercase tracking-wide text-white/60">What Elena admits</p>
          <ul className="mt-2 space-y-1.5 text-[15px] leading-relaxed text-white/80">
            <li>• She visited Daniel that night.</li>
            <li>• They argued.</li>
            <li>• She touched the knife earlier in the evening.</li>
          </ul>
          <p className="mt-3 text-[15px] font-medium text-white/90">She denies killing him.</p>
        </div>

        <div className="mt-8">
          <p className="text-sm uppercase tracking-wide text-white/60 mb-3">You will hear from</p>
          <div className="flex flex-wrap gap-3">
            {WITNESSES.map((w) => (
              <div key={w.id} className="flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.03] py-1.5 pl-1.5 pr-3">
                <Portrait name={w.name} accentColor={w.accentColor} size="sm" />
                <span className="text-sm text-white/80">{w.name}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-8 rounded-2xl border border-amber-400/20 bg-amber-400/[0.04] p-4">
          <p className="text-sm font-medium text-amber-200">Your role: the Judge.</p>
          <p className="mt-1.5 text-[15px] leading-relaxed text-white/75">
            Question witnesses. Examine evidence. Build your own reconstruction of the night.
            When you're ready — and only you decide when that is — deliver your verdict.
          </p>
        </div>
      </div>

      <button
        onClick={onBegin}
        className="mx-auto mt-10 w-full max-w-md rounded-2xl bg-amber-400 py-4 text-lg font-semibold text-black shadow-lg shadow-amber-400/20 active:scale-[0.98] transition-transform"
      >
        Begin the case
      </button>
    </div>
  );
}
