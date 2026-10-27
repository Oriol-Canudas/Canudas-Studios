// Runs ALL THREE case self-tests (scripts/selftest.ts for Case 002, scripts/selftest.ascent.ts
// for The Last Ascent, scripts/selftest.untouchable.ts for "Untouchable") in one command,
// regardless of which case src/game/caseData.ts currently points at. Run with: npm run selftest
//
// Each suite's own store (store.ts) imports case data through caseData.ts, and each suite
// hardcodes its own case's witness/evidence/axis ids -- so each one only runs meaningfully
// while caseData.ts points at its matching case file (see the header comments on both
// selftest.ts and selftest.ascent.ts). Before this script existed, there was no single
// command that validated both cases, and running selftest.ts while caseData.ts pointed at
// Ascent crashed with a confusing TypeError deep in a helper function instead of failing
// with a useful message -- a regression in the inactive case could go unnoticed indefinitely.
//
// This script temporarily points caseData.ts at each case in turn, runs that case's suite,
// and restores caseData.ts to its original content when done (success or failure) -- so it
// never changes what's checked in, and always exercises both suites in one command.
import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { execFileSync } from "node:child_process";

const CASE_DATA_PATH = fileURLToPath(new URL("../src/game/caseData.ts", import.meta.url));
const ROOT = fileURLToPath(new URL("..", import.meta.url));

const SUITES = [
  { target: "./case002", script: "scripts/selftest.ts" },
  { target: "./caseAscent", script: "scripts/selftest.ascent.ts" },
  { target: "./caseUntouchable", script: "scripts/selftest.untouchable.ts" },
];

const originalCaseData = readFileSync(CASE_DATA_PATH, "utf8");
let failed = false;

function pointCaseDataAt(target) {
  writeFileSync(CASE_DATA_PATH, `export * from "${target}";\n`);
}

try {
  for (const suite of SUITES) {
    console.log(`\n=== Running ${suite.script} (caseData.ts -> ${suite.target}) ===\n`);
    pointCaseDataAt(suite.target);
    try {
      execFileSync("npx", ["tsx", suite.script], { cwd: ROOT, stdio: "inherit" });
    } catch {
      failed = true;
      console.error(`\n[selftest-all] ${suite.script} FAILED\n`);
    }
  }
} finally {
  writeFileSync(CASE_DATA_PATH, originalCaseData);
  console.log(`[selftest-all] restored src/game/caseData.ts to its original content.`);
}

if (failed) {
  console.error("\n[selftest-all] one or more suites failed.");
  process.exit(1);
}
console.log("\n[selftest-all] all three suites passed.");
