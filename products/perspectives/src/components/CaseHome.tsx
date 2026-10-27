import { useState } from "react";
import { CASE_META, HOME_HERO_IMAGE, WITNESSES } from "../game/caseData";
import { prefersReducedMotion } from "../game/motion";
import Portrait from "./Portrait";

interface CaseHomeProps {
  onBegin: () => void;
}

/**
 * A cinematic arrival screen instead of an all-at-once info checklist:
 * a slow Ken-Burns hero, the admits revealed one at a time like a film's
 * text beats, a scrolling marquee tagline, and a cast-reveal strip
 * instead of a flat contact list. Presentational only, over the same
 * CASE_META/WITNESSES data every case already provides — improves every
 * case's home screen, not just this one. Every animation freezes to its
 * end state instantly when the OS asks for reduced motion.
 */
export default function CaseHome({ onBegin }: CaseHomeProps) {
  const [reduced] = useState(prefersReducedMotion);

  return (
    <div className="flex min-h-full flex-col bg-gradient-to-b from-[#0a0a0d] via-[#0a0a0d] to-[#121018] text-white">
      <style>{`
        @keyframes caseHomeKenBurns { from { transform: scale(1); } to { transform: scale(1.08); } }
        @keyframes caseHomeFadeUp { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes caseHomeMarquee { from { transform: translateX(0); } to { transform: translateX(-50%); } }
      `}</style>

      <div className="relative h-60 w-full overflow-hidden">
        <img
          src={HOME_HERO_IMAGE}
          alt=""
          className="h-full w-full object-cover"
          style={reduced ? undefined : { animation: "caseHomeKenBurns 20s ease-out forwards" }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0d] via-[#0a0a0d]/40 to-transparent" />
        <div className="absolute inset-x-0 bottom-0 px-6 pb-4">
          <p className="text-xs uppercase tracking-[0.3em] text-amber-300/90">{CASE_META.kicker}</p>
          <h1 className="mt-1 text-4xl font-semibold leading-tight drop-shadow-lg">{CASE_META.title}</h1>
        </div>
      </div>

      {/* A ticker-style pass of the one-line hook — a film tagline, not
          the full charge paragraph (too long to read mid-scroll). A clear
          "•" separator and generous spacing make the loop read as a
          deliberate ticker, not a stray repeated sentence. Reduced-motion:
          shows the line once, centered, no animation. */}
      <div className="overflow-hidden border-y border-white/10 bg-black/40 py-2">
        {reduced ? (
          <p className="text-center text-xs uppercase tracking-[0.2em] text-amber-200/70">{CASE_META.causeOfDeath}</p>
        ) : (
          <div
            className="flex w-max whitespace-nowrap text-xs uppercase tracking-[0.25em] text-amber-200/70"
            style={{ animation: "caseHomeMarquee 26s linear infinite" }}
          >
            {[0, 1].map((i) => (
              <span key={i} className="flex items-center gap-4 pr-4">
                {CASE_META.causeOfDeath}
                <span aria-hidden="true" className="text-amber-200/35">{"•"}</span>
              </span>
            ))}
          </div>
        )}
      </div>

      <div className="mx-auto w-full max-w-md flex-1 px-6 pb-10 pt-6">
        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
          <p className="text-sm uppercase tracking-wide text-red-300/80">{CASE_META.chargeLabel}</p>
          <p className="mt-2 text-[18px] font-medium leading-snug text-white/90">{CASE_META.charge}</p>

          <div className="mt-4 flex flex-wrap gap-2">
            {CASE_META.admits.map((a, i) => (
              <span
                key={a}
                className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5 text-sm text-white/75"
                style={
                  reduced
                    ? undefined
                    : { opacity: 0, animation: `caseHomeFadeUp 500ms ease-out ${i * 400}ms forwards` }
                }
              >
                {"✓"} {a}
              </span>
            ))}
          </div>
          <p
            className="mt-3 text-base font-semibold text-white"
            style={
              reduced
                ? undefined
                : { opacity: 0, animation: `caseHomeFadeUp 500ms ease-out ${CASE_META.admits.length * 400}ms forwards` }
            }
          >
            {CASE_META.standingLine}
          </p>
        </div>

        {/* Cast reveal — bigger portraits, staggered entrance, horizontal
            scroll-snap instead of a wrapped contact-list grid. */}
        <div className="mt-6">
          <p className="mb-3 text-sm uppercase tracking-wide text-white/60">You will hear from</p>
          <div className="-mx-6 flex snap-x gap-4 overflow-x-auto px-6 pb-2">
            {WITNESSES.map((w, i) => (
              <div
                key={w.id}
                className="flex shrink-0 snap-start flex-col items-center gap-2"
                style={
                  reduced
                    ? undefined
                    : { opacity: 0, animation: `caseHomeFadeUp 450ms ease-out ${300 + i * 180}ms forwards` }
                }
              >
                <Portrait name={w.name} accentColor={w.accentColor} image={w.portraitImage} size="lg" />
                <span className="max-w-[88px] truncate text-center text-sm text-white/80">{w.name}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-6 flex items-center gap-3 rounded-2xl border border-amber-400/20 bg-amber-400/[0.04] p-4">
          <span className="text-2xl">{CASE_META.roleIcon}</span>
          <p className="text-base leading-snug text-amber-100">{CASE_META.roleLine}</p>
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
