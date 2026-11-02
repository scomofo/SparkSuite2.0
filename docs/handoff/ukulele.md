# Ukulele brief (standard tuning, high G)

**Status: implemented.** The ukulele path is in the codebase. Tuning is standard GCEA with a high G throughout: every demo, the tuner, and the theory neck assume high-G. Low-G setups are not covered anywhere.

## Instrument definition

```ts
{
  id: "ukulele",
  name: "Ukulele",
  kicker: "GCEA",
  promise: "Four strings, one C chord, then the chords behind a hundred songs.",
  family: "strings",
  surface: "strings",
  stringNames: ["G", "C", "E", "A"],
  openFreq: [392.0, 261.63, 329.63, 440.0],
  openPc: [7, 0, 4, 9],
  firstChords: ["C", "G"],
  theoryNeck: "four",
}
```

MIDI for open strings in the same order: 67, 60, 64, 69.

High-G tuning is re-entrant: the G string (G4, MIDI 67) sits *above* the C string (C4, MIDI 60) in pitch, even though it is the first string in playing order. String order in every record is playing order (G–C–E–A), never pitch order.

## Chord record (`UKE_CHORDS`)

Frets and fingers in GCEA order.

| Chord | Frets | Fingers | Notes |
| ----- | ----- | ------- | ----- |
| C     | 0-0-0-3 | 0-0-0-3 | G C E C |
| Am    | 2-0-0-0 | 2-0-0-0 | A C E A |
| F     | 2-0-1-0 | 2-0-1-0 | A C F A |
| G7    | 0-2-1-2 | 0-2-1-3 | G D F B |
| G     | 0-2-3-2 | 0-1-3-2 | G D G B |
| D     | 2-2-2-0 | 1-2-3-0 | A D F♯ A |

G7 is taught before the full G shape in the daily loop: it is the easier V chord in the key of C, and the Learn path's transpose lesson names it in that role.

## The two paths

**Learn path** (`src/lib/spark/curriculum.ts`): 8 lessons, 2 per level (foundations, beginner, intermediate, advanced), with chained prerequisites — each lesson unlocks after the previous one. Lesson 1 teaches tuning first: what GCEA means, the re-entrant high G, and a tuner step before any chord. The path continues through first C, C–Am–F changes, the island strum, fingerpicking, transposing, chord melody, and arranging. Guided exercises in `src/lib/spark/lesson-practice.ts` are keyed to these Learn lessons, one per lesson, and the first-piece milestone is "Three chords and a return" (C → Am → F → C).

**Daily loop** (`UKE_LESSONS` in `src/lib/spark/instruments.ts`): 12 lessons in this order —

1. Open strings
2. C
3. Am
4. F
5. Bright or dark (listening: C vs Am)
6. G7
7. G
8. Dock Loop (C–G song loop)
9. Same chord or different (listening: C vs G)
10. Island strum
11. Ode to Joy (melody, one note at a time)
12. Your hang (create)

The first session (`firstLessonIds`) is open strings → C → Am: one chord, then its neighbour, before any chord change under time pressure.

## Strum lab

`src/components/labs/uke-lab.tsx` has five tabs: Down, Island, Chunk, Pick, Switch. The Chunk (a left-hand mute) is taught only in the lab — it appears in no lesson. Finger assignment differs between the lab and the Learn path on purpose, and the copy in both places now says so: the lab's Pick drill assigns one finger per string (p-i-m-a: thumb G, index C, middle E, ring A), while the Learn fingerpicking lesson uses a three-finger repeating pattern — thumb, index, middle on the C, E, and A strings.

## Demo rule

Lesson demos use the true ukulele voicing pitches in GCEA string order — a played C chord sounds 67, 60, 64, 72 — never generic triad pitches borrowed from piano voicings. New demos must follow the chord records above, string by string.

## Known limitations

### Microphone assessment

- Chord checks compare distinct sounding pitches. Am, F, G, and D contain unison strings, which share a spectral peak; the mic cannot verify each string independently.
- Ukulele strums use a quieter attack threshold and wait 160 ms for the rolled chord to fill the FFT. Rhythm is still scored at the original attack time, and cue expiry allows the evidence to arrive.
- Chord pitches must match their rounded MIDI targets; an adjacent semitone is a different note. Missing or masked target pitches remain uncertain and count for timing only. Clearly unrelated detected pitches fail the chord check once per cue. Upper harmonics alone are not evidence of an extra fretted note.
- Stroke direction is not scored for re-entrant tuning (including high-G ukulele and five-string banjo). The low-first/high-first heuristic assumes strings ascend in pitch.
- These are rounded pitch checks, not a cents-level intonation assessment. Room noise, microphone placement, ringing previous notes, and speaker spill can still affect the result. Headphones help isolate the instrument.
- `scripts/ukulele-assessment-audio-browser.mjs` exercises Chromium's native analyser with all six shapes at 44.1/48 kHz, quiet uneven strings, wrong chords/frets, masked notes, silence, metronome, and noise. This is synthetic-audio regression evidence, not certification against a recording of the user's playing.

### Content

- Chord vocabulary is six shapes (C, Am, F, G7, G, D). No seventh chords beyond G7, no minor chords beyond Am.
- No barre chords anywhere.
- No low-G content; a low-G ukulele will mismatch the demos and the tuner.
- Melodies so far use the C and E strings only (Ode to Joy sits entirely on those two).
