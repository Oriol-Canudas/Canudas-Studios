import { useEffect, useRef, useState } from "react";
import { WITNESS_BY_ID } from "../game/caseData";
import { useGameStore } from "../game/store";
import { isTopicReachable } from "../game/witnessEngine";
import type { EvidenceId, WitnessId } from "../game/types";
import Portrait from "./Portrait";
import DemeanorBadge from "./DemeanorBadge";
import TypewriterText from "./TypewriterText";
import TypingIndicator from "./TypingIndicator";
import EvidencePicker from "./EvidencePicker";

interface WitnessChatProps {
  witnessId: WitnessId;
  onBack: () => void;
  onInspect: () => void;
}

export default function WitnessChat({ witnessId, onBack, onInspect }: WitnessChatProps) {
  const witness = WITNESS_BY_ID[witnessId];
  const askWitness = useGameStore((s) => s.askWitness);
  const presentEvidence = useGameStore((s) => s.presentEvidence);
  const openWitness = useGameStore((s) => s.openWitness);
  const setDraft = useGameStore((s) => s.setDraft);
  const messages = useGameStore((s) => s.chatHistory[witnessId]);
  const witnessStages = useGameStore((s) => s.witnessStages);
  const currentDemeanor = useGameStore((s) => s.demeanor[witnessId]);
  const discoveredEvidence = useGameStore((s) => s.discoveredEvidence);
  const draft = useGameStore((s) => s.drafts[witnessId]);

  const [typingIndex, setTypingIndex] = useState<number | null>(null);
  const [animatingIndex, setAnimatingIndex] = useState<number | null>(null);
  const [pickerOpen, setPickerOpen] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const prevLenRef = useRef(messages.length);

  const busy = typingIndex !== null || animatingIndex !== null;

  useEffect(() => {
    openWitness(witnessId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [witnessId]);

  // When a new witness line appears, hold it behind a brief "typing" beat,
  // then reveal it at a human reading/typing pace. Historical lines (from
  // before this screen mounted, or the player's own messages) render
  // instantly — only the single freshest witness reply animates.
  useEffect(() => {
    const newLen = messages.length;
    if (newLen > prevLenRef.current) {
      const lastIdx = newLen - 1;
      const last = messages[lastIdx];
      if (last.role === "witness") {
        setTypingIndex(lastIdx);
        const t = setTimeout(() => {
          setTypingIndex(null);
          setAnimatingIndex(lastIdx);
        }, 450);
        prevLenRef.current = newLen;
        return () => clearTimeout(t);
      }
    }
    prevLenRef.current = newLen;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [messages.length]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, typingIndex, animatingIndex]);

  function send(text: string, topicId?: string) {
    const trimmed = text.trim();
    if (!trimmed || busy) return;
    askWitness(witnessId, trimmed, topicId);
  }

  function handlePresent(evidenceId: EvidenceId, excerptIndex: number) {
    presentEvidence(witnessId, evidenceId, excerptIndex);
    setPickerOpen(false);
  }

  const visibleTopics = witness.topics.filter((t) => isTopicReachable(t, witnessStages));

  return (
    <div className="flex h-full flex-col pb-[calc(env(safe-area-inset-bottom)+0px)]">
      <div className="flex items-center gap-3 border-b border-white/10 bg-black/40 px-4 py-3">
        <button onClick={onBack} className="text-2xl text-white/70 active:text-white">
          {"←"}
        </button>
        <button onClick={onInspect}>
          <Portrait name={witness.name} accentColor={witness.accentColor} image={witness.portraitImage} size="sm" />
        </button>
        <div className="min-w-0 flex-1">
          <p className="truncate text-lg font-medium text-white">{witness.name}</p>
          <p className="truncate text-sm text-white/50">{witness.role}</p>
        </div>
        <DemeanorBadge demeanor={currentDemeanor} />
      </div>

      <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-4">
        <div className="mb-4 rounded-xl border border-white/10 bg-white/[0.03] p-3.5 text-base leading-relaxed text-white/60">
          {witness.context}
        </div>

        <div className="space-y-3">
          {messages.map((m, i) => {
            if (i === typingIndex) {
              return (
                <div key={i} className="flex justify-start">
                  <TypingIndicator />
                </div>
              );
            }
            if (m.role === "evidence") {
              return (
                <div key={i} className="flex justify-center">
                  <div className="max-w-[90%] rounded-xl border border-amber-300/25 bg-amber-300/[0.07] px-4 py-2.5 text-center text-sm text-amber-100/90">
                    {"\u{1F4C4} Presented: "}
                    {m.text}
                  </div>
                </div>
              );
            }
            return (
              <div key={i} className={`flex ${m.role === "player" ? "justify-end" : "justify-start"}`}>
                <div
                  className={`max-w-[85%] rounded-2xl px-4 py-3 text-[17px] leading-relaxed ${
                    m.role === "player"
                      ? "bg-amber-400 text-black rounded-br-sm"
                      : "bg-white/10 text-white rounded-bl-sm"
                  }`}
                >
                  {i === animatingIndex ? (
                    <TypewriterText text={m.text} onDone={() => setAnimatingIndex(null)} />
                  ) : (
                    m.text
                  )}
                </div>
              </div>
            );
          })}
          {messages.length === 0 && (
            <p className="py-8 text-center text-base text-white/40">No questions yet. Try one below.</p>
          )}
        </div>
      </div>

      <div className="border-t border-white/10 bg-black/40 px-3 pb-3 pt-2">
        <div className="mb-2 flex flex-wrap gap-2">
          {visibleTopics.map((t) => {
            const asked = (witnessStages[witnessId][t.id] ?? -1) >= 0;
            return (
              <button
                key={t.id}
                onClick={() => send(t.chipLabel, t.id)}
                disabled={busy}
                className={`whitespace-nowrap rounded-full border px-3.5 py-2 text-sm transition-colors disabled:opacity-50 ${
                  asked
                    ? "border-white/10 bg-white/[0.02] text-white/40"
                    : "border-amber-300/30 bg-amber-300/10 text-amber-200"
                }`}
              >
                {t.chipLabel}
              </button>
            );
          })}
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            send(draft);
          }}
          className="flex items-center gap-2"
        >
          <button
            type="button"
            onClick={() => setPickerOpen(true)}
            aria-label="Present evidence"
            className="shrink-0 rounded-full border border-white/15 bg-white/[0.05] p-3 text-lg text-white/70 active:text-white"
          >
            {"\u{1F4C4}"}
          </button>
          <input
            value={draft}
            onChange={(e) => setDraft(witnessId, e.target.value)}
            placeholder="Ask in your own words, or tap a suggestion"
            aria-label={`Ask ${witness.name} a question`}
            disabled={busy}
            className="flex-1 rounded-full border border-white/15 bg-white/[0.05] px-4 py-3 text-[17px] text-white placeholder:text-white/35 outline-none focus:border-amber-300/50 disabled:opacity-60"
          />
          <button
            type="submit"
            disabled={busy || !draft.trim()}
            className="shrink-0 rounded-full bg-amber-400 px-5 py-3 text-base font-semibold text-black active:scale-95 transition-transform disabled:opacity-40"
          >
            Ask
          </button>
        </form>
      </div>

      {pickerOpen && (
        <EvidencePicker discoveredIds={discoveredEvidence} onPresent={handlePresent} onClose={() => setPickerOpen(false)} />
      )}
    </div>
  );
}
