# Content guide: writing lessons, exercises, and pieces

Use this while drafting text for a new instrument. Part one is the voice and pedagogy. Part two is the set of rules the test suite enforces, so a draft passes on the first run.

## Part one: voice and pedagogy

**Speak to one adult learner, in plain words.** Second person, present tense, short sentences. No exclamation marks in lesson bodies. The existing text reads like a patient teacher, not marketing.

**Name the physical action.** Which string, which fret, which finger, which beat. "Press just behind fret 3 on the A string" beats "make a C chord".

**One concept per lesson.** The `outcome` line states it. The `explanation` defines it in three or four sentences. The `example` shows it once with specific pitches or beats. The three `practice` steps go from locate, to do slowly, to repeat with counting.

**Checks test the concept, not memory of the text.** Three options: one correct, two plausible misconceptions. The `feedback` names why the correct answer is correct and, briefly, why the others fail.

**Never claim assessment.** The app cannot hear the learner. Avoid "you played it correctly", "the app will check", "pass". Use "you tried", "notice", "compare", "choose one criterion".

**Rests are content.** Every existing path teaches counting through silence in its second lesson. Keep that.

**Progress language.** A finished lesson is "a practice milestone, not a performance assessment". Projects end with a Refine stage that asks for one changeable observation.

**Reuse the shared vocabulary.** Pulse, bar, beat, subdivision, and (as in "and of 2"), downstroke, upstroke, open string, fret, prepare, landing, rest, ring, shape.

**Instrument-specific words are fine when defined.** Ukulele defines re-entrant tuning in its first lesson. Do the same for roll, chop, tremolo, bow direction, string crossing.

## Part two: rules the tests enforce

### Curriculum (`learning.test.ts`)

- Exactly 8 lessons per instrument; exactly 2 at each of the four levels, in order foundations, beginner, intermediate, advanced.
- `id` is `<instrument>-<slug>` and must be unique across the whole curriculum.
- `prerequisite` is the previous lesson in the path (the `path` helper does this).
- `practice` has exactly 3 strings. `options` has 3 distinct strings and `answer` indexes one of them.
- `outcome`, `explanation`, `example`, `feedback`, and each practice step are longer than 20 characters after trimming.
- Every `demo` MIDI value is an integer from 21 to 108.

### Guided exercises (`lesson-practice.test.ts`)

- One exercise for every curriculum lesson, keyed by the exact lesson id, and no extras.
- `bpm` is one of 40, 50, 60, 70, 80, 90, 100.
- `beats` is 4 to 16, or exactly 17 when a cue sits on beat 16 (a landing after four bars).
- `goal`, `setup`, `hint`, and `takeaway` are each longer than 30 characters.
- `subdivision`, if set, is 1, 2, 3, or 4. Each cue's `beat` times the subdivision must be an integer. Default is 2 (straight eighths).
- Every cue has a non-empty `detail`, a `beat` inside `[0, beats)`, and if `duration` is set, `beat + duration` stays inside `beats`.
- **Every integer beat has at least one cue.** Use `rest(beat)` for silence.
- Cue `notes` are MIDI 21 to 108. Cue `pads` are 0 to 3.
- Every name in `shapes` must resolve through `practiceShape(instrument, chord)`.
- Exactly the last two lessons per instrument have a `project`. With three new instruments the project count goes from 12 to 18.
- Project rules: `buildBeats` between 4 and `beats`; three stages labelled Build, Choose, Refine; each stage `title` at least 3 characters, `instruction` over 30, `button` at least 3; two choices with distinct labels of at least 3 characters and details over 20.
- `retryCoaching` must return two entries labelled differently, each label over 10 characters, each adjustment over 30, and the second adjustment equals the exercise `hint`. So every `hint` must be longer than 30 characters and the technique label for the instrument must be longer than 10.

### Milestones (`personalized-learning.test.ts` and browser checks)

- One milestone per instrument, found by `musicalMilestone(instrument)`.
- The browser check starts every non-guitar piece, switches to the variation, plays the last bar, tries the whole piece, and saves. Keep `beats` a multiple of 4 unless you also handle the landing label.
- `lessons` should list the curriculum ids that prepare the piece, in order. The next-action logic offers the piece once its first preparation lesson has been explored.

### Daily-loop lessons (`spark.test.ts`)

- Lessons with `process: "respond"` need a `listenPrompt`. Lessons with `process: "create"` need at least two `createOptions`.
- For string surfaces, warmups and skills must be playable by the generic control: no per-string note expectation.
- `firstLessonIds` returns three ids that exist in the instrument's list; the first becomes the warmup, the last the challenge.

## Templates

### Curriculum seed

```ts
{
  slug: "kebab-case",
  level: "foundations",
  title: "Short imperative or noun phrase",
  outcome: "One sentence: what the learner can do after this.",
  explanation:
    "Three or four sentences. Define the term. Say where it sits on the instrument. Say what counting or motion keeps it steady.",
  example: "One concrete instance with pitches, frets, or beats.",
  practice: [
    "Locate: find the string, key, or position.",
    "Do it once, slowly, with a named cue.",
    "Repeat with counting for a set number of bars.",
  ],
  question: "One question about the concept?",
  options: ["Correct", "Plausible misconception", "Second misconception"],
  answer: 0,
  feedback: "Why the correct option is right, and what the others confuse.",
  demo: { label: "What the demo plays", notes: [[60], [62], [], [64]] },
},
```

### Exercise

```ts
{
  lessonId: "<instrument>-<slug>",
  title: "What the four bars contain",
  bpm: 60,
  beats: 16,
  goal: "What to try, in one sentence that names the count of bars.",
  setup: "Where the hands go, what stays quiet, what counts silently.",
  hint: "A smaller version of the same task, for the technique retry.",
  takeaway: "One sentence the learner can keep, without judging the attempt.",
  shapes: ["G", "C"],
  cues: repeat([note(0, "G", [55]), rest(1), note(2, "D", [62]), rest(3)], 4),
},
```

### Milestone

```ts
{
  instrument: "<id>",
  title: "A short original title",
  goal: "The whole piece in one sentence, ending where it started.",
  setup: "Shapes or positions with numbers, and what to prepare while counting.",
  variation: "Name of the one change",
  variationHint: "Where exactly the change goes and what stays the same.",
  lessons: ["<id>-first", "<id>-second", "<id>-third"],
  bpm: 50,
  beats: 16,
  shapes: ["G", "C"],
  cues: base,
  alternate: base.map(/* the single change */),
},
```
