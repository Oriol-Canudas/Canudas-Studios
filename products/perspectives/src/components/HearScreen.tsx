import { WITNESSES } from "../game/caseData";
import { useGameStore } from "../game/store";
import type { WitnessId } from "../game/types";
import Portrait from "./Portrait";
import DemeanorBadge from "./DemeanorBadge";

interface HearScreenProps {
  onSelect: (id: WitnessId) => void;
}

export default function HearScreen({ onSelect }: HearScreenProps) {
  const chatHistory = useGameStore((s) => s.chatHistory);
  const demeanor = useGameStore((s) => s.demeanor);

  return (
    <div className="px-5 pb-28 pt-6">
      <h2 className="text-2xl font-semibold text-white">Witnesses</h2>
      <p className="mt-1 text-base text-white/55">Tap someone to question them. Ask anything — or use a suggestion.</p>

      <div className="mt-5 space-y-3">
        {WITNESSES.map((w) => {
          const messages = chatHistory[w.id]?.length ?? 0;
          return (
            <button
              key={w.id}
              onClick={() => onSelect(w.id)}
              className="flex w-full items-center gap-3.5 rounded-2xl border border-white/10 bg-white/[0.03] p-4 text-left active:scale-[0.99] transition-transform"
            >
              <Portrait name={w.name} accentColor={w.accentColor} image={w.portraitImage} size="md" />
              <div className="min-w-0 flex-1">
                <p className="text-lg font-medium text-white">{w.name}</p>
                <p className="truncate text-base text-white/55">{w.role}</p>
                <div className="mt-1.5">
                  <DemeanorBadge demeanor={demeanor[w.id]} />
                </div>
              </div>
              {messages > 0 && (
                <span className="shrink-0 rounded-full bg-white/10 px-2.5 py-1 text-sm text-white/70">
                  {Math.ceil(messages / 2)} asked
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
