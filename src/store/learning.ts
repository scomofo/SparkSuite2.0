import { create } from "zustand";
import {
  advanceLearning,
  answerLearning,
  beginLearning,
  beginLessonPractice,
  emptyLearning,
  finishLearning,
  loadLearning,
  saveLearning,
  updateLessonPractice,
  configureLearning,
  type PracticeAction,
  type LearningState,
} from "@/lib/spark/learning";
import { beginMilestone, updateMilestone, type MilestoneAction } from "@/lib/spark/milestones";
import type { InstrumentId } from "@/lib/spark/instruments";
import type { LearningProfile } from "@/lib/spark/learning-profile";

type LearningStore = {
  data: LearningState;
  hydrated: boolean;
  storageOk: boolean;
  hydrate: () => void;
  begin: (id: string) => void;
  advance: (id: string) => void;
  answer: (id: string, answer: number) => void;
  finish: (id: string) => void;
  setPace: (pace: LearningState["pace"], instrument?: InstrumentId) => void;
  configure: (instrument: InstrumentId, profile: LearningProfile) => void;
  skipSetup: (instrument: InstrumentId) => void;
  beginMilestone: (instrument: InstrumentId) => void;
  milestoneAction: (instrument: InstrumentId, action: MilestoneAction) => void;
  beginPractice: (id: string) => void;
  practiceAction: (id: string, action: PracticeAction) => void;
};

export const useLearning = create<LearningStore>((set, get) => {
  const update = (transform: (data: LearningState) => LearningState) => {
    if (!get().hydrated) return;
    const data = transform(get().data);
    if (data === get().data) return;
    set({ data, storageOk: saveLearning(data) });
  };
  return {
    data: emptyLearning(),
    hydrated: false,
    storageOk: true,
    hydrate: () => {
      if (!get().hydrated) set({ ...loadLearning(), hydrated: true });
    },
    begin: (id) => update((data) => beginLearning(data, id)),
    advance: (id) => update((data) => advanceLearning(data, id)),
    answer: (id, answer) => update((data) => answerLearning(data, id, answer)),
    finish: (id) => update((data) => finishLearning(data, id)),
    setPace: (pace, instrument) =>
      update((data) => {
        const profile = instrument ? data.profiles[instrument] : undefined;
        const next =
          profile && instrument
            ? configureLearning(data, instrument, {
                ...profile,
                minutes: pace === "step" ? 2 : profile.minutes === 10 ? 10 : 5,
              })
            : data;
        return { ...next, pace };
      }),
    configure: (instrument, profile) =>
      update((data) => configureLearning(data, instrument, profile)),
    skipSetup: (instrument) =>
      update((data) => ({ ...data, skippedSetup: { ...data.skippedSetup, [instrument]: true } })),
    beginMilestone: (instrument) => update((data) => beginMilestone(data, instrument)),
    milestoneAction: (instrument, action) =>
      update((data) => updateMilestone(data, instrument, action)),
    beginPractice: (id) => update((data) => beginLessonPractice(data, id)),
    practiceAction: (id, action) => update((data) => updateLessonPractice(data, id, action)),
  };
});
