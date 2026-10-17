// A small fixed-position number on every screen, purely so a screen can
// be referenced by number ("screen 4 has an issue") during review. Not
// part of the product experience — kept deliberately quiet.
export default function ScreenBadge({ n }: { n: number }) {
  return (
    <div
      className="fixed top-3 left-3 z-50 w-7 h-7 rounded-full bg-ink/70 text-cream text-xs font-semibold flex items-center justify-center pointer-events-none select-none"
      aria-hidden="true"
    >
      {n}
    </div>
  )
}
