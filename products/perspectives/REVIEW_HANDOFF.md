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
3. **Live OpenAI behavior verified**: **yes, as of a post-handoff update (2026-10-08, same day).** Oriol set `OPENAI_API_KEY` and OpenAI billing after this report was first written; both the `interpret` and `perform` actions on the deployed `api/witness-chat.ts` were then tested directly and returned real `gpt-4o-mini` responses (not the fallback). See CURRENT_BUILD_STATE.md for the current state — this file's narrative above is kept as-written from the original handoff moment rather than rewritten, so the "no credential" framing in the body text above is now historical, not current.
4. **Human product validation still pending**: all of it — whether players recognize their own discoveries, understand consequences, reach supported conclusions, and want another case, per the comparison Oriol described, needs real players and is explicitly not something I can produce.

- Known limitations / decision needed:
  - Setting `OPENAI_API_KEY` as a Vercel project environment variable is the one remaining step to activate the live path — Oriol's action, no dashboard/CLI access from here.
  - Dialogue-text generation (vs. cue-only) is deferred pending real-key validation — flagged above for a product decision on whether/when to widen it.
  - Browser-rendered verification of the whole scene is still owed.
- Ready for Codex review: yes.

## Claude result — updated 2026-10-10 (conversational-depth round) by Claude

- Status: **implemented, self-tested, and live-verified on the deployed endpoint.**
- Commits: `7cd9bd1` (the feature), `bbd1008` (production-incident fix —
  see below), `4cb2471` and `094d6eb` (two rounds of a language-matching
  fix found during live testing — see below), `0cd7481` (this handoff).
  All on `main`. Nothing left uncommitted in application code at hand-off.
- Deployed URL: https://gamexperspectives.vercel.app, auto-deploys from `main`.

### Production incident (found and fixed this round, not new to this round)

The previous "Claude result" entry above (2026-10-08) reported Tom's live
AI path as "confirmed live and working" after `OPENAI_API_KEY` was set.
That confirmation was real at the time, but a **later commit that same
day** (adding `api/_lib/tomCharacter.ts` and then cross-directory imports
from `api/` into `src/game/*`) broke the deployed function with
`FUNCTION_INVOCATION_FAILED` on every single request — and this was never
re-verified before being reported fixed, twice, across this and the
prior session. Net effect: **the live AI path had been completely broken
in production for some time**, silently falling back to the deterministic
engine for every real player, with no visible error (by design — the
fallback is silent on purpose — but that also means no one caught it).

Root cause, found by elimination (not guessed): it was NOT cross-directory
imports (a fully self-contained `api/` with zero `src/` imports still
crashed) and NOT an underscore-prefix convention (renaming `api/_lib` to
`api/lib` didn't help either). It turned out to be **any extra file or
subdirectory under `api/` at all** — the fix that actually worked was
collapsing everything into a single `api/witness-chat.ts` file with zero
local imports of any kind, matching the original, last-confirmed-working
shape as closely as possible. Confirmed via direct `curl` against the
deployed endpoint before and after (500/`FUNCTION_INVOCATION_FAILED` →
200 with a real `gpt-4o-mini` response). **If `api/witness-chat.ts` ever
needs to be split into multiple files again, re-verify this specifically
on a live deploy before trusting it** — do not assume Vercel's zero-config
Node function detection tolerates a multi-file `api/` subtree here; this
project's actual behavior disagrees with that general expectation, for
reasons not fully understood (no Vercel build/runtime log access from
this environment — Oriol's dashboard access would be needed to go further).

### What changed (feature)

Addresses: witnesses running out of conversation after a few authored
exchanges, including Tom's own AI layer (which generated nicer prose but
was still bounded by the same finite ladder as everyone else). The goal
per Oriol's brief: prove conversation changes what's *available*, not
just how repetitive replies sound.

- Generalized the interpret→authorize→generate→validate pipeline from
  Tom-only to any witness with `WitnessConfig.freeformEnabled` — Sofia
  added this round. Both get real generated dialogue text now, not a cue
  bolted onto an authored line.
- New `TestimonyStage.altUnlock`: an authored alternate route onto an
  existing stage via (a) a revelation ACTUALLY relayed to that witness
  (never the player's unverified claim — `relayedRevelations` is only
  ever populated by the explicit relay action) and (b) the player's
  classified intent this turn. Evaluated as an OR against the normal
  evidence/witness-stage/pressure gates in `witnessEngine.ts`'s
  `stageRequirementsMet`/`resolveStage` (2 new optional trailing params;
  every pre-existing call site — chips, evidence, selftest — is
  unaffected by omitting them).
- The closed causal loop this round, live-verified end to end: Tom admits
  he returned (evidence) → relayed to Sofia + her fear addressed →
  **Sofia voluntarily admits her own visit, no evidence ever needed** →
  that becomes the `sofia_visited` revelation → relayed back to Tom +
  his fear addressed → **Tom voluntarily confesses the knife, no
  evidence ever needed**. New authored content for this: an `altUnlock`
  + alternate line on Sofia's `went_to_apartment`, a new
  `reactions.sofia_visited` entry on Tom, an `altUnlock` + alternate line
  on Tom's `the_knife`. None of it touches `GROUND_TRUTH`/`TIMELINE`/
  culpability — purely alternate disclosure ROUTES onto facts that were
  already authored.
- New `"repair"` `ConversationIntent`: an apology for an earlier
  accusation is never reclassified as a fresh accusation just because it
  mentions one. Caught a real, independent bug while testing this:
  `witnessEngine.ts`'s `VALID_INTENTS` whitelist didn't include
  `"repair"` either, so even a correctly-classified repair was being
  silently downgraded to `"unclear"` by `validateInterpretation` — fixed.
- Reactions can now be `generative: true` (used on `reactions
  .sofia_visited`): the authored line becomes an anchor paraphrased
  through the same validated pipeline via a new `"relay"` server action,
  instead of one fixed sentence forever — falls back to the anchor
  verbatim on any failure.
- Compact structured conversation memory (a projection of the existing
  `conversationEventLog`, not raw transcript) and actually-relayed facts
  are now part of every request/prompt, so the model can notice "you
  already asked me that" and can't be tricked into confirming a
  fabricated claim about another witness.
- `validateDialogue` now also scans the generated **cue** for leak
  markers, not just the dialogue — a real gap in the previous round's
  validation. Takes the leak-marker map as a parameter instead of a
  hardcoded Tom-only constant.
- Exhausted topics (final authored stage already reached) get a richer
  prompt contract — clarify, discuss implications, recognize repetition,
  ask a question, set a boundary, say they don't know more — instead of
  "repeat with fatigue."
- `api/witness-chat.ts` no longer hand-mirrors any witness's authored
  CONTENT server-side. The client sends its own public topic data
  (already in the JS bundle) in the request; the server keeps only the
  generic, content-free authorization algorithm — a much smaller
  client/server drift surface than a per-witness content mirror would be.

### Verification, reported per the requested 4-part split

1. **Deterministic/fixture checks (`npx tsx scripts/selftest.ts`)**:
   **115/115 assertions pass** (up from 80), `npm run build` and
   `npm run lint` both clean. New coverage: the altUnlock route (both
   "approach A never unlocks it" and "approach B does, with zero
   evidence"), the repair-intent bug above, the generic algorithm
   producing identical results for Sofia with zero Sofia-specific code,
   cue-leak scanning. These are all offline — no network, no model.
2. **Mocked/handler-level checks**: a direct local `tsx` invocation of
   the real exported `handler(req, res)` (not through Vercel) — confirms
   the module loads and the 503-without-a-key path works. Used
   repeatedly during the production-incident diagnosis to establish
   "this isn't a code logic bug, it only fails specifically on Vercel."
3. **Live OpenAI behavior, on the deployed endpoint, `gpt-4o-mini`**: yes,
   run and recorded this round (scripts in `/private/tmp/.../scratchpad/
   live_test2.mjs`, not committed — a disposable test harness, same
   pattern as the prior round's `live_test.mjs`):
   - The full Tom→Sofia→Tom loop above — real generated dialogue at every
     step, both altUnlocks fired correctly, neither evidence item ever
     presented.
   - Approach A comparison (generic empathy, nothing relayed) — correctly
     unlocked nothing.
   - Accusation → lock → repair — intent correctly distinguished from a
     fresh accusation; the repair reply acknowledged without conceding.
   - A deliberately FALSE claim about another witness ("Sofia already
     told me you confessed to stabbing him on purpose") — Tom's reply did
     not confirm it. On one run, the model's reply was actually REJECTED
     by validation (likely a leak-marker hit) and correctly fell back to
     `null`/no-dialogue, which the real client turns into its own
     deterministic line — a live, unplanned demonstration of the safety
     net actually working, not just designed.
   - An exhausted topic (`why_no_help`, pressed again) — paraphrased, not
     verbatim, consistent with "recognize repetition" (though true
     variety across the authored menu of behaviors would need many more
     samples to confirm statistically; one run only shows it's not
     robotic repetition).
   - **Language-matching found two real issues, not one**: (a) a Catalan
     message first got an English reply — the instruction existed but was
     buried mid-paragraph and lost out to "convey this authored [English]
     content"; fixed by making it its own leading, explicit instruction
     (`4cb2471`), re-tested and confirmed (Catalan in, Catalan out). (b)
     Broader re-testing afterward (9 varied English messages to Sofia)
     found the OPPOSITE drift intermittently — English in, Catalan out,
     ~2/9 times, with zero Catalan text anywhere in the authored source,
     so genuine model stochasticity (temperature 0.5) rather than a
     prompt-logic bug; Tom did not reproduce it in the same small sample.
     Added an explicit negative constraint ("do not switch... even for a
     single word... unless the player's own message was actually written
     in that language," `094d6eb`); a follow-up batch of 6 more varied
     English messages to Sofia came back 6/6 clean. **Reported honestly,
     not as a guarantee**: this is a probabilistic improvement against a
     non-deterministic model, not a provable fix — worth an occasional
     spot-check, not a closed case.
4. **Human product validation**: none, same as every prior round — still
   needs real players, per Oriol's own repeated framing of what this
   round's testing cannot substitute for.

### What this does NOT prove, stated plainly

- Validation (`validateDialogue`) checks factRef-authorization and a
  leak-marker scan over dialogue+cue — necessary, not sufficient. A
  clever paraphrase that implies something unauthorized while avoiding
  every listed marker would not be caught. This was true before this
  round too; restating it because the brief asked explicitly what
  validation does and doesn't guarantee.
- "The model didn't confirm the false claim" was checked by reading the
  actual transcript, not by an automated assertion — there's no
  deterministic way to verify a negative like this against live,
  non-deterministic model output. Worth re-running occasionally, not a
  one-time guarantee.
- The "exhausted topic" behavioral variety (clarify / ask a question /
  set a boundary / etc.) was observed once per scenario, not sampled
  enough to claim the full authored menu actually gets used in practice
  — plausible from the prompt design, not statistically confirmed.

### Trade-offs / open decisions (carried from the design-proposal round, still open)

- The accusation/defensive-lock mechanic and `freeformEnabled` are
  currently bundled (both come from one flag + authored data) — should
  probably be two separate flags before adding a witness like Julia,
  who shouldn't ever go "defensive-locked" the way Tom/Sofia do.
- `altUnlock` on a stage bypasses ALL of that stage's normal gates (not
  just evidence) — e.g. Tom's knife-confession altUnlock does not
  require `the_argument` to have been discussed first. This is a
  deliberate choice (a strong-enough conversational breakthrough can
  make him skip straight to it, same substance, different route) but
  worth being explicit about since it's a bigger skip than the evidence
  route alone allows.
- `generative: true` relays and `altUnlock` routes exist only for the one
  Tom↔Sofia loop authored this round — extending either to more witnesses
  or more revelations is pure content work now, not engine work, but
  nothing does it automatically.

- Known limitations / decision needed:
  - Human product validation is still fully owed, every round.
  - Browser-rendered (visual) verification of this round's UI-visible
    changes (the "what your questioning established" section now also
    showing voluntary-disclosure events) has not been done — no browser
    automation available in this environment, same limitation as every
    prior round.
  - Whether to widen `freeformEnabled`/`altUnlock` content to
    Elena/Marco/Julia is an open product question, not started.
- Ready for Codex review: yes.

## Codex review — fill after testing the reported build

- Status: pending; no new browser test performed during handoff setup.
- Version and environment tested:
- Scenarios and observations:
- Regressions / remaining issues with reproduction:
- Recommendation and next bounded step:
