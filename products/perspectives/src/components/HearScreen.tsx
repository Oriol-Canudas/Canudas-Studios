import { useEffect } from "react";
import { WITNESSES } from "../game/caseData";
import { useGameStore } from "../game/store";
import { isProactiveContactEligible } from "../game/witnessEngine";
import type { WitnessId } from "../game/types";
import Portrait from "./Portrait";
import DemeanorBadge from "./DemeanorBadge";

interface HearScreenProps {
  onSelect: (id: WitnessId) => void;
  onInspect: (id: WitnessId) => void;
}

export default function HearScreen({ onSelect, onInspect }: HearScreenProps) {
  const chatHistory = useGameStore((s) => s.chatHistory);
  const demeanor = useGameStore((s) => s.demeanor);
  const witnessStages = useGameStore((s) => s.witnessStages);
  const discoveredEvidence = useGameStore((s) => s.discoveredEvidence);
  const relayedRevelations = useGameStore((s) => s.relayedRevelations);
  const deliveredProactiveContacts = useGameStore((s) => s.deliveredProactiveContacts);
  const alertedProactiveContacts = useGameStore((s) => s.alertedProactiveContacts);
  const markProactiveContactAlerted = useGameStore((s) => s.markProactiveContactAlerted);

  // Plays the one-time alert sound exactly when a contact newly becomes
  // eligible — the store-backed "alerted" set (not component state) means
  // switching to Examine/Reason and back never re-triggers it.
  useEffect(() => {
    for (const w of WITNESSES) {
      const delivered = deliveredProactiveContacts[w.id];
      const alerted = alertedProactiveContacts[w.id];
      const eligible = w.topics.find(
        (t) => t.proactive && !delivered?.has(t.id) && isProactiveContactEligible(t, witnessStages, discoveredEvidence, relayedRevelations)
      );
      if (eligible && !alerted?.has(eligible.id)) markProactiveContactAlerted(w.id, eligible.id);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [witnessStages, discoveredEvidence, relayedRevelations, deliveredProactiveContacts, alertedProactiveContacts]);

  return (
    <div className="px-5 pb-28 pt-6">
      <h2 className="text-2xl font-semibold text-white">Witnesses</h2>
      <p className="mt-1 text-base text-white/55">Tap a portrait for details, or the row to question them.</p>

      <div className="mt-5 space-y-3">
        {WITNESSES.map((w) => {
          const messages = chatHistory[w.id]?.length ?? 0;
          const delivered = deliveredProactiveContacts[w.id];
          const wantsToTalk = w.topics.find(
            (t) =>
              t.proactive &&
              !delivered?.has(t.id) &&
              isProactiveContactEligible(t, witnessStages, discoveredEvidence, relayedRevelations)
          );
          return (
            <div
              key={w.id}
              onClick={() => onSelect(w.id)}
              className="flex w-full items-center gap-3.5 rounded-2xl border border-white/10 bg-white/[0.03] p-4 text-left active:scale-[0.99] transition-transform"
            >
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onInspect(w.id);
                }}
              >
                <Portrait name={w.name} accentColor={w.accentColor} image={w.portraitImage} size="md" glow={Boolean(wantsToTalk)} />
              </button>
              <div className="min-w-0 flex-1">
                <p className="text-lg font-medium text-white">{w.name}</p>
                <p className="truncate text-base text-white/55">{w.role}</p>
                <div className="mt-1.5">
                  <DemeanorBadge demeanor={demeanor[w.id]} />
                </div>
              </div>
              {wantsToTalk ? (
                <span className="shrink-0 rounded-full bg-amber-400/15 px-2.5 py-1 text-sm font-medium text-amber-300 animate-pulse">
                  {"💬"} {wantsToTalk.proactive!.badgeLabel}
                </span>
              ) : (
                messages > 0 && (
                  <span className="shrink-0 rounded-full bg-white/10 px-2.5 py-1 text-sm text-white/70">
                    {Math.ceil(messages / 2)} asked
                  </span>
                )
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
