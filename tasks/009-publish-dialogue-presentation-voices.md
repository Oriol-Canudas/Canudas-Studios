# 009 — Publish the accepted dialogue, presentation and introduction voices

## Scope and authorization — 16 October 2026
Oriol explicitly requested the latest playable link and deployment to Vercel rather than local-only access. Publish the already independently accepted products/concert bytes; no implementation, generation, inference, merge or other-product changes. Checkout outputs/concert-build, branch codex/concert-encore-v05, clean HEAD4ace2eeee2765c8918b15341ef9121e8e6dc51c6. Product bytes equal task008 tested candidate b9175958f4f0d70a76791660fdf550c1a842eb9d; the intervening commit is documentation only.

## Release
62/62 Node tests and production build passed before publication. Pushed14 accepted commits on the existing branch. Confirmed the existing linked Vercel project ocanudas-7641/gamex-concert (prj_pmy012EZyymfl5MvxHQrIRhzYz3R), and inspected the prior live deployment before replacing it. Production deploy4ace2ee is READY: dpl_9bivHTBy9BqvjqxZLcjwSC5BdFU2, https://gamex-concert-3gx7o7o79-ocanudas-7641.vercel.app, public alias https://gamex-concert.vercel.app/?v=voices-20261016. Prior immutable deployment https://gamex-concert-gvueggl2s-ocanudas-7641.vercel.app remains available. Git auto-deploy was not configured or changed.

## Acceptance and published verification
Anonymous public alias returns200, with no authentication redirect. Both served JS/CSS assets match the locally built bytes. All11 served intro MP3s return audio/mpeg and match the approved manifest's size and SHA256. Actual API metadata reports available:true, model:gpt-4.1, build:concert-encore-v05; actual signed session start succeeds at turn0 without a provider call. No signed token or secret is stored in evidence.

Public browser suites use isolated contexts and intercept every negotiation API request: intro-voice (actual public MP3 playback, controls, mapping, cancellation and failure recovery), scenes (all11 intro beats and19 states at four viewports, actual consent/cue/reveal controls with seeded agreement), dialogue (11 authored journeys) and interrupted-send (explicit retry and draft/consent preservation). Verdicts and screenshots are retained in outputs/perspectives/concert-publication-voices-20261016. Coordinator inspected the actual public mobile intro and Nora dialogue renders.

First instrumented voice attempt timed out waiting for playback. A separate uninstrumented public probe returned200 for music/crowd/voice, completed the first line and recorded no console/page/network errors. One repeat of the unchanged instrumented suite passed. No product fix was made and the initial timeout's cause is unestablished; retain this fact rather than representing the first run as PASS.

## Limits and handoff
No paid inference or new generation. Previous independent technical QA remains the product gate; this task verifies publication. Physical iOS, subjective full-cast listening and current live-model conversation quality are not established. Existing saves remain; Start again intentionally restarts a device's game. Enter backstage then Sound on to hear the introduction. Recorded voices apply only to the introduction.

Final published verification: all four browser suites exited0, PASS. Eleven authored dialogue journeys; all required scene viewports; actual voice mapping/progress/pause/failure recovery; interrupted-send recovery. Durable sanitized publication-check.json records these separately from provider-model and physical-iOS limitations.
