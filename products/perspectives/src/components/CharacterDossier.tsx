import { useGameStore } from "../game/store";
import { DEMEANOR_STYLE } from "../game/demeanor";
import type { WitnessConfig } from "../game/types";

interface CharacterDossierProps {
  witness: WitnessConfig;
  onClose: () => void;
  onQuestion: () => void;
}

export default function CharacterDossier({ witness, onClose, onQuestion }: CharacterDossierProps) {
  const demeanor = useGameStore((s) => s.demeanor[witness.id]);
  const style = DEMEANOR_STYLE[demeanor];

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-[#0a0a0d]">
      <div className="relative h-[52vh] w-full shrink-0 overflow-hidden">
        <img src={witness.portraitImage} alt={witness.name} className="h-full w-full object-cover object-top" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0d] via-[#0a0a0d]/10 to-black/40" />
        <button
          onClick={onClose}
          className="absolute right-4 top-[calc(env(safe-area-inset-top)+12px)] flex h-10 w-10 items-center justify-center rounded-full bg-black/50 text-xl text-white backdrop-blur-sm"
        >
          {"✕"}
        </button>
        <div className="absolute inset-x-0 bottom-0 px-6 pb-5">
          <span className={`inline-flex items-center gap-1.5 rounded-full ${style.bg} px-2.5 py-1 text-xs font-medium ${style.text}`}>
            <span className={`h-1.5 w-1.5 rounded-full ${style.dot}`} />
            {style.label}
          </span>
          <h1 className="mt-2 text-3xl font-semibold text-white drop-shadow-lg">{witness.name}</h1>
          <p className="text-base text-white/70">{witness.role}</p>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-6 py-5">
        <p className="text-sm font-medium uppercase tracking-wide text-white/50">Key facts</p>
        <ul className="mt-2.5 space-y-2.5">
          {witness.keyFacts.map((f, i) => (
            <li key={i} className="flex gap-2.5 text-[17px] leading-snug text-white/85">
              <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full" style={{ background: witness.accentColor }} />
              {f}
            </li>
          ))}
        </ul>
      </div>

      <div className="px-6 pb-[calc(env(safe-area-inset-bottom)+20px)] pt-2">
        <button
          onClick={onQuestion}
          className="w-full rounded-2xl py-4 text-lg font-semibold text-black active:scale-[0.98] transition-transform"
          style={{ background: witness.accentColor }}
        >
          Question {witness.name.split(" ")[0]}
        </button>
      </div>
    </div>
  );
}
