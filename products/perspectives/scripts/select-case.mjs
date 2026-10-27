// Runs automatically before every build (see package.json's "prebuild"
// script — npm's standard lifecycle hook, no extra wiring needed).
//
// Lets multiple Vercel projects deploy the SAME commit on the SAME branch
// (no branch-per-case, no merge drift) while each still serves a
// different case: each project sets its own ACTIVE_CASE environment
// variable, and this script overwrites src/game/caseData.ts to match
// right before the real build runs. Local dev is untouched — with no
// ACTIVE_CASE set, this is a no-op and caseData.ts stays exactly as
// checked into git.
import { writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

const KNOWN_CASES = {
  case002: "./case002",
  ascent: "./caseAscent",
  untouchable: "./caseUntouchable",
};

const activeCase = process.env.ACTIVE_CASE;

if (!activeCase) {
  console.log("[select-case] ACTIVE_CASE not set — leaving src/game/caseData.ts as checked in.");
  process.exit(0);
}

const target = KNOWN_CASES[activeCase];
if (!target) {
  console.error(`[select-case] Unknown ACTIVE_CASE "${activeCase}" — expected one of: ${Object.keys(KNOWN_CASES).join(", ")}`);
  process.exit(1);
}

const path = fileURLToPath(new URL("../src/game/caseData.ts", import.meta.url));
const content = `// ─────────────────────────────────────────────────────────────────────────
// GENERATED at build time by scripts/select-case.mjs from ACTIVE_CASE="${activeCase}".
// Do not hand-edit while that environment variable is set — it will be
// overwritten on the next build. For local dev without ACTIVE_CASE set,
// this file is left exactly as checked into git instead.
// ─────────────────────────────────────────────────────────────────────────

export * from "${target}";
`;

writeFileSync(path, content);
console.log(`[select-case] ACTIVE_CASE="${activeCase}" — wrote caseData.ts -> ${target}`);
