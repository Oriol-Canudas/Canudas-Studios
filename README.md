# Canudas Studios

This repository is the **source of truth for executable product code**.

## Current active build

### Perspectives — POC / Case 002: "The Last Message"

Production code lives under:

`products/perspectives/`

Start here:

- [`products/perspectives/README.md`](products/perspectives/README.md) — what exists, how to run it, current status.
- [`products/perspectives/PRODUCTION_LOG.md`](products/perspectives/PRODUCTION_LOG.md) — plain-language log of meaningful build changes.
- [`products/perspectives/CURRENT_BUILD_STATE.md`](products/perspectives/CURRENT_BUILD_STATE.md) — handoff state for Oriol/ChatGPT/Claude.

### Rehearsal — V0 / The Deadline (parked)

Parked by Oriol — not under active development. Production code, when work
resumes, lives under `products/rehearsal/`. Do not extend this product
without explicit approval.

## Source-of-truth split

- **GitHub** = code that can actually build/run the product, tests, prompts used by the runtime, schemas, production notes.
- **Google Drive** = strategy, Design Canon, visual references, product decisions, Board material.

Do not leave production-critical code only in chat. If it is required to run a product, it must be committed here.

## Working rule for AI builders

Every meaningful build step must:

1. change files in this repository;
2. keep the relevant product runnable or state clearly why not;
3. update that product's `PRODUCTION_LOG.md` in plain language;
4. explain to Oriol what changed, why, where the files are, and how to test it;
5. avoid broadening scope beyond the current product's current stage unless explicitly approved;
6. never modify a parked product's files without explicit approval.
