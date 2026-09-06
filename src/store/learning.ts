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
  type PracticeAction,
  type LearningState,
} from "@/lib/spark/learning";

type LearningStore = {
  data: LearningState;
  hydrated: boolean;
  storageOk: boolean;
  hydrate: () => void;
  begin: (id: string) => void;
  advance: (id: string) => void;
  answer: (id: string, answer: number) => void;
  finish: (id: string) => void;
  setPace: (pace: LearningState["pace"]) => void;
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
    setPace: (pace) => update((data) => ({ ...data, pace })),
    beginPractice: (id) => update((data) => beginLessonPractice(data, id)),
    practiceAction: (id, action) => update((data) => updateLessonPractice(data, id, action)),
  };
});
