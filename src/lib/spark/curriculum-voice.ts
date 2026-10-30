import type { LearningLesson } from "./curriculum.ts";

export type LessonVoice = {
  opener: string;
  whyItMatters: string;
  listenFor: string;
  permission: string;
  reflection: string;
};

const instrumentLanguage: Record<LearningLesson["instrument"], string> = {
  guitar: "hands, ears, and pulse",
  piano: "hands, ears, and the keys under them",
  ukulele: "strumming hand, chord hand, and pulse",
  bass: "fretting hand, plucking hand, and the groove",
  drums: "hands, feet, and pulse",
  vocals: "breath, pitch, and the shape of the phrase",
  mandolin: "pick hand, fretting hand, and pulse",
  banjo: "picking hand, fretting hand, and the roll",
  violin: "bow arm, left hand, and ear",
  lapsteel: "bar hand, picking hand, and pitch",
};

const levelOpeners: Record<LearningLesson["level"], (lesson: LearningLesson) => string> = {
  foundations: (lesson) =>
    `Start with the basics. “${lesson.title}” gives you one steady place to begin, and every later lesson builds on it.`,
  beginner: (lesson) =>
    `You know the basics now. “${lesson.title}” gets one small move comfortable before anything else is added.`,
  intermediate: (lesson) =>
    `Work on control, not more notes. In “${lesson.title},” listen for the difference one small choice makes to the sound.`,
  advanced: (lesson) =>
    `Play “${lesson.title}” like a short piece, not an exercise. Make one clear choice, listen to what it changes, and keep the version you like.`,
};

// First lessons need an audible target before broader musicianship language is useful.
const firstListeningFocus: Record<string, string> = {
  "guitar-first-sound":
    "Listen for the first-fret F sounding higher than open E, then for the return to the lower E.",
  "piano-find-c":
    "Listen for C–D–E rising one step at a time, then E–D–C returning to the starting pitch.",
  "ukulele-gcea":
    "Say G, C, E, A as each string sounds. Listen for four separate attacks rather than one chord.",
  "bass-one-note":
    "Listen for open E starting when you pluck and becoming silent when you touch the string to mute it.",
  "drums-pulse": "Listen for equal space between taps, including where count 4 returns to count 1.",
  "vocals-easy-tone":
    "Notice an easy, steady hum for two counts and a silent two-count rest. Use a comfortable pitch; listening alone is also an option.",
  "mandolin-gdae":
    "Listen for one clear attack from both strings of each course together, then a higher pitch on the next course.",
  "banjo-open-g":
    "Listen for the notes you heard separately blending into the open G chord when you brush all five strings.",
  "violin-open-strings-and-bow":
    "Listen for a continuous sound within each bow stroke. Let the next stroke start where the previous one ended.",
  "lapsteel-c6-and-the-bar":
    "Listen for each open-string pitch separately, then for those same notes together when you brush the C6 chord.",
};

function focusFor(lesson: LearningLesson) {
  if (firstListeningFocus[lesson.id]) return firstListeningFocus[lesson.id];
  const text = `${lesson.id} ${lesson.title} ${lesson.outcome}`.toLowerCase();

  if (/pulse|eighth|rhythm|rest|backbeat|syncop|groove|polyrhythm|subdivision/.test(text))
    return "Listen for the pulse continuing underneath everything, especially through rests, changes, or off-beat notes.";
  if (
    /chord|triad|dominant|seventh|progression|cadence|harmony|voice-leading|major|minor/.test(text)
  )
    return "Listen for what stays stable and what creates motion. The useful clue is usually a note that holds, moves by a small step, or creates tension before release.";
  if (/melody|phrase|motif|pentatonic|scale|tetrachord|line/.test(text))
    return "Listen for a shape you could sing back: where the line starts, where it rises or leans, and where it settles at the end.";
  if (/bow|slide|vibrato|hammer|finger|crossing|bar|pick|strum|roll|stroke|breath/.test(text))
    return "Listen for an even sound before you chase speed. A clean attack, relaxed motion, and a clear ending matter more than squeezing out extra notes.";
  if (/arrang|miniature|performance|create|refine|interpret|backup|break/.test(text))
    return "Listen for one choice you can point to: a place where the feel changes, and an ending that sounds deliberate.";

  return `Listen for the moment your ${instrumentLanguage[lesson.instrument]} come together instead of working as separate parts.`;
}

function reflectionFor(lesson: LearningLesson) {
  const text = `${lesson.id} ${lesson.title} ${lesson.outcome}`.toLowerCase();
  if (/pulse|eighth|rhythm|rest|backbeat|syncop|groove|polyrhythm|subdivision/.test(text))
    return "After the last bar, ask: did the pulse keep moving even when I did less?";
  if (
    /chord|triad|dominant|seventh|progression|cadence|harmony|voice-leading|major|minor/.test(text)
  )
    return "After the last bar, ask: which note or finger movement made the change feel easiest?";
  if (/melody|phrase|motif|pentatonic|scale|tetrachord|line/.test(text))
    return "After the last phrase, ask: could I sing or tap back the shape I just played?";
  if (/bow|slide|vibrato|hammer|finger|crossing|bar|pick|strum|roll|stroke|breath/.test(text))
    return "After the attempt, name the one motion that felt relaxed enough to repeat.";
  if (/arrang|miniature|performance|create|refine|interpret|backup|break/.test(text))
    return "After the attempt, name one choice you would keep and one you would change on the next pass.";
  return "After the attempt, name one thing you can hear or feel more clearly than last time.";
}

function permissionFor(lesson: LearningLesson) {
  if (lesson.level === "foundations")
    return "A rough first sound is useful information. Stop after one clear attempt if your attention is done.";
  if (lesson.level === "beginner")
    return "Keep it slow enough that you can notice what happened. One clean bar teaches more than four rushed ones.";
  if (lesson.level === "intermediate")
    return "Make one variable better at a time. If the phrase falls apart, shrink it before you speed it up.";
  return "You get to prefer one version over another. Noticing which one you like, and why, is part of the practice.";
}

export function lessonVoice(lesson: LearningLesson): LessonVoice {
  return {
    opener: levelOpeners[lesson.level](lesson),
    whyItMatters: `Use this in your next practice: ${lesson.practice[2].replace(/^[^:]+: /, "")}`,
    listenFor: focusFor(lesson),
    permission: permissionFor(lesson),
    reflection: reflectionFor(lesson),
  };
}
