import { useGameStore } from "../game/store";
import { TIME_PRESSURE } from "../game/caseData";

/**
 * Renders nothing when the active case has no TimePressureConfig (every
 * case until Last Ascent) — a true no-op, not just an empty-looking badge.
 */
export default function TimeClock() {
  const minutesRemaining = useGameStore((s) => s.minutesRemaining);
  if (TIME_PRESSURE === null || minutesRemaining === null) return null;

  const urgent = minutesRemaining <= Math.ceil(TIME_PRESSURE.totalMinutes * 0.2);
  const hours = Math.floor(minutesRemaining / 60);
  const mins = minutesRemaining % 60;
  const display = hours > 0 ? `${hours}h ${mins.toString().padStart(2, "0")}m` : `${mins}m`;

  // Bottom-anchored, not top — the top-left/top-right corners are already
  // claimed by back buttons, close buttons, and SoundToggle across every
  // screen this renders on top of, so a fixed top badge reliably ends up
  // covering one of them somewhere. Floating above the bottom bars
  // (TabBar, the witness input bar, the verdict/decision button bar)
  // mirrors the common "floating badge above a chat's input" pattern
  // instead, which only ever overlaps scrollable content, never a control.
  return (
    <div
      className={`fixed right-4 bottom-[calc(env(safe-area-inset-bottom)+88px)] z-40 flex flex-col items-end rounded-2xl px-3 py-1.5 backdrop-blur-sm ${
        urgent ? "bg-red-900/70 text-red-100" : "bg-black/50 text-white/80"
      }`}
    >
      <span className="text-sm font-semibold leading-none">
        {"⏱️"} {display}
      </span>
      <span className="text-[10px] leading-tight opacity-80">{TIME_PRESSURE.label}</span>
    </div>
  );
}
