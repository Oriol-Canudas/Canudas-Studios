# GameX: DESIGN → BUILD → QA

This Git checkout holds executable products; scope each task explicitly. Current trial: `products/concert`. Other products are out of scope; `products/rehearsal` is parked. Reference material under the surrounding project's `sources/` is read-only. Never change canonical strategy or synced sources as part of a code fix.

- **DESIGN:** confirm checkout, branch, baseline commit and existing changes. Freeze player benefit, allowed files, non-goals and observable acceptance in `tasks/NNN-name.md`. Reproduce a reported defect before changing behavior; if absent, report evidence first.
- **BUILD:** delegate to one implementation worker with bounded file scope. Preserve unrelated work. Keep the product runnable; update its production log. Handoff a candidate commit, changed files, commands/results and limitations. Commit only the task's files; never reset or sweep unrelated changes.
- **QA:** after the worker finishes, use a different subagent and `.agents/skills/gamex-qa/SKILL.md`. Verify the candidate commit independently against the frozen criteria. QA cannot edit product code or weaken acceptance. Record PASS / FAIL / BLOCKED and evidence in the task. A build or worker claim alone is insufficient. On failure return to BUILD, then repeat independent QA.

Preserve authored past, private discoveries, communicated knowledge, proposals, accepted versions, consent and executed outcomes as separate state. Neither UI recovery nor model dialogue may invent consent, facts or delivery success. Preserve existing saves and drafts.

For Concert use Node 24 and commands documented in `products/concert/README.md`; build generates ignored `dist/`, browser QA generates ignored screenshots/results. Prefer local controlled API fixtures. No paid model calls, deployment, new infrastructure, credentials in client code or changes to other products without explicit authorization. The current task forbids all of these. Server deduplication is best-effort, never a claim of exactly-once inference.
