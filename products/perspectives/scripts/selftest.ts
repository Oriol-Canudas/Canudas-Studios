// Scripted playthrough self-test. Run with: npx tsx scripts/selftest.ts
// Exercises the deterministic witness engine the same way a player's taps
// would, and asserts the ground-truth-consistency invariants from the brief.

import { useGameStore } from "../src/game/store";
import { WITNESS_BY_ID } from "../src/game/caseData";
import { gradeVerdict } from "../src/game/verdictGrading";
import { isTopicReachable } from "../src/game/witnessEngine";

let failures = 0;
function assert(cond: boolean, msg: string) {
  if (!cond) {
    failures++;
    console.error("FAIL:", msg);
  } else {
    console.log("ok:", msg);
  }
}

function lastWitnessLine(witnessId: string): string {
  const hist = useGameStore.getState().chatHistory[witnessId as "tom"];
  const last = hist[hist.length - 1];
  return last?.text ?? "";
}

// ── Playthrough 1: naive order (talk first, never look at evidence) ──────
console.log("\n=== Playthrough 1: witnesses before evidence ===");
{
  const { askWitness } = useGameStore.getState();

  askWitness("tom", "what did you do after you left");
  assert(
    lastWitnessLine("tom").includes("went home"),
    "Tom denies returning before any evidence is shown"
  );

  askWitness("sofia", "did daniel contact you after his text");
  assert(
    lastWitnessLine("sofia").includes("last I heard"),
    "Sofia denies further contact before phone records are shown"
  );

  askWitness("elena", "what happened during the argument");
  assert(
    lastWitnessLine("elena").includes("nothing serious"),
    "Elena downplays contact on first ask"
  );
  askWitness("elena", "what happened during the argument");
  assert(
    lastWitnessLine("elena").includes("shoved him"),
    "Elena admits the shove once pressed a second time"
  );
}

// ── Playthrough 2: confront with evidence in the 'wrong' order ───────────
console.log("\n=== Playthrough 2: confronting Tom out of order ===");
{
  useGameStore.getState().reset();
  const { askWitness, discoverEvidence } = useGameStore.getState();

  // Try to jump straight to the knife confession without ever establishing
  // that Tom came back — the engine must not allow this to skip stages.
  discoverEvidence("E01_knife");
  discoverEvidence("E04_forensic_prelim");
  askWitness("tom", "what really happened with the knife");
  assert(
    !lastWitnessLine("tom").includes("accidentally"),
    "Tom does NOT confess the accidental stabbing before admitting he even returned"
  );

  // Now build up properly.
  discoverEvidence("E07_tom_phone_records");
  askWitness("tom", "what did you do after you left");
  assert(lastWitnessLine("tom").includes("Alright"), "Tom admits returning once phone records exist");

  discoverEvidence("E08_garage_access_log");
  askWitness("tom", "did you see anyone when you got there");
  assert(lastWitnessLine("tom").includes("Sofia leaving"), "Tom admits seeing Sofia once garage log exists");

  askWitness("tom", "did you go up to his apartment");
  assert(lastWitnessLine("tom").includes("I went up"), "Tom admits going up");

  askWitness("tom", "what happened between you and daniel");
  assert(lastWitnessLine("tom").includes("shoved"), "Tom admits the shoving match");

  askWitness("tom", "what really happened with the knife");
  assert(
    lastWitnessLine("tom").includes("accidentally") || lastWitnessLine("tom").includes("didn't stab"),
    "Tom now gives the accidental-stabbing account once fully pressed with evidence"
  );

  const board = useGameStore.getState().board;
  const confessionEntry = board.find((b) => b.text.includes("Daniel grabbed the knife himself"));
  assert(!!confessionEntry, "Board records Tom's confession once he confesses");
  assert(
    confessionEntry?.type === "claim",
    "Tom's confession is recorded as a CLAIM, not a verified fact — matching ground truth isn't the same as player-verified"
  );
}

// ── Playthrough 3: re-asking the same question never duplicates the board ─
console.log("\n=== Playthrough 3: idempotency ===");
{
  useGameStore.getState().reset();
  const { askWitness, discoverEvidence } = useGameStore.getState();
  discoverEvidence("E05_daniel_phone_records");
  askWitness("sofia", "did daniel contact you after his text");
  askWitness("sofia", "did daniel contact you after his text");
  askWitness("sofia", "did daniel contact you after his text");
  const board = useGameStore.getState().board;
  const contradictionEntries = board.filter((b) => b.text.includes("Sofia initially denied"));
  assert(contradictionEntries.length === 1, "Repeated questions do not duplicate board entries");
}

// ── Playthrough 4: evidence facts appear on INSPECTION, not acquisition ──
console.log("\n=== Playthrough 4: evidence board de-dup, acquired vs. inspected (R05) ===");
{
  useGameStore.getState().reset();
  const { discoverEvidence, inspectEvidence } = useGameStore.getState();

  discoverEvidence("E05_daniel_phone_records");
  assert(
    useGameStore.getState().board.length === 0,
    "Merely acquiring a document adds nothing to the board — a zero-investigation playthrough must show zero board items"
  );

  inspectEvidence("E05_daniel_phone_records");
  const onceCount = useGameStore.getState().board.length;
  assert(onceCount === 4, "Actually inspecting E05 adds its 4 authored board facts, not one generic blob");
  inspectEvidence("E05_daniel_phone_records");
  const twiceCount = useGameStore.getState().board.length;
  assert(twiceCount === onceCount, "Inspecting the same evidence twice does not duplicate its facts");

  const unlockEntry = useGameStore.getState().board.find((b) => b.text.includes("does not establish who used it"));
  assert(!!unlockEntry, "The 23:58 phone-unlock fact uses neutral wording, not an inferred conclusion");

  // The 4 "initial" documents (available for free at game start) must not
  // leak board facts just by being present in discoveredEvidence from t=0.
  useGameStore.getState().reset();
  assert(
    useGameStore.getState().board.length === 0 && useGameStore.getState().discoveredEvidence.size === 4,
    "At game start, the 4 free documents are acquired but zero board facts exist until something is actually opened"
  );
}

// ── Playthrough 5: unmatched free text never crashes, always deflects ────
console.log("\n=== Playthrough 5: off-topic free text ===");
{
  useGameStore.getState().reset();
  const { askWitness } = useGameStore.getState();
  askWitness("marco", "what's your favorite color");
  const line = lastWitnessLine("marco");
  assert(line.length > 0, "Off-topic question gets a non-empty deflection, not a crash");
  assert(
    WITNESS_BY_ID.marco.deflections.includes(line),
    "Off-topic question returns one of the witness's authored deflections, never invented text"
  );
}

// ── Playthrough 6: verdict grading matches locked ground truth ───────────
console.log("\n=== Playthrough 6: verdict grading ===");
{
  const correct = gradeVerdict({ theory: "", responsible: "tom", elenaVerdict: "not_guilty" });
  assert(correct.responsibleCorrect && correct.elenaVerdictCorrect, "Correct verdict grades as fully correct");

  const wrong = gradeVerdict({ theory: "", responsible: "elena", elenaVerdict: "guilty" });
  assert(!wrong.responsibleCorrect && !wrong.elenaVerdictCorrect, "Prosecution's theory grades as fully incorrect");
}

// ── Playthrough 7: reset actually clears session state ───────────────────
console.log("\n=== Playthrough 7: reset clears state, ground truth untouched ===");
{
  useGameStore.getState().askWitness("tom", "what did you do after you left");
  useGameStore.getState().reset();
  const s = useGameStore.getState();
  assert(s.chatHistory.tom.length === 0, "Reset clears conversation history");
  assert(s.board.length === 0, "Reset clears the board");
  assert(s.discoveredEvidence.size === 4, "Reset restores exactly the 4 initial evidence items");
}

// ── Playthrough 8: demeanor tracks testimony pressure ────────────────────
console.log("\n=== Playthrough 8: demeanor ===");
{
  useGameStore.getState().reset();
  const { askWitness, discoverEvidence } = useGameStore.getState();

  assert(
    useGameStore.getState().demeanor.tom === "guarded",
    "Tom starts at his authored baseline demeanor (guarded)"
  );

  discoverEvidence("E07_tom_phone_records");
  discoverEvidence("E08_garage_access_log");
  discoverEvidence("E01_knife");
  discoverEvidence("E04_forensic_prelim");
  askWitness("tom", "what did you do after you left"); // -> defensive
  assert(useGameStore.getState().demeanor.tom === "defensive", "Tom's demeanor updates to defensive once he admits returning");

  askWitness("tom", "did you see anyone when you got there");
  askWitness("tom", "did you go up to his apartment");
  askWitness("tom", "what happened between you and daniel");
  askWitness("tom", "what really happened with the knife"); // confession stage
  assert(useGameStore.getState().demeanor.tom === "panicking", "Tom's demeanor hits panicking at the confession stage");
}

// ── Playthrough 9: cross-witness reactions (item 6) ───────────────────────
console.log("\n=== Playthrough 9: cross-witness reactions ===");
{
  useGameStore.getState().reset();
  const { askWitness, discoverEvidence } = useGameStore.getState();

  // Elena shouldn't be able to react to Tom's return before Tom has admitted it.
  askWitness("elena", "did you know sofia and tom both went back that night");
  assert(
    !lastWitnessLine("elena").includes("had no idea anyone else"),
    "Elena cannot react to Tom's return before Tom has actually admitted it"
  );

  // Now establish Tom's return.
  discoverEvidence("E07_tom_phone_records");
  askWitness("tom", "what did you do after you left");
  assert(lastWitnessLine("tom").includes("Alright"), "Tom admits returning once phone records exist");

  // Elena's reactive line should now be reachable, carried by the player
  // (the Judge), not by Elena magically knowing something she couldn't.
  askWitness("elena", "did you know sofia and tom both went back that night");
  assert(
    lastWitnessLine("elena").includes("had no idea anyone else"),
    "Elena reacts to being told (by the Judge) that Tom also returned that night"
  );
  assert(useGameStore.getState().demeanor.elena === "shaken", "Elena's demeanor shifts to shaken on that reveal");

  // Sofia should react the same way, independently.
  askWitness("sofia", "tom says he came back to the apartment too, after you left");
  assert(
    lastWitnessLine("sofia").includes("I didn't know that"),
    "Sofia reacts to being told Tom also returned, independently of Elena's reaction"
  );
}

// ── Playthrough 10: arbitrary question-order bug is fixed (item 3) ───────
console.log("\n=== Playthrough 10: Tom's follow-ups are askable in any order ===");
{
  useGameStore.getState().reset();
  const { askWitness, discoverEvidence } = useGameStore.getState();
  discoverEvidence("E07_tom_phone_records");
  askWitness("tom", "what did you do after you left");
  assert(lastWitnessLine("tom").includes("Alright"), "Tom admits returning once phone records exist");

  // Previously "went_up" required "saw_sofia" to be asked first, and
  // "saw_sofia" required the garage log. Now both are independent
  // siblings of after_that — going straight to "went up" must work even
  // though "saw anyone" and the garage log were never touched.
  askWitness("tom", "did you go up to his apartment");
  assert(lastWitnessLine("tom").includes("I went up"), "Tom answers about going upstairs without first being asked about seeing Sofia");

  askWitness("tom", "what happened between you and daniel");
  assert(lastWitnessLine("tom").includes("shoved"), "The argument is reachable right after after_that, in any order");
}

// ── Playthrough 11: Marco's baseline question no longer needs evidence ───
console.log("\n=== Playthrough 11: Marco's baseline call question is always answerable ===");
{
  useGameStore.getState().reset();
  const { askWitness, discoverEvidence } = useGameStore.getState();
  askWitness("marco", "did you speak to daniel that night");
  assert(
    lastWitnessLine("marco").includes("Briefly"),
    "Marco gives a baseline answer before any evidence exists, instead of a generic deflection"
  );
  discoverEvidence("E05_daniel_phone_records");
  askWitness("marco", "did you speak to daniel that night");
  assert(lastWitnessLine("marco").includes("23:34") || lastWitnessLine("marco").includes("stop lying"), "Marco gives the specific account once phone records exist");
}

// ── Playthrough 12: chip visibility matches known premises (item 1) ──────
console.log("\n=== Playthrough 12: suggestion chips never state an unknown premise ===");
{
  useGameStore.getState().reset();
  const stages = useGameStore.getState().witnessStages;
  const elenaOthersReturned = WITNESS_BY_ID.elena.topics.find((t) => t.id === "others_returned")!;
  const elenaRelationship = WITNESS_BY_ID.elena.topics.find((t) => t.id === "relationship")!;
  assert(
    !isTopicReachable(elenaOthersReturned, stages),
    "Elena's cross-witness reactive chip is hidden before Tom has actually returned"
  );
  assert(
    isTopicReachable(elenaRelationship, stages),
    "An ordinary question stays visible even though the honest answer could be a denial"
  );

  const { askWitness, discoverEvidence } = useGameStore.getState();
  discoverEvidence("E07_tom_phone_records");
  askWitness("tom", "what did you do after you left");
  const stagesAfter = useGameStore.getState().witnessStages;
  assert(
    isTopicReachable(elenaOthersReturned, stagesAfter),
    "Elena's reactive chip becomes visible once Tom has actually admitted returning"
  );
}

// ── Playthrough 13: presenting evidence confronts the witness in-chat ────
console.log("\n=== Playthrough 13: presenting evidence in conversation ===");
{
  useGameStore.getState().reset();
  const { discoverEvidence, presentEvidence } = useGameStore.getState();

  discoverEvidence("E07_tom_phone_records");
  presentEvidence("tom", "E07_tom_phone_records", 1); // "23:49 — Phone disconnects from home Wi-Fi."

  const history = useGameStore.getState().chatHistory.tom;
  const evidenceMsg = history.find((m) => m.role === "evidence");
  assert(!!evidenceMsg, "Presenting evidence inserts a distinct evidence-message into the conversation");
  assert(
    useGameStore.getState().presentedEvidence.tom.has("E07_tom_phone_records"),
    "Presented evidence is tracked per-witness, distinct from merely possessing it"
  );
  assert(
    useGameStore.getState().presentationLog.some((p) => p.witnessId === "tom" && p.excerptIndex === 1),
    "The presentation log records which specific excerpt was shown"
  );

  const last = history[history.length - 1];
  assert(
    last.role === "witness" && last.text.includes("phone records"),
    "Tom's reply after being confronted with evidence explicitly references what was shown, not a generic repeat"
  );

  // Presenting evidence that isn't authored to speak to any topic for this
  // witness must not crash or fabricate a reaction.
  discoverEvidence("E02_msg_sofia_2306");
  presentEvidence("elena", "E02_msg_sofia_2306", 0);
  const elenaHistory = useGameStore.getState().chatHistory.elena;
  assert(elenaHistory.some((m) => m.role === "evidence"), "Presenting irrelevant evidence still logs the presentation");
}

// ── Playthrough 14: insufficient-evidence verdicts grade honestly ────────
console.log("\n=== Playthrough 14: insufficient-evidence verdicts are not 'wrong' ===");
{
  const bothInsufficient = gradeVerdict({ theory: "", responsible: "insufficient_evidence", elenaVerdict: "insufficient_evidence" });
  assert(
    !bothInsufficient.headline.toLowerCase().includes("prosecution"),
    "Calling both insufficient does not produce the harshest 'you believed the prosecution' headline"
  );
  assert(bothInsufficient.responsibleJudgment === "insufficient" && bothInsufficient.elenaJudgment === "insufficient", "Both axes are graded as insufficient, not wrong");

  const correctButCautious = gradeVerdict({ theory: "", responsible: "tom", elenaVerdict: "insufficient_evidence" });
  assert(correctButCautious.responsibleJudgment === "correct", "Knowing the real culprit still grades as correct even when Elena's axis is called insufficient");
}

console.log(`\n${failures === 0 ? "ALL PASS" : `${failures} FAILURE(S)`}`);
process.exit(failures === 0 ? 0 : 1);
