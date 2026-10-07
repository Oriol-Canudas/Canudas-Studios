// Scripted playthrough self-test. Run with: npx tsx scripts/selftest.ts
// Exercises the deterministic witness engine the same way a player's taps
// would, and asserts the ground-truth-consistency invariants from the brief.

import { useGameStore } from "../src/game/store";
import { WITNESS_BY_ID } from "../src/game/caseData";
import { gradeVerdict } from "../src/game/verdictGrading";

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
  const factEntry = board.find((b) => b.text.includes("Daniel grabbed the knife himself"));
  assert(!!factEntry, "Board records the true account as a FACT once Tom confesses");
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

// ── Playthrough 4: evidence discovery always produces exactly one fact ───
console.log("\n=== Playthrough 4: evidence board de-dup ===");
{
  useGameStore.getState().reset();
  const { discoverEvidence } = useGameStore.getState();
  discoverEvidence("E05_daniel_phone_records");
  discoverEvidence("E05_daniel_phone_records");
  const board = useGameStore.getState().board;
  const entries = board.filter((b) => b.text.includes("Daniel's phone records"));
  assert(entries.length === 1, "Discovering the same evidence twice adds only one board fact");
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

console.log(`\n${failures === 0 ? "ALL PASS" : `${failures} FAILURE(S)`}`);
process.exit(failures === 0 ? 0 : 1);
