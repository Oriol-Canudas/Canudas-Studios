// ─────────────────────────────────────────────────────────────────────────
// Which case is currently active. Every component imports from THIS path
// ("../game/caseData"), never from a specific case file directly — so
// switching the whole app to a different case is changing the one export
// line below, not touching any of the ~9 files that import case data.
//
// Only one case can be "the active case" at a time this way (no in-app
// case-selector/library yet — see the generalization round's DECISIONS.md
// entry for why that's deliberately deferred). To add a new case: author
// it as its own file (case002.ts is the reference shape — GROUND_TRUTH,
// TIMELINE, EVIDENCE, WITNESSES, REVELATIONS, VERDICT_AXES/CONFIG, and
// TIME_PRESSURE, which may be null), then swap the line below once it's
// ready to replace the current one.
// ─────────────────────────────────────────────────────────────────────────

export * from "./caseAscent";
