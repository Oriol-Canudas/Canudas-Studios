import { useState } from "react";
import { EVIDENCE } from "../game/caseData";
import { useGameStore } from "../game/store";
import type { EvidenceId } from "../game/types";

const CATEGORY_ICON: Record<string, string> = {
  physical: "\u{1F52A}",
  message: "\u{1F4AC}",
  video: "\u{1F3A5}",
  forensic: "\u{1F9EA}",
  records: "\u{1F4C4}",
};

// "Pending" replaces the old "Locked" — the document isn't forbidden, it
// just hasn't been pulled from the record yet, and tapping it is exactly
// how you do that. Cool/neutral tone signals "available, not yet taken,"
// not "blocked"; New and Read keep their existing, already-liked colors.
const STATUS_BADGE: Record<"pending" | "new" | "read", { label: string; className: string }> = {
  pending: { label: "\u{1F50E} Request", className: "bg-sky-300/15 text-sky-200 border border-sky-300/30" },
  new: { label: "● New", className: "bg-amber-400 text-black" },
  read: { label: "✓ Read", className: "bg-white/10 text-white/60 border border-white/10" },
};

const DISCOVER_ANIMATION_MS = 480;

export default function EvidenceScreen() {
  const discovered = useGameStore((s) => s.discoveredEvidence);
  const inspected = useGameStore((s) => s.inspectedEvidence);
  const discoverEvidence = useGameStore((s) => s.discoverEvidence);
  const inspectEvidence = useGameStore((s) => s.inspectEvidence);
  const [open, setOpen] = useState<EvidenceId | null>(null);
  const [discovering, setDiscovering] = useState<EvidenceId | null>(null);

  const openItem = EVIDENCE.find((e) => e.id === open) ?? null;

  function handleOpen(id: EvidenceId, alreadyDiscovered: boolean) {
    if (!alreadyDiscovered) {
      // Brief "pulling it from the record" beat — the card flashes and
      // settles into its New look before the detail sheet opens, instead
      // of the request and the read happening in the same instant.
      discoverEvidence(id);
      setDiscovering(id);
      window.setTimeout(() => {
        setDiscovering(null);
        inspectEvidence(id);
        setOpen(id);
      }, DISCOVER_ANIMATION_MS);
      return;
    }
    inspectEvidence(id);
    setOpen(id);
  }

  return (
    <div className="pb-28">
      <div className="relative h-32 w-full overflow-hidden">
        <img src="/scenes/evidence.jpg" alt="" className="h-full w-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0d] via-[#0a0a0d]/30 to-transparent" />
      </div>

      <div className="px-5 pt-5">
        <h2 className="text-2xl font-semibold text-white">Evidence</h2>
        <p className="mt-1 text-base text-white/55">
          Tap a card marked <span className="text-sky-300">Request</span> to pull it from the record.
        </p>

        <div className="mt-5 grid grid-cols-2 gap-3">
          {EVIDENCE.map((e) => {
            const isDiscovered = discovered.has(e.id);
            const isInspected = inspected.has(e.id);
            const isDiscovering = discovering === e.id;
            const status = !isDiscovered ? "pending" : isInspected ? "read" : "new";
            const badge = STATUS_BADGE[status];
            return (
              <button
                key={e.id}
                onClick={() => handleOpen(e.id, isDiscovered)}
                disabled={isDiscovering}
                className={`relative flex flex-col items-start gap-2 rounded-2xl border p-4 text-left transition-all duration-300 ${
                  isDiscovering
                    ? "scale-105 border-amber-300 bg-amber-300/15 shadow-[0_0_28px_rgba(251,191,36,0.5)]"
                    : `active:scale-[0.98] ${
                        status === "pending"
                          ? "border-dashed border-sky-300/25 bg-sky-300/[0.03]"
                          : status === "new"
                            ? "border-amber-300/40 bg-amber-300/[0.06]"
                            : "border-white/10 bg-white/[0.04]"
                      }`
                }`}
              >
                <span
                  className={`absolute right-2.5 top-2.5 rounded-full px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide transition-opacity ${badge.className} ${isDiscovering ? "opacity-0" : "opacity-100"}`}
                >
                  {badge.label}
                </span>
                <span className={`text-2xl ${status === "pending" ? "opacity-60" : ""}`}>{CATEGORY_ICON[e.category]}</span>
                <span className="pr-14 text-base font-medium text-white">{e.title}</span>
                {isDiscovered ? (
                  <span className="text-sm text-white/50">{e.summary}</span>
                ) : (
                  <span className="text-sm font-medium text-sky-200/70">Tap to request</span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {openItem && (
        <div className="fixed inset-0 z-40 flex items-end bg-black/70" onClick={() => setOpen(null)}>
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full rounded-t-3xl border-t border-white/10 bg-[#121018] p-5 pb-[calc(env(safe-area-inset-bottom)+24px)]"
          >
            <div className="mx-auto mb-4 h-1 w-10 rounded-full bg-white/20" />
            <p className="text-xs uppercase tracking-wide text-amber-300/80">{openItem.category}</p>
            <h3 className="mt-1 text-xl font-semibold text-white">{openItem.title}</h3>
            <div className="mt-3 space-y-2">
              {openItem.details.map((d, i) => (
                <p key={i} className="text-[17px] leading-relaxed text-white/80">
                  {d}
                </p>
              ))}
            </div>
            <button
              onClick={() => setOpen(null)}
              className="mt-5 w-full rounded-xl bg-white/10 py-3.5 text-base font-medium text-white"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
