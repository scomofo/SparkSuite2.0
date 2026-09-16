# Banjo brief (five-string, open G)

**Status: implemented.** The banjo path is in the codebase. The fifth string is listed first in the definition and kept open in every chord record; the theory neck shows only the four long strings through the new optional `theoryStrings` field on `InstrumentDef` and the `theoryNeckDef` helper. The mark at `public/instruments/banjo.jpg` is still a placeholder: a vector drawing rendered to match the framing and lighting of the six product photos, not a photograph. Replace it with a photo when one is available; no code changes are needed.

## Decisions to make first

**The fifth string.** On a five-string banjo the short fifth string starts at fret 5 and is almost always played open (high G). Two components assume every string runs from the nut: `ChordDiagram` draws frets from fret 1, and `neckVoicing` in `theory.ts` will happily place a chord tone at fret 2 on the fifth string. Recommended v1 approach:

- Put the fifth string first in `stringNames`, `openFreq`, and `openPc` so diagrams read gDGBD left to right, which matches banjo chord charts.
- In every chord record, keep the fifth string at `0` (open) or `null` (not played). Never fret it.
- For theory, either accept the `"four"` neck with the fifth string included and note the limitation, or pass a four-string view (`DGBD`) to the theory neck. The second is more honest and needs a small change in `routes/theory.tsx` to read a `theoryStrings` subset when present. Flag whichever you choose in the PR.

**Picking style.** Three-finger (thumb, index, middle) rolls fit the beat-cue model: each roll note is a cue with one MIDI pitch. Clawhammer can come later as a lab tab.

## Instrument definition

```ts
{
  id: "banjo",
  name: "Banjo",
  kicker: "gDGBD",
  promise: "Open strings already make a G chord. Add one roll and it moves.",
  family: "strings",
  surface: "strings",
  stringNames: ["g", "D", "G", "B", "D"],
  openFreq: [392.0, 146.83, 196.0, 246.94, 293.66],
  openPc: [7, 2, 7, 11, 2],
  firstChords: ["G", "D7"],
  theoryNeck: "four",
}
```

MIDI for open strings in the same order: 67, 50, 55, 59, 62.

## Chord record (`BANJO_CHORDS`)

Frets and fingers in gDGBD order. Verify against a chord chart before shipping.

| Chord | Frets     | Notes     |
| ----- | --------- | --------- |
| G     | 0-0-0-0-0 | g D G B D |
| C     | 0-2-0-1-2 | g E G C E |
| D7    | x-0-2-1-0 | D A C D   |
| D     | x-0-2-3-4 | D A D F♯  |
| Em    | 0-2-0-0-2 | g E G B E |
| Am    | 0-2-2-1-2 | g E A C E |

D7 uses the beginner two-finger shape: the long strings sound D–A–C–D, omitting F♯. Skip the short fifth string in D/D7 brushes (x in the diagram, null in the data). Rolls still pick its open high-G drone, not a D7 chord tone. The first string stays open. Source: [Deering, Learn 3 Easy Banjo Chords](https://blog.deeringbanjos.com/learn-3-easy-banjo-chords).

## Curriculum outline (8 lessons)

| #   | Slug             | Level        | Title                           | Concept                                                                                   |
| --- | ---------------- | ------------ | ------------------------------- | ----------------------------------------------------------------------------------------- |
| 1   | open-g           | foundations  | Five strings that already agree | Name gDGBD; the short fifth string; open strings sound G major.                           |
| 2   | pulse-brush      | foundations  | A pulse over an open chord      | Brush on 1 and 3, count through 2 and 4, rests belong to the beat.                        |
| 3   | g-to-d7          | beginner     | The first change                | G (open) to D7 (x-0-2-1-0); prepare during beats 3 and 4.                                 |
| 4   | forward-roll     | beginner     | Eight notes, three fingers      | Forward roll T-I-M-T-I-M-T-M on strings 3-2-1-5-2-1-3-1; straight eighths; subdivision 2. |
| 5   | three-chord-loop | intermediate | G, C, D7, and home              | I-IV-V7 with rolls across changes; the roll keeps moving while the hand moves.            |
| 6   | hammer-and-slide | intermediate | Notes that move after the pick  | Hammer-on 0 to 2 on the G string; slide 2 to 4; articulation without re-picking.          |
| 7   | backup-and-break | advanced     | Two jobs in one tune (project)  | Build a vamp behind a chord loop; choose vamp or roll; refine one bar.                    |
| 8   | arrangement      | advanced     | Arrange a short tune (project)  | Original 8-bar tune; choose an ending tag or a fade to the open G.                        |

Demos: lesson 1 `[[67], [50], [55], [59], [62]]`; lesson 3 `[[55, 59, 62], [], [50, 57, 60, 62], []]`; lesson 4 the pitch sequence `[[55], [59], [62], [67], [59], [62], [55], [62]]`. The guided exercise and Roll lab place these eight attacks at half-beat intervals; the Learn demo is a pitch-only reference.

## Exercise sketches

- **open-g** (12 beats, 60 BPM): pluck each open string on beats 0 to 3 and 4 to 7, then brush all five on beat 8, rests to 11.
- **pulse-brush** (16 beats): `muted: true` brushes on 0 and 2 of each bar, `rest` on 1 and 3. Copy `guitar-pulse`.
- **g-to-d7** (16 beats): `chordBars("banjo", ["G", "D7", "G", "D7"])`, `shapes: ["G", "D7"]`.
- **forward-roll** (16 beats, subdivision 2): per bar T-I-M-T-I-M-T-M on strings 3-2-1-5-2-1-3-1, at beats 0, 0.5, 1, 1.5, 2, 2.5, 3, 3.5. Labels T, I, M make the picking hand visible.
- **three-chord-loop** (16 beats): one bar each G, C, D7, G with eight roll notes at half-beat intervals and the chord name in `detail`.
- **hammer-and-slide** (16 beats): pick G string open (55), hammer to 57 on the and, slide 57 to 59 across beat 2, rest beat 3.
- **backup-and-break** (project, buildBeats 8, beats 16): Build two bars of vamp (muted chord on 2 and 4), Choose vamp or roll for bars 3 to 4, Refine one transition.
- **arrangement** (project, buildBeats 8, beats 17 with a landing on 16): Build the melody bars, Choose ending tag (D7 to G brush) or fade (open G ring), Refine the final bar.

Retry technique label: "The roll or the shapes felt awkward".

## Milestone

- Title: "Roll home to G". Goal: G, C, D7, G, one bar each, ending on a ringing open G.
- Cues: `copy("banjo-three-chord-loop")` with beat 12 replaced by a full brush of all five open strings held for 3.8 beats.
- Variation "Add a hammer-on": in bars 1 and 4, the roll's first note hammers 0 to 2 on the G string.
- Lessons: `banjo-open-g`, `banjo-pulse-brush`, `banjo-g-to-d7`.

## Daily-loop lessons (practice layer)

Tracks: foundations, rolls, changes. First session ids: orientation warmup (open strings), G to D7 shape, two-chord song "Creek Road" with `process: "perform"`. Add one `respond` lesson (same or different: roll versus brush) and one `create` lesson with options `G` and `G–D7`.

## Lab tabs

Roll, Pinch, Hammer, Slide, Vamp. Copy `uke-lab.tsx`; sounds use `pluck` per string frequency rather than `strum`.

## Risks

- The `"four"` theory neck name is misleading but functional. Do not add a fifth string to `TheoryFretboard` without checking the 320px layout.
- `ChordDiagram` computes width from the number of strings, so a five-string diagram is wider than ukulele; check the compact size in Today and Skills.

## Accuracy repairs (September 2026)

D7 brushes now use x–0–2–1–0, with the first string open and the fifth skipped. D brushes also skip the fifth, preserving PR #17. Rolls use 0–0–2–1–0 with the open high-G drone. Learn, Today and the lab use eight roll attacks in four quarter-note beats. The muted backbeat requires light contact across all five strings; releasing an open shape cannot mute it. This is an unpitched rhythm exercise, not a closed-shape vamp lesson. Player review is still outstanding.
