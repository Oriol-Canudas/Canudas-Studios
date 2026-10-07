import { useEffect, useRef, useState } from "react";
import { WITNESS_BY_ID } from "../game/caseData";
import { useGameStore } from "../game/store";
import type { WitnessId } from "../game/types";
import Portrait from "./Portrait";
import DemeanorBadge from "./DemeanorBadge";
import TypewriterText from "./TypewriterText";
import TypingIndicator from "./TypingIndicator";

interface WitnessChatProps {
  witnessId: WitnessId;
  onBack: () => void;
}

export default function WitnessChat({ witnessId, onBack }: WitnessChatProps) {
  const witness = WITNESS_BY_ID[witnessId];
  const askWitness = useGameStore((s) => s.askWitness);
  const openWitness = useGameStore((s) => s.openWitness);
  const messages = useGameStore((s) => s.chatHistory[witnessId]);
  const witnessStages = useGameStore((s) => s.witnessStages[witnessId]);
  const currentDemeanor = useGameStore((s) => s.demeanor[witnessId]);

  const [draft, setDraft] = useState("");
  const [typingIndex, setTypingIndex] = useState<number | null>(null);
  const [animatingIndex, setAnimatingIndex] = useState<number | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const prevLenRef = useRef(messages.length);

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
    if (!trimmed) return;
    askWitness(witnessId, trimmed, topicId);
    setDraft("");
  }

  return (
    <div className="flex h-full flex-col pb-[calc(env(safe-area-inset-bottom)+0px)]">
      <div className="flex items-center gap-3 border-b border-white/10 bg-black/40 px-4 py-3">
        <button onClick={onBack} className="text-2xl text-white/70 active:text-white">
          {"←"}
        </button>
        <Portrait name={witness.name} accentColor={witness.accentColor} image={witness.portraitImage} size="sm" />
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
        <div className="mb-2 flex gap-2 overflow-x-auto pb-1">
          {witness.topics.map((t) => {
            const asked = (witnessStages[t.id] ?? -1) >= 0;
            return (
              <button
                key={t.id}
                onClick={() => send(t.chipLabel, t.id)}
                className={`shrink-0 whitespace-nowrap rounded-full border px-3.5 py-2 text-sm transition-colors ${
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
          <input
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder="Ask anything…"
            className="flex-1 rounded-full border border-white/15 bg-white/[0.05] px-4 py-3 text-[17px] text-white placeholder:text-white/35 outline-none focus:border-amber-300/50"
          />
          <button
            type="submit"
            className="shrink-0 rounded-full bg-amber-400 px-5 py-3 text-base font-semibold text-black active:scale-95 transition-transform"
          >
            Ask
          </button>
        </form>
      </div>
    </div>
  );
}
