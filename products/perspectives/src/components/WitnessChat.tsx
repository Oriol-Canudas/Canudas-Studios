import { useEffect, useRef, useState } from "react";
import { EVIDENCE_BY_ID, REVELATIONS, WITNESS_BY_ID } from "../game/caseData";
import { useGameStore } from "../game/store";
import { isRevelationKnown, isTopicReachable, suggestedEvidenceFor } from "../game/witnessEngine";
import { prefersReducedMotion } from "../game/motion";
import type { Demeanor, EvidenceId, RevelationId, TestimonyTopic, WitnessId } from "../game/types";
import Portrait from "./Portrait";
import DemeanorBadge from "./DemeanorBadge";
import TypewriterText from "./TypewriterText";
import TypingIndicator from "./TypingIndicator";
import EvidencePicker from "./EvidencePicker";
import RelayPicker from "./RelayPicker";
import EmotionReveal from "./EmotionReveal";

const MAX_VISIBLE_CHIPS = 3;

interface WitnessChatProps {
  witnessId: WitnessId;
  onBack: () => void;
  onInspect: () => void;
  onViewEvidence: (evidenceId: EvidenceId) => void;
}

export default function WitnessChat({ witnessId, onBack, onInspect, onViewEvidence }: WitnessChatProps) {
  const witness = WITNESS_BY_ID[witnessId];
  const isFreeform = Boolean(witness.freeformEnabled); // Tom and Sofia, this round — see DECISIONS.md

  const askWitness = useGameStore((s) => s.askWitness);
  const presentEvidence = useGameStore((s) => s.presentEvidence);
  const relayRevelation = useGameStore((s) => s.relayRevelation);
  const sendFreeformMessage = useGameStore((s) => s.sendFreeformMessage);
  const retryFreeformMessage = useGameStore((s) => s.retryFreeformMessage);
  const openWitness = useGameStore((s) => s.openWitness);
  const setDraft = useGameStore((s) => s.setDraft);
  const messages = useGameStore((s) => s.chatHistory[witnessId]);
  const witnessStages = useGameStore((s) => s.witnessStages);
  const currentDemeanor = useGameStore((s) => s.demeanor[witnessId]);
  const discoveredEvidence = useGameStore((s) => s.discoveredEvidence);
  const relayedRevelations = useGameStore((s) => s.relayedRevelations[witnessId]);
  const deliveredProactiveContacts = useGameStore((s) => s.deliveredProactiveContacts[witnessId]);
  const pending = useGameStore((s) => s.pendingWitnesses.has(witnessId));
  const draft = useGameStore((s) => s.drafts[witnessId]);

  const [typingIndex, setTypingIndex] = useState<number | null>(null);
  const [animatingIndex, setAnimatingIndex] = useState<number | null>(null);
  const [evidencePickerOpen, setEvidencePickerOpen] = useState(false);
  const [relayPickerOpen, setRelayPickerOpen] = useState(false);
  // A tapped suggestion pre-fills the input rather than sending instantly
  // — "here's a starting point," not "pick a branch." Remembers which
  // topic it came from so an UNEDITED send still carries the same
  // reliable hint a chip always gave a deterministic witness; any edit
  // at all drops it and the message is treated as organic free text,
  // same as typing from scratch. Freeform witnesses (Tom, Sofia) never
  // use this hint at all — see `send` below — every message to them
  // goes through real generation, suggested or not.
  const [lastSuggestion, setLastSuggestion] = useState<{ text: string; topicId: string } | null>(null);
  // Suggestions start OPEN on entering a conversation (per the "don't drop
  // the player into a blank box with no context" fix) — the player can
  // still collapse them via the toggle. Once asked about, a topic drops
  // out of the suggestion list ENTIRELY rather than lingering greyed out.
  // suggestionPage cycles through the remaining unasked topics
  // MAX_VISIBLE_CHIPS at a time, wrapping back to the start past the end.
  const [suggestionsOpen, setSuggestionsOpen] = useState(true);
  const [suggestionPage, setSuggestionPage] = useState(0);
  // Per-mount only (not persisted) — dismissing "you might want to
  // examine X" just quiets it for this visit; if it's still the most
  // relevant unexamined lead next time this chat opens, it resurfaces,
  // which is the point (a reminder, not a one-shot toast).
  const [dismissedNudges, setDismissedNudges] = useState<Set<EvidenceId>>(new Set());
  const inputRef = useRef<HTMLInputElement>(null);
  // Shows once on open (an "establishing shot" of their current state) and
  // again whenever demeanor actually changes mid-conversation — never on
  // every line. WitnessChat remounts per witness (App.tsx unmounts it when
  // you go back), so seeding this from currentDemeanor at mount is exactly
  // the "show current state on open" behavior, for free.
  const [activeReveal, setActiveReveal] = useState<Demeanor | null>(currentDemeanor);
  const prevDemeanorRef = useRef(currentDemeanor);
  const scrollRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const prevLenRef = useRef(messages.length);
  const reducedMotionRef = useRef(prefersReducedMotion());
  // Whether the player is currently parked at (or near) the bottom of the
  // scroll area. Read inside the ResizeObserver below so a reply growing
  // character-by-character never fights someone who scrolled up to reread
  // earlier testimony.
  const stickToBottomRef = useRef(true);

  const busy = typingIndex !== null || animatingIndex !== null || pending;

  useEffect(() => {
    openWitness(witnessId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [witnessId]);

  useEffect(() => {
    if (currentDemeanor !== prevDemeanorRef.current) {
      prevDemeanorRef.current = currentDemeanor;
      setActiveReveal(currentDemeanor);
    }
  }, [currentDemeanor]);

  // When a new witness line appears, hold it behind a brief "typing" beat
  // — longer for a line carrying a dramatic cue (a considered pause before
  // a difficult answer), shorter for an ordinary one, and always short
  // when the device asks for reduced motion. Historical lines (from
  // before this screen mounted, or the player's own messages) render
  // instantly — only the single freshest witness reply animates.
  useEffect(() => {
    const newLen = messages.length;
    if (newLen > prevLenRef.current) {
      const lastIdx = newLen - 1;
      const last = messages[lastIdx];
      if (last.role === "witness") {
        const pauseMs = reducedMotionRef.current ? 80 : Math.min(last.cue?.pauseMs ?? 450, 900);
        setTypingIndex(lastIdx);
        const t = setTimeout(() => {
          setTypingIndex(null);
          setAnimatingIndex(lastIdx);
        }, pauseMs);
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
  }, [messages, typingIndex, animatingIndex, pending]);

  function skipPause() {
    if (typingIndex === null) return;
    setTypingIndex(null);
    setAnimatingIndex(typingIndex);
  }

  function send(text: string) {
    const trimmed = text.trim();
    if (!trimmed || busy) return;
    // Freeform witnesses always go through real generation — a tapped
    // suggestion is a starting point for the SAME conversation, not a
    // shortcut around it, so it never bypasses interpretation.
    if (isFreeform) {
      void sendFreeformMessage(witnessId, trimmed);
      setLastSuggestion(null);
      return;
    }
    // Deterministic witnesses: an UNEDITED suggestion still carries the
    // exact topic hint a chip always guaranteed (matchTopic's keyword
    // overlap isn't always reliable enough on its own — see
    // scripts/selftest.ts history for real examples of ambiguous
    // phrasing matching the wrong topic). Any edit at all means the
    // player wrote their own question, so it's resolved fresh, same as
    // typing from scratch always has been.
    const hintTopicId =
      lastSuggestion && lastSuggestion.text.trim() === trimmed ? lastSuggestion.topicId : undefined;
    askWitness(witnessId, trimmed, hintTopicId);
    setLastSuggestion(null);
  }

  function handleSuggestionTap(topic: TestimonyTopic) {
    if (busy) return;
    setDraft(witnessId, topic.chipLabel);
    setLastSuggestion({ text: topic.chipLabel, topicId: topic.id });
    setSuggestionsOpen(false);
    inputRef.current?.focus();
  }

  function handlePresent(evidenceId: EvidenceId, excerptIndex: number) {
    presentEvidence(witnessId, evidenceId, excerptIndex);
    setEvidencePickerOpen(false);
  }

  function handleRelay(revelationId: RevelationId) {
    void relayRevelation(witnessId, revelationId);
    setRelayPickerOpen(false);
  }

  // Once a topic has actually been asked about (via a chip OR free text),
  // it drops out of the suggestion list entirely — it doesn't linger
  // greyed out. 2 at a time; "Show more" cycles through the rest,
  // wrapping back to the start past the end.
  const unaskedReachableTopics = witness.topics.filter(
    (t) =>
      isTopicReachable(t, witnessStages) &&
      (witnessStages[witnessId][t.id] ?? -1) < 0 &&
      // A proactive contact already delivered as the witness's own opening
      // line has nothing left to "suggest" — it stays off the chip list
      // even though witnessStages never actually marked it engaged (see
      // TestimonyTopic.proactive).
      !deliveredProactiveContacts?.has(t.id)
  );
  const suggestedEvidenceId = suggestedEvidenceFor(witness, witnessStages, discoveredEvidence);
  const suggestedEvidence = suggestedEvidenceId && !dismissedNudges.has(suggestedEvidenceId) ? EVIDENCE_BY_ID[suggestedEvidenceId] : null;

  const totalSuggestionPages = Math.max(1, Math.ceil(unaskedReachableTopics.length / MAX_VISIBLE_CHIPS));
  const currentSuggestionPage = suggestionPage % totalSuggestionPages;
  const visibleTopics = unaskedReachableTopics.slice(
    currentSuggestionPage * MAX_VISIBLE_CHIPS,
    currentSuggestionPage * MAX_VISIBLE_CHIPS + MAX_VISIBLE_CHIPS
  );

  const availableRelays = (Object.keys(REVELATIONS) as RevelationId[]).filter(
    (id) =>
      isRevelationKnown(REVELATIONS[id], witnessStages) &&
      !relayedRevelations.has(id) &&
      Boolean(witness.reactions?.[id])
  );

  const lastWitnessSource = [...messages].reverse().find((m) => m.role === "witness")?.source;

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
            if (m.role === "relay") {
              return (
                <div key={i} className="flex justify-center">
                  <div className="max-w-[90%] rounded-xl border border-sky-300/25 bg-sky-300/[0.07] px-4 py-2.5 text-center text-sm text-sky-100/90">
                    {"\u{1F5E3}️ You tell them: "}
                    {m.text}
                  </div>
                </div>
              );
            }

            const isPlayer = m.role === "player";
            const isPending = i === typingIndex;
            const isFailedPlayerMsg = isPlayer && m.failed === true;

            return (
              <div key={i} className={`flex flex-col ${isPlayer ? "items-end" : "items-start"}`}>
                {/* A short authored/generated stage direction — shown for
                    the whole lifetime of this line (pause, typing, and
                    settled), never duplicated across those phases. */}
                {!isPlayer && m.cue?.action && (
                  <p className="mb-1 max-w-[85%] text-xs italic leading-snug text-white/35">{m.cue.action}</p>
                )}
                {isPending ? (
                  <button onClick={skipPause} aria-label="Skip pause">
                    <TypingIndicator />
                  </button>
                ) : (
                  <div
                    className={`max-w-[85%] rounded-2xl px-4 py-3 text-[17px] leading-relaxed ${
                      isPlayer
                        ? isFailedPlayerMsg
                          ? "border border-red-400/40 bg-red-400/10 text-red-100 rounded-br-sm"
                          : "bg-amber-400 text-black rounded-br-sm"
                        : "bg-white/10 text-white rounded-bl-sm"
                    }`}
                  >
                    {i === animatingIndex ? (
                      <TypewriterText text={m.text} onDone={() => setAnimatingIndex(null)} instant={reducedMotionRef.current} />
                    ) : (
                      m.text
                    )}
                  </div>
                )}
                {/* Per-message source tag — m.source is only ever set on
                    the free-form (freeformEnabled) path, so this is a
                    no-op for deterministic-only witnesses by construction,
                    not an extra check here. Answers the "which answers are
                    actually from the model vs. the scripted fallback"
                    question per-line, not just as a one-time banner. */}
                {!isPlayer && !isPending && m.source && (
                  <p
                    className={`mt-1 text-[10px] font-medium uppercase tracking-wide ${
                      m.source === "ai" ? "text-emerald-300/50" : "text-white/35"
                    }`}
                  >
                    {m.source === "ai" ? "✨ AI-generated" : "⚙ Scripted fallback"}
                  </p>
                )}
                {isFailedPlayerMsg && (
                  <button
                    onClick={() => void retryFreeformMessage(witnessId)}
                    disabled={busy}
                    className="mt-1 rounded-full border border-red-400/40 bg-red-400/10 px-3 py-1 text-xs font-medium text-red-200 active:scale-95 disabled:opacity-50"
                  >
                    Couldn't reach the record — tap to retry
                  </button>
                )}
              </div>
            );
          })}
          {pending && (
            <div className="flex justify-start">
              <TypingIndicator />
            </div>
          )}
          {messages.length === 0 && (
            <p className="py-8 text-center text-base text-white/40">No questions yet. Try one below.</p>
          )}
        </div>
      </div>

      {/* A subtly lighter, warm-tinted panel — distinguishes "how you ask"
          (chips + input) from "what was said" (the conversation above),
          which otherwise read as one continuous dark surface. */}
      <div className="border-t border-white/10 bg-[#171319] px-3 pb-3 pt-2">
        {isFreeform && lastWitnessSource === "fallback" && (
          <p className="mb-1.5 text-center text-[11px] text-white/30">Guided matching active — live AI not connected</p>
        )}

        {/* Surfaces a link that already exists for gating (a later
            stage's requiresEvidence) as a suggestion too — never a new
            authored fact, just the same one shown a second way. */}
        {suggestedEvidence && (
          <div className="mb-2 flex items-center gap-2 rounded-xl border border-sky-400/20 bg-sky-400/[0.06] px-3 py-2">
            <span className="text-base leading-none">{"🔎"}</span>
            <p className="flex-1 text-sm leading-snug text-sky-100">
              You might want to examine{" "}
              <button
                type="button"
                onClick={() => onViewEvidence(suggestedEvidence.id)}
                className="font-medium underline decoration-sky-300/50 underline-offset-2 active:text-sky-50"
              >
                {suggestedEvidence.title}
              </button>
              .
            </p>
            <button
              type="button"
              onClick={() => setDismissedNudges((prev) => new Set(prev).add(suggestedEvidence.id))}
              className="shrink-0 text-sky-200/50 active:text-sky-200"
              aria-label="Dismiss suggestion"
            >
              {"✕"}
            </button>
          </div>
        )}

        {/* Open by default on entering a conversation — the player can
            collapse it, but never starts staring at a blank box with no
            context. Once a topic's actually been asked about it drops out
            entirely (see unaskedReachableTopics above), so this never
            shows something already covered. */}
        {unaskedReachableTopics.length > 0 && (
          <div className="mb-2">
            {!suggestionsOpen ? (
              <button
                type="button"
                onClick={() => setSuggestionsOpen(true)}
                disabled={busy}
                className="rounded-full border border-white/15 bg-white/[0.04] px-3.5 py-2 text-sm text-white/55 transition-colors disabled:opacity-50"
              >
                {"\u{1F4A1} Suggestions"}
              </button>
            ) : (
              <div>
                <div className="mb-1.5 flex items-center justify-between px-1">
                  <p className="text-[11px] text-white/30">If you're stuck, try asking about —</p>
                  <button
                    type="button"
                    onClick={() => setSuggestionsOpen(false)}
                    className="text-[11px] text-white/30 active:text-white/50"
                  >
                    Hide
                  </button>
                </div>
                <div className="flex flex-col gap-2">
                  {visibleTopics.map((t) => (
                    <button
                      key={t.id}
                      onClick={() => handleSuggestionTap(t)}
                      disabled={busy}
                      className="flex w-full items-center justify-between gap-3 rounded-xl border border-white/15 bg-gradient-to-br from-white/[0.06] to-white/[0.02] px-4 py-3.5 text-left text-[15px] text-white/85 transition-colors disabled:opacity-50 active:bg-white/[0.08]"
                    >
                      <span>{t.chipKeyword ?? t.chipLabel}</span>
                      <span aria-hidden="true" className="shrink-0 text-white/35">→</span>
                    </button>
                  ))}
                  {unaskedReachableTopics.length > MAX_VISIBLE_CHIPS && (
                    <button
                      type="button"
                      onClick={() => setSuggestionPage((p) => p + 1)}
                      disabled={busy}
                      className="self-start whitespace-nowrap rounded-full border border-white/10 px-3 py-2 text-sm text-white/35 transition-colors disabled:opacity-50 active:text-white/60"
                    >
                      {"↻ Show more"}
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        <form
          onSubmit={(e) => {
            e.preventDefault();
            send(draft);
          }}
          className="flex items-center gap-2"
        >
          <button
            type="button"
            onClick={() => setEvidencePickerOpen(true)}
            aria-label="Present evidence"
            disabled={busy}
            className="shrink-0 rounded-full border border-white/15 bg-white/[0.05] p-3 text-lg text-white/70 active:text-white disabled:opacity-50"
          >
            {"\u{1F4C4}"}
          </button>
          {availableRelays.length > 0 && (
            <button
              type="button"
              onClick={() => setRelayPickerOpen(true)}
              aria-label="Tell them what you've learned"
              disabled={busy}
              className="shrink-0 rounded-full border border-sky-300/25 bg-sky-300/[0.06] p-3 text-lg text-sky-200 active:text-white disabled:opacity-50"
            >
              {"\u{1F5E3}️"}
            </button>
          )}
          <input
            ref={inputRef}
            value={draft}
            onChange={(e) => setDraft(witnessId, e.target.value)}
            placeholder={isFreeform ? "Ask in your own words — English or Català" : "Ask in your own words, or tap a suggestion"}
            aria-label={`Ask ${witness.name} a question`}
            disabled={busy}
            className="flex-1 rounded-full border border-white/15 bg-white/[0.05] px-4 py-3 text-[17px] text-white placeholder:text-white/35 outline-none focus:border-amber-300/50 disabled:opacity-60"
          />
          <button
            type="submit"
            disabled={busy || !draft.trim()}
            className="shrink-0 rounded-full bg-amber-400 px-5 py-3 text-base font-semibold text-black active:scale-95 transition-transform disabled:opacity-40"
          >
            {pending ? "…" : "Ask"}
          </button>
        </form>
      </div>

      {evidencePickerOpen && (
        <EvidencePicker discoveredIds={discoveredEvidence} onPresent={handlePresent} onClose={() => setEvidencePickerOpen(false)} />
      )}
      {relayPickerOpen && (
        <RelayPicker options={availableRelays} witnessId={witnessId} onRelay={handleRelay} onClose={() => setRelayPickerOpen(false)} />
      )}
      {activeReveal && <EmotionReveal witness={witness} demeanor={activeReveal} onDone={() => setActiveReveal(null)} />}
    </div>
  );
}
