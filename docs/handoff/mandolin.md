# Mandolin brief

**Status: implemented.** The mandolin path is in the codebase; this brief is kept as the worked example of the checklist. The placeholder mark at `public/instruments/mandolin.jpg` is a rendered drawing, not a photo like the other six, and should be replaced.

Mandolin is the recommended first instrument to add. It has four courses tuned like a violin, standard chord shapes, and every existing four-string code path applies.

## Decisions to make first

**Courses.** Each course is a pair of strings tuned in unison. Treat each course as one string everywhere in the app (four entries in `stringNames`, `openFreq`, `openPc`, and every chord record). Explain the pairs in the first lesson.

**Pick direction.** Mandolin teaching leans on strict alternate picking. Reuse the guitar and ukulele "↓ down · ↑ up" labelling by adding `mandolin` to those two conditionals.

## Instrument definition

```ts
{
  id: "mandolin",
  name: "Mandolin",
  kicker: "GDAE",
  promise: "Two-finger G and C, then a chop on two and four. The pulse lives in your wrist.",
  family: "strings",
  surface: "strings",
  stringNames: ["G", "D", "A", "E"],
  openFreq: [196.0, 293.66, 440.0, 659.25],
  openPc: [7, 2, 9, 4],
  firstChords: ["G", "C"],
  theoryNeck: "four",
}
```

MIDI for open courses: 55, 62, 69, 76.

## Chord record (`MANDOLIN_CHORDS`)

Frets and fingers in GDAE order. Verify against a chord chart before shipping.

| Chord | Frets   | Notes    |
| ----- | ------- | -------- |
| G     | 0-0-2-3 | G D B G  |
| C     | 0-2-3-0 | G E C E  |
| D     | 2-0-0-2 | A D A F♯ |
| Am    | 2-2-3-0 | A E C E  |
| Em    | 0-2-2-0 | G E B E  |

## Curriculum outline (8 lessons)

| #   | Slug              | Level        | Title                          | Concept                                                                       |
| --- | ----------------- | ------------ | ------------------------------ | ----------------------------------------------------------------------------- |
| 1   | gdae              | foundations  | Four pairs, one pick           | Courses, GDAE low to high, pick angle, one clean note per course.             |
| 2   | down-pulse        | foundations  | Downstrokes on a pulse         | Down on 1 and 3 over the open D course; count 2 and 4 silently.               |
| 3   | g-and-c           | beginner     | Two fingers, two chords        | G (0-0-2-3) and C (0-2-3-0); change on beat 1; prepare on 3 and 4.            |
| 4   | down-up           | beginner     | Alternate picking              | Down on numbers, up on ands; D E F♯ G on the D course; subdivision 2.         |
| 5   | chop              | intermediate | The chop on two and four       | Muted chord on 2 and 4, open downs on 1 and 3; the mandolin as a snare.       |
| 6   | tremolo           | intermediate | Sustain from motion            | Four even strokes per beat on one note; subdivision 4; relaxed wrist.         |
| 7   | melody-with-chops | advanced     | Melody, then backing (project) | Build a four-bar melody over G-C-D-G; choose chop or tremolo backing; refine. |
| 8   | arrangement       | advanced     | Arrange a short tune (project) | Original tune; choose a tremolo ending or a chop-and-stop ending; refine.     |

Demos: lesson 1 `[[55], [62], [69], [76]]`; lesson 3 `[[55, 62, 71, 79], [], [55, 64, 72, 76], []]`; lesson 4 `[[62], [64], [66], [67]]`.

## Exercise sketches

- **gdae** (16 beats, 60 BPM): each course on beat 1 of its bar, rests after. Copy `ukulele-gcea`.
- **down-pulse** (16 beats): `note(0, "D ↓", [62])`, `rest(1)`, `note(2, "D ↓", [62])`, `rest(3)`, repeated.
- **g-and-c** (16 beats): `chordBars("mandolin", ["G", "C", "G", "C"])`, `shapes: ["G", "C"]`.
- **down-up** (16 beats, subdivision 2): D E F♯ G ascending on numbers and ands with ↓ and ↑ labels, then descending.
- **chop** (16 beats): open down on 0 and 2, `muted: true` chop with `chord: "G"` on 1 and 3, `shapes: ["G"]`.
- **tremolo** (8 beats, subdivision 4, 50 BPM): sixteen strokes on A (69) per two beats, then rest two beats, twice. Keep total beats 8 so the pattern stays readable.
- **melody-with-chops** (project, buildBeats 8, beats 16): Build the melody bars 1 and 2, Choose chop backing or tremolo backing for bars 3 and 4, Refine the change on beat 1 of bar 3.
- **arrangement** (project, buildBeats 8, beats 17 with a landing on 16).

Retry technique label: "The pick direction or the shapes felt awkward".

## Milestone

- Title: "Two courses and a return". Goal: G, C, D, G one bar each, one downstroke on beat 1, final G rings.
- Cues: `chordBars("mandolin", ["G", "C", "D", "G"])` with beat 12 held for 3.8 beats.
- Variation "Chop on two and four": bars 1 to 3 add a muted chop on beats 2 and 4; bar 4 stays as one strum.
- Lessons: `mandolin-gdae`, `mandolin-down-pulse`, `mandolin-g-and-c`.

## Daily-loop lessons (practice layer)

Tracks: foundations, chords, chops. First session ids: open-course warmup, G shape, two-chord song "Porch Light" with `process: "perform"`. One `respond` lesson (chop or open strum) and one `create` lesson with options `G` and `G–C`.

## Lab tabs

Down, Alt, Chop, Tremolo, Switch. Copy `uke-lab.tsx` almost unchanged: replace the chord table and the island pattern with a chop pattern.

## Risks

- `TheoryFretboard` and `neckVoicing` work as-is with `openPc`. Confirm the E course at 659 Hz is not clipped by any audio gain choice in `strum`.
- The tuner detection window is sized for low pitches; high E is fine.
