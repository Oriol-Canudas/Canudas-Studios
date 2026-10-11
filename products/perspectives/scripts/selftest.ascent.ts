// Scripted playthrough self-test for "The Last Ascent" specifically.
// Run with: npx tsx scripts/selftest.ascent.ts
// Mirrors scripts/selftest.ts's style but imports caseAscent directly
// (never the swappable "../src/game/caseData" pointer) — this suite
// hardcodes Ascent's own witness/topic/axis ids throughout, same reasoning
// as selftest.ts importing case002 directly. The store itself (store.ts)
// still goes through caseData.ts, so this only runs meaningfully while
// that pointer is aimed at "./caseAscent".
//
// altUnlock (the conversational-only route) is only ever evaluated on the
// free-form path (sendFreeformMessage -> runFreeformTurn), never on a
// plain chip-tap askWitness call — same as Case 002's own Playthrough 28
// in scripts/selftest.ts. Every altUnlock step below uses
// sendFreeformMessage with text crafted to (a) deterministically match
// the right topic via its own keywords and (b) classify as one of that
// gate's allowed intents under interpretDeterministic — there's no live
// model in this environment, so every free-form turn here runs the
// deterministic fallback, exactly like a failed/unconfigured AI call would.

import { useGameStore } from "../src/game/store";
import { VERDICT_CONFIG, WITNESSES, buildVerdictContext, buildRevealNarrative } from "../src/game/caseAscent";
import { gradeVerdict } from "../src/game/verdictGrading";
import { matchTopic } from "../src/game/witnessEngine";

let failures = 0;
function assert(cond: boolean, msg: string) {
  if (!cond) {
    failures++;
    console.error("FAIL:", msg);
  } else {
    console.log("ok:", msg);
  }
}

function grade(choices: Record<string, string>) {
  const state = useGameStore.getState();
  const ctx = buildVerdictContext(state);
  const verdict = { theory: "", choices };
  const graded = gradeVerdict(VERDICT_CONFIG, verdict, ctx);
  return { ctx, verdict, graded };
}

console.log("\n=== Sanity: every topic's chip text resolves back to itself, every witness has fallback lines ===");
{
  for (const w of WITNESSES) {
    assert(Boolean(w.freeformEnabled), `${w.id} has freeformEnabled (per the "everyone gets it from day one" lesson)`);
    assert(w.deflections.length > 0, `${w.id} has at least one deflection line`);
    assert((w.defensiveLines?.length ?? 0) > 0, `${w.id} has at least one defensive line`);
    for (const topic of w.topics) {
      const matched = matchTopic(w, topic.chipLabel);
      assert(matched?.id === topic.id, `${w.id}'s "${topic.id}" chip text resolves to itself via matchTopic (got "${matched?.id}")`);
    }
  }
  console.log("ok: topic counts —", WITNESSES.map((w) => `${w.id}:${w.topics.length}`).join(", "));
}

console.log("\n=== Playthrough 1: naive instant push — no investigation, nothing secured ===");
{
  useGameStore.getState().reset();
  const { ctx, graded } = grade({ call: "push" });
  assert(ctx.minutesRemaining === 75, "No actions taken yet — full 75 minutes still on the clock");
  assert(!ctx.devCommitted && !ctx.raeCommitted, "Nothing secured with zero investigation");
  const judgment = graded.axisGrades.find((g) => g.axisId === "call")!.judgment;
  assert(judgment === "wrong", `Pushing blind, with Rae's pace never protected, is judged wrong (got "${judgment}")`);
}

console.log("\n=== Playthrough 2: the full causal + commitment chain, efficiently ===");
{
  useGameStore.getState().reset();
  const { askWitness, relayRevelation, sendFreeformMessage } = useGameStore.getState();

  askWitness("soren", "has this happened before, on another trip", "felix_incident"); // minStage 0 — known immediately
  await relayRevelation("dev", "felix_story");
  // altUnlock: requiresRelayed [felix_story], requiresIntent [empathetic_appeal] — free-form only.
  await sendFreeformMessage("dev", "I understand this is hard, but is there a more recent satellite update you haven't told us about?");
  await relayRevelation("rae", "dev_real_weather");
  // altUnlock: requiresRelayed [dev_real_weather], requiresIntent [empathetic_appeal, evidence_challenge].
  await sendFreeformMessage("rae", "I understand that's personal, but is there something about your health you haven't told anyone?");
  askWitness("dev", "will you skip the extended photo stop if it means getting everyone down safely", "the_deal"); // self-ref normal gate — plain ask is fine
  await relayRevelation("soren", "dev_agreed_to_skip_stop");
  askWitness("rae", "will you commit to a pace that actually protects your own safety", "pace_agreement"); // self-ref normal gate
  await relayRevelation("soren", "rae_agreed_to_pace_plan");
  // conditional_support's remaining stages are altUnlock-only (relayed facts + intent) — free-form again.
  await sendFreeformMessage("soren", "Would you back a plan to push with a hard turnaround deadline?");

  const state = useGameStore.getState();
  const ctx = buildVerdictContext(state);
  assert(ctx.felixStoryKnown, "Felix's story is known");
  assert(ctx.devRealWeatherKnown, "Dev's real weather data is known, via the Felix-story altUnlock route (never presented as evidence)");
  assert(ctx.raeConditionKnown, "Rae's heart condition is known, via the relayed-weather altUnlock route");
  assert(ctx.devCommitted, "Dev's commitment to drop the photo stop is secured");
  assert(ctx.raeCommitted, "Rae's commitment to a protected pace is secured");
  assert(ctx.sorenSupports, "Soren's support is secured, now that both commitments have been relayed to him");

  // 4 askWitness + 2 sendFreeformMessage, all at the "ask" rate (4 each) = 24, plus 4 relays at 2 each = 8. 32 total.
  assert(ctx.minutesRemaining === 75 - 32, `Exactly 32 minutes spent (6 ask-rate turns + 4 relays) — ${ctx.minutesRemaining} remaining`);

  const { graded } = grade({ call: "push_deadline" });
  const judgment = graded.axisGrades.find((g) => g.axisId === "call")!.judgment;
  assert(judgment === "correct", `Pushing with a deadline, fully prepared, with real margin left, is judged correct (got "${judgment}")`);

  // Choosing retreat INSTEAD, despite having everything lined up for a safe push, is a real but overly cautious call — never silently "correct" just because it's safe.
  const retreatGrade = gradeVerdict(VERDICT_CONFIG, { theory: "", choices: { call: "retreat" } }, ctx);
  assert(
    retreatGrade.axisGrades[0].judgment === "insufficient",
    `Retreating despite having everything secured is graded "insufficient", not silently "correct" (got "${retreatGrade.axisGrades[0].judgment}")`
  );

  const narrative = buildRevealNarrative(state, { theory: "", choices: { call: "push_deadline" } }, graded);
  assert(
    narrative.changed.some((line) => line.includes("Dev abandoned the extended photo/video stop")),
    "The reveal's causal narrative names Dev's actual commitment as a specific callback"
  );
  assert(
    narrative.discovered.some((line) => line.includes("got Dev to admit")),
    "The reveal's narrative reflects that the real weather data actually was discovered, not assumed"
  );
}

console.log("\n=== Playthrough 3: retreating when genuinely unprepared is still the sound call ===");
{
  useGameStore.getState().reset();
  const { graded } = grade({ call: "retreat" });
  const judgment = graded.axisGrades.find((g) => g.axisId === "call")!.judgment;
  assert(judgment === "correct", `Retreating with nothing secured and nothing discovered is a defensible, correct call (got "${judgment}")`);
}

console.log("\n=== Playthrough 4: Soren's conditional support — any ONE of three relayed facts suffices (OR, not AND) ===");
{
  useGameStore.getState().reset();
  const { discoverEvidence, presentEvidence, relayRevelation, sendFreeformMessage } = useGameStore.getState();

  // Reach Rae's condition via the EVIDENCE route (not the relay/altUnlock route) — unlocks Mei's altUnlock without ever touching Dev's or Rae's commitments.
  discoverEvidence("E05_team_medical_log");
  presentEvidence("rae", "E05_team_medical_log", 0);
  let state = useGameStore.getState();
  assert((state.witnessStages.rae?.heart_condition ?? -1) >= 1, "Rae's condition reached via presented evidence, independent of any relay");

  await relayRevelation("mei", "rae_condition");
  await sendFreeformMessage("mei", "I understand this might change things — what would you do, if it were only up to you?");
  state = useGameStore.getState();
  assert((state.witnessStages.mei?.final_call ?? -1) >= 1, "Mei formed her own independent view");

  await relayRevelation("soren", "mei_independent_view");
  await sendFreeformMessage("soren", "Would you back a plan to push with a hard turnaround deadline?");

  state = useGameStore.getState();
  const sorenStage = state.witnessStages.soren?.conditional_support ?? -1;
  assert(sorenStage === 3, `Relaying ONLY Mei's independent view jumps Soren straight to stage 3 (the mei_independent_view gate), skipping 1 and 2 — got stage ${sorenStage}`);
  const ctx = buildVerdictContext(state);
  assert(ctx.sorenSupports, "Soren's support reads as secured via this single alternate route — none of the other two facts were ever relayed to him");
  assert(!ctx.devCommitted && !ctx.raeCommitted, "Dev's and Rae's commitments were never actually secured in this playthrough — only Soren's support, via the alternate route");
}

console.log("\n=== Playthrough 5: timeIsUp guard — a fully drained clock blocks further investigation ===");
{
  // timeIsUp blocks once the clock is fully drained (<=0) — it does not
  // pre-check whether THIS action's specific cost still fits, so the
  // clock can go a little under before the next action is refused (the
  // display floors at 0 via tickClock's Math.max, so the player always
  // sees a clean zero rather than a confusing negative number).
  useGameStore.getState().reset();
  useGameStore.setState({ minutesRemaining: 0 });
  const before = useGameStore.getState().chatHistory.rae.length;
  useGameStore.getState().askWitness("rae", "what's your read on the weather", "your_read");
  const after = useGameStore.getState();
  assert(after.chatHistory.rae.length === before, "askWitness is a no-op once the clock is fully drained");
  assert(after.minutesRemaining === 0, "The blocked attempt spent no additional time");
}

console.log("\n=== Playthrough 6: evidence-only route to the causal chain (no conversation, same underlying facts) ===");
{
  useGameStore.getState().reset();
  const { discoverEvidence, presentEvidence } = useGameStore.getState();
  discoverEvidence("E06_radio_transcript");
  presentEvidence("dev", "E06_radio_transcript", 0); // real_weather stage1 via evidence, not altUnlock
  let state = useGameStore.getState();
  assert((state.witnessStages.dev?.real_weather ?? -1) >= 1, "Presenting the radio transcript directly also reaches Dev's confession, independent of the Felix-story route");

  discoverEvidence("E05_team_medical_log");
  presentEvidence("rae", "E05_team_medical_log", 0);
  state = useGameStore.getState();
  assert((state.witnessStages.rae?.heart_condition ?? -1) >= 1, "Presenting the medical log directly also reaches Rae's confession, independent of the relayed-weather route");
}

console.log(failures === 0 ? "\nALL PASS" : `\n${failures} FAILURE(S)`);
process.exit(failures === 0 ? 0 : 1);
