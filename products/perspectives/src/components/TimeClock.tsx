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

  return (
    <div
      className={`fixed left-4 top-[calc(env(safe-area-inset-top)+12px)] z-40 flex flex-col items-start rounded-2xl px-3 py-1.5 backdrop-blur-sm ${
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
