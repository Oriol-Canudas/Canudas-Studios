# Proposal — make the agreement and its consequences visible

Status: DESIGN PROPOSAL from Oriol's 16 October feedback. This is not a frozen implementation task or approval to build every option. Task016 separately removes the optional goal prompt.

## Current evidence

At runtime candidate93aeb13, Lia has four existing mood portraits (guarded, receptive, hurt, firm). The engine explicitly separates mood from agreement. A proposal strip and Review & end lead to a review screen; Nora's authored response is appended there by confirmNora. Consent is version-specific. The current ending has three caption beats over one image; public/private share ending-duet. Source: main.jsx, story.mjs and engine.mjs.

## Recommended interaction

Keep one bounded open AI negotiation with Lia. Give Nora a short, visible, authored-reactive response scene in the same portrait language. Her response must reflect delivered terms and prior choices; she may accept, request a change or refuse. Do not make two full open AI conversations mandatory before learning whether the handoff itself works.

- During Lia: one compact expandable offer/status summary. Show actual terms and who has agreed, not mood as a proxy. Once Lia has accepted a valid current offer, promote **Take this offer to Nora** beside the still-available option to continue talking. There is no need to use every turn.
- No agreement: retain a clearly labeled **Choose another ending** route; unresolved terms and lack of consent stay visible. No encore remains possible.
- Nora: taking the offer actually delivers that exact version. Her response plays as a short scene rather than a wall of review text. Do not ask the player to select Nora's yes on her behalf. Present meaningful interventions only where something is unresolved.
- A new condition changes the offer. Nora requesting physical space cannot silently count as Lia accepting it. **Take her condition to Lia** returns the real condition to the existing negotiation; once Lia accepts, Nora confirms the same revised terms. Keep the return bounded. At the turn limit or after a refusal, show honest alternatives instead of inventing acceptance or resetting the budget.
- Once all required consent exists: **Cue the shared encore** is a prominent action. Player cue remains separate from consent. For Lia without Nora, show **Lia agreed · Nora not performing** and **Cue the encore without Nora**. Never imply Nora endorses that choice.
- Clear status examples: Lia agreed / Nora not asked; Nora added a condition / Lia must reconfirm; both agreed to this offer / ready for your cue. Full terms expand in place, avoiding another permanent panel.

## Portrait reaction beat

On a meaningful mood change, briefly fade the dialogue, reveal the new expression, then restore the attributed reply. Starting candidate: about 0.8–1.2 seconds. Use existing portraits first to test pacing. Do not add a delay every turn or interrupt typing, recording, a long reply being read, or a retry. Respect reduced motion and keep text available. A reluctant agreement can remain hurt or firm; it must not visually claim reconciliation. Add new art for distinct emotional moments only where existing images cannot carry them.

## Payoff, then reflection

Build a short mostly automatic sequence with pause and optional skip: entrance/opening words → song and audience reaction → backstage aftermath → evidence-based reflection. Images and text should show actual executed terms and remaining costs, not just an outcome label.

Proposed additional shot list, not generated or approved assets yet:

1. Lia and Nora returning through the curtain towards separate microphones.
2. Public acknowledgment: Lia speaks, Nora visibly present, audience listening.
3. Private agreement: the same song with clear physical space and no staged embrace.
4. Lia with the band and Nora's empty microphone; crowd carrying the missing answering line.
5. Nora in the dressing room during the solo encore, without implying reconciliation.
6. House lights over an empty stage for no encore.
7. Two distinct post-show exits or backstage distance after a shared encore.

Reuse existing performance images where appropriate. Do not introduce new historical facts, reverse the tour booking, expose confidential love in a public caption, or manufacture reactions as verified audience beliefs.

Reflection should highlight one or two traceable actions: correcting an impossible promise, protecting an actually discovered confidence, retaining shared credit, or respecting a refusal. State the evidence and observable effect; retain the real trade-off without grading or shaming. No invented empathy score, personality diagnosis or universal best ending. Durable cross-case progression remains a separate metagame design.

## Prototype review

Interactive scripted sketch: `/Users/oriol.canudas/.codex/visualizations/2026/09/24/01a0d4ff-4fa2-7731-87a8-c6ea888a33b4/concert-agreement-payoff.html`. Existing artwork illustrates four branches, including a revised condition. Not live AI or the released app. Checked all four paths at 736px and 320px; source uses no provider calls.

Next implementation order recommended: agreement/handoff clarity first; ending sequence second; portrait reaction timing alongside presentation work. Before BUILD, freeze exact player actions, changed files and acceptance, including stale consent, no-agreement exit, Nora refusal, preserved drafts and mobile rendering. Replay actual authored → Lia → Nora → cue → outcome path with controlled fixtures, then request a human playtest of clarity and payoff.
