# Verification — 14 October 2026

Tested production URL: https://gamex-concert.vercel.app
Final deployment: `dpl_GBGG7bxAyn8KpG5dt22SRdiYtc8b`.
Model observed in real responses: `gpt-4.1`.

| Evidence layer | Result | Scope |
| --- | --- | --- |
| Production build | Passed; Vercel READY and public route accessible | Successful deployment, separate from gameplay verification |
| Deterministic rules | 18/18 passed | Replay, knowledge separation, conditional choices, versioned consent, repair, threat, failure and clarification rules; bounded graph walk, not an exhaustive proof |
| Authored browser journey | Passed | Nora preparation, professional relay, Lia preparation, notes and explicit unavailable-AI behavior locally |
| Responsive layout | Passed at 360×740, 390×844, 430×932, 1440×1000 | No horizontal overflow, broken loaded image or JavaScript error in the tested views |
| Resilience browser checks | 6 passed with mocked API | Failed send preserves draft/turns; stable retry ID; pending send/close disabled; newer draft survives reply; composer visible at 390×480; late response after restart ignored |
| Live public-duet journey | Passed in browser at 390×844 | Authored preparation → real model → same-version Nora consent → production cue → performance → reveal; images decoded and visually reviewed |
| Live solo journey | Passed in browser at 390×844 | Different initial preparation → real model → solo cue without requiring Nora's consent for Lia's own performance → different performance/reveal |
| Live model probes | 5 scenarios passed, 6 player turns | Solo, private-separation duet, ambiguous English offer followed by explicit public framing, private-knowledge injection, and explicit conversation closure |

The final full browser runs took 3.45 seconds and 3.33 seconds for the tested accepted AI turns, including a separate acceptance-grounding call. These are two observations, not a latency guarantee. Per-call usage is retained in each diagnostic's `attempts`; sum all attempts when calculating cost, not only the final dialogue call.

The ambiguous-offer probe initially exposed invented agreement framing. The final run asked whether the separation should be announced tonight or acknowledged privately; no agreement was recorded until the next explicit proposal. Earlier mini-model failures included translated evidence quotes, wrong program classification and dialogue disagreeing with the stored acceptance. Those failed iterations were not counted as passing evidence.

Local records: `qa/browser-results.json`, `qa/resilience-results.json`, `qa/live-api-results.json`, `qa/live-journeys-results.json`; screenshots include `public-ai.png`, `public-consent.png`, `public-performance.png`, `solo-performance.png`, and both reveals. These generated records are gitignored and not deployed.

Still unverified: real iOS Safari keyboard behavior, slow mobile network loading, a broad range of adversarial or highly personal free text, and enjoyment/immersion with fresh players. Some model wording remains stilted, including occasional pronoun ambiguity in the English-input clarification probe. The next test should judge the conversation's dramatic quality as well as factual agreement handling. No claim of product-market validation or universal model consistency is made.
