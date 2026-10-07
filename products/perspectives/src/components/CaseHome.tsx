import { CASE_META, WITNESSES } from "../game/caseData";
import Portrait from "./Portrait";

interface CaseHomeProps {
  onBegin: () => void;
}

const ADMITS = ["Was there that night", "They argued", "Touched the knife earlier"];

export default function CaseHome({ onBegin }: CaseHomeProps) {
  return (
    <div className="flex min-h-full flex-col bg-gradient-to-b from-[#0a0a0d] via-[#0a0a0d] to-[#121018] text-white">
      <div className="relative h-48 w-full overflow-hidden">
        <img src="/scenes/home.jpg" alt="" className="h-full w-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0d] via-[#0a0a0d]/40 to-transparent" />
        <div className="absolute inset-x-0 bottom-0 px-6 pb-4">
          <p className="text-xs uppercase tracking-[0.3em] text-amber-300/90">Perspective — Case 002</p>
          <h1 className="mt-1 text-4xl font-semibold leading-tight drop-shadow-lg">{CASE_META.title}</h1>
        </div>
      </div>

      <div className="mx-auto w-full max-w-md flex-1 px-6 pb-10 pt-6">
        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
          <p className="text-sm uppercase tracking-wide text-red-300/80">The Charge</p>
          <p className="mt-2 text-[18px] font-medium leading-snug text-white/90">{CASE_META.charge}</p>
          <p className="mt-2 text-sm text-white/50">{CASE_META.causeOfDeath}</p>

          <div className="mt-4 flex flex-wrap gap-2">
            {ADMITS.map((a) => (
              <span key={a} className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5 text-sm text-white/75">
                {"✓"} {a}
              </span>
            ))}
          </div>
          <p className="mt-3 text-base font-semibold text-white">She denies killing him.</p>
        </div>

        <div className="mt-6">
          <p className="text-sm uppercase tracking-wide text-white/60 mb-3">You will hear from</p>
          <div className="flex flex-wrap gap-3">
            {WITNESSES.map((w) => (
              <div key={w.id} className="flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.03] py-1.5 pl-1.5 pr-3.5">
                <Portrait name={w.name} accentColor={w.accentColor} image={w.portraitImage} size="sm" />
                <span className="text-base text-white/80">{w.name}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-6 flex items-center gap-3 rounded-2xl border border-amber-400/20 bg-amber-400/[0.04] p-4">
          <span className="text-2xl">{"⚖️"}</span>
          <p className="text-base leading-snug text-amber-100">
            You're the Judge. Question, examine, decide — whenever you're ready.
          </p>
        </div>
      </div>

      <div className="px-6 pb-10">
        <button
          onClick={onBegin}
          className="mx-auto w-full max-w-md rounded-2xl bg-amber-400 py-4 text-lg font-semibold text-black shadow-lg shadow-amber-400/20 active:scale-[0.98] transition-transform"
        >
          Begin the case
        </button>
      </div>
    </div>
  );
}
