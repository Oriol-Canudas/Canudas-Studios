import { useEffect, useRef, useState } from "react";
import { WITNESS_BY_ID } from "../game/caseData";
import { useGameStore } from "../game/store";
import { isTopicReachable } from "../game/witnessEngine";
import type { EvidenceId, QuestionTone, WitnessId } from "../game/types";
import Portrait from "./Portrait";
import DemeanorBadge from "./DemeanorBadge";
import TypewriterText from "./TypewriterText";
import TypingIndicator from "./TypingIndicator";
import EvidencePicker from "./EvidencePicker";

const MAX_VISIBLE_CHIPS = 3;

// Cosmetic only — color signals the question's tone, never changes what
// the witness can say or how the engine gates anything.
const TONE_STYLE: Record<QuestionTone, string> = {
  soft: "border-sky-300/30 bg-sky-300/10 text-sky-200",
  neutral: "border-amber-300/30 bg-amber-300/10 text-amber-200",
  accusative: "border-red-400/30 bg-red-400/10 text-red-200",
};

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
  const contentRef = useRef<HTMLDivElement>(null);
  const prevLenRef = useRef(messages.length);
  // Whether the player is currently parked at (or near) the bottom of the
  // scroll area. Read inside the ResizeObserver below so a reply growing
  // character-by-character never fights someone who scrolled up to reread
  // earlier testimony.
  const stickToBottomRef = useRef(true);

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
    const el = scrollRef.current;
    if (!el) return;
    function onScroll() {
      stickToBottomRef.current = el!.scrollHeight - el!.scrollTop - el!.clientHeight < 80;
    }
    el.addEventListener("scroll", onScroll, { passive: true });
    return () => el.removeEventListener("scroll", onScroll);
  }, []);

  // A plain effect on `messages`/`animatingIndex` only fires once per state
  // change, not per character — so as TypewriterText grows a long reply,
  // the tail of it sat below the fold until the whole animation finished.
  // Watching the content's actual height instead keeps it pinned to the
  // bottom the entire time text is being "typed," not just at the start
  // and end of it. `behavior: "auto"` (not "smooth") avoids the animation
  // fighting itself on every tiny growth tick.
  useEffect(() => {
    const content = contentRef.current;
    const scroller = scrollRef.current;
    if (!content || !scroller) return;
    const observer = new ResizeObserver(() => {
      if (stickToBottomRef.current) {
        scroller.scrollTo({ top: scroller.scrollHeight, behavior: "auto" });
      }
    });
    observer.observe(content);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (stickToBottomRef.current) {
      scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
    }
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

  // Cap the row at 3 chips so it never eats the screen. Not-yet-asked
  // topics are prioritized (stable on authored order), so once one is
  // used it sinks behind the others and the next reachable topic takes
  // its place — "ask one, see 3 more" — without needing extra state.
  const reachableTopics = witness.topics.filter((t) => isTopicReachable(t, witnessStages));
  const visibleTopics = [...reachableTopics]
    .sort((a, b) => {
      const askedA = (witnessStages[witnessId][a.id] ?? -1) >= 0 ? 1 : 0;
      const askedB = (witnessStages[witnessId][b.id] ?? -1) >= 0 ? 1 : 0;
      return askedA - askedB;
    })
    .slice(0, MAX_VISIBLE_CHIPS);

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

      <div ref={scrollRef} className="flex-1 overflow-y-auto bg-[#0a0a0d] px-4 py-4">
        <div className="mb-4 rounded-xl border border-white/10 bg-white/[0.03] p-3.5 text-base leading-relaxed text-white/60">
          {witness.context}
        </div>

        <div ref={contentRef} className="space-y-3">
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

      {/* A subtly lighter, warm-tinted panel — distinguishes "how you ask"
          (chips + input) from "what was said" (the conversation above),
          which otherwise read as one continuous dark surface. */}
      <div className="border-t border-white/10 bg-[#171319] px-3 pb-3 pt-2">
        <div className="mb-2 flex flex-wrap gap-2">
          {visibleTopics.map((t) => {
            const asked = (witnessStages[witnessId][t.id] ?? -1) >= 0;
            return (
              <button
                key={t.id}
                onClick={() => send(t.chipLabel, t.id)}
                disabled={busy}
                className={`whitespace-nowrap rounded-full border px-3.5 py-2 text-sm transition-colors disabled:opacity-50 ${
                  asked ? "border-white/10 bg-white/[0.02] text-white/40" : TONE_STYLE[t.tone ?? "neutral"]
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
