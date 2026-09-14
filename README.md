# Canudas Studios

This repository is the **source of truth for executable product code**.

## Current active build

### Rehearsal — V0 / The Deadline

Production code lives under:

`products/rehearsal/`

Start here:

- [`products/rehearsal/README.md`](products/rehearsal/README.md) — what exists, how to run it, current status.
- [`products/rehearsal/PRODUCTION_LOG.md`](products/rehearsal/PRODUCTION_LOG.md) — plain-language log of meaningful build changes.

## Source-of-truth split

- **GitHub** = code that can actually build/run the product, tests, prompts used by the runtime, schemas, production notes.
- **Google Drive** = strategy, Design Canon, visual references, product decisions, Board material.

Do not leave production-critical code only in chat. If it is required to run Rehearsal, it must be committed here.

## Working rule for AI builders

Every meaningful build step must:

1. change files in this repository;
2. keep Rehearsal runnable or state clearly why not;
3. update `products/rehearsal/PRODUCTION_LOG.md` in plain language;
4. explain to Oriol what changed, why, where the files are, and how to test it;
5. avoid broadening scope beyond the current V0 unless explicitly approved.
