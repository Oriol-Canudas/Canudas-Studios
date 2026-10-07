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

export default function EvidenceScreen() {
  const discovered = useGameStore((s) => s.discoveredEvidence);
  const discoverEvidence = useGameStore((s) => s.discoverEvidence);
  const inspectEvidence = useGameStore((s) => s.inspectEvidence);
  const [open, setOpen] = useState<EvidenceId | null>(null);

  const openItem = EVIDENCE.find((e) => e.id === open) ?? null;

  function handleOpen(id: EvidenceId) {
    discoverEvidence(id);
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
          Tap a dashed card to request it from the record.
        </p>

        <div className="mt-5 grid grid-cols-2 gap-3">
          {EVIDENCE.map((e) => {
            const isDiscovered = discovered.has(e.id);
            return (
              <button
                key={e.id}
                onClick={() => handleOpen(e.id)}
                className={`flex flex-col items-start gap-2 rounded-2xl border p-4 text-left active:scale-[0.98] transition-transform ${
                  isDiscovered
                    ? "border-white/10 bg-white/[0.04]"
                    : "border-dashed border-white/15 bg-white/[0.015]"
                }`}
              >
                <span className="text-2xl">{CATEGORY_ICON[e.category]}</span>
                <span className="text-base font-medium text-white">{e.title}</span>
                {isDiscovered ? (
                  <span className="text-sm text-white/50">{e.summary}</span>
                ) : (
                  <span className="text-sm font-medium text-amber-300/80">Tap to request</span>
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
