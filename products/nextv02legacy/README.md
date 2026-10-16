# Living Family History (codename `nextv02legacy`)

Working title — the "Kings and Queens" tribute framing is a leading
candidate name, not finalized. Full product spec:
[Living Family History — Product Design Document](https://claude.ai/code/artifact/c2179068-eec8-4697-839c-2fa2e5bc4ec6).

## What's playable now (pass 2)

The real senior-side screen loop, with the approved visual identity
applied (Fraunces + Karla, the terracotta/cream palette):

**Home → Conversation → Chapter confirm → Session close**, looping back
to Home. Home shows up to three tiles — "Family is asking" only appears
when a real pending question exists (see seeding, below); "Something on
your mind" and "Today's spark" are always available. The Conversation
screen is still typed input standing in for voice (ElevenLabs integration
is next); confirmed context renders visually distinct from her own
testimony, and the Director's adaptive close ("we can leave it there, or
if there's more — I'm listening") shows as a real in-UI choice, not a
hard cutoff. Chapter confirm crafts a real chapter from the conversation
(one OpenAI call, never inventing beyond what was actually said/confirmed)
and persists it to Supabase only once she actually confirms it — "that's
not quite right" re-crafts with her correction folded in.

No chapter illustrations yet (placeholder only — that's its own pass), no
voice, no family-side screens, no continue-priority override on Home
(needs mid-session persistence across reloads, deliberately deferred).

`TextHarness.tsx` still exists (not wired into `App.tsx` anymore) as a
developer debug view — raw four-layers panels, useful for isolating a
Director prompt issue from a UI issue.

## Running it locally

```bash
npm install
cp .env.example .env.local        # fill in OPENAI_API_KEY, SUPABASE_URL,
                                   # SUPABASE_SERVICE_ROLE_KEY
npx tsx scripts/seed-test-data.ts # one-time: creates a test family/senior
                                   # + one real pending question, so
                                   # "Family is asking" has something to show
npx vercel dev                    # serves the frontend AND api/*.ts together —
                                   # plain `vite` alone won't run the API routes
```

`npm run dev` (plain Vite) also works for frontend-only iteration, but
none of the `/api/*` routes will respond under it — use `vercel dev`
whenever you need them live.

## Verified so far

- `npm run build` / `npm run lint` — clean.
- Full loop tested live end-to-end via the actual API routes: a real
  multi-turn conversation in Catalan, a chapter crafted from it (not a
  flat transcript — real prose weaving her actual words together),
  confirmed, and checked directly against Supabase afterward — the
  `chapters` row landed with status `confirmed`, its `conversation_turns`
  were written, and its source `questions` row flipped to `answered`.
- Pass 1's Director quality checks (real web-search grounding, verbatim
  quoting, the four-layers separation holding structurally) all still
  apply unchanged — `director-respond.ts` itself didn't change in this pass.
- **Not yet verified through the actual screens in a browser** — everything
  above was exercised via `curl` against the live endpoints, same
  verification style as pass 1. Open `vercel dev`'s local URL to see it
  for real.

## Conventions carried over from `perspectives`

Vite + React + TypeScript + Zustand + Tailwind v4, same tsconfig trio,
`.oxlintrc.json`, `vite.config.ts`, and `vercel.json` (SPA rewrite only,
zero-config functions). `game/` = pure logic (types, Zustand store, the
client-side API glue module), `components/` = flat, all screens/UI. Zustand
store has no persist middleware — in-memory, optimistic updates on async
actions, failed turns marked for retry rather than silently dropped.
`api/*.ts` files stay fully self-contained (no imports from `src/` or a
shared `api/lib/`) — a lesson learned the hard way in `perspectives`
(`FUNCTION_INVOCATION_FAILED` on Vercel from a shared imported helper).

## Roadmap (not built yet)

ElevenLabs STT/TTS wired into the Conversation/Chapter-confirm screens;
the continue-priority override on Home; the family-side screens (account
setup incl. the remote setup-link flow, send-a-question, family home,
chapter view); chapter illustration generation in "subtle painted
realism" style with the baked-in honesty framing device; WhatsApp
one-tap delivery and the reaction-capture/loopback mechanic; production
deploy.
