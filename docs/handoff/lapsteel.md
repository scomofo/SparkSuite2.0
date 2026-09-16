# Lap steel brief (six-string, C6)

**Status: implemented.** The lap steel path is in the codebase. It uses C6 tuning (C–E–G–A–C–E), treats straight-bar positions as the chord records, and keeps `theoryNeck: "none"` with its own theory caption. The mark at `public/instruments/lapsteel.jpg` is still a placeholder: a vector drawing rendered to match the framing and lighting of the six product photos, not a photograph. Replace it with a photo when one is available; no code changes are needed.

## Decisions made

**Tuning.** C6 is the common six-string lap steel setup for learners and gives an open chord, which lets the existing "open strings already make a chord" pattern from banjo carry over.

**Chords are bar positions.** There is no fretting hand. Every record in `LAPSTEEL_CHORDS` puts all six strings at the same fret: open is C6, fret 2 is D6, fret 5 is F6, fret 7 is G6. `ChordDiagram` renders these as a barre, which reads as the bar. The chord names are the roots (C, D, F, G); lesson text explains the added sixth.

**No theory neck.** `neckVoicing` would draw one fret per string, which a straight bar cannot play, so the theory page hides the neck and says the sound is the reference. The tuner header still lists the six strings.

**Cue vocabulary.** ↓ is a brush; ⟋ and ⟍ mark a slide leaving on the and and arriving on the beat. Captions in guided practice and the milestone page define them. Rests say "palm-block" because lap steel silence has to be made.

**Daily loop.** `instrument-patterns.ts` maps the open-string warmup and the slide lesson to their Learn exercises, so Today plays real pitches for those items. The other daily lessons use the generic strum timeline.

## Instrument definition

```ts
{
  id: "lapsteel",
  name: "Lap steel",
  kicker: "C6",
  promise: "Open strings already make a chord. Lay the bar straight and slide it home.",
  family: "strings",
  surface: "strings",
  stringNames: ["C", "E", "G", "A", "C", "E"],
  openFreq: [130.81, 164.81, 196.0, 220.0, 261.63, 329.63],
  openPc: [0, 4, 7, 9, 0, 4],
  firstChords: ["C", "F"],
  theoryNeck: "none",
}
```

MIDI for open strings: 48, 52, 55, 57, 60, 64.

## Curriculum (8 lessons)

| #   | Slug                 | Level        | Concept                                                                 |
| --- | -------------------- | ------------ | ----------------------------------------------------------------------- |
| 1   | c6-and-the-bar       | foundations  | Name the strings; the open strings are a chord; bar and picks.          |
| 2   | pick-pulse           | foundations  | Brush on 1 and 3, palm-block 2 and 4, keep counting.                    |
| 3   | straight-bar         | beginner     | Open C, fret 5 F, fret 7 G; bar over the marker; change on beat 1.      |
| 4   | slide-into           | beginner     | Leave on the and, arrive on the beat; F to G and back.                  |
| 5   | vibrato              | intermediate | Sustain one note; small even vibrato after the attack.                  |
| 6   | single-string-melody | intermediate | E G A G on the 1st string at positions 0, 3, 5; lift for open.          |
| 7   | harmony-in-thirds    | advanced     | Two strings under one bar; choose thirds or sixths (project).           |
| 8   | arrangement          | advanced     | Chords, one slide, the melody, land on open C; choose ending (project). |

## First piece

"Home, away, and home": C, F, G, C, one bar each, brushed on beat 1. Variation slides the bar into every change on the last beat of each bar.

## Lab

Bar, Slide, Vibrato, Block, Positions. Slides are approximated by the arrival chord; the lab says so.

## Open items

- The mark is a drawing placeholder.
- Bar positions and the melody frets are standard C6 material but have not been checked by a player.
- Slides are notated as an arrival chord; the synthesized reference does not glide.
