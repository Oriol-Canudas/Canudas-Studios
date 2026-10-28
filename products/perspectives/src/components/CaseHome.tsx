import { useState } from "react";
import { CASE_META, HOME_HERO_IMAGE, WITNESSES } from "../game/caseData";
import { prefersReducedMotion } from "../game/motion";
import Portrait from "./Portrait";

interface CaseHomeProps {
  onBegin: () => void;
}

/**
 * A cinematic arrival screen — the hero image dominates the viewport and
 * every text beat sits directly on top of it with a gradient scrim, the
 * way a film's title card works, instead of a thin image band followed by
 * bordered info cards stacked underneath (read as a settings menu in
 * playtest feedback, twice). No separate "THE REVIEW" card, no scrolling
 * marquee (caused real readability bugs on two rounds — replaced with a
 * single static tagline instead, which is also just how a film poster
 * actually presents a tagline). Presentational only, over the same
 * CASE_META/WITNESSES data every case already provides — improves every
 * case's home screen, not just this one. Every animation freezes to its
 * end state instantly when the OS asks for reduced motion.
 */
export default function CaseHome({ onBegin }: CaseHomeProps) {
  const [reduced] = useState(prefersReducedMotion);

  const fadeUp = (delayMs: number) =>
    reduced ? undefined : { opacity: 0, animation: `caseHomeFadeUp 600ms ease-out ${delayMs}ms forwards` };

  return (
    <div className="flex min-h-full flex-col bg-[#0a0a0d] text-white">
      <style>{`
        @keyframes caseHomeKenBurns { from { transform: scale(1); } to { transform: scale(1.1); } }
        @keyframes caseHomeFadeUp { from { opacity: 0; transform: translateY(14px); } to { opacity: 1; transform: translateY(0); } }
      `}</style>

      {/* Hero — dominates the screen, every text beat lives on top of the
          image itself, not in a card below it. */}
      <div className="relative h-[72vh] min-h-[460px] w-full shrink-0 overflow-hidden">
        <img
          src={HOME_HERO_IMAGE}
          alt=""
          className="h-full w-full object-cover"
          style={reduced ? undefined : { animation: "caseHomeKenBurns 24s ease-out forwards" }}
        />
        {/* Full-height scrim: dark enough at the very top for the kicker,
            darkest at the bottom where the dense text sits, lighter
            through the middle so the image still reads as a real place. */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/15 to-black/95" />

        <div className="absolute inset-x-0 top-0 px-6 pt-[calc(env(safe-area-inset-top)+20px)]">
          <p
            className="text-xs uppercase tracking-[0.35em] text-amber-300/90 drop-shadow-lg"
            style={fadeUp(0)}
          >
            {CASE_META.kicker}
          </p>
        </div>

        <div className="absolute inset-x-0 bottom-0 px-6 pb-7">
          <h1 className="text-5xl font-semibold leading-[1.02] drop-shadow-lg" style={fadeUp(120)}>
            {CASE_META.title}
          </h1>
          <p
            className="mt-2.5 font-serif text-lg italic leading-snug text-amber-100/90 drop-shadow-lg"
            style={fadeUp(320)}
          >
            {CASE_META.causeOfDeath}
          </p>

          <p className="mt-5 max-w-md text-[17px] leading-relaxed text-white/90 drop-shadow-lg" style={fadeUp(520)}>
            {CASE_META.charge}
          </p>

          <div className="mt-4 flex flex-col gap-1.5">
            {CASE_META.admits.map((a, i) => (
              <p
                key={a}
                className="text-sm text-white/70 drop-shadow-lg"
                style={fadeUp(700 + i * 220)}
              >
                <span className="text-amber-300/80">{"✓"}</span> {a}
              </p>
            ))}
          </div>

          <p
            className="mt-3 text-base font-semibold text-white drop-shadow-lg"
            style={fadeUp(700 + CASE_META.admits.length * 220 + 200)}
          >
            {CASE_META.standingLine}
          </p>
        </div>
      </div>

      {/* Below the hero — minimal chrome: a credits-style cast strip, the
          role line, and the CTA. No bordered cards. */}
      <div className="mx-auto w-full max-w-md flex-1 px-6 pb-8 pt-7">
        <p className="mb-3 text-xs uppercase tracking-[0.3em] text-white/45">Starring</p>
        <div className="-mx-6 flex snap-x gap-5 overflow-x-auto px-6 pb-2">
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
              <span className="max-w-[96px] truncate text-center text-sm text-white/80">{w.name}</span>
            </div>
          ))}
        </div>

        <div className="mt-7 flex items-center gap-2.5 text-amber-100/90">
          <span className="text-xl">{CASE_META.roleIcon}</span>
          <p className="text-[15px] leading-snug">{CASE_META.roleLine}</p>
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
