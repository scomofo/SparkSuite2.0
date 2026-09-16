# Review of the existing lesson content

This is a map of the content that already ships for guitar, piano, ukulele, bass, drums, and vocals. It describes what each layer holds, where it lives, how the layers connect, and what the current content does well that new instruments should copy.

## Layer 1: daily-loop lessons (practice)

- Files: `src/lib/spark/guitar.ts` (guitar), `src/lib/spark/instruments.ts` (the other five), types in `src/lib/spark/types.ts`.
- Shape: `Lesson` with `id`, `title`, `skill`, `trackId`, `order`, `type`, `objectives`, `chords`, `pattern`, `bars`, `bpm`, `prerequisites`, `masteryRequired`, and optional NAfME fields (`process`, `repertoire`, `criteria`, `createOptions`, `listenPrompt`, `why`, `interpret`, `analysis`).
- Count: guitar has a long path; the others have 5 to 10 lessons each. There is no fixed count in tests.
- Used by: `daily-plan.ts` builds the Today loop from `firstLessonIds` on a first session and from `nextLessonFor` afterwards. `practice.ts` turns each plan item into a timeline based on `surface` (`strings`, `keys`, `pads`, `voice`). `session-player.tsx` renders the surface.
- Notes: `process: "respond"` lessons carry a `listenPrompt` (same or different), `process: "create"` lessons carry two `createOptions`. `spark.test.ts` checks that these are playable with the generic control for every instrument in a hard-coded id list.

## Layer 2: Learn curriculum

- File: `src/lib/spark/curriculum.ts`.
- Shape: `LearningLesson` built by `path(instrument, seeds)`, which derives `id` as `<instrument>-<slug>` and chains `prerequisite` to the previous seed.
- Count: exactly 8 per instrument, 2 per level (`foundations`, `beginner`, `intermediate`, `advanced`). 48 total. Enforced in `learning.test.ts`.
- Each lesson has: `title`, `outcome`, `explanation`, `example`, `practice` (three steps), `question`, `options` (three, distinct), `answer` (index), `feedback`, and an optional `demo` of MIDI chords, one entry per beat, `[]` for a rest.
- Progression pattern used by all six paths:
  - Foundations 1: find the instrument (names of strings or keys, how a sound is made).
  - Foundations 2: a steady four-beat pulse with rests.
  - Beginner 1: the first harmonic or melodic building block (two chords, a triad, roots).
  - Beginner 2: subdivision (eighths, hands together, hats).
  - Intermediate 1: harmony or line control specific to the instrument (triads, voice leading, walking, accents).
  - Intermediate 2: a second harmonic or rhythmic idea (pentatonic, sevenths, transposing, polyrhythm, harmony line).
  - Advanced 1: expression or harmony choice (secondary dominant, interpretation).
  - Advanced 2: an independent arrangement or performance plan.
- Starting points: `learning-profile.ts` maps experience to index 0, 2, 4, or 6 in the path. This is why the two-per-level structure matters.

## Layer 3: guided exercises

- File: `src/lib/spark/lesson-practice.ts`.
- Shape: `LessonExercise` keyed by `lessonId`, with `title`, `goal`, `setup`, `hint`, `takeaway`, `bpm`, `beats`, optional `subdivision`, `cues`, optional `shapes` (chord names), optional `positions` (bass neck marks), optional `retryLabel`, and optional `project`.
- Count: one per curriculum lesson, 48 total. Enforced in `lesson-practice.test.ts`. The README still says 24 in one paragraph; that sentence is stale and should be updated when counts change again.
- Cues: `PracticeCue` has `beat` (quarter notes from 0, fractions allowed within `subdivision`), `label`, `detail`, and optionally `notes` (MIDI), `pads` (drum pad indexes 0 to 3), `muted`, `duration`, `chord`. Helpers `note`, `rest`, `drum`, `strum`, `repeat`, `repeatEvery`, and `chordBars` build most patterns. `strum` and `chordBars` are typed to guitar and ukulele only.
- Chord shapes: `practiceShape(instrument, chord)` resolves guitar shapes from `guitar.ts` and ukulele shapes from `UKE_CHORDS`. Anything else returns undefined, and the test requires every listed shape to resolve.
- Projects: the final two exercises per instrument carry a `project` with `buildBeats` and three stages named Build, Choose, Refine, plus two choices. Twelve projects exist. `practiceSequence` plays only `buildBeats` until the learner moves past the Build stage.
- Retry coaching: `retryCoaching` gives two paths, pulse and technique. The technique label is chosen by instrument in a chain of conditionals, so a new instrument needs either a new branch or `retryLabel` on every exercise.
- UI: `src/components/lesson-practice.tsx` renders drum pads for drums, a bass neck when `positions` exist, a keyboard for piano and vocals, chord diagrams from `shapes`, and otherwise a row of cue buttons. Labels like "↓ down · ↑ up" are gated on guitar or ukulele.

## Layer 4: first pieces (milestones)

- File: `src/lib/spark/milestones.ts`.
- Shape: `MusicalMilestone` with `instrument`, `title`, `goal`, `setup`, `variation`, `variationHint`, `lessons` (the preparation lesson ids), `bpm`, `beats`, `cues`, `alternate`, optional `shapes`.
- Most pieces reuse cues from an exercise through `copy(lessonId)` and then edit the final bar into a landing. The variation is the same piece with one musical change.
- Route: `/milestone?instrument=<id>`; the card in Progress lists saved versions per instrument.

## Supporting definitions

- `InstrumentDef` in `instruments.ts`: `id`, `name`, `kicker`, `promise`, `family`, `surface`, `stringNames`, `openFreq`, `openPc`, `firstChords`, `theoryNeck`. The `INSTRUMENTS` array is the single source for every instrument picker in the app.
- Chord voicings: `CHORDS` (guitar, `ChordShape` with frets low to high), `UKE_CHORDS`, `PIANO_VOICINGS` (MIDI), and bass roots in `session-player.tsx`.
- Technique labs: `labs.ts` chooses the default tab and the Studio card. `routes/techniques.tsx` picks a lab component by instrument and falls back to the bass lab for anything unmatched.
- Theory: `routes/theory.tsx` renders a piano for `theoryNeck: "piano"`, a generic neck from `openPc` for `"four"`, guitar CAGED shapes for `"guitar"`, and nothing for `"none"`. The `"four"` branch is generic over string count despite its name.
- Tuner: `routes/tuner.tsx` builds its header from `surface` and `stringNames`.
- Marks: `components/instrument-mark.tsx` maps each id to `public/instruments/<id>.jpg`.
- Coach: `coach.ts` scopes learning data by instrument and names the instrument from `INSTRUMENTS`. No per-instrument text lives there.

## What the existing content does well

- **Small, bounded tasks.** Every exercise fits in four bars, with a count-in and an automatic stop. Every lesson step is one screen.
- **Honest progress language.** Text never claims the app can hear or grade the learner. Completion means an attempt was reported and a check was answered.
- **Concrete examples with numbers.** Fret numbers, string names, beat positions, and MIDI demos appear in nearly every lesson, so a learner can act without guessing.
- **Consistent vocabulary.** Open string, fret, pulse, bar, subdivision, downstroke, upstroke, rest, landing, prepare. New instruments should reuse these words.
- **One idea per check.** The question tests the single concept the lesson introduced, and the feedback explains why the wrong options are wrong.
- **Projects offer a pick, not a blank page.** Two named choices with a sentence of detail each.

## Known drift to fix along the way

- README says "24 guided exercises" and "later lessons do not yet have matched interactive exercises". Both are out of date; there are 48.
- The route description in `src/routes/__root.tsx` lists the six instruments by name.
- Browser scripts iterate a literal list of six instruments in `learning-browser.mjs` and `studio-browser.mjs`.
