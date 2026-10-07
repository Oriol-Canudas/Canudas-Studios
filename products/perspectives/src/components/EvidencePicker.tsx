import { useState } from "react";
import { EVIDENCE } from "../game/caseData";
import type { EvidenceId } from "../game/types";

interface EvidencePickerProps {
  discoveredIds: Set<EvidenceId>;
  onPresent: (evidenceId: EvidenceId, excerptIndex: number) => void;
  onClose: () => void;
}

export default function EvidencePicker({ discoveredIds, onPresent, onClose }: EvidencePickerProps) {
  const [openId, setOpenId] = useState<EvidenceId | null>(null);
  const available = EVIDENCE.filter((e) => discoveredIds.has(e.id));
  const openItem = available.find((e) => e.id === openId) ?? null;

  return (
    <div className="fixed inset-0 z-40 flex items-end bg-black/70" onClick={onClose}>
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full rounded-t-3xl border-t border-white/10 bg-[#121018] p-5 pb-[calc(env(safe-area-inset-bottom)+24px)] max-h-[75vh] overflow-y-auto"
      >
        <div className="mx-auto mb-4 h-1 w-10 rounded-full bg-white/20" />

        {!openItem ? (
          <>
            <p className="text-lg font-semibold text-white">Present evidence</p>
            <p className="mt-1 text-sm text-white/50">
              Only what you've already requested from the record. Pick a document, then the specific line to put in front of them.
            </p>
            {available.length === 0 && (
              <p className="mt-6 text-center text-sm text-white/40">
                You haven't requested any documents yet — check Examine.
              </p>
            )}
            <div className="mt-4 space-y-2">
              {available.map((e) => (
                <button
                  key={e.id}
                  onClick={() => setOpenId(e.id)}
                  className="w-full rounded-xl border border-white/10 bg-white/[0.03] p-3.5 text-left"
                >
                  <p className="text-base font-medium text-white">{e.title}</p>
                  <p className="mt-0.5 text-sm text-white/50">{e.summary}</p>
                </button>
              ))}
            </div>
          </>
        ) : (
          <>
            <button onClick={() => setOpenId(null)} className="text-sm text-amber-300/80">
              {"← Back"}
            </button>
            <p className="mt-2 text-lg font-semibold text-white">{openItem.title}</p>
            <p className="mt-1 text-sm text-white/50">Tap the specific line to present.</p>
            <div className="mt-3 space-y-2">
              {openItem.details.map((d, i) => (
                <button
                  key={i}
                  onClick={() => onPresent(openItem.id, i)}
                  className="w-full rounded-xl border border-white/10 bg-white/[0.03] p-3.5 text-left text-[16px] leading-relaxed text-white/85 active:border-amber-300/40"
                >
                  {d}
                </button>
              ))}
            </div>
          </>
        )}

        <button onClick={onClose} className="mt-5 w-full rounded-xl bg-white/10 py-3.5 text-base font-medium text-white">
          Close
        </button>
      </div>
    </div>
  );
}
