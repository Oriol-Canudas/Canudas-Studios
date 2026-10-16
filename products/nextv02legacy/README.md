# Living Family History (codename `nextv02legacy`)

Working title — the "Kings and Queens" tribute framing is a leading
candidate name, not finalized. Full product spec:
[Living Family History — Product Design Document](https://claude.ai/code/artifact/c2179068-eec8-4697-839c-2fa2e5bc4ec6).

## This build pass

Scope deliberately narrow: get the Director's actual conversation quality
right first, text-only, before voice I/O, screens, or delivery. This repo
currently contains:

- A minimal **text harness** (`src/components/TextHarness.tsx`) — type a
  senior's reply, see the Director's next turn, and watch the four layers
  (testimony / confirmed context / researched-unconfirmed / interpretation)
  rendered in genuinely separate panels, not blended.
- `api/director-respond.ts` — the Director's conversation engine. Fully
  self-contained (no imports from `src/`), following the same convention
  the sibling `perspectives` project adopted after hitting
  `FUNCTION_INVOCATION_FAILED` on Vercel from a shared imported helper.
  Uses OpenAI's Responses API (raw `fetch`, no SDK — matching
  `perspectives`' own convention) with its native `web_search` tool for the
  Director's Research/Contrast functions. Switched from an earlier
  Claude-based version specifically because OpenAI credits were already
  funded — same prompt, same four-layers enforcement, different provider.
- `supabase/migrations/0001_init.sql` — the full schema (families, seniors,
  questions, chapters, conversation_turns, reactions, preference_signals).
  **Not yet connected to any live Supabase project or wired into any code
  path** — this pass's harness is in-memory only (Zustand, no
  persistence). Next pass.

## Running it locally

```bash
npm install
cp .env.example .env.local   # fill in OPENAI_API_KEY
npx vercel dev                # serves the frontend AND api/*.ts together —
                               # plain `vite` alone won't run the API route
```

`npm run dev` (plain Vite) also works for frontend-only iteration, but
`/api/director-respond` won't respond to anything under it — use
`vercel dev` whenever you need the real endpoint.

## Verified so far

- `npm run build` — clean (tsc + vite build).
- `npm run lint` — clean (oxlint).
- `vercel dev` smoke-tested: `GET /api/director-respond` → `405`,
  `POST` with no key present → `503 { error: "ai_unavailable" }`. Both
  exactly as designed.
- **Not yet tested**: an actual live conversation. No `OPENAI_API_KEY`
  exists anywhere in the dev environment this was built in — needs a real
  key (from platform.openai.com) before the Director's conversation
  quality can be judged for real.

## Conventions carried over from `perspectives`

Vite + React + TypeScript + Zustand + Tailwind v4, same tsconfig trio,
`.oxlintrc.json`, `vite.config.ts`, and `vercel.json` (SPA rewrite only,
zero-config functions). `game/` = pure logic (types, Zustand store, the
client-side API glue module), `components/` = flat, all screens/UI. Zustand
store has no persist middleware — in-memory, optimistic updates on async
actions, failed turns marked for retry rather than silently dropped.

## Roadmap (not built yet)

ElevenLabs STT/TTS wired into a real conversation screen; the full
senior-side and family-side screens from the product doc's Screens & flow
section; chapter illustration generation in "subtle painted realism" style;
WhatsApp delivery and the reaction-capture/loopback mechanic; Supabase
persistence actually wired in; deploy to production.
