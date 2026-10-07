import { useEffect, useRef, useState } from "react";
import { WITNESS_BY_ID } from "../game/caseData";
import { useGameStore } from "../game/store";
import type { WitnessId } from "../game/types";
import Portrait from "./Portrait";

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

  const [draft, setDraft] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    openWitness(witnessId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [witnessId]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages]);

  function send(text: string, topicId?: string) {
    const trimmed = text.trim();
    if (!trimmed) return;
    askWitness(witnessId, trimmed, topicId);
    setDraft("");
  }

  return (
    <div className="flex h-full flex-col pb-[calc(env(safe-area-inset-bottom)+0px)]">
      <div className="flex items-center gap-3 border-b border-white/10 bg-black/40 px-4 py-3">
        <button onClick={onBack} className="text-xl text-white/70 active:text-white">
          {"←"}
        </button>
        <Portrait name={witness.name} accentColor={witness.accentColor} size="sm" />
        <div className="min-w-0">
          <p className="truncate font-medium text-white">{witness.name}</p>
          <p className="truncate text-xs text-white/50">{witness.role}</p>
        </div>
      </div>

      <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-4">
        <div className="mb-4 rounded-xl border border-white/10 bg-white/[0.03] p-3 text-sm leading-relaxed text-white/60">
          {witness.context}
        </div>

        <div className="space-y-3">
          {messages.map((m, i) => (
            <div key={i} className={`flex ${m.role === "player" ? "justify-end" : "justify-start"}`}>
              <div
                className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 text-[15px] leading-relaxed ${
                  m.role === "player"
                    ? "bg-amber-400 text-black rounded-br-sm"
                    : "bg-white/10 text-white rounded-bl-sm"
                }`}
              >
                {m.text}
              </div>
            </div>
          ))}
          {messages.length === 0 && (
            <p className="py-8 text-center text-sm text-white/40">No questions yet. Try one below.</p>
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
                className={`shrink-0 whitespace-nowrap rounded-full border px-3 py-1.5 text-xs transition-colors ${
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
            className="flex-1 rounded-full border border-white/15 bg-white/[0.05] px-4 py-2.5 text-[15px] text-white placeholder:text-white/35 outline-none focus:border-amber-300/50"
          />
          <button
            type="submit"
            className="shrink-0 rounded-full bg-amber-400 px-4 py-2.5 text-sm font-semibold text-black active:scale-95 transition-transform"
          >
            Ask
          </button>
        </form>
      </div>
    </div>
  );
}
