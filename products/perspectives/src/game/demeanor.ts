import type { Demeanor } from "./types";

export const DEMEANOR_STYLE: Record<Demeanor, { label: string; dot: string; text: string; bg: string }> = {
  composed: { label: "Composed", dot: "bg-slate-400", text: "text-slate-300", bg: "bg-slate-400/10" },
  guarded: { label: "Guarded", dot: "bg-sky-400", text: "text-sky-300", bg: "bg-sky-400/10" },
  defensive: { label: "Defensive", dot: "bg-orange-400", text: "text-orange-300", bg: "bg-orange-400/10" },
  nervous: { label: "Nervous", dot: "bg-yellow-400", text: "text-yellow-300", bg: "bg-yellow-400/10" },
  shaken: { label: "Shaken", dot: "bg-amber-500", text: "text-amber-300", bg: "bg-amber-500/10" },
  panicking: { label: "Panicking", dot: "bg-red-500", text: "text-red-300", bg: "bg-red-500/10" },
  resigned: { label: "Resigned", dot: "bg-violet-400", text: "text-violet-300", bg: "bg-violet-400/10" },
};

/**
 * Same per-demeanor hues as DEMEANOR_STYLE above, as raw colors instead of
 * Tailwind background-utility classes — for anywhere that needs to color
 * a glyph/glow directly (e.g. `style={{ color }}` or a box-shadow) rather
 * than apply a background class. Keep these in sync with DEMEANOR_STYLE's
 * dot colors by eye; they're the same named Tailwind shades.
 */
export const DEMEANOR_HEX: Record<Demeanor, string> = {
  composed: "#94a3b8",
  guarded: "#38bdf8",
  defensive: "#fb923c",
  nervous: "#facc15",
  shaken: "#f59e0b",
  panicking: "#ef4444",
  resigned: "#a78bfa",
};
