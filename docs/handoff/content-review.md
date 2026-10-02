# Current learning content map

The app supports guitar, piano, ukulele, bass, drums, vocals, mandolin, banjo, violin and lap steel. Design for an adult learner: give one clear task, preserve pause/resume, offer explanations without forcing rereading, and keep corrections useful rather than punitive.

| Layer | Source | Current scope |
| --- | --- | --- |
| Learn | `src/lib/spark/curriculum.ts` | 80 lessons, eight per instrument; four levels with two lessons each |
| Guided exercises | `src/lib/spark/lesson-practice.ts` | One per Learn lesson; the last two per instrument have Build/Choose/Refine projects |
| Optional musicianship | `src/lib/spark/side-quests.ts`, `side-quest-practice.ts` | Four authored side quests and patterns per instrument |
| First pieces | `src/lib/spark/milestones.ts` | Instrument-specific pieces with a saved variation and self-assessment |
| Daily practice | `src/lib/spark/guitar.ts`, `instruments.ts` | Separate instrument practice loops; Learn completion does not award timing XP |

## Teaching and progress

Core explanations are direct. Extra practical context and terminology are optional expanders. Creative application is the learner-facing name of the final level; internal IDs remain `advanced` for save compatibility.

A completed lesson opens at the recall question when revisited. First answer and assistance are saved separately from the final corrected answer. Corrected completion still counts, but assisted due reviews return the next day instead of earning longer spacing. The original completion date is retained. Opening the explanation during a check marks that attempt assisted.

Authored alternate checks cover the first lesson on every instrument, plus guitar pulse. Other checks retain their authored question and rotate option order on review. This reduces answer-position cues but is not a complete bank of transfer questions for all 80 lessons.

## Extension guidance

Keep the explanation, concrete example, practice cues, check and feedback aligned. Give a prerequisite refresher for unfamiliar chord or rhythm notation. Specify tuning and string order; preserve comfortable-octave and listen-only alternatives for vocals. Completion is learner-reported practice plus a conceptual check, not measured instrumental mastery.

Existing projects already include a separate independent performance after the reference stops. Preserve that distinction when changing phrase length. Broader transfer examples and real-instrument assessment remain future work.
