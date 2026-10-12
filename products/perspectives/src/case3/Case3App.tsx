import { useEffect, useRef, useState } from "react";
import { useCase3Store, routeBStatus } from "./store";
import { isCase3Muted, playCase3Ambient, playCase3Sfx, setCase3Muted, stopCase3Ambient } from "./audio";
import { computeGrading } from "./reveal";
import {
  ACT1_HALE_OPENING,
  ACT1_MAYA_INTERRUPT,
  ACT1_RORY_INTERRUPT,
  D1_FORCE_THRESHOLD,
  D1_OPTIONS,
  D2_FORCE_THRESHOLD,
  D2_OPTIONS,
  D4_OPTIONS,
  D4_PREVIEW,
  GROUND_TRUTH_REVEAL,
  HALE,
  MAYA,
  OUTCOME_MATRIX,
  PRESSURE_START,
  RORY,
  RORY_THRESHOLD_WARNING,
  ROUTE_B_FLOOR,
} from "./data";
import type { AgentDef, AgentId, D4Option, Route } from "./types";

const RORY_PORTRAIT = "/case3/rory.png";

/** Fixed-height footer bar, not a floating pill — reserving real layout
 * space (via PROTOTYPE_BADGE_CLEARANCE below) is what keeps it from
 * covering the last interactive control on short viewports. */
export const PROTOTYPE_BADGE_CLEARANCE = "pb-9";

function PrototypeBadge() {
  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-0 z-50 flex h-7 items-center justify-center border-t border-white/10 bg-black/85 text-[10px] uppercase tracking-wide text-white/50">
      Prototype — guided, authored responses, not live AI
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

/**
 * Two-tier, large-type header: framing on top, live state below as a
 * visual gauge + badges — not a single dense row of 11px text. The
 * margin bar replaces earlier "Cost 10" / "−2 margin" number-first
 * language; the consequence is shown, not explained.
 */
function StatusBar({
  act,
  objective,
  lowThreshold = D1_FORCE_THRESHOLD,
}: {
  act: string;
  objective: string;
  /** The bar turns red at the threshold that's actually live right now — D1's in Act II, D2's (lower) in Act III — not a fixed number everywhere. */
  lowThreshold?: number;
}) {
  const { pressure, fireStatus } = useCase3Store();
  const routeB = routeBStatus(pressure);
  const pct = Math.max(0, Math.min(100, (pressure / PRESSURE_START) * 100));
  const low = pressure <= lowThreshold;

  return (
    <div className="border-b border-white/10 bg-black/70 backdrop-blur">
      <div className="px-4 pb-1.5 pt-3">
        <p className="text-sm font-semibold uppercase tracking-wide text-amber-300">{act}</p>
        <p className="mt-0.5 text-sm text-white/60">{objective}</p>
      </div>
      <div className="flex items-center gap-3 px-4 pb-3">
        <div className="h-2.5 flex-1 overflow-hidden rounded-full bg-white/10">
          <div
            className={`h-full rounded-full transition-all duration-500 ${low ? "bg-red-400" : "bg-amber-400"}`}
            style={{ width: `${pct}%` }}
          />
        </div>
        <span
          className={`shrink-0 rounded-full border px-2 py-0.5 text-[11px] font-medium uppercase ${
            fireStatus === "unknown" ? "border-sky-400/30 bg-sky-400/10 text-sky-300" : "border-red-400/30 bg-red-400/10 text-red-300"
          }`}
        >
          Fire {fireStatus === "unknown" ? "unknown" : "smoldering"}
        </span>
        <span className="shrink-0 rounded-full border border-emerald-400/30 bg-emerald-400/10 px-2 py-0.5 text-[11px] font-medium uppercase text-emerald-300">
          A open
        </span>
        <span
          className={`shrink-0 rounded-full border px-2 py-0.5 text-[11px] font-medium uppercase ${
            routeB === "open" ? "border-emerald-400/30 bg-emerald-400/10 text-emerald-300" : "border-red-400/30 bg-red-400/10 text-red-300"
          }`}
        >
          B {routeB === "open" ? "open" : "closed"}
        </span>
      </div>
    </div>
  );
}

/**
 * The core interaction surface, replacing free text. Shows a capped set
 * of currently-available questions (primary + unlocked follow-ups),
 * each directly bound to its topic id — never keyword-matched. Asked
 * topics stay visible as free, explicitly marked rerereads rather than
 * disappearing, so "ask vs. reread" is always legible at a glance.
 */
function QuestionList({
  agentId,
  def,
  free = false,
  forceThreshold = D1_FORCE_THRESHOLD,
}: {
  agentId: AgentId;
  def: AgentDef;
  free?: boolean;
  /** Which act's forced-decision threshold currently gates NEW asks — D1's in Act II, D2's in Act III. Rereads are never gated by this. */
  forceThreshold?: number;
}) {
  const { askedTopics, pressure, selectTopic } = useCase3Store();
  const [showAll, setShowAll] = useState(false);
  const forced = !free && pressure <= forceThreshold;
  const asked = askedTopics[agentId];

  const topics = free ? def.topics.filter((t) => def.act1Topics?.includes(t.id)) : def.topics;
  const available = topics.filter(
    (t) => !t.requiresAsked || askedTopics[t.requiresAsked.agent ?? agentId]?.has(t.requiresAsked.topicId)
  );
  const visible = showAll ? available : available.slice(0, 3);
  const hiddenCount = available.length - visible.length;

  return (
    <div className="flex w-full max-w-sm flex-col gap-2">
      {visible.map((t) => {
        const isAsked = asked.has(t.id);
        const locked = forced && !isAsked;
        return (
          <button
            key={t.id}
            disabled={locked}
            onClick={() => selectTopic(agentId, t.id)}
            className={`flex items-center justify-between gap-2 rounded-xl border px-3 py-2.5 text-left text-sm active:scale-[0.98] ${
              locked
                ? "cursor-not-allowed border-white/5 bg-white/[0.02] text-white/25"
                : isAsked
                  ? "border-white/10 bg-white/[0.03] text-white/70"
                  : "border-amber-300/25 bg-amber-300/[0.06] text-white"
            }`}
          >
            <span>{t.prompt}</span>
            {isAsked ? (
              <span className="shrink-0 text-[11px] uppercase text-white/35">{"↺"} reread</span>
            ) : free ? (
              <span className="shrink-0 text-[11px] uppercase text-emerald-300/70">free</span>
            ) : (
              <span className="shrink-0 font-mono text-[11px] text-amber-300/70">{"−"}{t.cost}</span>
            )}
          </button>
        );
      })}
      {hiddenCount > 0 && !showAll && (
        <button onClick={() => setShowAll(true)} className="py-1 text-center text-xs text-white/40">
          Show {hiddenCount} more
        </button>
      )}
    </div>
  );
}

function MiniRoster({ active }: { active: AgentId }) {
  const items: { id: AgentId; name: string; portrait: string }[] = [
    { id: "hale", name: "Hale", portrait: HALE.portrait },
    { id: "maya", name: "Maya", portrait: MAYA.portrait },
    { id: "rory", name: "Rory", portrait: RORY_PORTRAIT },
  ];
  return (
    <div className="flex justify-center gap-3">
      {items.map((a) => (
        <div key={a.id} className={`flex flex-col items-center gap-1 rounded-xl border p-1.5 ${a.id === active ? "border-amber-300/30 bg-amber-300/[0.06]" : "border-white/5 bg-black/30 opacity-50"}`}>
          <img
            src={a.portrait}
            alt={a.name}
            className={`h-10 w-10 rounded-full object-cover object-top ${a.id === active ? "" : "grayscale"}`}
          />
          <span className={`text-[10px] font-medium ${a.id === active ? "text-white" : "text-white/50"}`}>{a.name}</span>
          {a.id !== active && <span className="text-[8px] uppercase text-white/35">standing by</span>}
        </div>
      ))}
    </div>
  );
}

function ColdOpen() {
  const begin = useCase3Store((s) => s.begin);
  useEffect(() => {
    const t = setTimeout(() => playCase3Sfx("bang"), 600);
    return () => clearTimeout(t);
  }, []);
  return (
    <div className="relative flex h-full w-full items-end justify-center overflow-hidden">
      <img src="/case3/night-flight.png" alt="" className="absolute inset-0 h-full w-full object-cover" />
      <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-black/40" />
      <div className="relative z-10 flex w-full max-w-md flex-col items-center gap-4 px-6 pb-14 text-center">
        <p className="text-xs uppercase tracking-[0.3em] text-white/60">Perspectives — Case 003</p>
        <h1 className="text-3xl font-semibold tracking-wide text-white">FLIGHT 702</h1>
        <p className="text-sm text-white/70">A bang, sharp enough to rattle the overhead bins. Then — quiet. Too quiet.</p>
        <button
          onClick={() => {
            playCase3Ambient();
            begin();
          }}
          className="mt-2 w-full rounded-xl bg-amber-400 py-3 text-base font-semibold text-black active:scale-[0.98]"
        >
          Continue
        </button>
        <p className="text-[11px] text-white/40">No cost for reading or continuing.</p>
      </div>
    </div>
  );
}

function Act1Hale() {
  const { hale, askedTopics, advanceAct1ToMaya } = useCase3Store();
  const picked = askedTopics.hale.size > 0;

  return (
    <div className="flex h-full flex-col">
      <StatusBar act="ACT I — THE BANG" objective="Orient. Crisis Director unavailable — you're it." />
      <div className="relative flex-1 overflow-hidden">
        <img src="/case3/situation-room.png" alt="" className="absolute inset-0 h-full w-full object-cover opacity-50" />
        <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/30 to-black/80" />
        <div className={`relative flex h-full flex-col items-center justify-end gap-3 px-4 pb-4 ${PROTOTYPE_BADGE_CLEARANCE}`}>
          <MiniRoster active="hale" />
          <img src={HALE.portrait} alt="Hale" className="max-h-[32vh] w-auto object-contain drop-shadow-2xl" />
          <p className="text-center text-xs uppercase tracking-wide text-white/50">{HALE.name} — {HALE.role}</p>

          {hale.length === 0 && (
            <div className="w-full max-w-sm rounded-2xl border border-white/10 bg-black/60 p-3 text-[15px] leading-snug text-white/90">
              "{ACT1_HALE_OPENING}"
            </div>
          )}

          {hale.map((line, i) => (
            <div
              key={i}
              className={`w-full max-w-sm rounded-2xl p-3 text-[15px] leading-snug ${
                line.role === "player" ? "ml-auto border border-amber-300/30 bg-amber-300/10 text-amber-100" : "border border-white/10 bg-black/60 text-white/90"
              }`}
            >
              {line.text}
            </div>
          ))}

          {!picked ? (
            <QuestionList agentId="hale" def={HALE} free />
          ) : (
            <button
              onClick={advanceAct1ToMaya}
              className="w-full max-w-sm rounded-xl bg-white/10 py-3 text-base font-medium text-white active:scale-[0.98]"
            >
              Continue
            </button>
          )}
          <p className="text-[11px] text-white/35">Orientation · one question, free</p>
        </div>
      </div>
    </div>
  );
}

function IncomingEventScreen({
  act,
  objective,
  portrait,
  name,
  cue,
  line,
  onContinue,
  continueLabel,
}: {
  act: string;
  objective: string;
  portrait: string;
  name: string;
  cue: string;
  line: string;
  onContinue: () => void;
  continueLabel: string;
}) {
  useEffect(() => {
    playCase3Sfx("ping");
  }, []);
  return (
    <div className="flex h-full flex-col">
      <StatusBar act={act} objective={objective} />
      <div className={`flex flex-1 flex-col items-center justify-center gap-4 bg-black/80 px-6 text-center ${PROTOTYPE_BADGE_CLEARANCE}`}>
        <span className="rounded-full border border-amber-300/40 bg-amber-300/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-wide text-amber-300">
          {cue}
        </span>
        <img src={portrait} alt={name} className="max-h-[36vh] w-auto object-contain drop-shadow-2xl" />
        <p className="max-w-sm text-[15px] leading-snug text-white/90">"{line}"</p>
        <button
          onClick={onContinue}
          className="mt-2 w-full max-w-sm rounded-xl bg-amber-400 py-3 text-base font-semibold text-black active:scale-[0.98]"
        >
          {continueLabel}
        </button>
        <p className="text-[11px] text-white/35">Orientation · no cost</p>
      </div>
    </div>
  );
}

function Act2Room() {
  const { pressure, hale, maya, ops, focusedAgent, focusAgent, openD1 } = useCase3Store();
  const forced = pressure <= D1_FORCE_THRESHOLD;
  const forcedAlertFired = useRef(false);

  useEffect(() => {
    if (forced && !forcedAlertFired.current) {
      forcedAlertFired.current = true;
      playCase3Sfx("ping");
    }
  }, [forced]);

  const activeAgent = focusedAgent === "hale" ? HALE : focusedAgent === "maya" ? MAYA : null;
  const activeHistory = focusedAgent === "hale" ? hale : focusedAgent === "maya" ? maya : [];

  return (
    <div className="flex h-full flex-col">
      <StatusBar act="ACT II — SEPARATING THE PROBLEM" objective="Bang, fire, comms loss — one problem or three?" />
      <div className="relative flex-1 overflow-hidden">
        {!focusedAgent && (
          <>
            <img src="/case3/situation-room.png" alt="" className="absolute inset-0 h-full w-full object-cover opacity-60" />
            <img
              src="/case3/aircraft.png"
              alt=""
              className="pointer-events-none absolute left-1/2 top-[14%] w-[72%] -translate-x-1/2 opacity-90 drop-shadow-2xl"
            />
          </>
        )}
        {focusedAgent && (
          <img src={activeAgent!.portrait} alt="" className="absolute inset-0 h-full w-full object-cover opacity-25 blur-sm" />
        )}
        <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-black/10 to-black/85" />

        <div className="relative flex h-full flex-col">
          {ops.length > 0 && !focusedAgent && (
            <div className="mx-auto mt-3 max-w-sm rounded-xl border border-white/15 bg-black/70 px-3 py-2 text-center text-[13px] text-white/80">
              {ops[ops.length - 1].text}
            </div>
          )}

          {focusedAgent && (
            <div className="flex flex-1 flex-col items-center justify-end gap-2 overflow-hidden px-4 pt-2">
              <img src={activeAgent!.portrait} alt={activeAgent!.name} className="max-h-[24vh] w-auto object-contain drop-shadow-2xl" />
            </div>
          )}

          <div className={`${focusedAgent ? "" : "mt-auto"} flex flex-col items-center gap-3 px-4 pb-4 ${PROTOTYPE_BADGE_CLEARANCE}`}>
            {!focusedAgent ? (
              <>
                <div className="flex justify-center gap-3">
                  {[
                    { id: "hale" as const, def: HALE },
                    { id: "maya" as const, def: MAYA },
                  ].map(({ id, def }) => (
                    <button
                      key={id}
                      onClick={() => focusAgent(id)}
                      className="flex flex-col items-center gap-1 rounded-xl border border-white/10 bg-black/50 p-2 active:scale-[0.97]"
                    >
                      <img src={def.portrait} alt={def.name} className="h-16 w-16 rounded-full object-cover object-top" />
                      <span className="text-xs font-medium text-white">{def.name}</span>
                    </button>
                  ))}
                  <div className="flex flex-col items-center gap-1 rounded-xl border border-white/5 bg-black/30 p-2 opacity-50">
                    <img src={RORY_PORTRAIT} alt="Rory" className="h-16 w-16 rounded-full object-cover object-top grayscale" />
                    <span className="text-xs font-medium text-white/60">Rory</span>
                    <span className="text-[9px] uppercase text-white/40">standing by</span>
                  </div>
                </div>

                {forced ? (
                  <button
                    onClick={openD1}
                    className="w-full max-w-sm rounded-xl bg-red-400/90 py-3 text-base font-semibold text-black active:scale-[0.98]"
                  >
                    Time to decide — open D1
                  </button>
                ) : (
                  <button
                    onClick={openD1}
                    className="w-full max-w-sm rounded-xl border border-white/15 bg-white/5 py-3 text-sm font-medium text-white/80 active:scale-[0.98]"
                  >
                    I'm ready to decide (D1)
                  </button>
                )}
              </>
            ) : (
              <>
                <div className="flex w-full max-w-sm items-center justify-between">
                  <button
                    onClick={() => useCase3Store.setState({ focusedAgent: null })}
                    className="text-sm text-white/50"
                  >
                    ← Room
                  </button>
                  <div className="text-center">
                    <p className="text-sm font-semibold text-white">{activeAgent!.name}</p>
                    <p className="text-[11px] text-white/50">{activeAgent!.role}</p>
                  </div>
                  <span className="w-12" />
                </div>

                {activeHistory.length > 0 && (
                  <div className="flex max-h-32 w-full max-w-sm flex-col gap-2 overflow-y-auto">
                    {activeHistory.map((line, i) => (
                      <div
                        key={i}
                        className={`max-w-[90%] rounded-xl p-2.5 text-[14px] leading-snug ${
                          line.role === "player"
                            ? "ml-auto border border-amber-300/30 bg-amber-300/10 text-amber-100"
                            : `border bg-black/60 text-white/90 ${line.reread ? "border-white/5 opacity-70" : "border-white/10"}`
                        }`}
                      >
                        {line.reread && <span className="mr-1 text-white/40">{"↺"}</span>}
                        {line.text}
                      </div>
                    ))}
                  </div>
                )}

                {forced && (
                  <div className="w-full max-w-sm rounded-xl border border-red-400/30 bg-red-400/10 px-3 py-2 text-center text-[13px] text-red-200">
                    Time's short — only answered questions can be reread now.
                  </div>
                )}

                <QuestionList agentId={focusedAgent} def={activeAgent!} />
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function D1Decision() {
  const { pressure, commitD1 } = useCase3Store();

  function preview(cost: number) {
    const after = Math.max(0, pressure - cost);
    const routeB = after >= ROUTE_B_FLOOR ? "open" : "closed";
    return { after, routeB };
  }

  const visual = preview(D1_OPTIONS.visual_check.cost);
  const instruments = preview(D1_OPTIONS.instruments_only.cost);

  return (
    <div className="flex h-full flex-col">
      <StatusBar act="D1 — MAKE THE CALL" objective="The cargo-smoke reading is still unconfirmed." />
      <div className={`flex flex-1 flex-col justify-center gap-4 bg-black/85 px-5 py-6 ${PROTOTYPE_BADGE_CLEARANCE}`}>
        <p className="text-center text-sm text-white/60">What we know: a smoke warning, unconfirmed. What's missing: whether it's real.</p>

        <button
          onClick={() => commitD1("visual_check")}
          className="rounded-2xl border border-amber-300/30 bg-amber-300/10 p-4 text-left active:scale-[0.98]"
        >
          <p className="text-base font-semibold text-amber-200">{D1_OPTIONS.visual_check.label}</p>
          <p className="mt-1 text-sm text-white/70">Takes real time. Route B stays {visual.routeB}{visual.routeB === "closed" ? ` — needed ${ROUTE_B_FLOOR}+ remaining` : ", barely"}.</p>
          <div className="mt-2 flex items-center gap-2">
            <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-white/10">
              <div className="h-full rounded-full bg-amber-300/70" style={{ width: `${(visual.after / PRESSURE_START) * 100}%` }} />
            </div>
            <span className="text-[11px] text-white/40">after: {visual.after}</span>
          </div>
        </button>

        <button
          onClick={() => commitD1("instruments_only")}
          className="rounded-2xl border border-white/15 bg-white/5 p-4 text-left active:scale-[0.98]"
        >
          <p className="text-base font-semibold text-white">{D1_OPTIONS.instruments_only.label}</p>
          <p className="mt-1 text-sm text-white/70">Immediate — no time lost. Fire stays unconfirmed, permanently.</p>
          <div className="mt-2 flex items-center gap-2">
            <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-white/10">
              <div className="h-full rounded-full bg-white/50" style={{ width: `${(instruments.after / PRESSURE_START) * 100}%` }} />
            </div>
            <span className="text-[11px] text-white/40">after: {instruments.after}</span>
          </div>
        </button>

        <p className="text-center text-[11px] text-white/35">This decision is irreversible.</p>
      </div>
    </div>
  );
}

function D1Consequence() {
  const { pressure, fireStatus, ops, ledger } = useCase3Store();
  const last = ops[ops.length - 1];
  const routeB = routeBStatus(pressure);

  useEffect(() => {
    stopCase3Ambient();
  }, []);

  return (
    <div className="flex h-full flex-col">
      <StatusBar act="D1 RESOLVED" objective="Act III — The Path — is next." />
      <div className={`flex flex-1 flex-col gap-4 overflow-y-auto bg-black/85 px-5 py-6 ${PROTOTYPE_BADGE_CLEARANCE}`}>
        {last && (
          <div className="rounded-2xl border border-white/15 bg-black/60 p-4 text-center">
            <span className="text-[11px] font-semibold uppercase tracking-wide text-amber-300">{last.cue}</span>
            <p className="mt-2 text-[15px] text-white/90">{last.text}</p>
          </div>
        )}

        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
          <p className="text-sm font-medium text-white/70">What that cost</p>
          <div className="mt-2 space-y-1 text-[13px] text-white/60">
            {ledger.map((e, i) => (
              <div key={i} className="flex justify-between">
                <span>{e.label}</span>
                <span className="font-mono">{e.delta} → {e.pressureAfter}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-3 gap-2 text-center text-[11px] uppercase tracking-wide">
          <div className="rounded-xl border border-white/10 bg-black/40 p-2">
            <p className="text-white/40">Margin</p>
            <p className="mt-1 text-base font-mono text-white">{pressure}</p>
          </div>
          <div className="rounded-xl border border-white/10 bg-black/40 p-2">
            <p className="text-white/40">Fire</p>
            <p className={`mt-1 text-base font-semibold ${fireStatus === "unknown" ? "text-sky-300" : "text-red-400"}`}>
              {fireStatus === "unknown" ? "UNKNOWN" : "SMOLDERING"}
            </p>
          </div>
          <div className="rounded-xl border border-white/10 bg-black/40 p-2">
            <p className="text-white/40">Route B</p>
            <p className={`mt-1 text-base font-semibold ${routeB === "open" ? "text-emerald-300" : "text-red-400"}`}>
              {routeB === "open" ? "OPEN" : "CLOSED"}
            </p>
          </div>
        </div>

        <button
          onClick={() => useCase3Store.getState().enterAct3()}
          className="rounded-xl bg-amber-400 py-3 text-base font-semibold text-black active:scale-[0.98]"
        >
          Continue to Act III
        </button>
        <button
          onClick={() => useCase3Store.getState().reset()}
          className="rounded-xl bg-white/10 py-3 text-base font-medium text-white active:scale-[0.98]"
        >
          Restart
        </button>
      </div>
    </div>
  );
}

function RouteCard({
  route,
  pressure,
  onCommit,
}: {
  route: Route;
  pressure: number;
  onCommit: (r: Route) => void;
}) {
  const opts = route === "A" ? D2_OPTIONS.route_A : D2_OPTIONS.route_B;
  const available = route === "A" || routeBStatus(pressure) === "open";
  const after = Math.max(0, pressure - opts.cost);

  return (
    <button
      onClick={() => available && onCommit(route)}
      disabled={!available}
      className={`rounded-2xl border p-4 text-left ${
        available ? "border-amber-300/30 bg-amber-300/10 active:scale-[0.98]" : "cursor-not-allowed border-white/5 bg-white/[0.02] opacity-50"
      }`}
    >
      <p className={`text-base font-semibold ${available ? "text-amber-200" : "text-white/40"}`}>
        Route {route} — {opts.label.replace(/^Commit to the /, "")}
      </p>
      <p className="mt-1 text-sm text-white/70">{opts.sublabel}</p>
      {available ? (
        <div className="mt-2 flex items-center gap-2">
          <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-white/10">
            <div className="h-full rounded-full bg-amber-300/70" style={{ width: `${(after / PRESSURE_START) * 100}%` }} />
          </div>
          <span className="text-[11px] text-white/40">after: {after}</span>
        </div>
      ) : (
        <p className="mt-2 text-[11px] uppercase text-red-300/70">No longer reachable — the window closed</p>
      )}
    </button>
  );
}

function Act3Room() {
  const { pressure, hale, maya, rory, ops, focusedAgent, focusAgent, openD2 } = useCase3Store();
  const forced = pressure <= D2_FORCE_THRESHOLD;
  const forcedAlertFired = useRef(false);

  useEffect(() => {
    if (forced && !forcedAlertFired.current) {
      forcedAlertFired.current = true;
      playCase3Sfx("ping");
    }
  }, [forced]);

  const agents: Record<"hale" | "maya" | "rory", { def: AgentDef; history: typeof hale }> = {
    hale: { def: HALE, history: hale },
    maya: { def: MAYA, history: maya },
    rory: { def: RORY, history: rory },
  };
  const activeAgent = focusedAgent ? agents[focusedAgent as "hale" | "maya" | "rory"].def : null;
  const activeHistory = focusedAgent ? agents[focusedAgent as "hale" | "maya" | "rory"].history : [];

  return (
    <div className="flex h-full flex-col">
      <StatusBar act="ACT III — THE PATH" objective="Choose where this plane goes before the weather chooses for you." lowThreshold={D2_FORCE_THRESHOLD} />
      <div className="relative flex-1 overflow-hidden">
        {!focusedAgent && (
          <img src="/case3/situation-room.png" alt="" className="absolute inset-0 h-full w-full object-cover opacity-60" />
        )}
        {focusedAgent && (
          <img src={activeAgent!.portrait} alt="" className="absolute inset-0 h-full w-full object-cover opacity-25 blur-sm" />
        )}
        <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-black/10 to-black/85" />

        <div className="relative flex h-full flex-col">
          {ops.length > 0 && !focusedAgent && (
            <div className="mx-auto mt-3 max-w-sm rounded-xl border border-white/15 bg-black/70 px-3 py-2 text-center text-[13px] text-white/80">
              {ops[ops.length - 1].text}
            </div>
          )}

          {focusedAgent && (
            <div className="flex flex-1 flex-col items-center justify-end gap-2 overflow-hidden px-4 pt-2">
              <img src={activeAgent!.portrait} alt={activeAgent!.name} className="max-h-[24vh] w-auto object-contain drop-shadow-2xl" />
            </div>
          )}

          <div className={`${focusedAgent ? "" : "mt-auto"} flex flex-col items-center gap-3 px-4 pb-4 ${PROTOTYPE_BADGE_CLEARANCE}`}>
            {!focusedAgent ? (
              <>
                <div className="flex justify-center gap-3">
                  {(["hale", "maya", "rory"] as const).map((id) => (
                    <button
                      key={id}
                      onClick={() => focusAgent(id)}
                      className="flex flex-col items-center gap-1 rounded-xl border border-white/10 bg-black/50 p-2 active:scale-[0.97]"
                    >
                      <img src={agents[id].def.portrait} alt={agents[id].def.name} className="h-16 w-16 rounded-full object-cover object-top" />
                      <span className="text-xs font-medium text-white">{agents[id].def.name}</span>
                    </button>
                  ))}
                </div>

                {forced ? (
                  <button
                    onClick={openD2}
                    className="w-full max-w-sm rounded-xl bg-red-400/90 py-3 text-base font-semibold text-black active:scale-[0.98]"
                  >
                    Time to decide — open D2
                  </button>
                ) : (
                  <button
                    onClick={openD2}
                    className="w-full max-w-sm rounded-xl border border-white/15 bg-white/5 py-3 text-sm font-medium text-white/80 active:scale-[0.98]"
                  >
                    I'm ready to decide (D2)
                  </button>
                )}
              </>
            ) : (
              <>
                <div className="flex w-full max-w-sm items-center justify-between">
                  <button onClick={() => useCase3Store.setState({ focusedAgent: null })} className="text-sm text-white/50">
                    ← Room
                  </button>
                  <div className="text-center">
                    <p className="text-sm font-semibold text-white">{activeAgent!.name}</p>
                    <p className="text-[11px] text-white/50">{activeAgent!.role}</p>
                  </div>
                  <span className="w-12" />
                </div>

                {activeHistory.length > 0 && (
                  <div className="flex max-h-32 w-full max-w-sm flex-col gap-2 overflow-y-auto">
                    {activeHistory.map((line, i) => (
                      <div
                        key={i}
                        className={`max-w-[90%] rounded-xl p-2.5 text-[14px] leading-snug ${
                          line.role === "player"
                            ? "ml-auto border border-amber-300/30 bg-amber-300/10 text-amber-100"
                            : `border bg-black/60 text-white/90 ${line.reread ? "border-white/5 opacity-70" : "border-white/10"}`
                        }`}
                      >
                        {line.reread && <span className="mr-1 text-white/40">{"↺"}</span>}
                        {line.text}
                      </div>
                    ))}
                  </div>
                )}

                {forced && (
                  <div className="w-full max-w-sm rounded-xl border border-red-400/30 bg-red-400/10 px-3 py-2 text-center text-[13px] text-red-200">
                    Time's short — only answered questions can be reread now.
                  </div>
                )}

                <QuestionList agentId={focusedAgent} def={activeAgent!} forceThreshold={D2_FORCE_THRESHOLD} />
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function D2Decision() {
  const { pressure, commitD2 } = useCase3Store();
  return (
    <div className="flex h-full flex-col">
      <StatusBar act="D2 — MAKE THE CALL" objective="Which route do you commit to?" lowThreshold={D2_FORCE_THRESHOLD} />
      <div className={`flex flex-1 flex-col justify-center gap-4 bg-black/85 px-5 py-6 ${PROTOTYPE_BADGE_CLEARANCE}`}>
        <p className="text-center text-sm text-white/60">Committing to one closes the other — permanently.</p>
        <RouteCard route="A" pressure={pressure} onCommit={commitD2} />
        <RouteCard route="B" pressure={pressure} onCommit={commitD2} />
        <p className="text-center text-[11px] text-white/35">This decision is irreversible.</p>
      </div>
    </div>
  );
}

function D2Consequence() {
  const { committedRoute, pressure, ops } = useCase3Store();
  const last = ops[ops.length - 1];
  return (
    <div className="flex h-full flex-col">
      <StatusBar act="D2 RESOLVED" objective="Act IV — The Call — is next." lowThreshold={D2_FORCE_THRESHOLD} />
      <div className={`flex flex-1 flex-col gap-4 bg-black/85 px-5 py-6 ${PROTOTYPE_BADGE_CLEARANCE}`}>
        {last && (
          <div className="rounded-2xl border border-white/15 bg-black/60 p-4 text-center">
            <p className="text-[15px] text-white/90">{last.text}</p>
          </div>
        )}
        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 text-center">
          <p className="text-sm text-white/60">Committed route</p>
          <p className="mt-1 text-xl font-semibold text-amber-200">Route {committedRoute}</p>
          <p className="mt-1 text-sm text-white/40">Margin remaining: {pressure}</p>
        </div>
        <button
          onClick={() => useCase3Store.getState().enterAct4()}
          className="rounded-xl bg-amber-400 py-3 text-base font-semibold text-black active:scale-[0.98]"
        >
          Continue to Act IV
        </button>
      </div>
    </div>
  );
}

function Act4Hale() {
  const { hale, committedRoute, openD4 } = useCase3Store();
  const last = hale[hale.length - 1];
  return (
    <div className="flex h-full flex-col">
      <StatusBar act="ACT IV — THE CALL" objective="Make the final call with what you actually know." />
      <div className={`relative flex-1 overflow-hidden`}>
        <img src="/case3/situation-room.png" alt="" className="absolute inset-0 h-full w-full object-cover opacity-40" />
        <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/30 to-black/85" />
        <div className={`relative flex h-full flex-col items-center justify-end gap-3 px-4 pb-4 ${PROTOTYPE_BADGE_CLEARANCE}`}>
          <img src={HALE.portrait} alt="Hale" className="max-h-[34vh] w-auto object-contain drop-shadow-2xl" />
          <p className="text-center text-xs uppercase tracking-wide text-white/50">{HALE.name} — Route {committedRoute} committed</p>
          {last && (
            <div className="w-full max-w-sm rounded-2xl border border-white/10 bg-black/60 p-3 text-[15px] leading-snug text-white/90">
              "{last.text}"
            </div>
          )}
          <button
            onClick={openD4}
            className="w-full max-w-sm rounded-xl bg-amber-400 py-3 text-base font-semibold text-black active:scale-[0.98]"
          >
            Make the call
          </button>
          <p className="text-[11px] text-white/35">No new questions here, deliberately — this is the climax, not another window.</p>
        </div>
      </div>
    </div>
  );
}

function D4Decision() {
  const { committedRoute, commitD4 } = useCase3Store();
  const route = committedRoute ?? "A";
  return (
    <div className="flex h-full flex-col">
      <StatusBar act="D4 — MAKE THE CALL" objective="Final preparation, before touchdown." />
      <div className={`flex flex-1 flex-col justify-center gap-4 bg-black/85 px-5 py-6 ${PROTOTYPE_BADGE_CLEARANCE}`}>
        {(Object.keys(D4_OPTIONS) as D4Option[]).map((opt) => (
          <button
            key={opt}
            onClick={() => commitD4(opt)}
            className={`rounded-2xl border p-4 text-left active:scale-[0.98] ${
              opt === "full_prep" ? "border-amber-300/30 bg-amber-300/10" : "border-white/15 bg-white/5"
            }`}
          >
            <p className={`text-base font-semibold ${opt === "full_prep" ? "text-amber-200" : "text-white"}`}>{D4_OPTIONS[opt].label}</p>
            <p className="mt-1 text-sm text-white/70">{D4_PREVIEW[route][opt]}</p>
          </button>
        ))}
        <p className="text-center text-[11px] text-white/35">This decision is irreversible.</p>
      </div>
    </div>
  );
}

function Reveal() {
  const state = useCase3Store();
  const [showFullStory, setShowFullStory] = useState(false);
  const route = state.committedRoute ?? "A";
  const d4 = state.d4Choice ?? "standard";
  const outcome = OUTCOME_MATRIX[route][d4];
  const grading = computeGrading({
    d1Choice: state.ledger.some((e) => e.label.includes("visual check")) ? "visual_check" : "instruments_only",
    fireStatus: state.fireStatus,
    route,
    d4Choice: d4,
    d1WasForced: state.d1WasForced,
    d2WasForced: state.d2WasForced,
  });

  const askedCount = Object.values(state.askedTopics).reduce((n, s) => n + s.size, 0);
  const learnedBeats: string[] = [];
  if (state.askedTopics.maya.has("old_writeup")) learnedBeats.push("You learned the unit had a prior, closed-out write-up.");
  if (state.askedTopics.hale.has("injuries_checklist")) learnedBeats.push("You learned the first officer skipped a checklist step.");
  if (state.fireStatus === "confirmed_smoldering") learnedBeats.push("You confirmed the fire directly — it wasn't a guess.");
  else learnedBeats.push("You never confirmed the fire — you decided on incomplete information.");

  const levelColor: Record<string, string> = {
    strong: "text-emerald-300",
    mixed: "text-amber-300",
    weak: "text-red-300",
  };

  return (
    <div className="flex h-full flex-col">
      <StatusBar act="REVEAL" objective="What happened, what you knew, and how you decided." />
      <div className={`flex flex-1 flex-col gap-4 overflow-y-auto bg-black/85 px-5 py-6 ${PROTOTYPE_BADGE_CLEARANCE}`}>
        <div className="rounded-2xl border border-amber-300/20 bg-amber-300/[0.06] p-4 text-center">
          <p className="text-xs uppercase tracking-wide text-amber-300/80">Outcome</p>
          <p className="mt-1 text-xl font-semibold text-amber-200">{outcome.label}</p>
          <p className="mt-2 text-sm leading-relaxed text-white/80">{outcome.narrative}</p>
        </div>

        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
          <p className="text-sm font-medium text-white/70">What you decided</p>
          <ul className="mt-2 space-y-1 text-sm text-white/80">
            <li>• D1: {state.fireStatus === "confirmed_smoldering" ? "Checked the cargo hold directly" : "Went with instruments only"}</li>
            <li>• D2: Committed to Route {route}</li>
            <li>• D4: {D4_OPTIONS[d4].label}</li>
          </ul>
        </div>

        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
          <p className="text-sm font-medium text-white/70">What you learned ({askedCount} question{askedCount === 1 ? "" : "s"} asked)</p>
          <ul className="mt-2 space-y-1 text-sm text-white/80">
            {learnedBeats.map((b, i) => <li key={i}>• {b}</li>)}
          </ul>
        </div>

        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
          <p className="text-sm font-medium text-white/70">Judgment — separate from the outcome above</p>
          <div className="mt-2 space-y-3">
            {grading.map((g) => (
              <div key={g.label}>
                <p className="text-sm font-medium">
                  {g.label}: <span className={levelColor[g.level]}>{g.level}</span>
                </p>
                <p className="text-sm text-white/60">{g.reasoning}</p>
              </div>
            ))}
          </div>
        </div>

        {!showFullStory ? (
          <button
            onClick={() => setShowFullStory(true)}
            className="rounded-2xl border border-white/15 bg-white/[0.04] py-3 text-base font-medium text-white active:scale-[0.98]"
          >
            Show the complete story
          </button>
        ) : (
          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
            <p className="text-sm font-medium text-amber-200">What actually happened</p>
            {GROUND_TRUTH_REVEAL.map((p, i) => (
              <p key={i} className={`mt-2 text-sm leading-relaxed ${i === GROUND_TRUTH_REVEAL.length - 1 ? "italic text-white/60" : "text-white/80"}`}>
                {p}
              </p>
            ))}
          </div>
        )}

        <button
          onClick={() => useCase3Store.getState().reset()}
          className="rounded-xl bg-white/10 py-4 text-lg font-semibold text-white active:scale-[0.98]"
        >
          Play again
        </button>
      </div>
    </div>
  );
}

export default function Case3App() {
  const screen = useCase3Store((s) => s.screen);

  return (
    <div className="h-dvh w-full bg-[#0a0a0d] text-white">
      {screen === "cold_open" && <ColdOpen />}
      {screen === "act1_hale" && <Act1Hale />}
      {screen === "act1_maya_interrupt" && (
        <IncomingEventScreen
          act="ACT I — THE BANG"
          objective="The world has its own initiative."
          portrait={MAYA.portrait}
          name={MAYA.name}
          cue={ACT1_MAYA_INTERRUPT.cue}
          line={ACT1_MAYA_INTERRUPT.line}
          onContinue={() => useCase3Store.getState().advanceAct1ToRory()}
          continueLabel="Continue"
        />
      )}
      {screen === "act1_rory_interrupt" && (
        <IncomingEventScreen
          act="ACT I — THE BANG"
          objective="The world has its own initiative."
          portrait={RORY_PORTRAIT}
          name="Rory"
          cue={ACT1_RORY_INTERRUPT.cue}
          line={ACT1_RORY_INTERRUPT.line}
          onContinue={() => useCase3Store.getState().enterAct2()}
          continueLabel="Begin Act II — margin costs start now"
        />
      )}
      {screen === "act3_rory_warning" && (
        <IncomingEventScreen
          act="ACT III — THE PATH"
          objective="The world has its own initiative."
          portrait={RORY_PORTRAIT}
          name="Rory"
          cue={RORY_THRESHOLD_WARNING.cue}
          line={RORY_THRESHOLD_WARNING.line}
          onContinue={() => useCase3Store.getState().dismissRoryWarning()}
          continueLabel="Continue"
        />
      )}
      {screen === "act2_room" && <Act2Room />}
      {screen === "d1_decision" && <D1Decision />}
      {screen === "d1_consequence" && <D1Consequence />}
      {screen === "act3_room" && <Act3Room />}
      {screen === "d2_decision" && <D2Decision />}
      {screen === "d2_consequence" && <D2Consequence />}
      {screen === "act4_hale" && <Act4Hale />}
      {screen === "d4_decision" && <D4Decision />}
      {screen === "reveal" && <Reveal />}
      <SoundToggle />
      <PrototypeBadge />
    </div>
  );
}
