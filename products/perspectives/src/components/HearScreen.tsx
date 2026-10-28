import { useEffect } from "react";
import { WITNESSES, CAST_SCENE_IMAGE, CAST_SCENE_HOTSPOTS } from "../game/caseData";
import { useGameStore } from "../game/store";
import { isProactiveContactEligible } from "../game/witnessEngine";
import { DEMEANOR_HEX } from "../game/demeanor";
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

  function wantsToTalkFor(w: (typeof WITNESSES)[number]) {
    const delivered = deliveredProactiveContacts[w.id];
    return w.topics.find(
      (t) =>
        t.proactive &&
        !delivered?.has(t.id) &&
        isProactiveContactEligible(t, witnessStages, discoveredEvidence, relayedRevelations)
    );
  }

  // Opt-in immersive mode — a single candid scene with a clickable zone
  // per person instead of a row list. Only set for cases that author
  // CAST_SCENE_IMAGE (currently Untouchable); every other case falls
  // through to the original list below, unchanged.
  if (CAST_SCENE_IMAGE) {
    return (
      <div className="pb-28">
        <div className="px-5 pt-6">
          <h2 className="text-2xl font-semibold text-white">The people involved</h2>
          <p className="mt-1 text-base text-white/55">Tap someone to start the conversation.</p>
        </div>
        <div className="relative mt-5 w-full overflow-hidden" style={{ aspectRatio: "16 / 9" }}>
          <img src={CAST_SCENE_IMAGE} alt="" className="absolute inset-0 h-full w-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-transparent to-black/20" />
          {WITNESSES.map((w) => {
            const hotspot = CAST_SCENE_HOTSPOTS[w.id];
            if (!hotspot) return null;
            const wantsToTalk = wantsToTalkFor(w);
            const mood = demeanor[w.id];
            const moodColor = mood ? DEMEANOR_HEX[mood] : undefined;
            return (
              <div
                key={w.id}
                className="absolute flex flex-col justify-end"
                style={{ left: `${hotspot.x}%`, top: `${hotspot.y}%`, width: `${hotspot.width}%`, height: `${hotspot.height}%` }}
              >
                <button
                  onClick={() => onSelect(w.id)}
                  className="absolute inset-0 transition-colors active:bg-white/10"
                  aria-label={`Talk to ${w.name}`}
                >
                  {wantsToTalk && (
                    <span className="absolute inset-0 animate-pulse rounded-lg ring-2 ring-amber-300/70" />
                  )}
                </button>

                {/* Profile button — a plain person icon, not a text glyph,
                    so it can never be misread as an alert/warning mark. */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onInspect(w.id);
                  }}
                  aria-label={`View ${w.name}'s profile`}
                  title={`View ${w.name}'s profile`}
                  className="pointer-events-auto absolute right-1.5 top-1.5 flex h-7 w-7 items-center justify-center rounded-full bg-black/55 text-white/85 backdrop-blur-sm"
                >
                  <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <circle cx="12" cy="8" r="3.2" />
                    <path d="M5 20c0-3.5 3-6 7-6s7 2.5 7 6" />
                  </svg>
                </button>

                {/* Status row — grouped with the name label instead of
                    floating over the photo, so it reads as "this person's
                    status" rather than an ambiguous icon on the scene
                    itself. Mood is a plain colored dot (a presence
                    indicator, not a star/rating); "wants to talk" spells
                    itself out in words, not just an icon. */}
                <div className="pointer-events-none mb-1.5 flex flex-col items-center gap-1">
                  <span className="rounded-full bg-black/65 px-2.5 py-1 text-xs font-medium text-white backdrop-blur-sm">
                    {w.name}
                  </span>
                  {(moodColor || wantsToTalk) && (
                    <div className="flex items-center gap-1.5 rounded-full bg-black/65 px-2 py-0.5 backdrop-blur-sm">
                      {moodColor && (
                        <span
                          className="h-2 w-2 shrink-0 rounded-full"
                          style={{ backgroundColor: moodColor, boxShadow: `0 0 6px ${moodColor}` }}
                          aria-hidden="true"
                          title={mood ? `Mood: ${mood}` : undefined}
                        />
                      )}
                      {wantsToTalk && (
                        <span className="flex items-center gap-1 text-[11px] font-medium text-amber-300">
                          <span className="relative flex h-2 w-2 shrink-0">
                            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-amber-400 opacity-75" />
                            <span className="relative inline-flex h-2 w-2 rounded-full bg-amber-400" />
                          </span>
                          Wants to talk
                        </span>
                      )}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

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
