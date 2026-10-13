import { useEffect, useRef, useState } from "react";
import { useCase3V2Store } from "./store";
import {
  COMMITMENT_LABEL,
  EXECUTION_TEXT,
  GROUND_TRUTH_V2,
  HALE_TOPICS,
  JUDGMENT_TEXT,
  MAYA_TOPICS,
  OPENING_GOAL,
  OPENING_LINES,
  OUTCOME_TEXT,
  RELAY_COPY,
  TURN_LIMIT,
} from "./data";
import { AUTHORED_TREE } from "./authoredTree";
import Typewriter from "../case3/Typewriter";
import { isCase3Muted, playCase3Ambient, playCase3Sfx, setCase3Muted, stopCase3Ambient } from "../case3/audio";
import type { ConversationTurn, HaleKnows, Mode } from "./types";

// ─────────────────────────────────────────────────────────────────────────
// Flight 702 v2 — EXPERIMENTAL. Visual grammar reused deliberately from
// /case3 (backgrounds, portrait-over-blurred-backdrop, roster-then-focus),
// recreated here rather than imported — v1's screen components read
// v1's own store directly (useCase3Store), so importing them would
// couple the two versions' game state. Only genuinely stateless pieces
// (Typewriter, audio.ts) are shared code; the background/portrait assets
// are separate, compressed copies in public/case3v2/ (JPEG, resized) —
// the original /case3/*.png files are 1-2.6MB each, which rendered as
// blank circles for several seconds on a real connection. Same source
// art, re-exported smaller; /case3's own originals are untouched.
// ─────────────────────────────────────────────────────────────────────────

const MAYA_PORTRAIT = "/case3v2/maya.jpg";
const HALE_PORTRAIT = "/case3v2/hale.jpg";

function modeFromPath(): Mode | null {
  const p = window.location.pathname;
  if (p.startsWith("/case3v2/ai")) return "ai";
  if (p.startsWith("/case3v2/authored")) return "authored";
  return null;
}

const BADGE_CLEARANCE = "pb-9";

function ExperimentalBadge({ mode, fallbackActive }: { mode: Mode | null; fallbackActive: boolean }) {
  const label = !mode
    ? "EXPERIMENTAL PROTOTYPE — not the current Flight 702 build"
    : fallbackActive
      ? "EXPERIMENTAL — FALLBACK (authored, not live AI)"
      : mode === "ai"
        ? "EXPERIMENTAL — AI NEGOTIATION (live model)"
        : "EXPERIMENTAL — AUTHORED COMPARATOR (no AI)";
  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-0 z-50 flex h-7 items-center justify-center border-t border-white/10 bg-black/85 text-center text-[10px] uppercase tracking-wide text-white/60">
      {label}
    </div>
  );
}

function SoundToggle() {
  const [muted, setMuted] = useState(isCase3Muted());
  return (
    <button
      onClick={() => {
        const next = !muted;
        setCase3Muted(next);
        setMuted(next);
      }}
      className="fixed right-3 top-3 z-50 flex h-9 w-9 items-center justify-center rounded-full border border-white/15 bg-black/60 text-base text-white/70 backdrop-blur active:scale-95"
      aria-label={muted ? "Unmute" : "Mute"}
    >
      {muted ? "\u{1F507}" : "\u{1F50A}"}
    </button>
  );
}

/** Situation-room + aircraft overlay — the "pick who to talk to" backdrop,
 * matching /case3's Act2Room non-focused state. */
function OverviewBackdrop() {
  return (
    <>
      <img src="/case3v2/situation-room.jpg" alt="" className="absolute inset-0 h-full w-full object-cover opacity-60" />
      <img
        src="/case3v2/aircraft.png"
        alt=""
        className="pointer-events-none absolute left-1/2 top-[10%] w-[70%] -translate-x-1/2 opacity-90 drop-shadow-2xl"
      />
      <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-black/10 to-black/85" />
    </>
  );
}

/** A character's own portrait, blurred, as full-bleed atmosphere behind
 * them — matching /case3's focused-agent state in Act2Room/Act3Room. */
function FocusedBackdrop({ portrait }: { portrait: string }) {
  return (
    <>
      <img src={portrait} alt="" className="absolute inset-0 h-full w-full object-cover opacity-25 blur-sm" />
      <div className="absolute inset-0 bg-gradient-to-b from-black/45 via-black/20 to-black/90" />
    </>
  );
}

function Landing() {
  const setMode = useCase3V2Store((s) => s.setMode);
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6 bg-black px-6 text-center text-white">
      <h1 className="text-xl font-semibold">Flight 702 — v2 experimental</h1>
      <p className="max-w-sm text-sm text-white/60">
        One short, bounded negotiation with Hale, Route A, three possible outcomes. Pick which version to test.
      </p>
      <div className="flex flex-col gap-3">
        <button
          onClick={() => setMode("ai")}
          className="rounded-lg border border-amber-400/40 bg-amber-400/10 px-5 py-3 text-sm font-medium text-amber-200"
        >
          AI negotiation (live model)
        </button>
        <button
          onClick={() => setMode("authored")}
          className="rounded-lg border border-white/20 bg-white/5 px-5 py-3 text-sm font-medium text-white/80"
        >
          Authored comparator (no AI)
        </button>
      </div>
      <p className="text-[11px] text-white/30">Direct links: /case3v2/ai · /case3v2/authored</p>
    </div>
  );
}

function Opening() {
  const goTo = useCase3V2Store((s) => s.goTo);
  useEffect(() => {
    const t = setTimeout(() => playCase3Sfx("bang"), 500);
    return () => clearTimeout(t);
  }, []);
  return (
    <div className="relative flex min-h-screen w-full flex-col items-center justify-end overflow-hidden text-white">
      <img src="/case3v2/night-flight.jpg" alt="" className="absolute inset-0 h-full w-full object-cover" />
      <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/25 to-black/50" />
      <div className={`relative z-10 flex w-full max-w-md flex-col items-center gap-3 px-6 pb-10 text-center ${BADGE_CLEARANCE}`}>
        <p className="text-xs uppercase tracking-[0.25em] text-white/50">Perspectives — Flight 702, experimental</p>
        {OPENING_LINES.map((line, i) => (
          <p key={i} className="text-sm leading-relaxed text-white/85">
            {line}
          </p>
        ))}
        <p className="mt-1 text-sm font-medium text-amber-200">{OPENING_GOAL}</p>
        <button
          onClick={() => {
            playCase3Ambient();
            goTo("exploration");
          }}
          className="mt-2 w-full rounded-xl bg-amber-400 py-3 text-base font-semibold text-black active:scale-[0.98]"
        >
          Continue
        </button>
      </div>
    </div>
  );
}

function MayaPanel({ mayaAsked, askMaya, onBack }: { mayaAsked: Record<string, boolean>; askMaya: (id: string) => void; onBack: () => void }) {
  const unasked = MAYA_TOPICS.filter((t) => !mayaAsked[t.id]);
  const asked = MAYA_TOPICS.filter((t) => mayaAsked[t.id]);
  return (
    <div className="flex w-full max-w-sm flex-col gap-2">
      {asked.length > 0 && (
        <div className="mb-1 flex flex-col gap-1.5 text-sm text-white/75">
          {asked.map((t) => (
            <p key={t.id} className="rounded-lg bg-black/55 px-3 py-2">
              <span className="text-white/40">Maya: </span>
              {t.response}
            </p>
          ))}
        </div>
      )}
      {unasked.map((t) => (
        <button
          key={t.id}
          onClick={() => askMaya(t.id)}
          className="rounded-lg border border-white/15 bg-white/5 px-4 py-3 text-left text-sm text-white/85"
        >
          {t.prompt}
        </button>
      ))}
      <button onClick={onBack} className="mt-1 text-sm text-white/50">
        ← Room
      </button>
    </div>
  );
}

function HalePanel({
  availableHaleTopics,
  availableRelays,
  haleLines,
  askHale,
  relay,
  onBack,
}: {
  availableHaleTopics: typeof HALE_TOPICS;
  availableRelays: (keyof HaleKnows)[];
  haleLines: ConversationTurn[];
  askHale: (id: string) => void;
  relay: (fact: keyof HaleKnows) => void;
  onBack: () => void;
}) {
  return (
    <div className="flex w-full max-w-sm flex-col gap-2">
      {haleLines.length > 0 ? (
        <div className="mb-1 flex flex-col gap-1.5 text-sm text-white/75">
          {haleLines.map((l, i) => (
            <p key={i} className="rounded-lg bg-black/55 px-3 py-2">
              <span className="text-white/40">Hale: </span>
              {l.text}
            </p>
          ))}
        </div>
      ) : (
        <p className="rounded-lg bg-black/55 px-3 py-2 text-sm italic text-white/50">"Let me know what you've got."</p>
      )}
      {availableHaleTopics.map((t) => (
        <button
          key={t.id}
          onClick={() => askHale(t.id)}
          className="rounded-lg border border-white/15 bg-white/5 px-4 py-3 text-left text-sm text-white/85"
        >
          {t.prompt}
        </button>
      ))}
      {availableRelays.map((k) => (
        <button
          key={k}
          onClick={() => relay(k)}
          className="rounded-lg border border-sky-400/30 bg-sky-400/10 px-4 py-3 text-left text-sm text-sky-200"
        >
          {RELAY_COPY[k].label}
        </button>
      ))}
      <button onClick={onBack} className="mt-1 text-sm text-white/50">
        ← Room
      </button>
    </div>
  );
}

function Exploration() {
  const mayaAsked = useCase3V2Store((s) => s.mayaAsked);
  const haleAsked = useCase3V2Store((s) => s.haleAsked);
  const haleKnows = useCase3V2Store((s) => s.haleKnows);
  const haleLines = useCase3V2Store((s) => s.haleExplorationLines);
  const askMaya = useCase3V2Store((s) => s.askMaya);
  const askHale = useCase3V2Store((s) => s.askHale);
  const relay = useCase3V2Store((s) => s.relay);
  const goTo = useCase3V2Store((s) => s.goTo);
  const [focused, setFocused] = useState<"maya" | "hale" | null>(null);

  const relayKeys = Object.keys(RELAY_COPY) as (keyof HaleKnows)[];
  const availableRelays = relayKeys.filter((k) => mayaAsked[RELAY_COPY[k].requiresTopic] && !haleKnows[k]);
  const availableHaleTopics = HALE_TOPICS.filter((t) => haleKnows[t.requiresRelay] && !haleAsked[t.id]);
  const haleKnowsAnything = relayKeys.some((k) => haleKnows[k]);

  return (
    <div className="relative flex min-h-screen w-full flex-col overflow-hidden text-white">
      {!focused ? <OverviewBackdrop /> : <FocusedBackdrop portrait={focused === "maya" ? MAYA_PORTRAIT : HALE_PORTRAIT} />}

      <div className="relative z-10 flex min-h-screen flex-col">
        <div className="px-4 pt-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-amber-300">Exploration</p>
          <p className="text-xs text-white/50">Learn what you can — you don't need to cover everything.</p>
        </div>

        {focused && (
          <div className="flex flex-1 flex-col items-center justify-end gap-2 overflow-hidden px-4 pt-2">
            <img
              src={focused === "maya" ? MAYA_PORTRAIT : HALE_PORTRAIT}
              alt={focused === "maya" ? "Maya" : "Hale"}
              className="max-h-[22vh] w-auto object-contain drop-shadow-2xl"
            />
            <p className="text-center text-xs uppercase tracking-wide text-white/50">
              {focused === "maya" ? "Maya — Ground engineer" : "Hale — Captain, radio only"}
            </p>
          </div>
        )}

        <div className={`${focused ? "" : "mt-auto"} flex flex-col items-center gap-3 px-4 pb-4 ${BADGE_CLEARANCE}`}>
          {!focused ? (
            <>
              <div className="flex justify-center gap-5">
                <button onClick={() => setFocused("maya")} className="flex flex-col items-center gap-1">
                  <img src={MAYA_PORTRAIT} alt="Maya" className="h-16 w-16 rounded-full border border-white/15 object-cover object-top" />
                  <span className="text-[11px] text-white/70">Maya</span>
                </button>
                <button onClick={() => setFocused("hale")} className="flex flex-col items-center gap-1">
                  <img
                    src={HALE_PORTRAIT}
                    alt="Hale"
                    className={`h-16 w-16 rounded-full border object-cover object-top ${haleKnowsAnything ? "border-amber-300/70 ring-2 ring-amber-300/40" : "border-white/15"}`}
                  />
                  <span className="text-[11px] text-white/70">Hale</span>
                </button>
              </div>
              {haleKnowsAnything && (
                <p className="text-center text-[11px] text-sky-300">
                  Hale knows: {relayKeys.filter((k) => haleKnows[k]).map((k) => RELAY_COPY[k].label.replace("Tell Hale: ", "")).join(" · ")}
                </p>
              )}
              <button
                onClick={() => goTo("climax_intro")}
                className="w-full max-w-sm rounded-xl bg-amber-400 py-3 text-base font-semibold text-black active:scale-[0.98]"
              >
                Continue
              </button>
            </>
          ) : focused === "maya" ? (
            <MayaPanel mayaAsked={mayaAsked} askMaya={askMaya} onBack={() => setFocused(null)} />
          ) : (
            <HalePanel
              availableHaleTopics={availableHaleTopics}
              availableRelays={availableRelays}
              haleLines={haleLines}
              askHale={askHale}
              relay={relay}
              onBack={() => setFocused(null)}
            />
          )}
        </div>
      </div>
    </div>
  );
}

function ClimaxIntro() {
  const haleKnows = useCase3V2Store((s) => s.haleKnows);
  const enterClimax = useCase3V2Store((s) => s.enterClimax);
  const relayKeys = Object.keys(RELAY_COPY) as (keyof HaleKnows)[];
  const known = relayKeys.filter((k) => haleKnows[k]);

  return (
    <div className="relative flex min-h-screen w-full flex-col overflow-hidden text-white">
      <FocusedBackdrop portrait={HALE_PORTRAIT} />
      <div className={`relative z-10 flex min-h-screen flex-col items-center justify-end gap-3 px-4 pb-4 ${BADGE_CLEARANCE}`}>
        <img src={HALE_PORTRAIT} alt="Hale" className="max-h-[22vh] w-auto object-contain drop-shadow-2xl" />
        <p className="text-center text-xs uppercase tracking-wide text-white/50">Hale — Captain, radio only</p>
        <div className="w-full max-w-sm rounded-2xl border border-white/10 bg-black/65 p-4 text-sm leading-relaxed text-white/85">
          <p>Hale needs your call before touchdown — there's no more time to gather anything new.</p>
          <p className="mt-2">
            {known.length === 0
              ? "He's going into this knowing only the basic situation — nothing you've found has reached him yet."
              : `He already knows: ${known.map((k) => RELAY_COPY[k].label.replace("Tell Hale: ", "")).join(" · ")}.`}
          </p>
          <p className="mt-2">Still open: how far to prepare for a smoke reading that's never been confirmed, on a field without crews standing by.</p>
          <p className="mt-2 text-amber-200">You can still shape what he does next.</p>
        </div>
        <button
          onClick={enterClimax}
          className="w-full max-w-sm rounded-xl bg-amber-400 py-3 text-base font-semibold text-black active:scale-[0.98]"
        >
          Talk to Hale
        </button>
      </div>
    </div>
  );
}

/** Shared atmosphere wrapper for the climax itself — same backdrop
 * treatment as everywhere else, so the AI and authored arms are visually
 * identical except for the interaction surface at the bottom. */
function ClimaxShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative flex min-h-screen w-full flex-col overflow-hidden text-white">
      <FocusedBackdrop portrait={HALE_PORTRAIT} />
      <div className="relative z-10 flex min-h-screen flex-col">{children}</div>
    </div>
  );
}

function ClimaxHeader({ proposal, accepted, right }: { proposal: string | null; accepted: string | null; right?: React.ReactNode }) {
  return (
    <>
      <div className="flex flex-col items-center gap-1 px-4 pt-3">
        <img src={HALE_PORTRAIT} alt="Hale" className="max-h-[15vh] w-auto object-contain drop-shadow-2xl" />
        <p className="text-xs uppercase tracking-wide text-white/50">Hale — Captain, radio only</p>
      </div>
      <div className="flex items-center justify-between gap-2 border-y border-white/10 bg-black/55 px-4 py-2 text-[11px] uppercase tracking-wide text-white/60">
        <span>
          On the table: {proposal ?? "—"} · Agreed: {accepted ?? "none yet"}
        </span>
        {right}
      </div>
    </>
  );
}

/** ResizeObserver on an inner content div, scrolling the outer container
 * to scrollHeight on every observed change — covers both "new line added"
 * and "a line still mid-typewriter-reveal" with one mechanism. Both refs
 * are attached unconditionally on first render (never behind an early
 * return keyed on empty history) — that exact ordering bug is what broke
 * auto-scroll in /case3 the first time this pattern was built. */
function Transcript({ children }: { children: React.ReactNode }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    const content = contentRef.current;
    if (!container || !content) return;
    const observer = new ResizeObserver(() => {
      container.scrollTop = container.scrollHeight;
    });
    observer.observe(content);
    return () => observer.disconnect();
  }, []);

  return (
    <div ref={containerRef} className="flex-1 overflow-y-auto px-4 py-3">
      <div ref={contentRef} className="flex flex-col gap-3">
        {children}
      </div>
    </div>
  );
}

function ChatBubble({ role, text, instant }: { role: "player" | "hale"; text: string; instant: boolean }) {
  return (
    <div
      className={
        role === "player"
          ? "self-end max-w-[85%] rounded-lg bg-amber-400/15 px-3 py-2 text-sm text-amber-100"
          : "self-start max-w-[85%] rounded-lg bg-white/10 px-3 py-2 text-sm text-white/85"
      }
    >
      {role === "hale" ? <Typewriter text={text} instant={instant} /> : text}
    </div>
  );
}

function ChatClimax() {
  const conversation = useCase3V2Store((s) => s.conversation);
  const sendPlayerMessage = useCase3V2Store((s) => s.sendPlayerMessage);
  const pending = useCase3V2Store((s) => s.pending);
  const turnsUsed = useCase3V2Store((s) => s.turnsUsed);
  const accepted = useCase3V2Store((s) => s.accepted);
  const proposal = useCase3V2Store((s) => s.proposal);
  const endClimaxEarly = useCase3V2Store((s) => s.endClimaxEarly);
  const goTo = useCase3V2Store((s) => s.goTo);
  const [text, setText] = useState("");
  const [seenCount] = useState(() => conversation.length);

  const remaining = TURN_LIMIT - turnsUsed;
  const canSend = remaining > 0 && !pending;

  useEffect(() => {
    if (turnsUsed >= TURN_LIMIT && !pending) {
      const t = setTimeout(() => goTo("execution"), 900);
      return () => clearTimeout(t);
    }
  }, [turnsUsed, pending, goTo]);

  function handleSend() {
    if (!text.trim() || !canSend) return;
    sendPlayerMessage(text);
    setText("");
  }

  return (
    <ClimaxShell>
      <ClimaxHeader
        proposal={proposal ? COMMITMENT_LABEL[proposal] : null}
        accepted={accepted ? COMMITMENT_LABEL[accepted] : null}
        right={
          <span>
            {remaining} turn{remaining === 1 ? "" : "s"} left
          </span>
        }
      />
      <Transcript>
        {conversation.map((line, i) => (
          <ChatBubble key={i} role={line.role === "player" ? "player" : "hale"} text={line.text} instant={i < seenCount} />
        ))}
        {pending && <p className="self-start text-xs text-white/40">Hale is responding…</p>}
      </Transcript>
      <div className={`border-t border-white/10 bg-black/70 p-3 ${BADGE_CLEARANCE}`}>
        <div className="flex gap-2">
          <input
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") handleSend();
            }}
            placeholder="Say what you want, in your own words…"
            aria-label="Message to Hale"
            disabled={!canSend}
            className="flex-1 rounded-lg border border-white/15 bg-white/5 px-3 py-2 text-sm text-white placeholder:text-white/30 disabled:opacity-40"
          />
          <button
            onClick={handleSend}
            disabled={!canSend || !text.trim()}
            className="rounded-lg border border-amber-400/40 bg-amber-400/10 px-4 py-2 text-sm font-medium text-amber-200 disabled:opacity-40"
          >
            Send
          </button>
        </div>
        <button onClick={endClimaxEarly} className="mt-2 w-full rounded-lg border border-white/10 bg-white/5 px-4 py-2 text-xs text-white/60">
          That's my final ask — end it here
        </button>
      </div>
    </ClimaxShell>
  );
}

function AuthoredClimax({ fallback = false }: { fallback?: boolean }) {
  const conversation = useCase3V2Store((s) => s.conversation);
  const authoredStepId = useCase3V2Store((s) => s.authoredStepId);
  const authoredChoose = useCase3V2Store((s) => s.authoredChoose);
  const accepted = useCase3V2Store((s) => s.accepted);
  const proposal = useCase3V2Store((s) => s.proposal);
  const endClimaxEarly = useCase3V2Store((s) => s.endClimaxEarly);
  const step = authoredStepId ? AUTHORED_TREE[authoredStepId] : null;

  return (
    <ClimaxShell>
      {fallback && (
        <div className="border-b border-amber-400/30 bg-amber-400/10 px-4 py-2 text-[11px] uppercase tracking-wide text-amber-200">
          Connection lost — continuing with Hale's position based on what's already established. Not live AI.
        </div>
      )}
      <ClimaxHeader proposal={proposal ? COMMITMENT_LABEL[proposal] : null} accepted={accepted ? COMMITMENT_LABEL[accepted] : null} />
      <Transcript>
        {conversation.map((line, i) => (
          <ChatBubble key={i} role={line.role === "player" ? "player" : "hale"} text={line.text} instant />
        ))}
      </Transcript>
      <div className={`border-t border-white/10 bg-black/70 p-3 ${BADGE_CLEARANCE}`}>
        {step ? (
          <div className="flex flex-col gap-2">
            {step.options.map((o) => (
              <button
                key={o.id}
                onClick={() => authoredChoose(o.id)}
                className="rounded-lg border border-white/15 bg-white/5 px-4 py-3 text-left text-sm text-white/85"
              >
                {o.label}
              </button>
            ))}
          </div>
        ) : (
          <button
            onClick={endClimaxEarly}
            className="w-full rounded-lg border border-amber-400/40 bg-amber-400/10 px-5 py-3 text-sm font-medium text-amber-200"
          >
            Continue
          </button>
        )}
      </div>
    </ClimaxShell>
  );
}

function Climax() {
  const mode = useCase3V2Store((s) => s.mode);
  const fallbackActive = useCase3V2Store((s) => s.fallbackActive);
  if (mode === "authored") return <AuthoredClimax />;
  if (fallbackActive) return <AuthoredClimax fallback />;
  return <ChatClimax />;
}

function Execution() {
  const finalCommitment = useCase3V2Store((s) => s.finalCommitment);
  const goTo = useCase3V2Store((s) => s.goTo);
  const commitment = finalCommitment();

  return (
    <div className="relative flex min-h-screen w-full flex-col items-center justify-center gap-6 overflow-hidden px-6 text-center text-white">
      <img src="/case3v2/situation-room.jpg" alt="" className="absolute inset-0 h-full w-full object-cover opacity-40" />
      <div className="absolute inset-0 bg-black/70" />
      <div className={`relative z-10 flex max-w-sm flex-col items-center gap-4 ${BADGE_CLEARANCE}`}>
        <p className="text-xs uppercase tracking-wide text-amber-300">{COMMITMENT_LABEL[commitment]}</p>
        <p className="text-base leading-relaxed text-white/90">{EXECUTION_TEXT[commitment]}</p>
        <button
          onClick={() => goTo("reveal")}
          className="mt-2 w-full rounded-xl bg-amber-400 py-3 text-base font-semibold text-black active:scale-[0.98]"
        >
          See what happened
        </button>
      </div>
    </div>
  );
}

function Reveal() {
  const mayaAsked = useCase3V2Store((s) => s.mayaAsked);
  const haleKnows = useCase3V2Store((s) => s.haleKnows);
  const finalCommitment = useCase3V2Store((s) => s.finalCommitment);
  const proposal = useCase3V2Store((s) => s.proposal);
  const sessionLog = useCase3V2Store((s) => s.sessionLog);
  const reset = useCase3V2Store((s) => s.reset);
  const [showGroundTruth, setShowGroundTruth] = useState(false);
  const [copied, setCopied] = useState(false);

  const commitment = finalCommitment();
  const outcome = OUTCOME_TEXT[commitment];
  const discoveredTopics = MAYA_TOPICS.filter((t) => mayaAsked[t.id]);
  const toldKeys = (Object.keys(RELAY_COPY) as (keyof HaleKnows)[]).filter((k) => haleKnows[k]);

  async function copyLog() {
    try {
      await navigator.clipboard.writeText(JSON.stringify(sessionLog, null, 2));
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // clipboard unavailable — no-op, not worth surfacing in a prototype
    }
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-black text-white">
      <img src="/case3v2/situation-room.jpg" alt="" className="absolute inset-0 h-full w-full object-cover opacity-20" />
      <div className="absolute inset-0 bg-black/75" />
      <div className={`relative z-10 flex flex-col gap-6 px-5 py-8 ${BADGE_CLEARANCE}`}>
        <section>
          <p className="mb-1 text-xs uppercase tracking-wide text-white/40">1. What you discovered</p>
          <p className="text-sm text-white/80">
            {discoveredTopics.length === 0
              ? "You went into the conversation without exploring anything with Maya first."
              : discoveredTopics.map((t) => t.prompt).join(" · ")}
          </p>
        </section>

        <section>
          <p className="mb-1 text-xs uppercase tracking-wide text-white/40">2. What Hale was told, specifically</p>
          <p className="text-sm text-white/80">
            {toldKeys.length === 0
              ? "Nothing — Hale entered the conversation knowing only the basic situation."
              : toldKeys.map((k) => RELAY_COPY[k].label.replace("Tell Hale: ", "")).join(" · ")}
          </p>
        </section>

        <section>
          <p className="mb-1 text-xs uppercase tracking-wide text-white/40">3. What was proposed and agreed</p>
          <p className="text-sm text-white/80">
            Agreed: <span className="font-medium text-amber-300">{COMMITMENT_LABEL[commitment]}</span>
            {proposal && proposal !== commitment ? (
              <span className="text-white/50"> (last asked for: {COMMITMENT_LABEL[proposal]}, not reached)</span>
            ) : null}
          </p>
        </section>

        <section>
          <p className="mb-1 text-xs uppercase tracking-wide text-white/40">4. What happened</p>
          <p className="text-sm text-white/80">{outcome.narrative}</p>
          <p className="mt-2 text-sm italic text-white/60">{JUDGMENT_TEXT[commitment]}</p>
        </section>

        <section>
          <p className="mb-1 text-xs uppercase tracking-wide text-white/40">5. What remained uncertain at the time</p>
          <p className="text-sm text-white/80">
            Whether tonight's reignition would stay as mild as every prior check, and whether the hold was actually still sealed — neither was
            resolvable before landing, for either of you.
          </p>
          <button onClick={() => setShowGroundTruth((v) => !v)} className="mt-2 text-xs text-sky-300 underline">
            {showGroundTruth ? "Hide" : "Show"} the complete story
          </button>
          {showGroundTruth && (
            <div className="mt-2 flex flex-col gap-2 text-sm text-white/60">
              {GROUND_TRUTH_V2.map((line, i) => (
                <p key={i}>{line}</p>
              ))}
            </div>
          )}
        </section>

        <div className="mt-2 flex flex-col gap-2">
          <button onClick={copyLog} className="rounded-lg border border-white/15 bg-white/5 px-4 py-2 text-xs text-white/70">
            {copied ? "Copied" : "Copy session log (JSON)"}
          </button>
          <button onClick={reset} className="rounded-lg border border-amber-400/40 bg-amber-400/10 px-4 py-2 text-sm font-medium text-amber-200">
            Start over
          </button>
        </div>
      </div>
    </div>
  );
}

export default function Case3V2App() {
  const mode = useCase3V2Store((s) => s.mode);
  const screen = useCase3V2Store((s) => s.screen);
  const fallbackActive = useCase3V2Store((s) => s.fallbackActive);
  const setMode = useCase3V2Store((s) => s.setMode);

  useEffect(() => {
    const fromPath = modeFromPath();
    if (fromPath && !mode) setMode(fromPath);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    return () => stopCase3Ambient();
  }, []);

  return (
    <div className="relative">
      <SoundToggle />
      {screen === "landing" && <Landing />}
      {screen === "opening" && <Opening />}
      {screen === "exploration" && <Exploration />}
      {screen === "climax_intro" && <ClimaxIntro />}
      {screen === "climax" && <Climax />}
      {screen === "execution" && <Execution />}
      {screen === "reveal" && <Reveal />}
      <ExperimentalBadge mode={mode} fallbackActive={fallbackActive} />
    </div>
  );
}
