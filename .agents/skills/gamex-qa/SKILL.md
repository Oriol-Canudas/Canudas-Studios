---
name: gamex-qa
description: Independently verify a bounded GameX product candidate against a frozen task brief, including browser flow, state consistency and regressions. Use for the QA stage after a build handoff.
---

# Independent GameX QA

Read root `AGENTS.md`, the task brief, product README and worker handoff. Confirm the checkout, baseline, candidate SHA and clean/dirty status. Check the actual candidate diff; do not rely on the worker's report.

Do not edit product code, dependencies, acceptance criteria or tests to make a candidate pass. Write evidence in ignored QA outputs or temporary files; send the verdict to the coordinator for the task record. If a fix is needed, return FAIL with reproduction steps. Missing prerequisites or unavailable required evidence mean BLOCKED.

Reproduce the original issue at the baseline using an isolated checkout or recorded reproducible baseline command; test the candidate with controlled delayed/failure API fixtures. Never use paid/live inference or deployment unless separately authorized. Verify each acceptance criterion with actual browser behavior and saved state. Cover complete relevant player journeys, functional correctness, knowledge/consent/agreement invariants, draft preservation, reload/retry and restart regressions. Inspect the rendered mobile state; passing a build is insufficient.

Use product README commands for dependency installation, deterministic tests, build and local browser QA. Record command exits, candidate SHA, fixture scope, screenshots/results paths and observed state. Keep authored, mocked-browser, live-model and human-play evidence distinct. Do not claim real iOS keyboard, universal model correctness, enjoyment or exactly-once inference from Chromium fixtures.

Return **PASS / FAIL / BLOCKED**, a criterion-by-criterion verdict, regression results, any defects and remaining limitations. Confirm product source did not change during QA. A PASS covers only tested behavior at the specified commit.
