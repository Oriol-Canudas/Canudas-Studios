// Scripted playthrough self-test for "Untouchable" (Case 003) specifically.
// Run with: npx tsx scripts/selftest.untouchable.ts
// Mirrors scripts/selftest.ascent.ts's style and reasoning exactly — imports
// caseUntouchable directly (never the swappable "../src/game/caseData"
// pointer), so this suite only runs meaningfully while that pointer is
// aimed at "./caseUntouchable". Run all three cases' suites together via
// `npm run selftest` (scripts/selftest-all.mjs), which handles that for you.
//
// altUnlock is only ever evaluated on the free-form path
// (sendFreeformMessage -> runFreeformTurn), never on a plain chip-tap
// askWitness call — same reasoning as the other two suites. There's no
// live model in this environment, so every free-form turn here runs the
// deterministic fallback (interpretDeterministic), exactly like a
// failed/unconfigured AI call would — same for the generative relay
// reactions, which fall back to their authored anchor text.

import { useGameStore } from "../src/game/store";
import {
  VERDICT_CONFIG,
  WITNESSES,
  buildVerdictContext,
  buildRevealNarrative,
  CONFRONTATION_WITNESS_IDS,
  SOCIAL_GRAPH,
} from "../src/game/caseUntouchable";
import { gradeVerdict } from "../src/game/verdictGrading";
import { matchTopic } from "../src/game/witnessEngine";
import { demeanorToConfrontBucket } from "../src/game/confrontation";
import { validateHoldsBothTruths, CONFRONT_FALLBACK, FINAL_CALL_LABEL, DEMEANOR_BUCKET_NOTE } from "../api/witness-chat";

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

console.log("\n=== Sanity: every topic's chip text resolves back to itself, witnesses have what they need ===");
{
  assert(
    CONFRONTATION_WITNESS_IDS[0] === "marcus" && CONFRONTATION_WITNESS_IDS.includes("priya"),
    "This case's confrontation sequence starts with Marcus and also includes Priya"
  );
  assert(Object.keys(SOCIAL_GRAPH).length > 0, "This case defines a non-empty ambient social graph");
  for (const w of WITNESSES) {
    for (const topic of w.topics) {
      const matched = matchTopic(w, topic.chipLabel);
      assert(matched?.id === topic.id, `${w.id}'s "${topic.id}" chip text resolves to itself via matchTopic (got "${matched?.id}")`);
    }
    if (w.freeformEnabled) {
      assert(w.deflections.length > 0, `${w.id} (freeform) has at least one deflection line`);
      assert((w.defensiveLines?.length ?? 0) > 0, `${w.id} (freeform) has at least one defensive line`);
    }
  }
  assert(Boolean(WITNESSES.find((w) => w.id === "marcus")?.demeanorEffects), "Marcus has real demeanor mechanical effects configured");
  assert(Boolean(WITNESSES.find((w) => w.id === "priya")?.demeanorEffects), "Priya has real demeanor mechanical effects configured");
  console.log("ok: topic counts —", WITNESSES.map((w) => `${w.id}:${w.topics.length}`).join(", "));
}

console.log("\n=== Playthrough 1: naive instant verdict — no investigation, nothing established ===");
{
  useGameStore.getState().reset();
  const { ctx, graded } = grade({
    processLegitimacy: "legitimate",
    harmSeverity: "overstated",
    finalCall: "proceed_with_pip",
    escalateComplicity: "decline",
  });
  assert(!ctx.harmPatternConfirmed && !ctx.timingTellConfirmed && !ctx.institutionalComplicityConfirmed, "Nothing established with zero investigation");
  const process = graded.axisGrades.find((g) => g.axisId === "processLegitimacy")!.judgment;
  const harm = graded.axisGrades.find((g) => g.axisId === "harmSeverity")!.judgment;
  const call = graded.axisGrades.find((g) => g.axisId === "finalCall")!.judgment;
  const escalate = graded.axisGrades.find((g) => g.axisId === "escalateComplicity")!.judgment;
  assert(process === "wrong", `Calling it "legitimate" with the real answer being mixed-motive is wrong (got "${process}")`);
  assert(harm === "wrong", `Calling it "overstated" with the real answer being real-and-serious is wrong (got "${harm}")`);
  assert(call === "insufficient", `Proceeding with the PIP without ever confirming the harm pattern contradicts the player's own (non-)findings (got "${call}")`);
  assert(escalate === "insufficient", `Declining to escalate when the institutional complicity was never even found reads as insufficient, not a real informed choice (got "${escalate}")`);
  assert(graded.headline !== "—", "A real headline resolves for this combination, not the gradeVerdict fallback dash");
}

console.log("\n=== Playthrough 2: the full causal chain, via topic-advance + relay/altUnlock routes ===");
{
  useGameStore.getState().reset();
  const { askWitness, presentEvidence, discoverEvidence, relayRevelation, sendFreeformMessage } = useGameStore.getState();

  // Harm pattern: Dana's account, then Theo corroborates once he knows Dana's been reached too.
  askWitness("dana", "why did you really leave the team", "why_i_left");
  askWitness("theo", "is this part of a pattern", "the_pattern");

  // Relay the corroborated pattern to Priya — altUnlock-only stage, she drops the vague framing.
  let state = useGameStore.getState();
  assert((state.witnessStages.theo?.the_pattern ?? -1) >= 1, "Theo's pattern topic reached stage 1, now that Dana's account is known");
  await relayRevelation("priya", "harm_pattern_confirmed");
  await sendFreeformMessage("priya", "Can you just say it plainly, please?");

  // Timing tell: present the calendar to Sam, ask him about it twice to earn the overheard remark.
  discoverEvidence("E03_pip_timeline");
  presentEvidence("sam", "E03_pip_timeline", 0);
  askWitness("sam", "is there something you haven't told hr", "what_he_overheard");
  askWitness("sam", "is there something you haven't told hr", "what_he_overheard");

  // Relay what Sam overheard to Marcus — altUnlock-only, he confirms the suspicion himself.
  state = useGameStore.getState();
  assert((state.witnessStages.sam?.what_he_overheard ?? -1) >= 1, "Sam's what_he_overheard reached stage 1 after the timing question and two asks");
  await relayRevelation("marcus", "priya_needed_clean_reason");
  await sendFreeformMessage("marcus", "I understand why you'd feel that way about her motive.");

  // Institutional complicity: present the old complaint to Theo directly.
  discoverEvidence("E01_old_complaint");
  presentEvidence("theo", "E01_old_complaint", 0);

  // Sam's trust crack: relay the buried complaint to him — altUnlock jumps straight to stage 2,
  // skipping the normal minAskCount:2 gate on that same stage entirely (same OR-bypass pattern
  // proven in both other cases' suites).
  state = useGameStore.getState();
  await relayRevelation("sam", "old_complaint_buried");
  await sendFreeformMessage("sam", "I understand this changes things — is there something you overheard?");

  const final = useGameStore.getState();
  const ctx = buildVerdictContext(final);
  assert(ctx.harmPatternConfirmed, "Harm pattern confirmed (via Theo's corroboration)");
  assert(ctx.timingTellConfirmed, "Timing tell confirmed (via Sam's overheard remark)");
  assert(ctx.institutionalComplicityConfirmed, "Institutional complicity confirmed (via the old complaint presented to Theo)");
  assert(ctx.samTrustCracked, "Sam's trust in leadership genuinely cracked (via the old-complaint relay, not the timing)");
  assert((final.witnessStages.priya?.say_it_plainly ?? -1) >= 1, "Priya's say_it_plainly altUnlock fired, independent of its own minAskCount:50");
  assert((final.witnessStages.marcus?.priyas_motive ?? -1) >= 1, "Marcus's priyas_motive altUnlock fired, independent of its own minAskCount:50");
  assert((final.witnessStages.sam?.what_he_overheard ?? -1) === 2, `Sam's what_he_overheard jumped straight to stage 2 via the old-complaint-buried altUnlock (got stage ${final.witnessStages.sam?.what_he_overheard})`);

  const { graded } = grade({
    processLegitimacy: "mixed_motive",
    harmSeverity: "real_and_serious",
    finalCall: "modify_process",
    escalateComplicity: "escalate",
  });
  assert(
    graded.axisGrades.every((g) => g.judgment === "correct"),
    `Every axis grades correct given full investigation and a call that doesn't contradict it (got ${graded.axisGrades.map((g) => g.judgment).join(",")})`
  );
  assert(graded.headline !== "—", "A real headline resolves for the full-information combination too");

  const narrative = buildRevealNarrative(final, { theory: "", choices: { finalCall: "modify_process", escalateComplicity: "escalate" } }, graded);
  assert(narrative.discovered.some((l) => l.includes("independently corroborated")), "The reveal narrative reflects that the harm pattern was actually confirmed");
  assert(narrative.changed.some((l) => l.includes("Sam's trust")), "The reveal narrative names Sam's cracked trust as a real, specific change");
  assert(narrative.outcome.some((l) => l.includes("escalated")), "The reveal narrative reflects the escalation choice actually made");
}

console.log("\n=== Playthrough 3: sustained-defensive demeanor locks the NEXT new topic (opt-in, Marcus/Priya only) ===");
{
  useGameStore.getState().reset();
  const { presentEvidence, discoverEvidence, sendFreeformMessage } = useGameStore.getState();

  discoverEvidence("E02_dana_exit_interview");
  presentEvidence("marcus", "E02_dana_exit_interview", 0); // working_for_him -> stage 1, demeanor: defensive (escalation, applies immediately)
  let state = useGameStore.getState();
  assert(state.demeanor.marcus === "defensive", "Marcus's demeanor escalates to defensive immediately once confronted with Dana's exit interview");
  const turnAtDefensive = state.demeanorTurnCount.marcus;

  // Three more real turns, re-asking the same already-maxed topic — a real
  // turn (countTurnAndResolveDemeanor/advanceTopic both still run) that
  // doesn't itself change demeanor (proposed === current is a same-value
  // no-op), accumulating the cooldown window without touching anything else.
  for (let i = 0; i < 3; i++) {
    await sendFreeformMessage("marcus", "What kind of manager are you, really?");
  }
  state = useGameStore.getState();
  assert(state.demeanorTurnCount.marcus - turnAtDefensive === 3, "Three more real turns passed with demeanor unchanged");
  assert(state.demeanor.marcus === "defensive", "Demeanor is still defensive — re-asking an already-maxed topic never itself changes it");
  assert((state.witnessStages.marcus?.the_timing ?? -1) === -1, "The new topic hasn't been engaged yet");

  // Now a genuinely new topic — should lock defensive immediately, never answered.
  await sendFreeformMessage("marcus", "Does the timing bother you?");
  state = useGameStore.getState();
  assert((state.witnessStages.marcus?.the_timing ?? -1) === -1, "The new topic was locked defensive, never actually engaged/answered");
  assert(state.defensiveTopics.marcus.has("the_timing"), "The new topic is recorded as defensive");
}

console.log("\n=== Playthrough 4: endsSessionOn ends a witness's session once the configured demeanor is reached ===");
{
  useGameStore.getState().reset();
  const { presentEvidence, discoverEvidence, sendFreeformMessage, askWitness } = useGameStore.getState();

  // Marcus's endsSessionOn targets "resigned" specifically, not "shaken" —
  // "shaken" is a real mid-conversation beat (jordan_and_dana's own
  // admission, and separately the priyas_motive vindication) he needs to
  // stay reachable through; "resigned" (the_harm_itself) is his one
  // genuinely terminal state, reached only after jordan_and_dana first.
  discoverEvidence("E01_old_complaint");
  discoverEvidence("E02_dana_exit_interview");
  presentEvidence("marcus", "E02_dana_exit_interview", 0);
  askWitness("marcus", "what happened with jordan and dana", "jordan_and_dana");
  askWitness("marcus", "what happened with jordan and dana", "jordan_and_dana"); // -> stage 1, demeanor: shaken (not a session-ender)
  let state = useGameStore.getState();
  assert((state.witnessStages.marcus?.jordan_and_dana ?? -1) >= 1, "Marcus's jordan_and_dana reached stage 1");
  assert(state.demeanor.marcus === "shaken", `Marcus's demeanor reaches shaken along the way (got "${state.demeanor.marcus}")`);
  assert(state.sessionEnded.marcus === false, "Reaching \"shaken\" does NOT end his session — it's a mid-conversation beat, not a configured terminal state");

  // The engine's own de-escalation hysteresis (DEMEANOR_COOLDOWN_TURNS,
  // store.ts) deliberately suppresses a same-turn drop from shaken ->
  // resigned (that's a de-escalation in severity, not an escalation, so
  // it only takes effect once enough real turns have passed) — three
  // filler turns, same technique as Playthrough 3, let it elapse honestly
  // rather than fighting proven, intentional engine behavior.
  for (let i = 0; i < 3; i++) {
    await sendFreeformMessage("marcus", "What kind of manager are you, really?");
  }
  askWitness("marcus", "do you think you've hurt people", "the_harm_itself"); // -> stage 0, demeanor: resigned (the configured terminal state)
  state = useGameStore.getState();
  assert(state.demeanor.marcus === "resigned", `Marcus's demeanor reaches resigned (got "${state.demeanor.marcus}")`);
  assert(state.sessionEnded.marcus === true, "Reaching the configured endsSessionOn demeanor marks the session ended");

  const historyBefore = state.chatHistory.marcus.length;
  await sendFreeformMessage("marcus", "One more question.");
  state = useGameStore.getState();
  assert(state.chatHistory.marcus.length === historyBefore, "sendFreeformMessage is a no-op once the session has ended");

  askWitness("marcus", "one more question", "the_pip");
  state = useGameStore.getState();
  assert(state.chatHistory.marcus.length === historyBefore, "askWitness is also a no-op once the session has ended");
}

console.log("\n=== Playthrough 5: ambient social-graph reactivity shifts a not-yet-met witness's STARTING demeanor only ===");
{
  useGameStore.getState().reset();
  const { sendFreeformMessage, openWitness } = useGameStore.getState();

  // Two clearly accusatory turns toward Theo — SOCIAL_GRAPH has dana<->theo.
  await sendFreeformMessage("theo", "Stop lying to me. Admit it.");
  await sendFreeformMessage("theo", "You're lying, just admit it already.");

  let state = useGameStore.getState();
  assert((state.approachTally.theo?.accusation ?? 0) >= 2, `Theo's approach tally recorded at least 2 accusatory turns (got ${state.approachTally.theo?.accusation})`);
  assert(state.demeanorTurnCount.dana === 0, "Dana hasn't had any real turns yet — her starting demeanor is still eligible to shift");
  assert(state.demeanor.dana === "composed", "Dana's demeanor is still at its authored baseline before being opened");

  openWitness("dana");
  state = useGameStore.getState();
  assert(state.demeanor.dana === "nervous", `Opening Dana after Theo was treated accusatorially shifts her STARTING demeanor ambiently (got "${state.demeanor.dana}")`);

  // And it only ever applies once, before any real turn — a real turn with
  // Dana afterward must never be silently overridden by this mechanism.
  const { askWitness } = useGameStore.getState();
  askWitness("dana", "why did you really leave", "why_i_left"); // doesn't author a demeanor change on its own stage
  state = useGameStore.getState();
  assert(state.demeanorTurnCount.dana === 1, "Dana now has a real turn on record");
}

console.log("\n=== Playthrough 6: the confrontation scene's selector and its scene-specific validation rule ===");
{
  assert(demeanorToConfrontBucket("composed") === "receptive", "composed -> receptive bucket");
  assert(demeanorToConfrontBucket("guarded") === "receptive", "guarded -> receptive bucket");
  assert(demeanorToConfrontBucket("defensive") === "guarded", "defensive -> guarded bucket");
  assert(demeanorToConfrontBucket("nervous") === "guarded", "nervous -> guarded bucket");
  assert(demeanorToConfrontBucket("shaken") === "raw", "shaken -> raw bucket");
  assert(demeanorToConfrontBucket("panicking") === "raw", "panicking -> raw bucket");
  assert(demeanorToConfrontBucket("resigned") === "raw", "resigned -> raw bucket");

  for (const call of Object.keys(FINAL_CALL_LABEL)) {
    for (const bucket of Object.keys(DEMEANOR_BUCKET_NOTE)) {
      assert(Boolean(CONFRONT_FALLBACK[`${call}:${bucket}`]), `A fallback line exists for ${call}:${bucket} — every selector combination is covered, none silently falls through`);
    }
  }

  const pureDenial = validateHoldsBothTruths("I did nothing wrong. This is all lies, a total setup.");
  assert(!pureDenial.ok, `A reply that purely denies everything, with no harm acknowledgment at all, fails validation (reason: ${pureDenial.reason})`);

  const pureCapitulation = validateHoldsBothTruths("You're completely right. I have no excuse at all. Whatever you decide, fine.");
  assert(!pureCapitulation.ok, `A reply that purely capitulates, with no acknowledgment of the bad-faith timing, fails validation (reason: ${pureCapitulation.reason})`);

  const holdsBoth = validateHoldsBothTruths("I hear you, and I did hurt people — I'm not going to pretend otherwise. I still think the timing of this wasn't fair, and both of those are true at once.");
  assert(holdsBoth.ok, `A reply that genuinely holds both truths passes validation (reason: ${holdsBoth.reason ?? "none"})`);

  const empty = validateHoldsBothTruths("   ");
  assert(!empty.ok, "An empty reply fails validation outright");
}

console.log("\n=== Playthrough 7: the confrontation sequence actually advances from Marcus to Priya ===");
{
  useGameStore.getState().reset();
  useGameStore.getState().submitVerdict({ theory: "", choices: { finalCall: "proceed_with_pip" } });

  await useGameStore.getState().beginConfrontation();
  let state = useGameStore.getState();
  assert(state.confrontIndex === 0, "Confrontation sequence starts at index 0 (Marcus)");
  assert(state.confrontHistory.length === 1 && state.confrontHistory[0].role === "witness", "Marcus's opener fired (AI unavailable here, so this is his authored fallback line, exactly like any other turn in this environment)");

  await useGameStore.getState().advanceConfrontation();
  state = useGameStore.getState();
  assert(state.confrontIndex === 1, "advanceConfrontation moved to index 1 (Priya)");
  assert(CONFRONTATION_WITNESS_IDS[state.confrontIndex] === "priya", "Index 1 is Priya, matching CONFRONTATION_WITNESS_IDS's order");
  assert(
    state.confrontHistory.length === 1 && state.confrontHistory[0].text.includes("everything I reported was real"),
    "Priya's authored opener fired, and — since Sam's overheard-remark relay was never triggered in this fresh playthrough — it's specifically her 'timingTellConfirmed: false' line, not her cracked one"
  );

  useGameStore.getState().reset();
}

console.log(failures === 0 ? "\nALL PASS" : `\n${failures} FAILURE(S)`);
process.exit(failures === 0 ? 0 : 1);
