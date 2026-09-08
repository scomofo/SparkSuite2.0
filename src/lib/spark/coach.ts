import { isDayKey } from "../utils.ts";
import { COACH_INTENTS, type CoachContext, type CoachRequest } from "./coach-types.ts";
import { learningPath } from "./curriculum.ts";
import { INSTRUMENTS, type InstrumentId } from "./instruments.ts";
import { EXPERIENCE_OPTIONS } from "./learning-profile.ts";
import { emptyLearning, parseLearning, type LearningState } from "./learning.ts";
import {
  lessonExercise,
  practiceSequence,
  practiceShape,
  retryCoaching,
  type PracticeCue,
} from "./lesson-practice.ts";
import { milestoneSequence } from "./milestones.ts";
import { nextLearningAction } from "./next-learning-action.ts";

const REQUEST_FIELDS = [
  "instrument",
  "intent",
  "energy",
  "minutes",
  "question",
  "today",
  "learning",
];
const LEARNING_MAPS = [
  "records",
  "active",
  "profiles",
  "skippedSetup",
  "milestones",
  "focus",
] as const;
const MAX_LEARNING_LENGTH = 24_000;

function object(value: unknown): value is Record<string, unknown> {
  return !!value && typeof value === "object" && !Array.isArray(value);
}

/** Copy scalar fields only, before serialization; never carry arbitrary nested client data. */
function fields(value: unknown, names: string[]): Record<string, unknown> {
  if (!object(value)) return {};
  return Object.fromEntries(
    names.flatMap((name) => {
      const item = value[name];
      return typeof item === "string" || typeof item === "number" || typeof item === "boolean"
        ? [[name, item]]
        : [];
    }),
  );
}

/** The coach receives this instrument's structured progress, without personal milestone notes. */
export function scopeCoachLearning(data: LearningState, instrument: InstrumentId): LearningState {
  const scoped = emptyLearning();
  if (!INSTRUMENTS.some((item) => item.id === instrument)) return scoped;
  const records: Record<string, unknown> = {};
  for (const lesson of learningPath(instrument)) {
    const record = data.records?.[lesson.id];
    if (!object(record)) continue;
    records[lesson.id] = {
      ...fields(record, ["step", "answer", "completedOn", "reviewOn", "lastReviewedOn", "reviews"]),
      ...(object(record.practice)
        ? {
            practice: fields(record.practice, [
              "bpm",
              "guide",
              "phase",
              "reflection",
              "retryFocus",
              "projectStage",
              "projectChoice",
            ]),
          }
        : {}),
    };
  }
  const milestone = data.milestones?.[instrument];
  const settings = ["bpm", "guide", "variation", "reflection"];
  return parseLearning(
    JSON.stringify({
      ...scoped,
      pace: data.pace,
      records,
      active: fields(data.active, [instrument]),
      profiles: { [instrument]: fields(data.profiles?.[instrument], ["experience", "minutes"]) },
      skippedSetup: fields(data.skippedSetup, [instrument]),
      focus: fields(data.focus, [instrument]),
      milestones: object(milestone)
        ? {
            [instrument]: {
              ...fields(milestone, [...settings, "phase", "scope", "firstBarTried"]),
              note: "",
              ...(object(milestone.saved)
                ? { saved: { ...fields(milestone.saved, [...settings, "savedOn"]), note: "" } }
                : {}),
            },
          }
        : {},
    }),
  );
}

/** Reject malformed request envelopes; repair bounded progress with the existing save parser. */
export function parseCoachRequest(raw: unknown): CoachRequest | null {
  if (!object(raw) || Object.keys(raw).some((key) => !REQUEST_FIELDS.includes(key))) return null;
  const learning = raw.learning;
  const instrument = INSTRUMENTS.find((item) => item.id === raw.instrument)?.id;
  const intent = COACH_INTENTS.find((item) => item.id === raw.intent)?.id;
  if (
    !instrument ||
    !intent ||
    (raw.energy !== "low" && raw.energy !== "steady" && raw.energy !== "ready") ||
    (raw.minutes !== 2 && raw.minutes !== 5 && raw.minutes !== 10) ||
    typeof raw.question !== "string" ||
    raw.question.trim().length > 600 ||
    !isDayKey(raw.today) ||
    !object(learning) ||
    learning.version !== 1 ||
    (learning.pace !== "step" && learning.pace !== "lesson") ||
    LEARNING_MAPS.some((name) => !object(learning[name]))
  )
    return null;
  try {
    const serialized = JSON.stringify(learning);
    if (serialized.length > MAX_LEARNING_LENGTH) return null;
    return {
      instrument,
      intent,
      energy: raw.energy,
      minutes: raw.minutes,
      question: raw.question.trim(),
      today: raw.today,
      learning: scopeCoachLearning(parseLearning(serialized), instrument),
    };
  } catch {
    return null;
  }
}

function firstBar(cues: PracticeCue[]) {
  return cues
    .filter((cue) => cue.beat < 4)
    .slice(0, 16)
    .map((cue) => ({
      beat: cue.beat,
      label: cue.label,
      detail: cue.detail,
      ...(cue.chord ? { chord: cue.chord } : {}),
      ...(cue.notes ? { midiNotes: [...cue.notes] } : {}),
      ...(cue.pads ? { pads: cue.pads.map((pad) => ["Kick", "Snare", "Hi-hat", "Tom"][pad]) } : {}),
    }));
}

/** Deterministic targets and curriculum facts; asking the coach never changes learning progress. */
export function buildCoachContext(request: CoachRequest): CoachContext {
  const data = scopeCoachLearning(request.learning, request.instrument);
  const next = nextLearningAction(data, request.instrument, request.today);
  const profile = data.profiles[request.instrument];
  const base = {
    instrument: INSTRUMENTS.find((item) => item.id === request.instrument)!.name,
    experience:
      EXPERIENCE_OPTIONS.find((item) => item.id === profile?.experience)?.label ??
      "Not chosen; use a beginner starting point without assuming prior experience.",
    intent: request.intent,
    energy: request.energy,
    minutes: request.minutes,
    question: request.question,
    explored: next.summary.completed,
    total: next.summary.lessons.length,
  };
  if (next.kind === "milestone") {
    const piece = next.piece;
    const saved = data.milestones[request.instrument];
    const scope = saved?.scope ?? (profile?.minutes === 2 ? "first" : "whole");
    const phase = saved?.phase ?? "play";
    const sequence = milestoneSequence(piece, saved?.variation ?? false, scope);
    const pause =
      phase === "reflect"
        ? "Choose an honest reflection. Save a version only when you choose to; a note is optional."
        : scope === "first"
          ? "Try only the first bar, then pause. The whole piece can wait."
          : "Try one pass of the piece, then pause to reflect. There is no score to earn.";
    return {
      ...base,
      target: {
        kind: "milestone",
        id: request.instrument,
        title: piece.title,
        outcome: piece.goal,
        reason:
          next.reason === "resume"
            ? "Resume the piece at your saved checkpoint."
            : "Combine ideas from your explored lessons in a short piece.",
      },
      lesson: null,
      practice: null,
      milestone: {
        title: piece.title,
        goal: piece.goal,
        setup: piece.setup,
        phase,
        scope,
        bpm: saved?.bpm ?? piece.bpm,
        guide: saved?.guide ?? "notes",
        variation: saved?.variation ? { label: piece.variation, hint: piece.variationHint } : null,
        firstBarTried: saved?.firstBarTried ?? false,
        reflection: saved?.reflection ?? null,
        hasSavedVersion: !!saved?.saved,
        beats: sequence.beats,
        referenceScope: "First bar only; beat positions start at zero.",
        reference: firstBar(sequence.cues),
        pause,
      },
    };
  }
  const lesson = next.lesson;
  const record = data.records[lesson.id];
  // A revisit starts at Understand; previous practice settings are not an active checkpoint.
  const step = next.reason === "resume" ? (record?.step ?? 0) : 0;
  const saved = next.reason === "resume" ? record?.practice : undefined;
  const exercise = lessonExercise(lesson.id);
  const practiceTarget = step === 1 && !!(saved || exercise?.project);
  const stage = exercise?.project?.stages[saved?.projectStage ?? 0];
  const choice =
    saved?.projectChoice !== undefined
      ? exercise?.project?.choices[saved.projectChoice]
      : undefined;
  const retry =
    saved?.retryFocus && exercise
      ? retryCoaching(exercise).find((item) => item.id === saved.retryFocus)
      : undefined;
  const reason =
    next.reason === "review"
      ? "One previously explored idea is ready for a spaced revisit."
      : next.reason === "resume"
        ? practiceTarget
          ? retry
            ? "Resume the adjustment you chose for your next try."
            : stage
              ? `Resume your guided project at ${stage.label}.`
              : "Resume your guided exercise at its saved checkpoint."
          : `Resume the ${["Understand", "Try it", "Check"][step]} step.`
        : next.reason === "explore"
          ? "Explore an earlier idea; lessons outside your starting section remain available."
          : "This is the next lesson from your chosen starting point.";
  const sequence = exercise ? practiceSequence(exercise, saved) : undefined;
  return {
    ...base,
    target: {
      kind: practiceTarget ? "practice" : "lesson",
      id: lesson.id,
      title: lesson.title,
      outcome: lesson.outcome,
      reason,
    },
    lesson: {
      id: lesson.id,
      title: lesson.title,
      level: lesson.level,
      outcome: lesson.outcome,
      checkpoint: ["Understand", "Try it", "Check"][step],
      exploredBefore: !!record?.completedOn,
      explanation: lesson.explanation,
      example: lesson.example,
      practiceSteps: [...lesson.practice],
      pause:
        step === 2
          ? "Read the check and choose your own answer. You can pause before answering."
          : step === 1
            ? "Try one small part, then pause. Continue only when you choose."
            : "Read the idea and its example, then pause before trying it.",
    },
    practice:
      exercise && sequence
        ? {
            title: exercise.title,
            goal: exercise.goal,
            setup: exercise.setup,
            hint: exercise.hint,
            takeaway: exercise.takeaway,
            status: practiceTarget
              ? "Current guided checkpoint"
              : "Exercise reference; stay with the lesson checkpoint first",
            phase: saved?.phase ?? "ready",
            bpm: saved?.bpm ?? exercise.bpm,
            guide: saved?.guide ?? "notes",
            beats: sequence.beats,
            subdivision: sequence.subdivision ?? 1,
            reflection: saved?.reflection ?? null,
            retry: retry
              ? { focus: retry.id, label: retry.label, adjustment: retry.adjustment }
              : null,
            project: stage
              ? {
                  stage: stage.label,
                  title: stage.title,
                  instruction: stage.instruction,
                  choice: choice ? { ...choice } : null,
                  choices:
                    stage.label === "Choose"
                      ? exercise.project!.choices.map((item) => ({ ...item }))
                      : [],
                }
              : null,
            referenceScope:
              "First bar only; beat positions start at zero. This is a reference, not a performance assessment.",
            reference: firstBar(sequence.cues),
            shapes:
              exercise.shapes?.slice(0, 6).map((name) => ({
                name,
                frets: practiceShape(request.instrument, name)?.frets,
              })) ?? [],
            pause:
              saved?.phase === "reflect"
                ? saved.reflection === "again"
                  ? retry
                    ? `Use your chosen adjustment: ${retry.adjustment}`
                    : "Choose what felt tricky before another try; you can pause here."
                  : "Reflect on what you noticed. Continuing is your choice; no performance was graded."
                : retry
                  ? retry.adjustment
                  : stage
                    ? `${stage.instruction} Pause at the end of this stage; the next stage can wait.`
                    : "Try just the first bar once, then stop. Listening and following the cues is also an option.",
          }
        : null,
    milestone: null,
  };
}
