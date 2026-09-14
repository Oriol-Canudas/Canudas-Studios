# Rehearsal — Production Log

Purpose: keep a **plain-language history of meaningful build changes** so Oriol can follow production without reading every line of code.

Each meaningful build step should append:

```text
## YYYY-MM-DD — short title

What changed
- ...

Why
- ...

Files
- ...

How to test
- ...

Current limitations / next step
- ...
```

---

## 2026-09-14 — Production source of truth initialized

What changed
- Created the Rehearsal production area in the Canudas Studios GitHub repository.
- Defined the V0 as The Deadline / The Pushback.
- Captured the current build rules: terminal-first, six visual states, immutable turn log, grounded Inner Reveal, freeform first input.

Why
- Production code must live somewhere durable, inspectable and runnable rather than being scattered across chats or Drive documents.
- Oriol needs a simple way to know what Claude changed and where it lives.

Files
- `/README.md`
- `/products/rehearsal/README.md`
- `/products/rehearsal/PRODUCTION_LOG.md`

How to test
- No executable prototype exists yet. This commit establishes the production contract and location.

Current limitations / next step
- Claude should now create the smallest runnable terminal prototype under `/products/rehearsal/` and document each material step here.
