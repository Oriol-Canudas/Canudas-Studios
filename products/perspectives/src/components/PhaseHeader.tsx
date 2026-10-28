interface PhaseHeaderProps {
  /** 1-based phase number, rendered as "01 / LABEL". */
  index: number;
  label: string;
  /** Right-aligned accent pill, e.g. "LIVE" — omit for phases with no live state. */
  status?: string;
}

/**
 * A constant sense of "where you are in the story" — a breadcrumb-style
 * phase indicator plus an optional live-status pill, modeled directly on
 * Concert's own header treatment (e.g. "04 / WHAT REMAINS" + "● LIVE").
 * Purely presentational, no case-data coupling — safe to use from any
 * screen in any case.
 */
export default function PhaseHeader({ index, label, status }: PhaseHeaderProps) {
  return (
    <div className="flex items-center justify-between">
      <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-white/45">
        {String(index).padStart(2, "0")} / {label}
      </p>
      {status && (
        <p className="flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-[0.1em] text-amber-300/90">
          <span className="h-1.5 w-1.5 rounded-full bg-amber-300" />
          {status}
        </p>
      )}
    </div>
  );
}
