import { isDayKey, localDayKey } from "../utils.ts";
import { learningPath } from "./curriculum.ts";
import { INSTRUMENTS, type InstrumentId } from "./instruments.ts";
import {
  lessonExercise,
  parsePractice,
  practiceTempo,
  type PracticeCue,
  type PracticeGuide,
} from "./lesson-practice.ts";
import { startingLesson } from "./learning-profile.ts";
import type { LearningState } from "./learning.ts";

export type MusicalMilestone = {
  instrument: InstrumentId;
  title: string;
  goal: string;
  setup: string;
  variation: string;
  variationHint: string;
  lessons: string[];
  bpm: number;
  beats: number;
  cues: PracticeCue[];
  alternate: PracticeCue[];
  shapes?: string[];
};
const n = (beat: number, label: string, notes: number[], duration = 0.85): PracticeCue => ({
  beat,
  label,
  detail: label,
  notes,
  duration,
});
const quiet = (beat: number, label = "Rest"): PracticeCue => ({
  beat,
  label,
  detail: "Leave space and keep counting",
});
const copy = (id: string) => lessonExercise(id)!.cues.map((cue) => ({ ...cue }));
const guitar = copy("guitar-em-to-g").map((cue) =>
  cue.beat === 12
    ? {
        ...cue,
        chord: "Em",
        label: "Em ↓",
        detail: "Return to Em and let it ring",
        notes: [40, 47, 52, 55, 59, 64],
        duration: 3.8,
      }
    : cue.beat === 10 || cue.beat === 11
      ? { ...cue, label: "Keep Em", detail: "Keep the Em shape for the final bar" }
      : cue.beat > 12
        ? { ...cue, label: "Hold", detail: "Let the final Em ring" }
        : cue,
);
const piano = Array.from({ length: 2 }, (_, pass) => [
  n(pass * 8, "C", [60]),
  n(pass * 8 + 1, "D", [62]),
  n(pass * 8 + 2, "E", [64]),
  quiet(pass * 8 + 3),
  n(pass * 8 + 4, "E", [64]),
  n(pass * 8 + 5, "D", [62]),
  n(pass * 8 + 6, "C", [60]),
  quiet(pass * 8 + 7),
]).flat();
const uke = [
  ...copy("ukulele-c-f-am"),
  ...copy("ukulele-first-c")
    .slice(0, 4)
    .map((cue) => ({ ...cue, beat: cue.beat + 12 })),
];
const bass = Array.from({ length: 16 }, (_, beat) =>
  n(beat, beat >= 4 && beat < 12 ? "G" : "E", [beat >= 4 && beat < 12 ? 31 : 28]),
);
const drums = copy("drums-first-fill");
const voice = copy("vocals-phrase-and-rest").map((cue) =>
  cue.beat >= 12 && cue.notes
    ? {
        ...cue,
        label: ["Back", "At", "Home"][cue.beat - 12],
        detail: "Speak or sing the ending: back at home",
      }
    : cue,
);

/** Six original, short arrangements. Variations change the music rather than a score. */
export const MUSICAL_MILESTONES: MusicalMilestone[] = [
  {
    instrument: "guitar",
    title: "Em to G, then home",
    goal: "Make a four-bar piece: Em → G → Em → Em, with a clear ending.",
    setup: "Strum once on each beat 1. Prepare the next shape on 3 and 4. Let the final Em ring.",
    variation: "A second strum",
    variationHint:
      "Add a gentle downstroke on beat 3 of the first three bars; leave the ending spacious.",
    lessons: ["guitar-first-sound", "guitar-pulse", "guitar-em-to-g"],
    bpm: 60,
    beats: 16,
    shapes: ["Em", "G"],
    cues: guitar,
    alternate: guitar.map((cue) =>
      [2, 6, 10].includes(cue.beat)
        ? { ...guitar.find((item) => item.beat === cue.beat - 2)!, beat: cue.beat }
        : cue,
    ),
  },
  {
    instrument: "piano",
    title: "A little question and answer",
    goal: "Play C–D–E, then E–D–C, twice, letting each phrase have space.",
    setup:
      "Find C just left of two black keys. D and E are the next two white keys. Use any comfortable fingers.",
    variation: "A longer final C",
    variationHint: "Hold the last C through beat 4 instead of lifting for the final rest.",
    lessons: ["piano-find-c", "piano-pulse-and-rest"],
    bpm: 60,
    beats: 16,
    cues: piano,
    alternate: piano.map((cue) =>
      cue.beat === 14
        ? { ...cue, duration: 1.9 }
        : cue.beat === 15
          ? { beat: 15, label: "Hold C", detail: "Keep the final C sounding through beat 4" }
          : cue,
    ),
  },
  {
    instrument: "ukulele",
    title: "Three chords and a return",
    goal: "Play C → Am → F → C, one bar each, and finish back where you started.",
    setup:
      "Strum on beat 1 and prepare the next shape while counting. GCEA frets: C 0–0–0–3, Am 2–0–0–0, F 2–0–1–0.",
    variation: "Two strums per bar",
    variationHint:
      "Add a downstroke on beat 3 in the first three bars; use one strum in the final bar.",
    lessons: ["ukulele-gcea", "ukulele-first-c", "ukulele-c-f-am"],
    bpm: 50,
    beats: 16,
    shapes: ["C", "Am", "F"],
    cues: uke,
    alternate: uke.map((cue) =>
      [2, 6, 10].includes(cue.beat)
        ? { ...uke.find((item) => item.beat === cue.beat - 2)!, beat: cue.beat }
        : cue,
    ),
  },
  {
    instrument: "bass",
    title: "Roots that come back home",
    goal: "Give E, G, G, and E one bar each; make the final return to E clear.",
    setup:
      "Use open E and E-string fret 3 for G. Play one light pluck per count, muting the note you leave.",
    variation: "Leave a little space",
    variationHint: "Play only on 1 and 3, muting on 2 and 4. Keep counting through the spaces.",
    lessons: ["bass-one-note", "bass-quarter-pulse", "bass-follow-roots"],
    bpm: 60,
    beats: 16,
    cues: bass,
    alternate: bass.map((cue) => (cue.beat % 2 ? quiet(cue.beat) : cue)),
  },
  {
    instrument: "drums",
    title: "A groove with a landing",
    goal: "Play four bars of backbeat, add a tiny fill, then land on the next kick.",
    setup:
      "Kick on 1 and 3; snare on 2 and 4. In bar 4, add a snare on and-of-4. The guide stops after the next 1.",
    variation: "A tom in the fill",
    variationHint: "Replace the final snare on and-of-4 with one tom, then return to the kick.",
    lessons: ["drums-pulse", "drums-backbeat", "drums-first-fill"],
    bpm: 60,
    beats: 17,
    cues: drums,
    alternate: drums.map((cue) =>
      cue.beat === 15.5 ? { ...cue, label: "T", detail: "Tom on and-of-4", pads: [3] } : cue,
    ),
  },
  {
    instrument: "vocals",
    title: "Here we go, back at home",
    goal: "Speak or sing three here–we–go phrases, then finish with back–at–home.",
    setup:
      "Place one word on each of 1–2–3 and rest on 4. Use an easy speaking pitch, a comfortable octave, or listen and follow the words.",
    variation: "An upward answer",
    variationHint:
      "The second phrase rises C–D–E, and the last comes down E–D–C. Echo only in a comfortable range, or listen.",
    lessons: ["vocals-easy-tone", "vocals-pitch-direction", "vocals-phrase-and-rest"],
    bpm: 60,
    beats: 16,
    cues: voice,
    alternate: voice.map((cue) =>
      cue.notes && ((cue.beat >= 4 && cue.beat <= 6) || (cue.beat >= 12 && cue.beat <= 14))
        ? {
            ...cue,
            notes:
              cue.beat < 8 ? [[60], [62], [64]][cue.beat - 4] : [[64], [62], [60]][cue.beat - 12],
          }
        : cue,
    ),
  },
];
export function musicalMilestone(instrument: InstrumentId) {
  return MUSICAL_MILESTONES.find((piece) => piece.instrument === instrument)!;
}
export type MilestoneVersion = {
  bpm: number;
  guide: PracticeGuide;
  variation: boolean;
  reflection: "exploring" | "comfortable";
  note: string;
  savedOn: string;
};
export type MilestoneRecord = {
  phase: "play" | "reflect" | "saved";
  scope: "first" | "whole";
  bpm: number;
  guide: PracticeGuide;
  variation: boolean;
  firstBarTried: boolean;
  reflection?: MilestoneVersion["reflection"];
  note: string;
  saved?: MilestoneVersion;
};
export function milestoneSequence(
  piece: MusicalMilestone,
  variation: boolean,
  scope: MilestoneRecord["scope"] = "whole",
) {
  const beats = scope === "first" ? 4 : piece.beats;
  return {
    beats,
    cues: (variation ? piece.alternate : piece.cues).filter((cue) => cue.beat < beats),
  };
}
export function parseMilestone(
  raw: unknown,
  instrument: InstrumentId,
): MilestoneRecord | undefined {
  if (!raw || typeof raw !== "object") return undefined;
  const value = raw as Record<string, unknown>;
  const practice = parsePractice(value, musicalMilestone(instrument).bpm)!;
  const reflection =
    value.reflection === "exploring" || value.reflection === "comfortable"
      ? value.reflection
      : undefined;
  const record: MilestoneRecord = {
    phase: value.phase === "reflect" || value.phase === "saved" ? value.phase : "play",
    scope: value.scope === "first" ? "first" : "whole",
    bpm: practice.bpm,
    guide: practice.guide,
    variation: value.variation === true,
    firstBarTried: value.firstBarTried === true,
    note: typeof value.note === "string" ? value.note.slice(0, 240) : "",
  };
  if (reflection && record.phase !== "play") record.reflection = reflection;
  if (value.saved && typeof value.saved === "object") {
    const saved = value.saved as Record<string, unknown>;
    if (
      isDayKey(saved.savedOn) &&
      (saved.reflection === "exploring" || saved.reflection === "comfortable")
    ) {
      const settings = parsePractice(saved, musicalMilestone(instrument).bpm)!;
      record.saved = {
        bpm: settings.bpm,
        guide: settings.guide,
        variation: saved.variation === true,
        reflection: saved.reflection,
        note: typeof saved.note === "string" ? saved.note.slice(0, 240) : "",
        savedOn: saved.savedOn,
      };
    }
  }
  if (record.scope === "first" && record.phase !== "play") {
    record.phase = "play";
    delete record.reflection;
  }
  if (record.phase === "saved" && !record.saved) record.phase = "reflect";
  return record;
}
export function beginMilestone(data: LearningState, instrument: InstrumentId): LearningState {
  if (!INSTRUMENTS.some((item) => item.id === instrument)) return data;
  const old = data.milestones[instrument];
  const record: MilestoneRecord =
    old && old.phase !== "saved"
      ? old
      : {
          phase: "play",
          scope: data.profiles[instrument]?.minutes === 2 ? "first" : "whole",
          bpm: old?.saved?.bpm ?? musicalMilestone(instrument).bpm,
          guide: old?.saved?.guide ?? "notes",
          variation: old?.saved?.variation ?? false,
          firstBarTried: old?.firstBarTried ?? false,
          note: "",
          ...(old?.saved ? { saved: old.saved } : {}),
        };
  return {
    ...data,
    focus: { ...data.focus, [instrument]: "milestone" },
    milestones: { ...data.milestones, [instrument]: record },
  };
}
export type MilestoneAction =
  | {
      type: "settings";
      bpm?: number;
      guide?: PracticeGuide;
      variation?: boolean;
      scope?: MilestoneRecord["scope"];
    }
  | { type: "attempt" }
  | { type: "reflect"; reflection: MilestoneVersion["reflection"] }
  | { type: "note"; note: string }
  | { type: "retry" }
  | { type: "replay" }
  | { type: "save" };
export function updateMilestone(
  data: LearningState,
  instrument: InstrumentId,
  action: MilestoneAction,
  today = localDayKey(),
): LearningState {
  const old = data.milestones[instrument];
  if (!old) return data;
  let record = { ...old };
  switch (action.type) {
    case "settings":
      if (record.phase !== "play") return data;
      if (action.bpm !== undefined) record.bpm = practiceTempo(action.bpm, record.bpm);
      if (action.guide === "notes" || action.guide === "pulse" || action.guide === "silent")
        record.guide = action.guide;
      if (typeof action.variation === "boolean") record.variation = action.variation;
      if (action.scope === "first" || action.scope === "whole") record.scope = action.scope;
      break;
    case "attempt":
      if (record.phase !== "play") return data;
      if (record.scope === "first") {
        record.scope = "whole";
        record.firstBarTried = true;
      } else record.phase = "reflect";
      break;
    case "reflect":
      if (record.phase !== "reflect" || !["exploring", "comfortable"].includes(action.reflection))
        return data;
      record.reflection = action.reflection;
      break;
    case "note":
      if (record.phase !== "reflect") return data;
      record.note = action.note.slice(0, 240);
      break;
    case "retry":
      record.phase = "play";
      delete record.reflection;
      break;
    case "replay":
      if (!record.saved) return data;
      record = {
        ...record,
        bpm: record.saved.bpm,
        guide: record.saved.guide,
        variation: record.saved.variation,
        note: record.saved.note,
        phase: "play",
        scope: "whole",
      };
      delete record.reflection;
      break;
    case "save":
      if (
        record.phase !== "reflect" ||
        record.scope !== "whole" ||
        !record.reflection ||
        !isDayKey(today)
      )
        return data;
      record.saved = {
        bpm: record.bpm,
        guide: record.guide,
        variation: record.variation,
        reflection: record.reflection,
        note: record.note,
        savedOn: today,
      };
      record.phase = "saved";
      break;
  }
  return {
    ...data,
    focus: { ...data.focus, [instrument]: "milestone" },
    milestones: { ...data.milestones, [instrument]: record },
  };
}
export function milestoneReady(data: LearningState, instrument: InstrumentId) {
  const start = startingLesson(instrument, data.profiles[instrument]);
  const path = learningPath(instrument);
  const available = musicalMilestone(instrument).lessons.filter(
    (id) => path.findIndex((lesson) => lesson.id === id) >= path.indexOf(start),
  );
  return (available.length ? available : [start.id]).every((id) => !!data.records[id]?.completedOn);
}
