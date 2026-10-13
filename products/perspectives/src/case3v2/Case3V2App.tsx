import { useEffect, useRef, useState } from "react";
import { useCase3V2Store } from "./store";
import { GROUND_TRUTH_V2, JUDGMENT_TEXT, MAYA_TOPICS, OPENING_LINE, OUTCOME_TEXT, RELAY_COPY, TURN_LIMIT } from "./data";
import { AUTHORED_TREE } from "./authoredTree";
import Typewriter from "../case3/Typewriter";
import { isCase3Muted, playCase3Ambient, setCase3Muted, stopCase3Ambient } from "../case3/audio";
import type { HaleKnows, Mode } from "./types";

// ─────────────────────────────────────────────────────────────────────────
// Flight 702 v2 — EXPERIMENTAL. Fully isolated from /case3 (no shared
// store/types/components except Typewriter + audio, reused directly since
// they're pure/stateless and already isolated from src/game/). Reachable
// at /case3v2 (mode picker), /case3v2/ai, /case3v2/authored — each a
// direct entry point, each visibly labeled which version is running.
// ─────────────────────────────────────────────────────────────────────────

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
    playCase3Ambient();
    return () => stopCase3Ambient();
  }, []);
  return (
    <div className={`flex min-h-screen flex-col items-center justify-center gap-6 bg-black px-6 text-center text-white ${BADGE_CLEARANCE}`}>
      <p className="max-w-sm text-base leading-relaxed text-white/85">{OPENING_LINE}</p>
      <button
        onClick={() => goTo("exploration")}
        className="rounded-lg border border-amber-400/40 bg-amber-400/10 px-5 py-3 text-sm font-medium text-amber-200"
      >
        Continue
      </button>
    </div>
  );
}

function Exploration() {
  const mayaAsked = useCase3V2Store((s) => s.mayaAsked);
  const haleKnows = useCase3V2Store((s) => s.haleKnows);
  const askMaya = useCase3V2Store((s) => s.askMaya);
  const relay = useCase3V2Store((s) => s.relay);
  const enterClimax = useCase3V2Store((s) => s.enterClimax);

  const unasked = MAYA_TOPICS.filter((t) => !mayaAsked[t.id]);
  const asked = MAYA_TOPICS.filter((t) => mayaAsked[t.id]);
  const relayKeys = Object.keys(RELAY_COPY) as (keyof HaleKnows)[];
  const availableRelays = relayKeys.filter((k) => mayaAsked[RELAY_COPY[k].requiresTopic] && !haleKnows[k]);

  return (
    <div className={`flex min-h-screen flex-col bg-black text-white ${BADGE_CLEARANCE}`}>
      <div className="flex-1 overflow-y-auto px-4 pb-6 pt-6">
        {asked.length > 0 && (
          <div className="mb-6 flex flex-col gap-2 text-sm text-white/60">
            {asked.map((t) => (
              <p key={t.id}>
                <span className="text-white/40">Maya: </span>
                {t.response}
              </p>
            ))}
          </div>
        )}

        {unasked.length > 0 && (
          <>
            <p className="mb-2 text-sm font-semibold uppercase tracking-wide text-amber-300">Talk to Maya</p>
            <div className="mb-6 flex flex-col gap-2">
              {unasked.map((t) => (
                <button
                  key={t.id}
                  onClick={() => askMaya(t.id)}
                  className="rounded-lg border border-white/15 bg-white/5 px-4 py-3 text-left text-sm text-white/85"
                >
                  {t.prompt}
                </button>
              ))}
            </div>
          </>
        )}

        {availableRelays.length > 0 && (
          <>
            <p className="mb-2 text-sm font-semibold uppercase tracking-wide text-sky-300">Relay to Hale</p>
            <div className="mb-6 flex flex-col gap-2">
              {availableRelays.map((k) => (
                <button
                  key={k}
                  onClick={() => relay(k)}
                  className="rounded-lg border border-sky-400/30 bg-sky-400/10 px-4 py-3 text-left text-sm text-sky-200"
                >
                  {RELAY_COPY[k].label}
                </button>
              ))}
            </div>
          </>
        )}

        {Object.values(haleKnows).some(Boolean) && (
          <div className="mb-6 flex flex-col gap-2 text-sm text-white/60">
            {relayKeys.filter((k) => haleKnows[k]).map((k) => (
              <p key={k}>
                <span className="text-white/40">Hale: </span>
                {RELAY_COPY[k].haleAck}
              </p>
            ))}
          </div>
        )}
      </div>
      <div className="border-t border-white/10 bg-black/80 p-3">
        <button
          onClick={enterClimax}
          className="w-full rounded-lg border border-amber-400/40 bg-amber-400/10 px-5 py-3 text-sm font-medium text-amber-200"
        >
          Continue to the conversation with Hale
        </button>
      </div>
    </div>
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
    <div ref={containerRef} className="flex-1 overflow-y-auto px-4 py-4">
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
      const t = setTimeout(() => goTo("reveal"), 900);
      return () => clearTimeout(t);
    }
  }, [turnsUsed, pending, goTo]);

  function handleSend() {
    if (!text.trim() || !canSend) return;
    sendPlayerMessage(text);
    setText("");
  }

  return (
    <div className={`flex min-h-screen flex-col bg-black text-white ${BADGE_CLEARANCE}`}>
      <div className="flex items-center gap-3 border-b border-white/10 bg-black/70 px-4 py-2">
        <img src="/case3/hale.png" alt="Hale" className="h-9 w-9 rounded-full border border-white/15 object-cover" />
        <div className="flex flex-1 items-center justify-between text-[11px] uppercase tracking-wide text-white/50">
          <span>
            On the table: {proposal ?? "—"} · Agreed: {accepted ?? "none yet"}
          </span>
          <span>
            {remaining} turn{remaining === 1 ? "" : "s"} left
          </span>
        </div>
      </div>
      <Transcript>
        {conversation.map((line, i) => (
          <ChatBubble key={i} role={line.role === "player" ? "player" : "hale"} text={line.text} instant={i < seenCount} />
        ))}
        {pending && <p className="self-start text-xs text-white/40">Hale is responding…</p>}
      </Transcript>
      <div className="border-t border-white/10 bg-black/80 p-3">
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
    </div>
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
    <div className={`flex min-h-screen flex-col bg-black text-white ${BADGE_CLEARANCE}`}>
      {fallback && (
        <div className="border-b border-amber-400/30 bg-amber-400/10 px-4 py-2 text-[11px] uppercase tracking-wide text-amber-200">
          Connection lost — continuing with Hale's position based on what's already established. Not live AI.
        </div>
      )}
      <div className="flex items-center gap-3 border-b border-white/10 bg-black/70 px-4 py-2">
        <img src="/case3/hale.png" alt="Hale" className="h-9 w-9 rounded-full border border-white/15 object-cover" />
        <div className="text-[11px] uppercase tracking-wide text-white/50">
          On the table: {proposal ?? "—"} · Agreed: {accepted ?? "none yet"}
        </div>
      </div>
      <Transcript>
        {conversation.map((line, i) => (
          <ChatBubble key={i} role={line.role === "player" ? "player" : "hale"} text={line.text} instant />
        ))}
      </Transcript>
      <div className="border-t border-white/10 bg-black/80 p-3">
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
            See what happened
          </button>
        )}
      </div>
    </div>
  );
}

function Climax() {
  const mode = useCase3V2Store((s) => s.mode);
  const fallbackActive = useCase3V2Store((s) => s.fallbackActive);
  if (mode === "authored") return <AuthoredClimax />;
  if (fallbackActive) return <AuthoredClimax fallback />;
  return <ChatClimax />;
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
    <div className={`flex min-h-screen flex-col gap-6 bg-black px-5 py-8 text-white ${BADGE_CLEARANCE}`}>
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
          {toldKeys.length === 0 ? "Nothing — Hale entered the conversation knowing only the basic situation." : toldKeys.map((k) => RELAY_COPY[k].label.replace("Tell Hale: ", "")).join(" · ")}
        </p>
      </section>

      <section>
        <p className="mb-1 text-xs uppercase tracking-wide text-white/40">3. What was proposed and agreed</p>
        <p className="text-sm text-white/80">
          Agreed: <span className="font-medium text-amber-300">{commitment}</span>
          {proposal && proposal !== commitment ? <span className="text-white/50"> (last asked for: {proposal}, not reached)</span> : null}
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

  return (
    <div className="relative">
      <SoundToggle />
      {screen === "landing" && <Landing />}
      {screen === "opening" && <Opening />}
      {screen === "exploration" && <Exploration />}
      {screen === "climax" && <Climax />}
      {screen === "reveal" && <Reveal />}
      <ExperimentalBadge mode={mode} fallbackActive={fallbackActive} />
    </div>
  );
}
