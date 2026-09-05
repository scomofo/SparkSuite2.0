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

## Verification

```sh
npm test
npm run build
npm run typecheck
```

CI runs these checks on pull requests and main. Node 24 also checks desktop, 390px mobile, and 320px layouts, keyboard interaction, exercise recovery through reloads and instrument switching, and single session finalization against development and production builds. Screenshots and verdicts are attached as the `browser-evidence` workflow artifact.

The browser checks require Playwright Chromium. `scripts/browser-smoke.mjs` and `scripts/studio-browser.mjs` save their evidence under `/workspace/screenshots` as required by the project's QA workflow.
