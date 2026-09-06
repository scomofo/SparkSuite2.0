# SparkSuite

A daily music-practice studio for guitar, piano, ukulele, bass, drums, and vocals. Short guided loops connect warmups, new skills, review, and musical challenges with technique labs, theory tools, and a tuner.

## Development

Use Node 22.12+ (CI checks Node 22 and 24).

```sh
npm ci
npm run dev
```

`startup.sh` also starts the development server from any checkout location. The existing environment wrapper, PWA branding, and Vercel build remain in place.

## Practice and progress

- **Studio:** continue with the selected instrument, see the last seven days across the suite, switch instruments, and review recent sessions. A day counts once even if several instruments were played.
- **Today:** start or resume the instrument's guided loop. Pausing or refreshing preserves finished exercises; the current unfinished exercise restarts at its introduction. Each instrument has its own checkpoint.
- **Progress:** inspect 28 days of activity, XP, lesson mastery, marks, and the eight most recent sessions for the selected instrument.

Progress and checkpoints stay in this browser. Checkpoints expire at the next local calendar day, when the curriculum/plan changes, or when the saved progress changes. Finishing clears the checkpoint; restoring one does not award XP or mark a day complete. Timing scores measure interaction with the on-screen exercises, not microphone-based instrumental assessment.

## Guided learning

**Learn** adds 48 original lessons: eight each for guitar, piano, ukulele, bass, drums, and vocals. Every path has two lessons at each stage: foundations, beginner, intermediate, and advanced. Lessons progress from first sounds and a steady pulse to instrument-specific harmony, rhythmic control, interpretation, and an independent arrangement or performance project. These are a practical learning path, not a certification or a complete substitute for instrumental instruction.

Each lesson has an explanation, a concrete example, a three-part practice attempt, and an understanding check with feedback. Selected lessons include optional synthesized pitch references. All levels are available; prerequisites are suggestions for learners who need the earlier concepts.

- **One step:** default to a small starting task, then offer a natural stopping point. A whole-lesson option keeps the three stages together. Time estimates are guides; nothing is timed or automatically advanced.
- **Return:** save the exact lesson step and answer separately for each instrument. These checkpoints survive calendar-day changes. Studio and Today point back to the current learning step.
- **Review:** offer one previously explored idea after 1, 3, 7, then 14 days. Early or repeated same-day reviews do not advance the schedule. New lessons stay available, and missed review dates remove nothing.
- **Honest progress:** a milestone means the learner reported an attempt and answered the check. It does not measure instrumental proficiency, award timing XP, or complete a daily practice loop. Existing practice data remains unchanged in its own storage.
- **Storage:** learning uses `sparksuite.learning.v1` in this browser. Corrupt entries are sanitized, unknown lessons are ignored, and failed saves are reported. It does not sync across devices.

### Matching lesson practice

The first four lessons for each instrument now open one of **24 guided exercises** from the lesson's **Try it** step. The existing technique route accepts `?lesson=<curriculum-id>` and selects the matching instrument, notes, rhythm, chord diagrams, and short practice goal. For example, `?lesson=guitar-em-to-g` opens four bars of Em → G with a strum on each beat 1 and preparation counts between changes. General technique-lab links continue to work.

- Choose 40–100 BPM and notes with a click, click only, or a visual-only guide. Each pass has a four-count lead-in and stops automatically. Stop, Escape, leaving the page, and hiding the tab cancel playback. Returning never starts it automatically.
- Tempo, guide choice, and the practice check-in save with the lesson across reloads, days, and instrument changes. Studio and Today resume an unfinished guided exercise directly. Playback position is intentionally restarted from the count-in after a pause.
- The learner explicitly records an attempt and chooses a reflection. Either reflection allows continuing to the lesson's understanding check; retry advice is specific to the exercise. Playback alone does not record an attempt, complete a lesson, award XP, or alter review dates.
- Synthesized pitch/rhythm guides and reusable chord diagrams, keyboards, bass necks, and drum pads support practice with an instrument. No microphone is requested and no instrumental accuracy is inferred. Written practice remains available for all 48 lessons; later lessons do not yet have matched interactive exercises.

The short stages, visible next action, and recoverable place apply [W3C cognitive accessibility guidance](https://www.w3.org/TR/coga-usable/). They are design choices to support attention and memory; actual learner usability still needs feedback from adults with ADHD.

## Verification

```sh
npm test
npm run build
npm run typecheck
```

CI runs these checks on pull requests and main. Node 24 also checks desktop, 390px mobile, and 320px layouts, keyboard interaction, exercise recovery through reloads and instrument switching, and single session finalization against development and production builds. Screenshots and verdicts are attached as the `browser-evidence` workflow artifact.

The browser checks require Playwright Chromium. `scripts/browser-smoke.mjs`, `scripts/studio-browser.mjs`, `scripts/learning-browser.mjs`, and `scripts/lesson-practice-browser.mjs` save their evidence under `/workspace/screenshots` as required by the project's QA workflow. The learning checks cover pacing, feedback, exact-step recovery, all six instruments, advanced access, review scheduling, and failed saves on both development and production builds. Guided-practice checks also cover all 24 exercise links, bounded playback, tempo and reflection recovery, the return to the understanding check, and legacy/invalid technique links.
