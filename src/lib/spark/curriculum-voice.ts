import type { LearningLesson } from "./curriculum.ts";

export type LessonVoice = {
  opener: string;
  listenFor: string;
  permission: string;
};

const instrumentLanguage: Record<LearningLesson["instrument"], string> = {
  guitar: "hands, ears, and pulse",
  piano: "hands, ears, and the shape of the keyboard",
  ukulele: "strumming hand, chord hand, and pulse",
  bass: "fretting hand, plucking hand, and the groove",
  drums: "limbs, pulse, and the space between hits",
  vocals: "breath, pitch, and the shape of the phrase",
  mandolin: "pick hand, fretting hand, and pulse",
  banjo: "picking hand, fretting hand, and the roll",
  violin: "bow arm, left hand, and ear",
  lapsteel: "bar hand, picking hand, and the moving pitch",
};

const levelOpeners: Record<LearningLesson["level"], (lesson: LearningLesson) => string> = {
  foundations: (lesson) =>
    `This is a landmark lesson, not a performance test. “${lesson.title}” gives you one dependable place to start so the instrument feels less like a puzzle.`,
  beginner: (lesson) =>
    `You have enough of the map to make music now. “${lesson.title}” is about getting one small musical move under your fingers before adding anything else.`,
  intermediate: (lesson) =>
    `This is where technique starts serving a choice. In “${lesson.title},” the goal is not more notes; it is more control over what the listener hears.`,
  advanced: (lesson) =>
    `Treat “${lesson.title}” like a tiny piece of music rather than an exercise. Make a choice, hear what it changes, then keep the version that says what you want.`,
};

function focusFor(lesson: LearningLesson) {
  const text = `${lesson.id} ${lesson.title} ${lesson.outcome}`.toLowerCase();

  if (/pulse|eighth|rhythm|rest|backbeat|syncop|groove|polyrhythm|subdivision/.test(text))
    return "Listen for the pulse continuing underneath everything, especially through rests, changes, or off-beat notes.";
  if (/chord|triad|dominant|seventh|progression|cadence|harmony|voice-leading|major|minor/.test(text))
    return "Listen for what stays stable and what creates motion. The useful clue is usually a note that holds, moves by a small step, or creates tension before release.";
  if (/melody|phrase|motif|pentatonic|scale|tetrachord|line/.test(text))
    return "Listen for a shape you could sing back: where the idea begins, where it seems to lean, and where it feels finished.";
  if (/bow|slide|vibrato|hammer|finger|crossing|bar|pick|strum|roll|stroke|breath/.test(text))
    return "Listen for an even sound before you chase speed. A clean attack, relaxed motion, and a clear ending matter more than squeezing out extra notes.";
  if (/arrang|miniature|performance|create|refine|interpret|backup|break/.test(text))
    return "Listen for contrast and intention. You should be able to point to one choice that changed the feel, and one moment that clearly says “finished.”";

  return `Listen for the moment when your ${instrumentLanguage[lesson.instrument]} start working as one system instead of separate jobs.`;
}

function permissionFor(lesson: LearningLesson) {
  if (lesson.level === "foundations")
    return "A rough first sound is useful information. Stop after one clear attempt if your attention is done.";
  if (lesson.level === "beginner")
    return "Keep it slow enough that you can notice what happened. One clean bar teaches more than four rushed ones.";
  if (lesson.level === "intermediate")
    return "Make one variable better at a time. If the phrase falls apart, shrink it before you speed it up.";
  return "You are allowed to prefer one version over another. Advanced practice is partly learning to make and defend musical choices.";
}

export function lessonVoice(lesson: LearningLesson): LessonVoice {
  return {
    opener: levelOpeners[lesson.level](lesson),
    listenFor: focusFor(lesson),
    permission: permissionFor(lesson),
  };
}
