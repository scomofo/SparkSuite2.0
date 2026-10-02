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

Follow-up validation: 204 application tests pass, with template checks; typecheck, lint and build pass. The shared state/playback logic has component coverage in Harmony (saved note/step and instrument slots, 17 onsets across 16 beats, one-bar/slower options, collapse stop, mute and failed storage). Desktop and mobile render checks on dev and production show content without overflow or uncaught page errors; external resource loading errors remain in this sandbox. The CLI-based interactive regression replaces handwritten Playwright. Its execution is blocked here because agent-browser cannot bind its daemon socket (Operation not permitted); no successful CLI interaction run is claimed.
