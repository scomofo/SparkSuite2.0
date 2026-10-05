# Adult learning curriculum pass

Designed for an adult learner who benefits from short tasks, an obvious next action, optional detail, and recoverable progress. This is a software and editorial pass, not clinical validation or certification of instrumental skill.

## SparkSuite

- Removed repeated instrument-wide explanation preambles; extra practical context and terminology can be expanded when useful.
- Renamed the final learner-facing level Creative application without changing internal IDs.
- Revisited lessons open at recall. Saved first responses and explanation use distinguish independent recall from corrected completion; assisted due reviews remain due the next day without removing completion.
- Added authored alternate checks for the first lesson on all ten instruments and guitar pulse; other review questions rotate option order. A full question bank for all 80 lessons remains an opportunity.
- Added an optional one-bar attempt with the reference stopped. Existing advanced projects and musical milestones remain available.
- Fixed literal backslash-n tokens in the Learn route and reconciled the content handoff documentation.

Validation: npm test (203 application tests plus template tests), typecheck, lint, and production build pass. The production browser regression covers an alternate review question, wrong-answer correction, reload persistence, preserved completion, and assisted spacing with no uncaught runtime errors. Real instrument performance was not assessed.

## Shared phrase follow-up

Added an optional Hear / Try / Use study, “A pulse with room to breathe”: four bars of 4/4 at 72 bpm (48 bpm slower option), with paired eighth-note attacks in bars 2 and 4 and a final quarter rest. Both apps use the same onset pattern. Harmony includes it in the pulse lesson; SparkSuite offers it on the Learn overview with instructions for all ten instruments. Listening, one-bar practice, and hidden-count attempts are valid choices; there is no timed requirement.

Selected step and a 240-character optional observation save locally in each app. They do not sync between apps or record audio, and do not award mastery. Stop, collapse, tab hiding and unmount cancel playback. Unavailable storage/audio produces a readable recovery message.

Legacy unfinished checks backfill firstAnswer from an existing valid answer so corrected responses cannot gain independent recall credit.

### Browser acceptance completed — 2026-10-05 UTC

Baseline: `main` at `c0d54ef5053a03f7b0504a8dfe2d470a5376c4de`. Validated implementation: `4ac15ace970dcc0f38ebbabb1d80fba0de2a1ec0` (the following documentation commit changes no executable code). Linux, Node 24.19.0, Playwright 1.62.1, headless Chromium 153.0.8010.0.

The previous follow-up could not run its interactive CLI regression because `agent-browser` could not bind its daemon socket. This environment has no `agent-browser` binary, so the Spark branch of the existing command now uses Playwright directly; the Harmony CLI branch is retained. A preinstalled Chromium executable was selected with `PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH` because the browser download returned an invalid archive. No app storage or audio implementation was mocked in the primary interaction flow.

Passed against both the development server and the production build:

- A fresh browser context opens the shared study, selects Try by keyboard, writes an observation, saves, and reloads. The selected step and exact observation return without autoplay.
- Hear / Stop schedules the 17 attacks in four bars at 72 bpm. One-bar practice schedules bar 2's five attacks. Slower mode schedules at 48 bpm; its five-second bar finishes automatically within the seven-second acceptance limit.
- Collapse, changing speed, changing instrument, and entering a lesson disconnect the native audio run. Reopening the study does not resume playback.
- Use persists across reload; Hide / Show count works. Guitar and piano retain separate steps and observations across instrument changes and reloads.
- Shared-phrase work awards no lesson completion, timing XP, or daily completion. Injected storage failure leaves the note available to copy, and injected missing AudioContext shows the written-count recovery message. A synthetic tab-hidden event also cancels native playback; this is lifecycle coverage, not a manual OS tab-switch trial.
- The previous seeded legacy-review check remains in a separate context: wrong answers cannot finish; the corrected answer survives reload; original completion remains; assisted review earns no independent recall credit and is due the following day.
- Desktop (1280 px) and 390 px screenshots were inspected. Both render without horizontal overflow or uncaught page errors.

The run exposed a real audio defect: the synthesizer's fixed 1.5-second note tails extended into the written final quarter rest. Shared-phrase notes now release before the next attack/rest; unrelated piano callers keep their default duration. A separate Chromium `OfflineAudioContext` regression renders the actual scheduler and synth at both tempos, in full-phrase and one-bar modes. All 17/five attacks produce nonzero samples at the expected times, and the final rest/end has an exactly zero waveform peak. Before the fix, the full-phrase rest peaks were approximately 0.00680 at 72 bpm and 0.00108 at 48 bpm.

Reproduction (with the appropriate server already running):

```sh
node scripts/adult-curriculum-browser.mjs spark http://127.0.0.1:8083 dev
node scripts/adult-curriculum-browser.mjs spark http://127.0.0.1:8081 built
node scripts/shared-phrase-audio-browser.mjs
```

The Node 24 CI job now runs these checks and uploads their JSON verdicts, screenshots, and Playwright traces in `browser-evidence`. Locally, `npm test` passed 195 template/script tests and 204 application tests; typecheck, lint, and production build passed. The shared-phrase scripts report no application console errors or uncaught runtime errors.

Remaining environment boundary: the external Grok branding script returned `net::ERR_EMPTY_RESPONSE`. Its exact URL/error is retained separately in interaction evidence. The unmodified generic render smoke therefore exits 2 on both dev and production; its screenshots have content and no overflow/page errors, and production does not diverge from the dev baseline. This is not claimed as a fully clean global smoke run. This acceptance covers SparkSuite software behavior and native synthesized samples, not human listening, physical instrument performance, or a new Harmony Knight acceptance run.

