import { useEffect, useRef, useState } from "react";
import { useGameStore } from "../game/store";
import { WITNESS_BY_ID, CONFRONTATION_WITNESS_IDS, CONFRONT_SCENE_IMAGE } from "../game/caseData";
import Portrait from "./Portrait";
import TypewriterText from "./TypewriterText";
import DemeanorBadge from "./DemeanorBadge";
import PhaseHeader from "./PhaseHeader";

interface ConfrontationSceneProps {
  onDone: () => void;
}

/**
 * The confrontation scene — "Untouchable" (Case 003) only. Bridges
 * Verdict -> Reveal: see CASE_003_SCENE_STRUCTURE.md. Walks through
 * CONFRONTATION_WITNESS_IDS in order (Marcus, then Priya) — advancing
 * between them clears the transcript and fires the next one's opener;
 * `onDone` only fires once the whole sequence is exhausted. App.tsx only
 * renders this when the active case defines a non-empty
 * CONFRONTATION_WITNESS_IDS; every other case skips straight from
 * verdict to reveal, unchanged.
 */
export default function ConfrontationScene({ onDone }: ConfrontationSceneProps) {
  const [draft, setDraft] = useState("");
  const confrontHistory = useGameStore((s) => s.confrontHistory);
  const confrontPending = useGameStore((s) => s.confrontPending);
  const confrontIndex = useGameStore((s) => s.confrontIndex);
  const demeanor = useGameStore((s) => s.demeanor);
  const beginConfrontation = useGameStore((s) => s.beginConfrontation);
  const sendConfrontMessage = useGameStore((s) => s.sendConfrontMessage);
  const advanceConfrontation = useGameStore((s) => s.advanceConfrontation);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    beginConfrontation();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [confrontHistory, confrontPending]);

  const activeId = CONFRONTATION_WITNESS_IDS[confrontIndex];
  if (!activeId) {
    // Defensive only — App.tsx never mounts this component when the
    // active case has no confrontation scene, and the "last witness"
    // button below calls onDone directly rather than advancing past
    // the end of the list.
    onDone();
    return null;
  }

  const witness = WITNESS_BY_ID[activeId];
  const hasExchanged = confrontHistory.filter((m) => m.role === "player").length > 0;
  const isLastWitness = confrontIndex === CONFRONTATION_WITNESS_IDS.length - 1;
  const nextWitness = !isLastWitness ? WITNESS_BY_ID[CONFRONTATION_WITNESS_IDS[confrontIndex + 1]] : null;

  return (
    <div className="min-h-screen bg-[#0a0a0d] flex flex-col">
      {CONFRONT_SCENE_IMAGE && (
        <div className="relative h-40 w-full overflow-hidden shrink-0">
          <img src={CONFRONT_SCENE_IMAGE} alt="" className="h-full w-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0d] via-[#0a0a0d]/50 to-transparent" />
        </div>
      )}
      <div className="flex-1 overflow-y-auto px-5 py-8">
        <div className="mx-auto flex max-w-md flex-col gap-4">
          <PhaseHeader index={3} label="The reckoning" status="Live" />
          <p className="text-center text-xs uppercase tracking-[0.3em] text-amber-300/80">The conversation that closes this</p>
          {CONFRONTATION_WITNESS_IDS.length > 1 && (
            <p className="text-center text-[11px] text-white/30">
              Conversation {confrontIndex + 1} of {CONFRONTATION_WITNESS_IDS.length}
            </p>
          )}
          <div className="flex justify-center">
            <Portrait name={witness.name} accentColor={witness.accentColor} image={witness.portraitImage} size="lg" />
          </div>
          <div className="flex flex-col items-center gap-1.5">
            <p className="text-center font-serif text-2xl text-white">{witness.name}</p>
            {demeanor[activeId] && <DemeanorBadge demeanor={demeanor[activeId]} />}
            {confrontHistory.length > 0 && (
              <p className="text-center text-[11px] text-white/30">
                Exchange {confrontHistory.filter((m) => m.role === "player").length}
              </p>
            )}
          </div>

          <div className="mt-4 flex flex-col gap-3">
            {confrontHistory.map((m, i) => (
              <div
                key={i}
                className={
                  m.role === "player"
                    ? "self-end max-w-[85%] rounded-2xl rounded-br-sm bg-amber-500/15 px-4 py-3 text-white/90"
                    : "self-start max-w-[90%] rounded-2xl rounded-bl-sm bg-white/5 px-4 py-3 text-white"
                }
              >
                {m.role === "witness" && i === confrontHistory.length - 1 ? (
                  <p className="text-base leading-relaxed">
                    <TypewriterText text={m.text} />
                  </p>
                ) : (
                  <p className="text-base leading-relaxed">{m.text}</p>
                )}
                {m.cue?.action && <p className="mt-1 text-xs italic text-white/40">{m.cue.action}</p>}
              </div>
            ))}
            {confrontPending && <p className="self-start text-sm italic text-white/40">...</p>}
          </div>
          <div ref={bottomRef} />
        </div>
      </div>

      <div className="border-t border-white/10 bg-black/40 px-5 py-5">
        <div className="mx-auto flex max-w-md flex-col gap-3">
          <div className="flex gap-2">
            <input
              className="flex-1 rounded-xl border border-white/15 bg-white/5 px-4 py-3 text-base text-white placeholder:text-white/30"
              placeholder="Say something, or let them respond."
              value={draft}
              disabled={confrontPending}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && draft.trim() && !confrontPending) {
                  sendConfrontMessage(draft.trim());
                  setDraft("");
                }
              }}
            />
            <button
              disabled={!draft.trim() || confrontPending}
              onClick={() => {
                sendConfrontMessage(draft.trim());
                setDraft("");
              }}
              className="rounded-xl bg-amber-500 px-5 text-base font-medium text-black disabled:opacity-40"
            >
              Send
            </button>
          </div>
          <button
            onClick={isLastWitness ? onDone : () => void advanceConfrontation()}
            disabled={!hasExchanged && confrontHistory.length === 0}
            className="text-center text-sm text-white/50 underline disabled:opacity-40"
          >
            {isLastWitness ? "Close the case" : `Talk to ${nextWitness?.name ?? "the next person"}`}
          </button>
        </div>
      </div>
    </div>
  );
}
