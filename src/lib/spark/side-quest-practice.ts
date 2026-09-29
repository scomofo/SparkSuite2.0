import type { LessonExercise, PracticeCue } from "./lesson-practice.ts";
import { sideQuestsFor, SIDE_QUESTS } from "./side-quests.ts";
import type { InstrumentId } from "./instruments.ts";

const melodicRoots: Record<Exclude<InstrumentId, "drums">, number[]> = {
  guitar: [52, 55, 57, 59],
  piano: [60, 62, 64, 67],
  ukulele: [60, 64, 67, 69],
  bass: [40, 43, 45, 47],
  vocals: [60, 62, 64, 67],
  mandolin: [55, 57, 59, 62],
  banjo: [55, 59, 62, 67],
  violin: [62, 64, 66, 67],
  lapsteel: [60, 64, 67, 69],
};

function melodicCues(instrument: Exclude<InstrumentId, "drums">, levelIndex: number): PracticeCue[] {
  const notes = melodicRoots[instrument];
  const rotate = levelIndex % notes.length;
  const seq = [...notes.slice(rotate), ...notes.slice(0, rotate)];
  return Array.from({ length: 8 }, (_, beat) => {
    const midi = seq[beat % seq.length];
    return {
      beat,
      label: beat === 7 ? "Land" : String(beat + 1),
      detail:
        beat === 7
          ? "Finish deliberately; let the final sound settle."
          : beat % 4 === 3
            ? "Leave this beat spacious and keep counting."
            : "Match the pulse, then notice the sound rather than chasing it.",
      notes: beat % 4 === 3 ? [] : [midi],
      duration: beat === 7 ? 1.8 : 0.8,
    };
  });
}

function drumCues(levelIndex: number): PracticeCue[] {
  return Array.from({ length: 8 }, (_, beat) => {
    const pos = beat % 4;
    const pads =
      levelIndex === 0
        ? pos === 1 || pos === 3
          ? [1]
          : []
        : levelIndex === 1
          ? pos === 0 || pos === 2
            ? [0, 2]
            : [2, ...(pos === 1 || pos === 3 ? [1] : [])]
          : levelIndex === 2
            ? [2, ...(pos === 1 || pos === 3 ? [1] : []), ...(pos === 0 ? [0] : [])]
            : pos === 0
              ? [0, 2]
              : pos === 3
                ? [1, 3]
                : pos === 1
                  ? [1, 2]
                  : [2];
    return {
      beat,
      label: pads.length ? "Hit" : "Space",
      detail: pos === 0 ? "Hear the downbeat clearly." : "Keep the pocket even.",
      pads,
    };
  });
}

export function sideQuestExercise(id: string | undefined): LessonExercise | undefined {
  const quest = SIDE_QUESTS.find((item) => item.id === id);
  if (!quest) return undefined;
  const levelIndex = ["foundations", "beginner", "intermediate", "advanced"].indexOf(quest.level);
  return {
    lessonId: quest.id,
    title: quest.title,
    goal: quest.challenge,
    setup: quest.purpose,
    hint: quest.listenFor,
    takeaway: "Notice one useful thing, then stop. Side quests are experiments, not tests.",
    bpm: quest.instrument === "drums" ? 70 : quest.instrument === "bass" ? 60 : 50 + levelIndex * 10,
    beats: 8,
    cues:
      quest.instrument === "drums"
        ? drumCues(levelIndex)
        : melodicCues(quest.instrument as Exclude<InstrumentId, "drums">, levelIndex),
  };
}

export function sideQuestById(id: string | undefined) {
  return SIDE_QUESTS.find((quest) => quest.id === id);
}

export function sideQuestExercisesFor(instrument: InstrumentId) {
  return sideQuestsFor(instrument)
    .map((quest) => sideQuestExercise(quest.id))
    .filter((exercise): exercise is LessonExercise => !!exercise);
}
