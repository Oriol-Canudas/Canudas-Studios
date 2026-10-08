import { REVELATIONS } from "../game/caseData";
import type { RevelationId, WitnessId } from "../game/types";

interface RelayPickerProps {
  options: RevelationId[];
  witnessId: WitnessId;
  onRelay: (revelationId: RevelationId) => void;
  onClose: () => void;
}

export default function RelayPicker({ options, onRelay, onClose }: RelayPickerProps) {
  return (
    <div className="fixed inset-0 z-40 flex items-end bg-black/70" onClick={onClose}>
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full rounded-t-3xl border-t border-white/10 bg-[#121018] p-5 pb-[calc(env(safe-area-inset-bottom)+24px)] max-h-[75vh] overflow-y-auto"
      >
        <div className="mx-auto mb-4 h-1 w-10 rounded-full bg-white/20" />
        <p className="text-lg font-semibold text-white">Tell them what you've learned</p>
        <p className="mt-1 text-sm text-white/50">
          You're the one carrying information between witnesses — pick what to relay. Once told, it's told.
        </p>
        <div className="mt-4 space-y-2">
          {options.map((id) => {
            const rev = REVELATIONS[id];
            return (
              <button
                key={id}
                onClick={() => onRelay(id)}
                className="w-full rounded-xl border border-sky-300/25 bg-sky-300/[0.06] p-3.5 text-left text-[16px] leading-relaxed text-white/85 active:border-sky-300/50"
              >
                {rev.label}
              </button>
            );
          })}
        </div>
        <button onClick={onClose} className="mt-5 w-full rounded-xl bg-white/10 py-3.5 text-base font-medium text-white">
          Close
        </button>
      </div>
    </div>
  );
}
