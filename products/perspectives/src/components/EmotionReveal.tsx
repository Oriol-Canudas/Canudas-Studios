import { useEffect } from "react";
import type { Demeanor, WitnessConfig } from "../game/types";

interface EmotionRevealProps {
  witness: WitnessConfig;
  demeanor: Demeanor;
  onDone: () => void;
}

const AUTO_ADVANCE_MS = 2200;
const FADE_MS = 450;

/**
 * A brief full-screen "establishing shot" of a witness's current emotional
 * state — shown once when a conversation opens, and again whenever their
 * demeanor actually changes mid-conversation (never on every line; see
 * DECISIONS.md). Reuses IntroSequence's visual language (full-bleed
 * portrait, lower-third caption, tap-to-skip) for consistency rather than
 * inventing a second cinematic idiom.
 */
export default function EmotionReveal({ witness, demeanor, onDone }: EmotionRevealProps) {
  const image = witness.demeanorImages?.[demeanor] ?? witness.portraitImage;
  const line = witness.demeanorLines?.[demeanor];

  useEffect(() => {
    const t = setTimeout(onDone, AUTO_ADVANCE_MS);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [demeanor]);

  return (
    <div className="fixed inset-0 z-50 bg-black" onClick={onDone}>
      <img
        src={image}
        alt=""
        className="h-full w-full object-cover object-top opacity-80 transition-opacity"
        style={{ transitionDuration: `${FADE_MS}ms` }}
      />
      <div className="absolute inset-0 bg-gradient-to-b from-black/35 via-transparent to-black/90" />
      <div className="absolute inset-x-0 bottom-16 flex flex-col items-center px-8 text-center">
        <p className="text-xs uppercase tracking-[0.3em] text-amber-300/90">{witness.name}</p>
        <p className="mt-1.5 text-2xl font-semibold capitalize text-white drop-shadow-lg">{demeanor}</p>
        {line && <p className="mt-2 max-w-xs text-base leading-snug text-white/80 drop-shadow-lg">{line}</p>}
      </div>
      <p className="absolute right-5 top-[calc(env(safe-area-inset-top)+16px)] text-sm text-white/40">Tap to continue</p>
    </div>
  );
}
