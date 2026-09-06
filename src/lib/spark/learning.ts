import { isDayKey, localDayKey } from "../utils.ts";
import { CURRICULUM, learningLesson, learningPath } from "./curriculum.ts";
import { INSTRUMENTS, type InstrumentId } from "./instruments.ts";

export const LEARNING_KEY = "sparksuite.learning.v1";
export const REVIEW_DAYS = [1, 3, 7, 14] as const;
export type LearningRecord = {
  step: 0 | 1 | 2 | 3;
  answer?: number;
  completedOn?: string;
  reviewOn?: string;
  lastReviewedOn?: string;
  reviews: number;
};
export type LearningState = {
  version: 1;
  records: Record<string, LearningRecord>;
  active: Partial<Record<InstrumentId, string>>;
  pace: "step" | "lesson";
};
export const emptyLearning = (): LearningState => ({
  version: 1,
  records: {},
  active: {},
  pace: "step",
});
const newRecord = (): LearningRecord => ({ step: 0, reviews: 0 });

function addDays(day: string, count: number) {
  const date = new Date(`${day}T12:00:00`);
  date.setDate(date.getDate() + count);
  return localDayKey(date);
}

/** Parse only known lessons and valid calendar dates; unrelated practice saves are never touched. */
export function parseLearning(text: string): LearningState {
  try {
    if (text.length > 100_000) return emptyLearning();
    const raw = JSON.parse(text);
    if (!raw || raw.version !== 1) return emptyLearning();
    const next = emptyLearning();
    next.pace = raw.pace === "lesson" ? "lesson" : "step";
    for (const lesson of CURRICULUM) {
      const saved = raw.records?.[lesson.id];
      if (!saved || typeof saved !== "object") continue;
      const record = newRecord();
      if (saved.step === 1 || saved.step === 2 || saved.step === 3) record.step = saved.step;
      if (
        Number.isInteger(saved.answer) &&
        saved.answer >= 0 &&
        saved.answer < lesson.options.length
      )
        record.answer = saved.answer;
      if (isDayKey(saved.completedOn)) record.completedOn = saved.completedOn;
      if (record.completedOn) {
        record.reviews = Number.isInteger(saved.reviews)
          ? Math.max(0, Math.min(3, saved.reviews))
          : 0;
        const lastReviewedOn =
          isDayKey(saved.lastReviewedOn) && saved.lastReviewedOn >= record.completedOn
            ? saved.lastReviewedOn
            : record.completedOn;
        record.lastReviewedOn = lastReviewedOn;
        record.reviewOn =
          isDayKey(saved.reviewOn) && saved.reviewOn > lastReviewedOn
            ? saved.reviewOn
            : addDays(lastReviewedOn, REVIEW_DAYS[record.reviews]);
      }
      // Invalid completion cannot turn an unanswered check into a finished lesson.
      if (record.step === 3 && (!record.completedOn || record.answer !== lesson.answer))
        record.step = 2;
      if (record.step < 2) delete record.answer;
      next.records[lesson.id] = record;
    }
    for (const instrument of INSTRUMENTS) {
      const id = raw.active?.[instrument.id];
      if (
        typeof id === "string" &&
        learningLesson(id)?.instrument === instrument.id &&
        next.records[id]
      )
        next.active[instrument.id] = id;
    }
    return next;
  } catch {
    return emptyLearning();
  }
}

export function loadLearning(): { data: LearningState; storageOk: boolean } {
  try {
    const text = localStorage.getItem(LEARNING_KEY);
    return { data: text ? parseLearning(text) : emptyLearning(), storageOk: true };
  } catch {
    return { data: emptyLearning(), storageOk: false };
  }
}
export function saveLearning(data: LearningState): boolean {
  try {
    localStorage.setItem(LEARNING_KEY, JSON.stringify(data));
    return true;
  } catch {
    return false;
  }
}

export function beginLearning(data: LearningState, id: string): LearningState {
  const lesson = learningLesson(id);
  if (!lesson) return data;
  const previous = data.records[id];
  // A completed lesson can be deliberately revisited without losing its milestone.
  const record =
    previous?.step === 3
      ? { ...previous, step: 0 as const, answer: undefined }
      : (previous ?? newRecord());
  return {
    ...data,
    active: { ...data.active, [lesson.instrument]: id },
    records: { ...data.records, [id]: record },
  };
}

export function advanceLearning(data: LearningState, id: string): LearningState {
  const record = data.records[id];
  if (!learningLesson(id) || !record || (record.step !== 0 && record.step !== 1)) return data;
  return {
    ...data,
    records: { ...data.records, [id]: { ...record, step: record.step === 0 ? 1 : 2 } },
  };
}

export function answerLearning(data: LearningState, id: string, answer: number): LearningState {
  const lesson = learningLesson(id);
  const record = data.records[id];
  if (
    !lesson ||
    record?.step !== 2 ||
    !Number.isInteger(answer) ||
    answer < 0 ||
    answer >= lesson.options.length
  )
    return data;
  return { ...data, records: { ...data.records, [id]: { ...record, answer } } };
}

export function finishLearning(
  data: LearningState,
  id: string,
  today = localDayKey(),
): LearningState {
  const lesson = learningLesson(id);
  const record = data.records[id];
  if (!lesson || record?.step !== 2 || record.answer !== lesson.answer || !isDayKey(today))
    return data;
  const first = !record.completedOn;
  const review =
    !first && !!record.reviewOn && record.reviewOn <= today && record.lastReviewedOn !== today;
  const reviews = review ? Math.min(3, record.reviews + 1) : record.reviews;
  return {
    ...data,
    records: {
      ...data.records,
      [id]: {
        ...record,
        step: 3,
        completedOn: record.completedOn ?? today,
        reviews,
        lastReviewedOn: first || review ? today : record.lastReviewedOn,
        reviewOn: first || review ? addDays(today, REVIEW_DAYS[reviews]) : record.reviewOn,
      },
    },
  };
}

export function learningSummary(
  data: LearningState,
  instrument: InstrumentId,
  today = localDayKey(),
) {
  const lessons = learningPath(instrument);
  const currentId = data.active[instrument];
  const candidate = currentId ? learningLesson(currentId) : undefined;
  const active = candidate && (data.records[candidate.id]?.step ?? 3) < 3 ? candidate : undefined;
  const next = lessons.find((lesson) => !data.records[lesson.id]?.completedOn);
  const due = lessons
    .filter((lesson) => {
      const record = data.records[lesson.id];
      return !!record?.completedOn && !!record.reviewOn && record.reviewOn <= today;
    })
    .sort((a, b) => data.records[a.id].reviewOn!.localeCompare(data.records[b.id].reviewOn!));
  return {
    lessons,
    active,
    next,
    due,
    completed: lessons.filter((lesson) => data.records[lesson.id]?.completedOn).length,
    // Resume first, then offer one review. New material always remains available.
    recommended: active ?? due[0] ?? next ?? lessons[0],
    reason: active ? "resume" : due.length ? "review" : next ? "new" : "explore",
  };
}
