# Adding an instrument: ordered checklist

Follow this order. Each step names the file, what to add, and how to verify it. Steps 1 to 4 make the app compile with an empty path; steps 5 to 8 add the content; steps 9 to 12 close the loop on tests, browser checks, and docs.

Run these after each step group:

```sh
npm run typecheck
npm test
```

## 1. Instrument definition

File: `src/lib/spark/instruments.ts`

- Add the id to the `InstrumentId` union.
- Add an `InstrumentDef` to `INSTRUMENTS`. Fields: `id`, `name`, `kicker` (tuning or a two-word tag), `promise` (one sentence about the first session), `family: "strings"`, `surface: "strings"`, `stringNames` (low to high in playing order), `openFreq` (Hz, same order), `openPc` (pitch class 0 to 11, same order), `firstChords`, `theoryNeck`.
- `theoryNeck` options: `"guitar"` uses six-string CAGED voicings and is guitar only. `"four"` builds a voicing from `openPc` and works for any string count. `"piano"` shows a keyboard. `"none"` hides the neck. Optional `theoryStrings` lists the string indexes the theory neck shows, for instruments with a short string (banjo uses `[1, 2, 3, 4]`). See each brief for the recommendation.

Typecheck now fails at every `Record<InstrumentId, ...>`. That is the list of steps 2 and 3.

## 2. Daily-loop content

File: `src/lib/spark/instruments.ts`

- Add a `<NAME>_LESSONS: Lesson[]` array. Minimum useful set: an orientation warmup, a first shape or note, a second shape, a two-shape song with `process: "perform"`, one `process: "respond"` lesson with a `listenPrompt`, and one `process: "create"` lesson with two `createOptions`. Look at `UKE_LESSONS` as the closest model.
- Add tracks to `TRACKS`, lessons to `ALL`, one or more ids to `foundationsFor`, and three ids to `firstLessonIds`.
- Add chord voicings for the practice player and lab: a new `Record` like `UKE_CHORDS` with `frets`, `fingers`, and `notes` arrays in string order.

## 3. Everything else keyed by id

- `src/components/instrument-mark.tsx`: add the id to `SRC` and add `public/instruments/<id>.jpg` (128 by 128 shown, square source, same style as the six existing photos).
- `src/lib/spark/labs.ts`: add a case to `labSearchFor` (default tab and chord) and `labCardFor` (Studio card copy).
- `src/routes/techniques.tsx`: add an `if (instrument === "<id>") return <NewLab />;` line. Without it the route falls through to the bass lab.
- `src/components/labs/<id>-lab.tsx`: create a lab. Copy `uke-lab.tsx` for a fretted string instrument. Tabs are free-form; five short ones is the pattern.
- `src/components/session-player.tsx`: `playInstrumentChord` needs a branch that strums the new chord record; the render branch that shows a `ChordDiagram` for ukulele needs a matching branch, otherwise the generic `StringRack` shows.
- `src/routes/today.tsx` and `src/routes/skills.tsx`: same pattern, one branch each for the compact chord diagram.
- `src/lib/spark/lesson-practice.ts`: extend `practiceShape` to return the new chord record, widen the `"guitar" | "ukulele"` parameter on `chordNotes`, `strum`, and `chordBars` (and its open-string MIDI table), and add a technique label branch to `retryCoaching` or set `retryLabel` on every exercise.
- `src/components/lesson-practice.tsx` line with `"↓ down · ↑ up"` and `src/routes/milestone.tsx` near line 445: include the new id if it strums.
- `src/routes/__root.tsx`: the meta description lists instruments by name.

## 4. Theory and tuner

- Theory works without changes when `theoryNeck` is `"four"`. Check `/theory` renders the neck with the right string labels and that "Hear" plays a sensible voicing.
- Tuner works without changes: the header uses `stringNames`, and reference pitches come from `openFreq`. Confirm the lowest string is above about 80 Hz or check `analyserSizeFor` in `tuner.ts` for detection window sizing (bass needed a larger window; violin, mandolin, and banjo do not).

## 5. Curriculum

File: `src/lib/spark/curriculum.ts`

- Add `const <id> = path("<id>", [ ...eight seeds... ]);` and spread it into `CURRICULUM`.
- Two seeds per level, in level order. Follow the templates in [content-guide.md](./content-guide.md) and the outline in the instrument brief.

## 6. Guided exercises

File: `src/lib/spark/lesson-practice.ts`

- Add eight `LessonExercise` entries. The final two carry `project` built with `advancedProject(...)`.
- Every listed shape must resolve through `practiceShape`. Every integer beat needs a cue.
- For fretted strings, `chordBars("<id>", [...])` gives the standard one-strum-per-bar pattern once the helper accepts the id.

## 7. Milestone

File: `src/lib/spark/milestones.ts`

- Build cues (usually `copy("<id>-<slug>")` plus a landing edit) and add one `MusicalMilestone`.
- The `alternate` array is the same length with one musical change.

## 8. Coach

No content change. `coach.ts` reads the instrument name from `INSTRUMENTS`. Confirm `/coach` lists the new instrument and that `scopeCoachLearning` returns only that instrument's data (the existing test pattern in `coach.test.ts` can be copied for one new id).

## 9. Unit tests

- `src/lib/spark/learning.test.ts`: the curriculum count derives from `INSTRUMENTS.length * 8`; bump the explicit `INSTRUMENTS.length` assertion.
- `src/lib/spark/lesson-practice.test.ts`: `LESSON_EXERCISES.length`, the set-size assertion, and the trailing `CURRICULUM.length` check add 8 per instrument; `projects.length` adds 2.
- `src/lib/spark/personalized-learning.test.ts`: the milestone counts derive from `INSTRUMENTS.length`; bump the explicit assertion.
- `src/lib/spark/spark.test.ts`: the hard-coded `ids` list of six instruments gains the new ids.
- Add one milestone assertion per new instrument in `personalized-learning.test.ts` if the file asserts on specific pieces (it currently checks guitar by name).

## 10. Browser checks

Files: `scripts/learning-browser.mjs`, `scripts/studio-browser.mjs`, `scripts/personalized-browser.mjs`, `scripts/lesson-practice-browser.mjs`.

- The literal instrument arrays in the learning and studio scripts need the new ids, the studio script counts `Practise` buttons, and the lesson-practice script asserts the exercise total in two places.
- The personalized script iterates `MUSICAL_MILESTONES`, so the new piece runs automatically. It clicks `Bar N` where N is `ceil(beats / 4)`, so keep `beats` a multiple of 4 or confirm the landing label.
- The lesson-practice script iterates `LESSON_EXERCISES`, so all new exercise links run automatically.
- Run locally before pushing (Chromium is preinstalled in CI and in the remote environment):

```sh
sh startup.sh
node scripts/studio-browser.mjs http://127.0.0.1:8083 dev
node scripts/learning-browser.mjs http://127.0.0.1:8083 dev
node scripts/lesson-practice-browser.mjs http://127.0.0.1:8083 dev
node scripts/personalized-browser.mjs http://127.0.0.1:8083 dev
```

Screenshots land under `/workspace/screenshots`. Check the 320px shots for horizontal overflow on the new chord diagrams and lab.

## 11. README and docs

- README: instrument list in the first line, "48 original lessons: eight each for ...", the stale "24 guided exercises" paragraph, the first-piece table, and "all six instruments" in the verification section.
- `docs/coach.md` does not list instruments.

## 12. Definition of done for one instrument

- `npm test`, `npm run build`, `npm run typecheck` pass.
- All four browser scripts pass on dev and built.
- Studio, Start, Learn, Today, Techniques, Theory, Tuner, Milestone, Progress, and Coach all show the instrument without a fallback to another instrument's lab or neck.
- README counts and tables are updated.
