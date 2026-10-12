import { useEffect, useState } from "react";
import { useGameStore } from "../game/store";
import { prefersReducedMotion } from "../game/motion";

const DISPLAY_MS = 2600;

/**
 * A brief, restrained "something just happened" toast + glow — never
 * confetti, never blocks input. Triggered by the store's transient
 * `celebration` signal (set only on a real contradiction or voluntary
 * disclosure — see advanceTopic in store.ts), self-dismisses on its own
 * timer regardless of what else happens in the meantime.
 */
export default function BreakthroughToast() {
  const celebration = useGameStore((s) => s.celebration);
  const dismissCelebration = useGameStore((s) => s.dismissCelebration);
  const [reduceMotion] = useState(prefersReducedMotion);

  useEffect(() => {
    if (!celebration) return;
    const t = setTimeout(dismissCelebration, reduceMotion ? 1200 : DISPLAY_MS);
    return () => clearTimeout(t);
  }, [celebration, dismissCelebration, reduceMotion]);

  if (!celebration) return null;

  const isDisclosure = celebration.kind === "voluntary_disclosure";
  const label = isDisclosure ? "Breakthrough" : "Contradiction found";
  const icon = isDisclosure ? "✨" : "⚡";
  const accent = isDisclosure ? "border-amber-300/40 bg-amber-300/10 text-amber-100" : "border-red-400/30 bg-red-400/10 text-red-100";

  return (
    <div className="fixed inset-x-4 top-[calc(env(safe-area-inset-top)+12px)] z-50 flex justify-center pointer-events-none">
      <div
        key={celebration.message}
        className={`flex max-w-sm items-start gap-2.5 rounded-2xl border px-4 py-3 shadow-lg backdrop-blur-md ${accent} ${reduceMotion ? "" : "animate-[breakthrough-in_0.3s_ease-out]"}`}
      >
        <span className="text-lg leading-none">{icon}</span>
        <div>
          <p className="text-sm font-semibold leading-tight">{label}</p>
          <p className="mt-0.5 text-sm leading-snug opacity-90">{celebration.message}</p>
        </div>
      </div>
    </div>
  );
}
