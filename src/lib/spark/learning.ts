import { isDayKey, localDayKey } from "../utils.ts";
import { CURRICULUM, learningLesson, learningPath } from "./curriculum.ts";
import { INSTRUMENTS, type InstrumentId } from "./instruments.ts";
import { parseProfile, startingLesson, type LearningProfile } from "./learning-profile.ts";
import { parseMilestone, type MilestoneRecord } from "./milestones.ts";
import {
  lessonExercise,
  parsePractice,
  practiceTempo,
  type LearningPractice,
  type PracticeGuide,
  type PracticeReflection,
  type PracticeRetryFocus,
} from "./lesson-practice.ts";

export const LEARNING_KEY = "sparksuite.learning.v1";
export const REVIEW_DAYS = [1, 3, 7, 14] as const;
export type LearningRecord = {
  step: 0 | 1 | 2 | 3;
  answer?: number;
  completedOn?: string;
  reviewOn?: string;
  lastReviewedOn?: string;
  reviews: number;
  practice?: LearningPractice;
};
export type LearningState = {
  version: 1;
  records: Record<string, LearningRecord>;
  active: Partial<Record<InstrumentId, string>>;
  pace: "step" | "lesson";
  profiles: Partial<Record<InstrumentId, LearningProfile>>;
  skippedSetup: Partial<Record<InstrumentId, boolean>>;
  milestones: Partial<Record<InstrumentId, MilestoneRecord>>;
  focus: Partial<Record<InstrumentId, "lesson" | "milestone">>;
};
export const emptyLearning = (): LearningState => ({
  version: 1,
  records: {},
  active: {},
  pace: "step",
  profiles: {},
  skippedSetup: {},
  milestones: {},
  focus: {},
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
      const exercise = lessonExercise(lesson.id);
      const practice = exercise
        ? parsePractice(saved.practice, exercise.bpm, exercise.project)
        : undefined;
      if (practice) record.practice = practice;
      next.records[lesson.id] = record;
    }
    for (const instrument of INSTRUMENTS) {
      const profile = parseProfile(raw.profiles?.[instrument.id]);
      if (profile) next.profiles[instrument.id] = profile;
      if (raw.skippedSetup?.[instrument.id] === true) next.skippedSetup[instrument.id] = true;
      const milestone = parseMilestone(raw.milestones?.[instrument.id], instrument.id);
      if (milestone) next.milestones[instrument.id] = milestone;
      const focus = raw.focus?.[instrument.id];
      if (focus === "lesson" || (focus === "milestone" && milestone))
        next.focus[instrument.id] = focus;
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
  const exercise = lessonExercise(id);
  const previous = data.records[id];
  // A completed lesson can be deliberately revisited without losing its milestone.
  const record =
    previous?.step === 3
      ? {
          ...previous,
          step: 0 as const,
          answer: undefined,
          ...(previous.practice
            ? {
                practice: {
                  bpm: previous.practice.bpm,
                  guide: previous.practice.guide,
                  phase: "ready" as const,
                  ...(exercise?.project ? { projectStage: 0 as const } : {}),
                },
              }
            : {}),
        }
      : (previous ?? newRecord());
  return {
    ...data,
    active: { ...data.active, [lesson.instrument]: id },
    focus: { ...data.focus, [lesson.instrument]: "lesson" },
    records: { ...data.records, [id]: record },
  };
}

/** Opening a guided exercise never completes a lesson or awards a timing score. */
export function beginLessonPractice(data: LearningState, id: string): LearningState {
  const exercise = lessonExercise(id);
  if (!exercise) return data;
  const next = beginLearning(data, id);
  const record = next.records[id];
  return {
    ...next,
    records: {
      ...next.records,
      [id]: {
        ...record,
        step: record.step === 0 ? 1 : record.step,
        practice: record.practice
          ? {
              ...record.practice,
              ...(exercise.project && record.practice.projectStage === undefined
                ? { projectStage: 0 as const }
                : {}),
            }
          : {
              bpm: exercise.bpm,
              guide: "notes",
              phase: "ready",
              ...(exercise.project ? { projectStage: 0 as const } : {}),
            },
      },
    },
  };
}

export type PracticeAction =
  | { type: "tempo"; bpm: number }
  | { type: "guide"; guide: PracticeGuide }
  | { type: "attempt" }
  | { type: "reflect"; reflection: PracticeReflection }
  | { type: "retry-focus"; focus: PracticeRetryFocus }
  | { type: "retry" }
  | { type: "project-choice"; choice: 0 | 1 }
  | { type: "project-next" }
  | { type: "return" };

export function updateLessonPractice(
  data: LearningState,
  id: string,
  action: PracticeAction,
): LearningState {
  const lesson = learningLesson(id);
  const exercise = lessonExercise(id);
  const record = data.records[id];
  if (!lesson || !exercise || !record?.practice || record.step === 3) return data;
  let practice = record.practice;
  let step = record.step;
  switch (action.type) {
    case "tempo":
      practice = { ...practice, bpm: practiceTempo(action.bpm, practice.bpm) };
      break;
    case "guide":
      if (!["notes", "pulse", "silent"].includes(action.guide)) return data;
      practice = { ...practice, guide: action.guide };
      break;
    case "attempt":
      if (
        practice.phase !== "ready" ||
        (exercise.project && (practice.projectStage !== 2 || practice.projectChoice === undefined))
      )
        return data;
      {
        const { retryFocus: _retryFocus, reflection: _reflection, ...rest } = practice;
        practice = { ...rest, phase: "reflect" };
      }
      break;
    case "reflect":
      if (practice.phase !== "reflect" || !["again", "ready"].includes(action.reflection))
        return data;
      if (action.reflection === "ready") {
        const { retryFocus: _retryFocus, ...rest } = practice;
        practice = { ...rest, reflection: action.reflection };
      } else practice = { ...practice, reflection: action.reflection };
      break;
    case "retry-focus":
      if (
        practice.phase !== "reflect" ||
        practice.reflection !== "again" ||
        !["pulse", "technique"].includes(action.focus)
      )
        return data;
      practice = { ...practice, retryFocus: action.focus };
      break;
    case "retry":
      if (practice.phase !== "reflect" || practice.reflection !== "again" || !practice.retryFocus)
        return data;
      {
        const { reflection: _reflection, ...rest } = practice;
        practice = {
          ...rest,
          phase: "ready",
          ...(practice.retryFocus === "pulse" ? { bpm: 40, guide: "pulse" as const } : {}),
        };
      }
      break;
    case "project-choice":
      if (
        practice.phase !== "ready" ||
        !exercise.project ||
        practice.projectStage !== 1 ||
        (action.choice !== 0 && action.choice !== 1)
      )
        return data;
      practice = { ...practice, projectChoice: action.choice };
      break;
    case "project-next":
      if (
        practice.phase !== "ready" ||
        !exercise.project ||
        practice.projectStage === undefined ||
        practice.projectStage >= 2 ||
        (practice.projectStage === 1 && practice.projectChoice === undefined)
      )
        return data;
      practice = {
        ...practice,
        projectStage: (practice.projectStage + 1) as 1 | 2,
      };
      break;
    case "return":
      if (
        practice.phase !== "reflect" ||
        !practice.reflection ||
        (exercise.project && (practice.projectStage !== 2 || practice.projectChoice === undefined))
      )
        return data;
      if (step === 1) step = 2;
      break;
  }
  return {
    ...data,
    focus: { ...data.focus, [lesson.instrument]: "lesson" },
    records: { ...data.records, [id]: { ...record, step, practice } },
  };
}

export function advanceLearning(data: LearningState, id: string): LearningState {
  const lesson = learningLesson(id);
  const record = data.records[id];
  if (!lesson || !record || (record.step !== 0 && record.step !== 1)) return data;
  if (record.step === 1 && lessonExercise(id)?.project) return data;
  return {
    ...data,
    focus: { ...data.focus, [lesson.instrument]: "lesson" },
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
  return {
    ...data,
    focus: { ...data.focus, [lesson.instrument]: "lesson" },
    records: { ...data.records, [id]: { ...record, answer } },
  };
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
  const start = startingLesson(instrument, data.profiles[instrument]);
  const next = lessons
    .slice(lessons.indexOf(start))
    .find((lesson) => !data.records[lesson.id]?.completedOn);
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
    recommended: active ?? due[0] ?? next ?? start,
    reason: active ? "resume" : due.length ? "review" : next ? "new" : "explore",
  };
}

export function configureLearning(
  data: LearningState,
  instrument: InstrumentId,
  input: LearningProfile,
): LearningState {
  const profile = parseProfile(input);
  if (!profile || !INSTRUMENTS.some((item) => item.id === instrument)) return data;
  return { ...data, profiles: { ...data.profiles, [instrument]: profile } };
}
export function learningPace(data: LearningState, instrument: InstrumentId) {
  const profile = data.profiles[instrument];
  return profile ? (profile.minutes === 2 ? "step" : "lesson") : data.pace;
}
