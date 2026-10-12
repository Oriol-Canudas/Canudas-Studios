import { useState } from "react";
import { useCase3Store, routeBStatus } from "./store";
import {
  ACT1_HALE_OPENING,
  ACT1_MAYA_INTERRUPT,
  ACT1_RORY_INTERRUPT,
  D1_FORCE_THRESHOLD,
  D1_OPTIONS,
  HALE,
  MAYA,
  ROUTE_B_FLOOR,
} from "./data";

const RORY_PORTRAIT = "/case3/rory.png";

/** Fixed-height footer bar, not a floating pill — reserving real layout
 * space (via PROTOTYPE_BADGE_CLEARANCE below) is what keeps it from
 * covering the last interactive control on short viewports. */
export const PROTOTYPE_BADGE_CLEARANCE = "pb-9";

function PrototypeBadge() {
  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-0 z-50 flex h-7 items-center justify-center border-t border-white/10 bg-black/85 text-[10px] uppercase tracking-wide text-white/50">
      Prototype — scripted responses, not live AI
    </div>
  );
}

function StatusBar({ act, objective }: { act: string; objective: string }) {
  const { pressure, fireStatus } = useCase3Store();
  const routeB = routeBStatus(pressure);
  return (
    <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1 border-b border-white/10 bg-black/60 px-3 py-2 text-[11px] uppercase tracking-wide text-white/70 backdrop-blur">
      <span className="font-semibold text-amber-300">{act}</span>
      <span className="text-white/50">{objective}</span>
      <span className="font-mono">MARGIN: {pressure}</span>
      <span className={fireStatus === "unknown" ? "text-sky-300" : "text-red-400"}>
        FIRE: {fireStatus === "unknown" ? "UNKNOWN" : "SMOLDERING"}
      </span>
      <span className="text-emerald-300">ROUTE A: AVAILABLE</span>
      <span className={routeB === "open" ? "text-emerald-300" : "text-red-400"}>
        ROUTE B: {routeB === "open" ? "AVAILABLE" : "CLOSED"}
      </span>
    </div>
  );
}

function ColdOpen() {
  const begin = useCase3Store((s) => s.begin);
  return (
    <div className="relative flex h-full w-full items-end justify-center overflow-hidden">
      <img src="/case3/night-flight.png" alt="" className="absolute inset-0 h-full w-full object-cover" />
      <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-black/40" />
      <div className="relative z-10 flex w-full max-w-md flex-col items-center gap-4 px-6 pb-14 text-center">
        <p className="text-xs uppercase tracking-[0.3em] text-white/60">Perspectives — Case 003</p>
        <h1 className="text-3xl font-semibold tracking-wide text-white">FLIGHT 702</h1>
        <p className="text-sm text-white/70">A bang, sharp enough to rattle the overhead bins. Then — quiet. Too quiet.</p>
        <button
          onClick={begin}
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
  const { hale, act1FreeUsed, sendAct1Free, advanceAct1ToMaya } = useCase3Store();
  const [draft, setDraft] = useState("");

  function send() {
    if (!draft.trim() || act1FreeUsed) return;
    sendAct1Free(draft.trim());
    setDraft("");
  }

  return (
    <div className="flex h-full flex-col">
      <StatusBar act="ACT I — THE BANG" objective="Orient. Crisis Director unavailable — you're it." />
      <div className="relative flex-1 overflow-hidden">
        <img src="/case3/situation-room.png" alt="" className="absolute inset-0 h-full w-full object-cover opacity-50" />
        <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/30 to-black/80" />
        <div className={`relative flex h-full flex-col items-center justify-end gap-3 px-4 pb-4 ${PROTOTYPE_BADGE_CLEARANCE}`}>
          <img src={HALE.portrait} alt="Hale" className="h-40 w-auto object-contain drop-shadow-2xl" />
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

          {!act1FreeUsed ? (
            <div className="flex w-full max-w-sm items-center gap-2">
              <input
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && send()}
                placeholder="Ask Hale anything…"
                className="flex-1 rounded-xl border border-white/15 bg-white/5 px-3 py-2.5 text-[15px] text-white placeholder:text-white/35 focus:outline-none focus:ring-1 focus:ring-amber-300/50"
                aria-label="Message to Hale"
              />
              <button onClick={send} className="rounded-xl bg-amber-400 px-4 py-2.5 text-sm font-semibold text-black">
                Send
              </button>
            </div>
          ) : (
            <button
              onClick={advanceAct1ToMaya}
              className="w-full max-w-sm rounded-xl bg-white/10 py-3 text-base font-medium text-white active:scale-[0.98]"
            >
              Continue
            </button>
          )}
          <p className="text-[11px] text-white/35">Orientation · no margin cost</p>
        </div>
      </div>
    </div>
  );
}

function IncomingEventScreen({
  portrait,
  name,
  cue,
  line,
  onContinue,
  continueLabel,
}: {
  portrait: string;
  name: string;
  cue: string;
  line: string;
  onContinue: () => void;
  continueLabel: string;
}) {
  return (
    <div className="flex h-full flex-col">
      <StatusBar act="ACT I — THE BANG" objective="The world has its own initiative." />
      <div className={`flex flex-1 flex-col items-center justify-center gap-4 bg-black/80 px-6 text-center ${PROTOTYPE_BADGE_CLEARANCE}`}>
        <span className="rounded-full border border-amber-300/40 bg-amber-300/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-wide text-amber-300">
          {cue}
        </span>
        <img src={portrait} alt={name} className="h-36 w-auto object-contain drop-shadow-2xl" />
        <p className="max-w-sm text-[15px] leading-snug text-white/90">"{line}"</p>
        <button
          onClick={onContinue}
          className="mt-2 w-full max-w-sm rounded-xl bg-amber-400 py-3 text-base font-semibold text-black active:scale-[0.98]"
        >
          {continueLabel}
        </button>
        <p className="text-[11px] text-white/35">Orientation · no margin cost</p>
      </div>
    </div>
  );
}

function Act2Room() {
  const { pressure, hale, maya, ops, focusedAgent, focusAgent, sendCosted, openD1 } = useCase3Store();
  const [draft, setDraft] = useState("");
  const forced = pressure <= D1_FORCE_THRESHOLD;

  function send() {
    if (!draft.trim() || !focusedAgent || forced) return;
    sendCosted(focusedAgent, draft.trim());
    setDraft("");
  }

  const activeAgent = focusedAgent === "hale" ? HALE : focusedAgent === "maya" ? MAYA : null;
  const activeHistory = focusedAgent === "hale" ? hale : focusedAgent === "maya" ? maya : [];

  return (
    <div className="flex h-full flex-col">
      <StatusBar act="ACT II — SEPARATING THE PROBLEM" objective="Bang, fire, comms loss — one problem or three?" />
      <div className="relative flex-1 overflow-hidden">
        <img src="/case3/situation-room.png" alt="" className="absolute inset-0 h-full w-full object-cover opacity-60" />
        <img
          src="/case3/aircraft.png"
          alt=""
          className="pointer-events-none absolute left-1/2 top-[18%] w-[70%] -translate-x-1/2 opacity-90 drop-shadow-2xl"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-black/10 to-black/85" />

        <div className="relative flex h-full flex-col">
          {ops.length > 0 && !focusedAgent && (
            <div className="mx-auto mt-3 max-w-sm rounded-xl border border-white/15 bg-black/70 px-3 py-2 text-center text-[13px] text-white/80">
              {ops[ops.length - 1].text}
            </div>
          )}

          <div className={`mt-auto flex flex-col gap-3 px-4 pb-4 ${PROTOTYPE_BADGE_CLEARANCE}`}>
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
                    className="w-full rounded-xl bg-red-400/90 py-3 text-base font-semibold text-black active:scale-[0.98]"
                  >
                    Margin is low — decide now (D1)
                  </button>
                ) : (
                  <button
                    onClick={openD1}
                    className="w-full rounded-xl border border-white/15 bg-white/5 py-3 text-sm font-medium text-white/80 active:scale-[0.98]"
                  >
                    I'm ready to decide (D1)
                  </button>
                )}
              </>
            ) : (
              <>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => useCase3Store.setState({ focusedAgent: null })}
                    className="text-sm text-white/50"
                  >
                    ← Room
                  </button>
                  <img src={activeAgent!.portrait} alt={activeAgent!.name} className="h-10 w-10 rounded-full object-cover object-top" />
                  <div>
                    <p className="text-sm font-semibold text-white">{activeAgent!.name}</p>
                    <p className="text-[11px] text-white/50">{activeAgent!.role}</p>
                  </div>
                </div>

                <div className="flex max-h-48 flex-col gap-2 overflow-y-auto">
                  {activeHistory.map((line, i) => (
                    <div
                      key={i}
                      className={`max-w-[85%] rounded-xl p-2.5 text-[14px] leading-snug ${
                        line.role === "player" ? "ml-auto border border-amber-300/30 bg-amber-300/10 text-amber-100" : "border border-white/10 bg-black/60 text-white/90"
                      }`}
                    >
                      {line.text}
                    </div>
                  ))}
                  {activeHistory.length === 0 && (
                    <p className="text-center text-[13px] text-white/40">Ask {activeAgent!.name} something — costs 2 margin.</p>
                  )}
                </div>

                {forced ? (
                  <div className="rounded-xl border border-red-400/30 bg-red-400/10 px-3 py-2 text-center text-[13px] text-red-200">
                    Margin's at {pressure} — time to decide. No more questions right now.
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <input
                      value={draft}
                      onChange={(e) => setDraft(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && send()}
                      placeholder={`Ask ${activeAgent!.name}… (−2 margin)`}
                      className="flex-1 rounded-xl border border-white/15 bg-white/5 px-3 py-2.5 text-[15px] text-white placeholder:text-white/35 focus:outline-none focus:ring-1 focus:ring-amber-300/50"
                      aria-label={`Message to ${activeAgent!.name}`}
                    />
                    <button onClick={send} className="rounded-xl bg-amber-400 px-4 py-2.5 text-sm font-semibold text-black">
                      Send
                    </button>
                  </div>
                )}
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
    const routeB = after >= ROUTE_B_FLOOR ? "remains open" : "closes";
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
          <p className="mt-1 text-sm text-white/70">Cost {D1_OPTIONS.visual_check.cost}. After this: margin {visual.after}. Route B {visual.routeB}{visual.routeB === "closes" ? ` — needs ${ROUTE_B_FLOOR}+` : ""}.</p>
        </button>

        <button
          onClick={() => commitD1("instruments_only")}
          className="rounded-2xl border border-white/15 bg-white/5 p-4 text-left active:scale-[0.98]"
        >
          <p className="text-base font-semibold text-white">{D1_OPTIONS.instruments_only.label}</p>
          <p className="mt-1 text-sm text-white/70">Cost {D1_OPTIONS.instruments_only.cost}. After this: margin {instruments.after}. Route B {instruments.routeB}. Fire status stays unknown — permanently.</p>
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

  return (
    <div className="flex h-full flex-col">
      <StatusBar act="D1 RESOLVED" objective="Act III — The Path — is next, outside this build's scope." />
      <div className={`flex flex-1 flex-col gap-4 overflow-y-auto bg-black/85 px-5 py-6 ${PROTOTYPE_BADGE_CLEARANCE}`}>
        {last && (
          <div className="rounded-2xl border border-white/15 bg-black/60 p-4 text-center">
            <span className="text-[11px] font-semibold uppercase tracking-wide text-amber-300">{last.cue}</span>
            <p className="mt-2 text-[15px] text-white/90">{last.text}</p>
          </div>
        )}

        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
          <p className="text-sm font-medium text-white/70">Pressure ledger</p>
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

        <div className="rounded-2xl border border-dashed border-white/15 p-4 text-center text-sm text-white/50">
          This build's scope ends here — Act III (route commitment, D2), Act IV (D4) and grading are outside this slice.
        </div>

        <button
          onClick={() => useCase3Store.getState().reset()}
          className="rounded-xl bg-white/10 py-3 text-base font-medium text-white active:scale-[0.98]"
        >
          Restart slice
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
          portrait={RORY_PORTRAIT}
          name="Rory"
          cue={ACT1_RORY_INTERRUPT.cue}
          line={ACT1_RORY_INTERRUPT.line}
          onContinue={() => useCase3Store.getState().enterAct2()}
          continueLabel="Begin Act II — margin costs start now"
        />
      )}
      {screen === "act2_room" && <Act2Room />}
      {screen === "d1_decision" && <D1Decision />}
      {screen === "d1_consequence" && <D1Consequence />}
      <PrototypeBadge />
    </div>
  );
}
