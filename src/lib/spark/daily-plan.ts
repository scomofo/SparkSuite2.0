import { localDayKey } from "@/lib/utils";
import { FIRST_PROMISE, LESSONS, lessonById, nextLesson } from "./guitar";
import {
  firstLessonIds,
  instrumentById,
  lessonByIdFor,
  lessonsFor,
  nextLessonFor,
  promiseFor,
  withSurface,
  type InstrumentId,
} from "./instruments";
import { feelFor, scaledBpm, type PlanFeel } from "./psychology";
import { analysisFor, criteriaFor, nextUnlockedProcess, processPromise } from "./nafme";
import type { DailyPlan, PlanItem, ProgressState } from "./types";

function warmupItem(progress: ProgressState, bpm: number, firstDay: boolean, windowMs: number): PlanItem {
  const needsTune = !firstDay && (progress.mastery["lesson_guitar_tuning_01"] ?? 0) < 0.7;
  const lesson = lessonById(needsTune ? "lesson_guitar_tuning_01" : "lesson_guitar_open_strings_01")!;
  return {
    id: "warmup",
    type: "warmup",
    title: needsTune ? "Tune + open strings" : "Open-string pulse",
    subtitle: "Low E to high e, on the beat",
    durationSec: 90,
    lessonId: lesson.id,
    chords: [],
    pattern: "D",
    bars: 8,
    bpm,
    windowMs,
    objectives: lesson.objectives,
    role: "warmup",
    criteria: criteriaFor(lesson),
  };
}

function fromLesson(lessonId: string, feel: PlanFeel, extra?: Partial<PlanItem>, instrument: InstrumentId = "guitar"): PlanItem {
  const lesson = instrument === "guitar" ? (lessonById(lessonId) ?? LESSONS[0]) : lessonByIdFor(instrument, lessonId);
  const bpm = scaledBpm(lesson.bpm, feel);
  const inst = instrumentById(instrument);
  const process = lesson.process;
  const criteria = criteriaFor(lesson);
  const analysis = analysisFor(lesson.chords, lesson.analysis);
  return withSurface(
    {
      id: lesson.id,
      type: lesson.type,
      title: lesson.title,
      subtitle: lesson.why ?? lesson.objectives[0] ?? "",
      durationSec: Math.round((lesson.bars * 4 * 60) / bpm),
      lessonId: lesson.id,
      chords: lesson.chords,
      pattern: lesson.pattern,
      bars: lesson.bars,
      bpm,
      windowMs: feel.windowMs,
      objectives: lesson.objectives,
      role: lesson.type === "warmup" ? "warmup" : "new",
      repertoire: lesson.repertoire,
      criteria,
      process,
      createOptions: lesson.createOptions,
      listenPrompt: lesson.listenPrompt,
      why: lesson.why,
      interpret: lesson.interpret,
      analysis,
      ...extra,
    },
    inst,
  );
}

function weakestSkill(progress: ProgressState, instrument: InstrumentId) {
  const list = instrument === "guitar" ? LESSONS : lessonsFor(instrument);
  const started = list.filter((l) => (progress.mastery[l.id] ?? 0) > 0 && (progress.mastery[l.id] ?? 0) < l.masteryRequired);
  if (!started.length) return null;
  return started.sort((a, b) => (progress.mastery[a.id] ?? 0) - (progress.mastery[b.id] ?? 0))[0];
}

function firstSessionPlan(progress: ProgressState, date: string, feel: PlanFeel, instrument: InstrumentId): DailyPlan {
  const inst = instrumentById(instrument);
  const ids = firstLessonIds(instrument);
  const items = ids.map((id, i) => {
    if (i === 0) return fromLesson(id, feel, { id: "warmup", type: "warmup", role: "warmup" }, instrument);
    if (i === ids.length - 1) return fromLesson(id, feel, { id: "groove", type: "song", role: "challenge" }, instrument);
    return fromLesson(id, feel, { role: "new" }, instrument);
  });
  return {
    date,
    minutes: 10,
    promise: promiseFor(instrument),
    items: items.map((it) => withSurface(it, inst)),
  };
}

function guitarFirst(progress: ProgressState, date: string, feel: PlanFeel): DailyPlan {
  const bpm = scaledBpm(70, feel);
  const warmup = warmupItem(progress, bpm, true, feel.windowMs);
  const em = fromLesson("lesson_guitar_em_chord_01", feel, {
    subtitle: "Two fingers. Strum when the note hits the line.",
    role: "new",
  });
  const groove = fromLesson("lesson_guitar_song_first_two_chord_01", feel, {
    id: "groove",
    type: "song",
    title: "Night Bus",
    subtitle: "Em → G. Stay with the pulse.",
    bars: 8,
    durationSec: 64,
    role: "challenge",
    repertoire: "Night Bus",
  });
  return {
    date,
    minutes: 10,
    promise: FIRST_PROMISE,
    items: [warmup, em, groove].map((it) => withSurface(it, instrumentById("guitar"))),
  };
}

/** WHAT to practise today. Curriculum decides the lesson; psychology decides length/tempo. */
export function generateDailyPlan(
  progress: ProgressState,
  date = localDayKey(),
  instrument: InstrumentId = "guitar",
): DailyPlan {
  const feel = feelFor(progress);
  const firstDay = progress.history.length === 0;
  if (firstDay) {
    return instrument === "guitar" ? guitarFirst(progress, date, feel) : firstSessionPlan(progress, date, feel, instrument);
  }

  const next = instrument === "guitar" ? nextLesson(progress.mastery) : nextLessonFor(instrument, progress.mastery);
  const weak = weakestSkill(progress, instrument);
  const inst = instrumentById(instrument);
  const items: PlanItem[] = [
    instrument === "guitar"
      ? withSurface(warmupItem(progress, scaledBpm(70, feel), false, feel.windowMs), inst)
      : fromLesson(firstLessonIds(instrument)[0], feel, { id: "warmup", type: "warmup" }, instrument),
  ];
  if (feel.extraWarmup) items[0] = { ...items[0], durationSec: 120, bars: 12 };

  if (weak && weak.id !== next.id) {
    items.push(
      fromLesson(
        weak.id,
        feel,
        {
          id: `review-${weak.id}`,
          title: `Review · ${weak.title}`,
          subtitle: "Yesterday's sticky spot",
          role: "review",
        },
        instrument,
      ),
    );
  }

  items.push(fromLesson(next.id, feel, {}, instrument));

  const processPick = nextUnlockedProcess(lessonsFor(instrument), progress.mastery, next.id);

  if (feel.challenge && processPick) {
    items.push(
      fromLesson(
        processPick.id,
        feel,
        {
          id: "challenge",
          role: "challenge",
          bars: Math.min(8, processPick.bars),
        },
        instrument,
      ),
    );
  } else if (feel.challenge && (next.chords.length || instrument === "drums")) {
    items.push(
      fromLesson(
        next.id,
        feel,
        {
          id: "challenge",
          type: next.chords.length > 1 ? "song" : "rhythm",
          title: next.repertoire ?? (next.chords.length > 1 ? "Groove challenge" : "Clean four-beat hold"),
          subtitle: next.chords.length > 1 ? next.chords.join(" → ") : "Stay locked to the click",
          bars: Math.min(16, next.bars + 4),
          bpm: scaledBpm(next.bpm + 6, feel),
          role: "challenge",
        },
        instrument,
      ),
    );
  }

  const trimmed = items.slice(0, feel.itemCount);
  const minutes = Math.max(8, Math.round(trimmed.reduce((s, i) => s + i.durationSec, 0) / 60));

  return {
    date,
    minutes,
    promise: processPromise(next.repertoire ?? next.title, next.process, minutes),
    items: trimmed,
  };
}
