# Violin brief

**Status: implemented.** The violin path is in the codebase with `theoryNeck: "none"`; the theory page plays a neutral keyboard reference and carries a fretless caption. Cues use ⊓ and ∨ for bow direction, the session player labels the action "Bow", the daily plan allows a chordless violin challenge, and listen prompts play sustained open-string tones. The mark at `public/instruments/violin.jpg` is still a placeholder: a vector drawing rendered to match the framing and lighting of the six product photos, not a photograph. Replace it with a photo when one is available; no code changes are needed.

Violin is the outlier: no frets, no chords, and bow direction replaces pick direction. Most of the generic string code still applies, but a few branches need a decision.

## Decisions to make first

**Fingerboard display.** There is no fretless component. Options:

1. `theoryNeck: "none"` for v1. Theory shows chords on nothing and "Hear" falls through to the guitar voicing branch in `routes/theory.tsx`. Add a small change there: when `theoryNeck` is `"none"` and `surface` is `"strings"`, play `pianoChord` so the reference is neutral.
2. `theoryNeck: "four"` and reuse `TheoryFretboard` as a first-position map with "fret" lines relabelled as finger positions. This misrepresents intonation and is not recommended for v1.

Recommended: option 1, with the lesson text carrying finger-position numbers and the exercise cues carrying MIDI pitches.

**Bow direction labels.** Use ⊓ for down-bow and ∨ for up-bow in cue labels, and define them in the first lesson. Do not reuse the ↓ ↑ strum labels; add a violin line to the label caption in `lesson-practice.tsx` ("⊓ down-bow · ∨ up-bow").

**No shapes, no positions.** Leave `shapes` and `positions` unset on every violin exercise. The practice panel then shows the generic cue buttons, which is correct. `firstChords` is an empty array.

**Retry label.** Set the technique label to "The bow or the left hand felt awkward" in `retryCoaching`.

## Instrument definition

```ts
{
  id: "violin",
  name: "Violin",
  kicker: "GDAE",
  promise: "One open string, one full bow. Then a first finger. The sound is in the bow speed.",
  family: "strings",
  surface: "strings",
  stringNames: ["G", "D", "A", "E"],
  openFreq: [196.0, 293.66, 440.0, 659.25],
  openPc: [7, 2, 9, 4],
  firstChords: [],
  theoryNeck: "none",
}
```

MIDI for open strings: 55, 62, 69, 76. First-position notes used in the outline: D string D E F♯ G = 62, 64, 66, 67; A string A B C♯ D = 69, 71, 73, 74.

## Curriculum outline (8 lessons)

| #   | Slug                 | Level        | Title                                 | Concept                                                                               |
| --- | -------------------- | ------------ | ------------------------------------- | ------------------------------------------------------------------------------------- |
| 1   | open-strings-and-bow | foundations  | Four strings and one straight bow     | GDAE, bow hold, one open string per bow, keep the bow between bridge and fingerboard. |
| 2   | bow-pulse            | foundations  | Down-bow on one, up-bow on three      | ⊓ on 1, rest on 2, ∨ on 3, rest on 4; the bow stops but the count continues.          |
| 3   | first-finger         | beginner     | One finger, one whole step            | First finger on D gives E; on A gives B; listen for the step.                         |
| 4   | d-tetrachord         | beginner     | Four notes on one string              | D E F♯ G with fingers 0 1 2 3; the half step between 2 and 3.                         |
| 5   | slurs                | intermediate | Two notes in one bow                  | Slur pairs; subdivision 2; the bow keeps moving while the finger changes.             |
| 6   | string-crossing      | intermediate | Crossing without a bump               | D to A on the pulse; roll the elbow; a crescendo over four bars.                      |
| 7   | phrase-shaping       | advanced     | Give the phrase a direction (project) | Build a four-bar phrase; choose swell to bar 3 or taper to bar 4; refine.             |
| 8   | performance-plan     | advanced     | Plan two phrases (project)            | Two connected phrases with planned bowings; choose an ending; refine one criterion.   |

Demos: lesson 1 `[[55], [62], [69], [76]]`; lesson 3 `[[62], [64], [69], [71]]`; lesson 4 `[[62], [64], [66], [67]]`; lesson 5 `[[62], [64], [], [66], [67], []]`, with the lesson text noting that the demo cannot show bow continuity.

## Exercise sketches

- **open-strings-and-bow** (16 beats, 50 BPM): one open string per bar, `note(bar * 4, "G ⊓", [55], "Whole down-bow", 3.8)`, rests filling beats 1 to 3 of each bar. Long `duration` values make the reference sustain.
- **bow-pulse** (16 beats): `note(0, "⊓", [62])`, `rest(1)`, `note(2, "∨", [62])`, `rest(3)`, repeated on the D string.
- **first-finger** (16 beats): D E D rest, A B A rest, alternated.
- **d-tetrachord** (16 beats): D E F♯ G ascending in bar 1, descending in bar 2, repeat.
- **slurs** (16 beats, subdivision 2): each beat carries two notes, label "⊓ slur" on the number and the second note on the and without a bow change in the detail text.
- **string-crossing** (16 beats): D on 0, A on 1, D on 2, A on 3, repeated, with `detail` noting the dynamic level per bar (soft, medium, louder, full).
- **phrase-shaping** (project, buildBeats 8, beats 16): Build bars 1 and 2 of a D-major phrase, Choose swell or taper, Refine one bow change.
- **performance-plan** (project, buildBeats 8, beats 17 with a landing on 16). Mirror `vocals-performance-plan` in structure.

## Milestone

- Title: "Open strings and a first finger". Goal: D E F♯ E over four bars, one note per beat with a rest on 4, ending on a held D.
- Cues: 16 beats; bars 1 to 3 are D E F♯ rest; bar 4 is D held with `duration: 3.8`.
- Variation "Slur the pairs": bars 1 to 3 slur D-E in one bow, F♯ alone, rest.
- Lessons: `violin-open-strings-and-bow`, `violin-bow-pulse`, `violin-first-finger`.

## Daily-loop lessons (practice layer)

Tracks: foundations, first position. First session ids: open-string warmup, first-finger note, a four-note song "Evening Walk" with `process: "perform"` and `chords: []`. The generic string control handles chordless items. One `respond` lesson (same or different: slurred versus separate) and one `create` lesson with options `D–E` and `D–E–F♯`.

Check `daily-plan.ts`: the challenge branch requires `next.chords.length || instrument === "drums"`. With no chords, a violin lesson never becomes the challenge item unless that condition also accepts violin. Add `|| instrument === "violin"` or give the song lesson a nominal `chords: ["D"]` and confirm the session player renders the `StringRack` fallback.

## Lab tabs

Open, Bow, Finger, Slur, Cross. Copy `uke-lab.tsx` structure; sounds use `pianoHold` for sustained references because `pluck` decays too fast to represent a bow.

## Risks

- `session-player.tsx` chooses the "Strum" label for any string instrument that is not bass. Add a "Bow" label.
- `tuner.tsx` header shows `stringNames` joined; fine.
- Vocals is the closest existing path in tone: sustained pitches, breath and bow both have "no extra effort" guidance. Reuse its honest-progress phrasing about not assessing intonation.
