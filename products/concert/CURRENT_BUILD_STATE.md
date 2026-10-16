# Concert prototype — delivery state

## Current release — full-height opening and dialogue tint, 16 October 2026

Live: https://gamex-concert.vercel.app/?v=full-screen-opening-20261016. Opening artwork fills the available viewport behind compact overlaid menus, with larger speaker portraits (112×132 mobile,128×150 desktop,80×94 compact), readable captions and prominent Backstage navigation. Compact captions scroll independently. Existing authored character speech is subtly blue-grey; player replies remain plum. Story, voices/crowd timing, saves, drafts, agreement/consent and the portrait AI layout are unchanged. The optional goal field remains removed.

Candidate `26a78cfd1dfe718a9b54e207d253c50316d038f5`, independent QA PASS all six task018 criteria. Build and five browser suites passed, including all11 beats×six sizes and extra390×660/668→844/rotation checks. Baseline/candidate renders inspected; body tint contrast11.89:1. Published commit `5284687b9b2796252e0f19ce4bfece9b2db8b392`, deployment `dpl_3afa129FtyHQxRmHdL3xmUMNVt22`, Production READY in the same gamex-concert project. Immutable: https://gamex-concert-bn6idll3o-ocanudas-7641.vercel.app.

Public verification PASS: anonymous200; client JS/CSS hashes match the tested build; microphone policy unchanged; non-inferential metadata available. Isolated public opening/navigation/tint and dynamic available-height checks passed with API intercepted. No paid calls or other-product changes. Durable evidence: `../../../perspectives/concert-opening-release-20261016/`. Physical iPhone/Safari remains unverified. Full-portrait translucent authored dialogue and task017 Lia→Nora→cue/expanded endings remain design previews only and are not in this release.

## Previous release — simpler Lia briefing, 16 October 2026

Live: https://gamex-concert.vercel.app/?v=goal-removed-20261016. Removed the optional personal-goal input before Lia; existing saved goals remain in history and drafts are preserved. No other runtime change. Candidate93aeb13 independently passed all task016 criteria, build/scenes/portrait and fresh/legacy error/retry/reload probes. Deployed e5e2c28 as dpl_A11JPjfftvUb37ZkJ1v6SPjy3bjt, READY; immutable https://gamex-concert-f6xgqatm2-ocanudas-7641.vercel.app. Public asset identity and independent public briefing probe PASS with controlled fixtures; no paid calls. Evidence: ../../../perspectives/concert-goal-removal-20261016/. Physical iOS/live AI remain unverified. Task017 agreement/payoff flow is a proposal only.

## Previous release — portrait conversation, 16 October 2026

Live: https://gamex-concert.vercel.app/?v=portrait-conversation-20261016

Published to the existing `ocanudas-7641/gamex-concert` project. Deployment `dpl_4z1DfrP9vERwRXPs5kU78nZewxmv` is Production READY; immutable URL https://gamex-concert-rgov0d77h-ocanudas-7641.vercel.app. Deployed `ff2c304`; runtime matches independently tested candidate `131a0418823370ed26ed27a9c675981d8299af1a`. Branch `codex/concert-encore-v05`. No merge or other-product change. Previous immutable production: https://gamex-concert-b3l8ptmbw-ocanudas-7641.vercel.app.

Lia's final conversation now has one continuous mood portrait behind translucent dialogue and controls. A compact header keeps actual turns, Review & end and options available. Latest Lia speech and following interruptions have clear attribution; earlier messages/private goal are on demand. Empty offer panel removed. Real offers still lead through review and Nora confirmation before the separate cue.

Talk → Stop → editable review → explicit Send, or Type instead. The text editor appears only in review/type mode; Back to Talk preserves words and Review saved draft makes them discoverable after reload. Suggestions preview before explicit append. Notes, sound/volume and restart are in the options menu. Existing speech provider, microphone lifecycle, authored voices, soundtrack, story, negotiation/consent rules and save versions are unchanged. Refresh the live link and continue the existing save; no restart required.

Independent QA PASS on all six frozen criteria: 81 Node tests, build, eight browser suites and separate focus/draft/suggestion/unsupported-recording/long-reply/retry probes. Rendered 390x844, 390x480, 320x640 and 1440x1000 inspected. Synthetic 430px/360px visible windows retain 227px/157px reading space, with natural text heights and stable controls. Parent also replayed the full authored-to-AI-to-Nora-to-performance path and inspected read/accepted renders.

Published verification PASS: anonymous HTTP 200, both JS/CSS hashes equal the tested build, API metadata available, unchanged microphone policy. Actual public UI journey and published speech-input suite pass with controlled API and microphone fixtures, including native Chromium fake-device capture. No paid calls or new services. Evidence: `../../../perspectives/concert-publication-portrait-20261016/`, including independent verdict, published assets, parent journey and speech results. Physical iPhone/Safari and live provider recognition/AI semantics remain unverified.

## Previous release — voice-first controls and crowd interlude

Updated:16 October2026. Encore v05 now has voice-first Lia controls, prominent Backstage navigation and the requested crowd interlude, published to Production. Existing story, authored voices, agreements and saves remain intact.

Live: https://gamex-concert.vercel.app/?v=talk-and-encore-20261016
Vercel: ocanudas-7641/gamex-concert (`prj_pmy012EZyymfl5MvxHQrIRhzYz3R`).
Deployment: `dpl_91yHPixEH5YkDdyYxZSDsDhdtJtL` — Production READY.
Immutable URL: https://gamex-concert-b3l8ptmbw-ocanudas-7641.vercel.app
Deployed commit: `68d2cb4f12be70d099699421eba6fa0a8e241af2`; product bytes match independently tested `34809cb1b9c6e38b7cce2e0fc4a12cf48ba54c8b`. Branch `codex/concert-encore-v05`; app `products/concert`. No merge or other-product change. Git auto-deploy remains unconfigured. Previous immutable production: https://gamex-concert-g1ddhetu7-ocanudas-7641.vercel.app.

Lia's conversation now prioritizes a central104px round Talk button. Tap once to record, then Stop; no holding required. Recording shows a live microphone-level bar/ring, elapsed time,45-second maximum and Cancel. The text area remains below as a secondary route. Recognized words remain editable before explicit Send; no automatic keyboard focus or send. Existing draft text is preserved. Microphone cleanup, temporary soundtrack muting, retries, session and turn rules are unchanged. The meter is transient amplitude feedback, not a speech-quality score, and is never saved. AI replies remain text; only the introduction has recorded character voices.

In compact typing, the Talk/Stop control is44px and the transcript keeps187px/117px at synthetic430px/360px visible windows. The normal layout returns on keyboard dismissal. No save migration/reset is needed.

Backstage/Return backstage are opaque gold-bordered48px buttons with16px bold labels. The existing crowd clip plays immediately after Nora's “About what? You've already told them I'm not coming.” and finishes before Bruno's “They're calling for the encore. Are you both ready?” Caption time, pause/resume offsets, manual skip, mute and cancellation remain intact. No new media was generated.

Independent QA: all9 combined criteria (tasks013/014) PASS;81 Node tests, build and six browser suites: intro-voice, opening, speech-input, keyboard, interrupted-send and agreement-exit. Actual WebAudio verified the8-second interlude and four interruption/resume paths;15 Backstage checks across three viewports preserved discoveries, accepted agreement and draft. Coordinator reviewed scoped diffs and mobile/desktop normal, recording, review and compact renders. Evidence: `../../../perspectives/concert-publication-crowd-nav-20261016/independent-qa/results.json`.

Published verification: anonymous200, both client asset hashes equal the tested build, unchanged microphone=(self) policy and available AI metadata. Actual public audio: Nora ends5.536s → crowd starts5.536s, ends13.536s → Bruno starts13.605s. Actual public Lia/Nora Backstage clicks preserve state. Public speech-input and keyboard suites PASS, including native Chrome fake-device recording, controlled MP4/WebM/API review/edit/Send, microphone cleanup and soundtrack restoration. Coordinator inspected public recording and compact screenshots. No paid provider calls. The first audio probe waited only150ms after the caption; it was corrected to await actual Bruno audio start before applying unchanged sequence assertions. No product change was required.

Limits: physical iPhone/Safari microphone/keyboard/autoplay behavior, real recognition accuracy/latency and live-model semantics remain unverified. Prior15–19px transient cold-font scroll residual remains documented; settled layout passes. Per-warm-instance transcription guards are not a global quota or exactly-once guarantee.

For mobile play: refresh the live link and continue the existing save. Tap Talk in Lia's final conversation, Stop, review/edit, then Send. Restart only if you want to hear the introduction's new crowd cue. Earlier local acceptance statements below are historical and superseded by this release.

## Local dialogue amendments — task005

Local candidate: `4b9e2850a39c2b54b69b75f9a879a0be9ed49bbc`; public deployment metadata above remains unchanged.27 of44 initial authored question/answer pairs tightened, with privacy-aware confession responses, explicit Lia admission before relay, complete visible offer terms, contextual returns and exact chronology intervention. All15 nodes and45 action IDs remain; protected privacy responses take precedence over pending acknowledgment, while genuine older event lists retain a guarded replay path. Existing stored transcript text is preserved.

Independent QA: PASS on all8 frozen criteria after fixing a Lia-first menu-priority defect found by the separate QA agent.55 Node tests, build,8 controlled browser suites (11 dialogue and11 encore journeys), plus separate source/state/legacy and3viewport probes PASS. Parent inspected diff, replayed all45 baseline actions and personally played the corrected authored chain through negotiation briefing, with all API calls intercepted. No paid generation, push or deployment. Story facts, opening, AI context/prompt, negotiation/consent logic, four outcomes, recovery, saves, media, styles and dependencies remain unchanged.

Play local: http://127.0.0.1:8810/?v=dialogue-005 (static preview, no live AI). Use Start again for revised initial exchanges; older transcripts keep their original wording. Task/evidence: `../../tasks/005-authored-dialogue-engagement.md`; independent `/tmp/concert-dialogue-independent-reqa/independent-qa.json`; parent `/tmp/concert-dialogue-parent-play.json`. Full amended tree is in the03-CONCERT workspace `reviews/concert-v05-amended-dialogue-tree-2026-10-16.md`. Engagement is an editorial judgment pending fresh human play, not established by fixture PASS. The new choice-scene image is still a separate asset.

## Local cover repair — task006

Candidate `8d37bc3bf7988b4d4eac83873799c44f0c3f9539`, independently PASS. Desktop cover now shows one unified artwork/title instead of repeating the decorative aside beside the playable cover. Cover-only desktop CSS keeps copy/CTA readable; task006 left mobile and non-cover layouts unchanged; task007 below subsequently corrects the story-screen presentation. Build plus cover/browser/opening/dialogue suites pass; independent desktop906×1058/1440×1000 and mobile390×844/390×480 inspection, matching mobile geometry and four actual entry journeys pass. App/story/state/saves/assets/dependencies unchanged. See `../../tasks/006-single-desktop-cover.md`, `/tmp/concert-cover-independent-qa/independent-qa.json`.

Play local: http://127.0.0.1:8810/?v=cover-006 . Refresh suffices for the cover fix; no reset needed. Public deployment remains the release listed above. No paid calls, push or deployment.

## Local story presentation correction — task007

Task007 product candidate `3d75602dbe0bc68626fab19b78bd908d331b5259`, independent QA PASS. Task006 fixed only the cover; user follow-up correctly showed the promotional cover/title sidebar still competing with the intro. It is now removed from opening/hub/brief/review/ending/reveal. These screens use one coherent stage with bounded reading/caption/control widths. Desktop dialogue and AI retain one functional companion portrait; repeated in-stage dialogue portrait removed, Backstage/name/role kept separate. Mobile/cover and all story/state/consent/save/media/backend code remain unchanged.

Build and six focused cover/scenes/opening/dialogue/agreement/encore suites independently PASS;19 scene states per viewport, all11 intro beats across970×1067/1440×1000/390×844/390×480. Actual fixture-backed Nora confirmation→performance→reveal and one-character portrait/readability checks pass. Parent replayed and inspected the exact intro screenshot moment, now with no sidebar. Evidence/task: `../../tasks/007-remove-story-marketing-sidebar.md`, `/tmp/concert-scenes-independent-qa/independent-qa.json`, `/tmp/concert-intro-single-scene.{json,png}`.

Refresh local http://127.0.0.1:8810/?v=scenes-007 ; no reset needed. Public production remains as listed above; no paid calls/push/deployment. Controlled Chromium evidence, not physical iOS or real-model validation.

## Local full-cast intro — task008

Candidate `b9175958f4f0d70a76791660fdf550c1a842eb9d`, independently QA PASS on all7 technical criteria. Eleven local approved MP3s give Nora, Lia and Bruno distinct voices plus a narrator for context/booking. Existing sound controls remain opt-in; shared music/voice volume, rapid score duck, offset-preserving pause/notes/restart-overlay/hidden interruption, cancellation on navigation/mute/exit and recoverable missing/corrupt/timeout audio. Captions, original silent pacing, authored facts, knowledge, agreements, consent and saves/drafts are preserved. Runtime playback uses no paid service.

The user approved52 sample credits, liked the four samples, then explicitly approved116 more credits and local integration. All11 completed once; total168 reported Magnific credits, no regeneration. Approved samples0/3/6/8 reused verbatim. Source archive/provenance/hash/level checks: user workspace assets/intro-voices-v1.

Independent62/62 Node tests, production build and7 offline browser suites PASS: intro-voice, opening, interrupted-send, dialogue, agreement-exit, encore, scenes. Additional separate probes completed the entire voiced intro in144.6s with11 naturally ended nonoverlapping sources, and silent intro in144.4s with zero audio requests/contexts. Actual voice RMS, retained0.416s pause offset, score duck near0.12, volume-zero gain below0.001, overlays/simulated visibility, late-load-after-exit cancellation, automatic404 caption fallback and retry recovery PASS. Rendered1440×1000/970×1067/390×844/390×480 and short-mobile failure inspected. Product source unchanged throughout QA; coordinator then recorded docs only.

Parent checked actual diff, inspected short-mobile normal/failure screenshots and independently verified the8810 client bundle plus all11 served asset hashes against approved originals without touching user storage or requesting the API. Task: ../../tasks/008-full-cast-intro-voices.md. Independent report: /tmp/concert-voices-independent-qa/independent-qa.json; durable copied evidence in user workspace reviews/concert-voices-qa-2026-10-16. Parent served-preview-validation.json is in the source archive.

Play local: http://127.0.0.1:8810/?v=voices-008 . Refresh to load the new client. From an existing game, Start again restarts that session; then Enter backstage and turn Sound on. Existing user8810 save was preserved. This static local preview has no live AI backend; regression negotiation was controlled fixtures. Public deployment remains unchanged as recorded above; no push/deployment. Limits: metadata/hash/audio-signal checks are not a full spoken-word listening review, physical iOS autoplay/background behavior is unverified, and no live-model semantics retested.

## Readable scene directions and cast order — task010

Candidate b3c0c0991876571df7c7f0913d8c6fa8c4760b15 accepted by separate QA: all5 criteria PASS,62 Node tests, build and opening/scenes/intro-voice suites. Unvoiced opening directions now18px normal/high-contrast on an opaque dark block with gold edge. Menu order Lia,Nora,then eligible Bruno. All15 cue/viewport combinations and actual contact-state navigation pass at390x844,390x480,1440x1000. No story, timing, voice, eligibility, state, API or save changes. Published and checked on the production alias; current release metadata is above. Evidence: task010 and ../../../perspectives/concert-publication-cues-20261016/. Physical iOS and subjective readability remain human checks.

## Current product

Main set complete → both artists backstage → Nora sees a phone booking confirmation excluding her from the next tour → refuses the customary shared encore. Lia fronts the band; Nora co-writes and co-sings substantial repertoire, a core creative member. One shared song, no competing solo premiere or broadcast deadline.

Reactive authored preparation, adaptive questions/statements and context-aware returns lead to a bounded Lia negotiation. Discovery, permission and actual delivery stay distinct. Love is optional and confidential; professional resolution is possible without disclosure. Lia cannot rewrite the booked tour or invent Nora consent. Term grounding and artist willingness are distinct. Withdrawal revokes consent/version; new conditions require same-version confirmation before a separate player cue. Four outcomes: shared encore with public next-tour acknowledgment; private acknowledgment, physical space and joint statement; band with Lia without Nora; no encore.

English throughout. Existing artwork/music preserved. Mobile speaker/reply/continuation/choice/history hierarchy clarified. Previous two-song saves retained separately, exportable with tokens stripped, never reinterpreted as the new past. Interrupted-send recovery preserves newer drafts and explicit original-request retry.

## Verification

Different BUILD and QA agents. First QA found invented Nora notes and stale consent after explicit Lia refusal; returned to BUILD and independently rechecked. Final all10 frozen criteria PASS.43 Node tests, build, seven offline browser suites including11 encore journeys, plus independent adversarial probes PASS. Rendered390x480/390x844 and1440x1000 inspected.

After publication, eleven encore journeys and interrupted-send suite PASS against public alias, all negotiation calls intercepted. Actual server metadata reports `concert-encore-v05`, AI available; non-inferential signed-session start returns200. No paid provider calls. This verifies server wiring and client behavior, not real-model semantic reliability, physical iOS or enjoyment.

Task: ../../tasks/004-encore-v05.md. Independent evidence: /tmp/concert-independent-reqa-20261016/. Published evidence: /tmp/concert-published-encore-20261016/. Durable delivery summary: ../../../perspectives/concert-delivery-2026-10-16.json.

Next: human mobile playtest. Does preparation create a clear objective, do choices visibly return through others, does negotiating Lia feel meaningful, and is the encore trade-off understandable? Do not infer those answers from fixtures.

## Superseded delivery history

The following dated records describe earlier releases, not the current story or proof of current live-model behavior. Previous production remains available at https://gamex-concert-ltoi56xx3-ocanudas-7641.vercel.app.

# Historical delivery state

Updated: 2026-10-15. Task 002 independently verified and published.

Live: https://gamex-concert.vercel.app
Vercel project: `ocanudas-7641/gamex-concert`, `prj_pmy012EZyymfl5MvxHQrIRhzYz3R`.
Current deployment: `dpl_BjuL3p4mZeaBy7c2uTgrtBwq6HRi` — production READY.
Deployment URL: https://gamex-concert-ltoi56xx3-ocanudas-7641.vercel.app
Deployed commit: `e2da375` (product code identical to independently verified `6441d1d8ca27aacf94ab71e5962ae5e6975f29bd`).
Branch: `codex/concert-immersion-english`. App directory: `products/concert`.
Git auto-deployment is not configured; CLI publication is separate from Git push. Other products unchanged.

## Current accepted change — two different songs and scene taps

Bruno explicitly distinguishes Lia’s new solo song from the duet she and Nora wrote together. Authored dialogue, questions, notes, programmes, endings and Lia instructions use consistent terminology. Nora’s credit refers to their shared songs, not Lia’s new solo song. Existing AI history is preserved.

Tap the non-interactive opening scene to advance one beat, including while paused. Last tap reaches backstage. Controls, text selection and drag gestures do not also advance; manual advancement resets reading time. Existing automatic pacing and game state remain intact.

**Independent QA: PASS** on all seven acceptance criteria, 25/25 Node tests, build and five offline browser suites. Baseline tap defect independently reproduced. Published opening suite also PASS with intercepted API, including 390x844 and 390x480. Published Lia line and cost question verified on mobile; no model calls. Evidence: task `../../tasks/002-opening-clarity-and-tap.md`, `/tmp/concert-published-002.json`, `/tmp/concert-published-lia-002.png`, ignored `qa/opening-results.json` and screenshots. Real-model wording adherence and physical iOS behavior were not retested.

## Previous accepted change — interrupted-send recovery

The three task commits (`305d84f`, `a913c77`, `ac278a0`) were pushed on the existing branch without merging. The accepted minimal workflow is DESIGN → one bounded BUILD worker → a different independent QA agent. Root `AGENTS.md`, `.agents/skills/gamex-qa/SKILL.md` and `tasks/001-recover-interrupted-send.md` hold its instructions and record.

Client saves the exact send request before dispatch. Reload replaces orphaned Sending with delivery unconfirmed, preserves the newer draft and agreement state, and offers an explicit original-envelope retry. No automatic resend; one player bubble/reply/turn after successful retry. Authored content, engine, server and other products are unchanged.

**Verification: PASS.** Independent QA at `a913c776`: 25 Node tests, build and four offline browser suites. After production publication of `ac278a0`, controlled API-fixture checks passed on https://gamex-concert.vercel.app (HTTP 200): actual delayed send → reload → unconfirmed delivery → explicit retry, with newer draft and accepted agreement/consent preserved; subsequent reload passive. Existing Nora-confirmation-to-performance regression also passed on production at 655×1050, 390×844 and 390×480. No JS errors or horizontal overflow. Published recovery and performance screenshots were personally inspected.

Commands/evidence: `node /tmp/concert-published-20261015/verify.cjs`; `QA_URL=https://gamex-concert.vercel.app QA_CHROME='/Applications/Google Chrome.app/Contents/MacOS/Google Chrome' node qa/agreement-exit.cjs`. Report and screenshots: `/tmp/concert-published-20261015/`; existing regression results: ignored `qa/agreement-exit-results.json`. Full handoff, IDs, URLs, acceptance and evidence are in `../../tasks/001-recover-interrupted-send.md`.

All browser API calls were intercepted by fixtures; no paid model calls. This verifies published client behavior, not live-model inference, real iOS keyboard or exactly-once processing. Existing expiry/retry limits remain; no backend or scale infrastructure added. The subsequent publication-record commit changes documentation only, with product bytes identical to this deployed commit.

The prior design-only handoff to Claude is superseded for this concert implementation. The authored case and the interaction intent came from the completed concert v03 design packet; this build does not change the priority of GameX products or approved strategy.

Implemented: cinematic opening; Nora-first/Lia-first preparation; conditional authored choices; sourced character requests; private notes and chronology contradiction; bounded live Lia negotiation; current-version confirmations and repairs; three agreement packages, optional encore, no-agreement ending; performance, causal reveal, local save/export; original optional ambience.

Verification records are local in `qa/`: deterministic rules, authored browser journey, mock failure/retry checks, live-model probes, and rendered public-duet/solo journeys. Generated records distinguish mocks from real OpenAI calls. Final delivery evidence is summarized in `VERIFICATION.md`.

Next acceptance step: Oriol plays without reading the implementation or solution routes. Evaluate whether preparation creates a clear personal objective, whether an intervention feels causally acknowledged, and whether the final cost is understandable. Improve resistance, context or pacing from that observation before extending the engine or adding another case.

## Prior delivery history — 2026-10-14

The following is historical; the current accepted change and deployment above are authoritative.

English immersion revision: `concert-v0.2-en`. Full case and UI translated; slower controllable opening; real audio-state checking and audible ambience; uncropped authored portraits; large Lia presence and four reactive emotional images; blonde Nora across portraits and shared scenes. User requested these changes after playing v0.1. Baseline preserved at commit `bb3cd01` and local `qa/baseline-v01/`.

Follow-up: user rejected the synthesized sound quality and requested readable context copy, larger speaker portraits and role clarity. Deployed generated crowd ambience, scene ducking, volume control, larger context type and opening portraits, and explicit stage-manager role for Bruno. Audio technical checks are recorded in `qa/audio-repair-results.json`; perceived quality and physical iPhone playback remain human checks.

Audio review pending: Oriol also rejected the generated crowd-only sound. New agreed direction is soft cinematic music with occasional distant cheering encouraging the artists back onstage. Audio is now OFF by default with a fresh sound preference key. A separate 30-second music-and-cheer preview has been prepared for listening review before installation; it is not the active soundtrack.

Music is now integrated at the user’s explicit request: 60-second cinematic underscore plus separate, stronger eight-second audience encore call. Sound on enables both. No continuous crowd-only bed is used. Opening now spells out one final performance: Lia premieres a new song alone OR both artists sing their best-known song together. The new score is installed; prior preview-pending notes above are historical.

Conversation flow repair: prominent primary exit after Lia acceptance, secondary exit at any other time; both lead to agreement review before execution. Sending with Enter clears the input instantly and shows a pending bubble; failed send recovery and preservation of any newly typed draft remain supported.
