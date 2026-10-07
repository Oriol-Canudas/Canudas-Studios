import { DEMEANOR_STYLE } from "../game/demeanor";
import type { Demeanor } from "../game/types";

export default function DemeanorBadge({ demeanor, size = "sm" }: { demeanor: Demeanor; size?: "sm" | "md" }) {
  const style = DEMEANOR_STYLE[demeanor];
  const pad = size === "sm" ? "px-2 py-0.5 text-[11px]" : "px-2.5 py-1 text-xs";
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full ${style.bg} ${pad} font-medium ${style.text}`}>
      <span className={`h-1.5 w-1.5 rounded-full ${style.dot}`} />
      {style.label}
    </span>
  );
}
