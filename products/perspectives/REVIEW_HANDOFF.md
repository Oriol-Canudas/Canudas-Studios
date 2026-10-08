# PERSPECTIVES — shared review handoff

Updated: 2026-10-08 by Codex, at Oriol's request to coordinate through this repository.

## How we work

- Claude owns implementation. Codex owns playtesting, review and reproducible feedback. Oriol owns product decisions.
- One code editor at a time. Codex will not change application code while Claude is implementing. Do not overwrite another collaborator's uncommitted changes.
- This file is the review queue and results exchange. CURRENT_BUILD_STATE.md remains the build-status entry point; DECISIONS.md records decisions; PRODUCTION_LOG.md records delivered changes. Avoid maintaining competing status documents.
- Read this file before the next iteration. Finish the already authorized integrity fixes before the AI-conversation iteration; do not restart or discard work already underway.
- Files do not notify or activate another agent. Oriol triggers Claude to read this handoff and Codex to review the resulting build. No automatic monitoring is configured.
- Do not commit, push or deploy solely because this handoff exists; follow the user's existing delivery authorization.

## Baseline observed by Codex

Local repository verified on 2026-10-08:
`/Users/oriol.canudas/dev/canudas-studios/products/perspectives`

HEAD at inspection: `fad4868`. Uncommitted changes were present in `src/game/caseData.ts` and `src/game/types.ts`; their owner and completion state were not independently verified. They were left untouched.

The current build document reports deterministic dialogue and no live LLM integration. This is not a fresh runtime/API verification. Earlier browser findings below may already be addressed by work in progress; reproduce them before changing code.

Playtest URL: https://gamexperspectives.vercel.app/

## Current objective and sequence

1. Complete the integrity/UI-flow corrections already discussed with Oriol.
2. Implement actual OpenAI conversation for Tom first, using the previously supplied detailed conversation prompt. Other witnesses may remain clearly identified as deterministic.
3. Verify the deployed experience and measure quality, latency and inference cost before expanding scope.

The experiment: can players ask natural questions, gain useful constraints and change Tom's willingness to disclose through evidence and their intervention, while authored facts remain consistent?

## Review queue from previous browser sessions — NOT retested on current HEAD

| ID | Reproduction / observed problem | Acceptance criterion |
| --- | --- | --- |
| R01 | Fresh case, open Marco: suggested question presupposed Tom's accidental-confession account before it was learned. | Suggestions never disclose unknown testimony; legitimate exploratory questions remain possible. |
| R02 | Marco failed both natural paraphrases and a suggested question about his call with Daniel. | Supported questions produce relevant answers; when AI is added, equivalent phrasing and Catalan/English/Spanish are tested without keyword dependence. |
| R03 | Tom's upstairs admission depended on first asking whether he saw someone. | Valid evidence and questioning support more than one disclosure route; an unrelated fixed question order is not required. |
| R04 | Tom's account of the stabbing appeared as FACT on the board. | Testimony, evidence, inference and uncertainty remain distinct, even if testimony matches author truth. |
| R05 | Zero-investigation verdict reported four pieces of evidence discovered; full evidence plus confession still showed low clarity. | Acquired, inspected and presented evidence are distinct; remove misleading completeness percentages. |
| R06 | Insufficient-evidence verdict received the same prosecution-belief headline as an Elena guilty verdict. | Reveal feedback matches the actual verdict and expressed uncertainty; do not claim analysis of free text unless implemented. |
| R07 | Reveal contained a six-versus-46-minute discrepancy and treated phone unlock as proof Daniel was alive. | Timeline arithmetic is correct; device activity is not presented as independent proof of life. |
| R08 | Hard to explicitly confront a witness with a selected evidence item. | Present-evidence action makes the item and accompanying question clear and records presentation to that witness. |

These were simulated player styles, not demographic or human engagement validation. Original browser tests were against an earlier deployed build, not the current uncommitted files.

## AI iteration acceptance criteria

- Real server-side OpenAI requests work locally and on the deployed app. Never expose keys in browser code, chat, logs or committed files.
- Authored world facts remain authoritative. Character knowledge, beliefs, motivations and dialogue are separate. The model cannot create evidence or alter the culprit/timeline.
- Interpretation handles free questions and follow-ups, rather than merely rephrasing a keyword-selected response. Engine validates disclosure/state changes before committing them.
- Compare accusation without evidence, precise evidence-based confrontation, and an empathetic intervention from the same starting state. Differences should be causally justified, not rewards for a magic phrase or repeated kindness.
- No premature confession, cross-witness omniscience or conversion of testimony into fact. Useful partial information counts as progress.
- Failed or repeated requests do not advance state twice. Reset invalidates stale replies. Failures are explicit; canned fallback must not masquerade as live AI.
- Record model, usage for every call (including interpretation, validation and retries), latency, failures, and estimated session cost using dated rates. Keep secrets and raw transcripts out of routine logs.
- Apply bounded requests/output/retries and a server-side disable switch. Do not invent an approved monetary budget; report configuration needed before public cost exposure is considered controlled.
- Separate mocked checks, live API checks and deployed browser checks in the completion report. Configuration alone is not proof of working AI.

Out of scope for this iteration: new cases, voice/avatar, charisma dice, metagame, general backend/auth/payments, new energy/time mechanics.

## Claude result — updated 2026-10-08 (step 2 round) by Claude

- Status: **step 1 (integrity fixes) and step 2 (Tom's free-form conversation scene) are both implemented and self-tested.** Step 1's R01–R08 summary is unchanged from the previous round (kept below). This update covers step 2.
- Commit / branch and uncommitted changes: committed to `main` this session; nothing left uncommitted in application code at hand-off.
- Deployed URL and verified version: https://gamexperspectives.vercel.app, auto-deploys from `main` on push.

### Step 2 — Tom's free-form conversation scene

**What it does**: free text is the real interface for Tom specifically. The player can type anything (English or Catalan); the engine classifies it as an unsupported accusation, an evidence-backed contradiction, an empathetic appeal, an ordinary question, or off-topic, and resolves a validated outcome:
- Unsupported accusation → that topic goes defensive (stonewalling), recoverable, never a permanent lock.
- Real evidence cited (by name in free text, or via the existing picker) → a limited, authored admission — exactly what that evidence is already gated to unlock via `requiresEvidence`, never more. Reuses the identical `advanceTopic()` resolution every other witness interaction already goes through — there is no separate "AI confession path."
- Empathy with zero evidence → unlocks nothing. Empathy *plus* real evidence can reopen a defensive topic.

**Acceptance criteria, addressed one by one:**
- *"Real server-side OpenAI requests work... never expose keys"* — `api/witness-chat.ts` is real code (actual `fetch()` to `api.openai.com`, key read server-side only via `process.env`). **Not live-tested**: no `OPENAI_API_KEY` exists anywhere in this environment (checked: not in the repo, no `.env`, no Vercel CLI access). Returns 503 without a key; client treats that as "use fallback," never a player-facing error.
- *"Authored world facts remain authoritative... model cannot create evidence or alter the culprit/timeline"* — hard boundary: `validateInterpretation()` (`witnessEngine.ts`) cross-checks every proposed topic/evidence-citation/intent against real state before anything acts on it, whether the proposal came from the model or the deterministic fallback. Tested directly with a simulated hallucinated evidence id and an injected intent string (`scripts/selftest.ts` Playthrough 19) — both stripped.
- *"Interpretation handles free questions... engine validates disclosure/state changes before committing"* — yes, via the above. Caveat on depth: the deterministic fallback's topic-matching still relies on keyword overlap (reuses `matchTopic`); true paraphrase-independence without any shared anchor word is the live-AI path's job and is untested without a key. See R02 note below.
- *"Compare accusation / evidence-based confrontation / empathetic intervention from the same starting state"* — implemented and tested as three distinct, causally-justified outcomes (Playthroughs 16–17). Not a "magic phrase" system: empathy only ever matters when paired with a real evidence citation.
- *"No premature confession, cross-witness omniscience, or conversion of testimony into fact"* — evidence-gated admissions are always the authored, already-limited stage text; nothing jumps further than normal evidence discovery already allows. Cross-witness info only moves via the existing explicit relay action, untouched by this scene.
- *"Failed or repeated requests do not advance state twice... failures explicit, fallback never masquerades as live"* — `pendingWitnesses` guards duplicate submission (tested, Playthrough 20); every witness message carries `source: "ai" | "fallback"`, surfaced in the UI as "Guided matching active — live AI not connected" when running on fallback, never silently relabeled.
- *"Record model, usage, latency, failures... keep secrets and raw transcripts out of logs"* — `api/witness-chat.ts` logs metadata only (witness id, action, model, token counts, latency) via `console.log`, visible in Vercel's function logs once deployed with a key. Never logs message or dialogue content. **Not yet observed in practice** — no live calls have happened.
- *"Bounded requests/output/retries, server-side disable switch"* — message length capped (600 chars), `max_tokens` capped per call (150/80), one retry on transient failure only, `AI_WITNESS_CHAT_DISABLED` env var kills the feature without removing the key.
- *"Separate mocked, live API, and deployed browser checks"* — see the 4-part breakdown below.

**Scope line I drew, flagged explicitly**: the model's only creative output this round is a short performance cue — Tom's actual dialogue text stays the authored line verbatim, never model-generated. Full reasoning in DECISIONS.md; short version: validating that a generated paraphrase hasn't silently altered a fact is a real problem I can't responsibly test without a real key, and shipping that unvalidated felt like the wrong trade for the riskiest integrity boundary in the feature. This is narrower than the brief's "generated dialogue" ask — surfacing it for a product call, not hiding it.

**R02 revisited**: now partially addressed rather than fully open — Marco's specific reproduction (unanswerable baseline question) was already fixed last round; this round adds free-text interpretation for Tom with a basic Catalan-phrase hook in the deterministic fallback (tested, Playthrough 21), but true keyword-independent multilingual understanding is still the live-AI path's job, untested without a key.

**R08 revisited**: the earlier caveat (no free-text question alongside a presented excerpt) is now also addressed for Tom specifically — the player can cite evidence by name directly in a free-text message (e.g. "your phone records show otherwise"), which the interpreter validates and the engine records into `presentedEvidence[tom]` exactly like the picker does (Playthrough 18).

### Verification, reported per the requested 4-part split

1. **Automated checks completed**: `npx tsx scripts/selftest.ts` — 75/75 assertions pass (grew from 49). Covers: equivalent phrasings reaching the same topic, full accusation→lock→recovery cycle, empathy-without-evidence never unlocking, chips respecting the defensive lock, private-reading vs. presenting being distinct, duplicate-submission prevention, a simulated hallucinated/injected model response being stripped by validation, a minimal Catalan phrasing hook. `npm run build` and `npm run lint` both clean.
2. **Manual browser checks completed**: none. Browser automation is unavailable in this environment (Chrome extension not connected) — same limitation noted every round this session. The rendered composer, loading/retry states, performance-cue timing/skippability, reduced-motion behavior, and mobile keyboard handling have NOT been visually verified.
3. **Live OpenAI behavior verified**: no. No credential exists in this environment to test with. The deterministic fallback is what the deployed app actually runs today, end to end.
4. **Human product validation still pending**: all of it — whether players recognize their own discoveries, understand consequences, reach supported conclusions, and want another case, per the comparison Oriol described, needs real players and is explicitly not something I can produce.

- Known limitations / decision needed:
  - Setting `OPENAI_API_KEY` as a Vercel project environment variable is the one remaining step to activate the live path — Oriol's action, no dashboard/CLI access from here.
  - Dialogue-text generation (vs. cue-only) is deferred pending real-key validation — flagged above for a product decision on whether/when to widen it.
  - Browser-rendered verification of the whole scene is still owed.
- Ready for Codex review: yes.

## Codex review — fill after testing the reported build

- Status: pending; no new browser test performed during handoff setup.
- Version and environment tested:
- Scenarios and observations:
- Regressions / remaining issues with reproduction:
- Recommendation and next bounded step:
