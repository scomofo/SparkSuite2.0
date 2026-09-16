# Handoff: adding banjo, mandolin, and violin

This folder is for whoever adds the next three instruments. It records how the existing lesson content for guitar, piano, ukulele, bass, drums, and vocals is built, which rules the tests enforce, and a concrete brief for each new instrument.

| Document                                             | Read it when                                               |
| ---------------------------------------------------- | ---------------------------------------------------------- |
| [content-review.md](./content-review.md)             | You want to understand the four content layers that exist. |
| [content-guide.md](./content-guide.md)               | You are writing lesson text, exercises, or a piece.        |
| [adding-an-instrument.md](./adding-an-instrument.md) | You are wiring a new instrument through the code.          |
| [banjo.md](./banjo.md)                               | Brief for the five-string banjo path.                      |
| [mandolin.md](./mandolin.md)                         | Brief for the mandolin path.                               |
| [violin.md](./violin.md)                             | Brief for the violin path.                                 |
| [lapsteel.md](./lapsteel.md)                         | Brief for the lap steel path, added after the first three. |

## The short version

Every instrument in SparkSuite carries four kinds of content. All four must exist before the app treats an instrument as complete, because the tests count them.

1. **Daily-loop lessons** in `src/lib/spark/instruments.ts` (guitar lives in `guitar.ts`). Short `Lesson` objects that the Today loop turns into timed exercises. Three of them are named as the first session.
2. **Learn curriculum** in `src/lib/spark/curriculum.ts`. Exactly eight `LearningLesson` entries per instrument, two per level, each with an explanation, example, three practice steps, and a three-option check.
3. **Guided exercises** in `src/lib/spark/lesson-practice.ts`. One `LessonExercise` per curriculum lesson, with beat-by-beat cues. The final two per instrument are three-stage projects.
4. **First piece** in `src/lib/spark/milestones.ts`. One `MusicalMilestone` per instrument with a base version and a variation.

Around that content sit the instrument definition (tuning, surface, chords), the technique lab, the theory neck, the tuner header, the studio mark image, the tests, and the browser checks. The checklist in [adding-an-instrument.md](./adding-an-instrument.md) walks every touchpoint in order.

## Suggested order of work

Do one instrument end to end before starting the next. All three instruments are done and serve as worked examples: four strings, standard chord shapes, and the theory neck already handles four-string tunings. Banjo needs a decision about the short fifth string. Violin has no chord shapes and no neck view; see its brief for how that was handled.

## Open items

- **Instrument marks are placeholders.** `public/instruments/mandolin.jpg`, `banjo.jpg`, `violin.jpg`, and `lapsteel.jpg` are vector drawings rendered at 512×512 to match the framing, tilt, and warm spotlight of the six product photos. They are not photographs. Swap in real photos at the same paths when available; the mark component needs no change.
- **Musical content needs a player's review.** The mandolin and banjo chord voicings, the violin first-position notes, and the lap steel bar positions are standard beginner material but have not been checked by someone who plays.

## What this handoff does not decide

- Count assertions in the unit tests now derive from `INSTRUMENTS.length`; the browser scripts still carry literal counts (10 instruments, 80 exercises) that move with each addition.

All lesson text in the briefs is a starting outline, not final copy. Check the musical facts against a method book before shipping, and keep the honest-progress language described in the content guide.
