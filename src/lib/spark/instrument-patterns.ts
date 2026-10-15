import { banjoRollBar, lessonExercise, type PracticeCue } from "./lesson-practice.ts";
import type { PlanItem } from "./types.ts";

/** Labs and Today share the musical specification used by Learn. */
export function instrumentLabPattern(
  id: "mandolin-down-up" | "banjo-forward-roll" | "violin-slurs",
) {
  const beats = id === "violin-slurs" ? 8 : 4;
  return { beats, cues: lessonExercise(id)!.cues.filter((cue) => cue.beat < beats) };
}

const DAILY_EXERCISES: Record<string, string> = {
  lesson_mandolin_open_01: "mandolin-gdae",
  lesson_mandolin_chop_01: "mandolin-chop",
  lesson_banjo_open_01: "banjo-open-g",
  lesson_banjo_roll_01: "banjo-forward-roll",
  lesson_violin_open_01: "violin-open-strings-and-bow",
  lesson_violin_bow_pulse_01: "violin-bow-pulse",
  lesson_violin_first_finger_01: "violin-first-finger",
  lesson_violin_slur_01: "violin-slurs",
  lesson_violin_walk_01: "violin-d-tetrachord",
  lesson_lapsteel_open_01: "lapsteel-c6-and-the-bar",
  lesson_lapsteel_slide_01: "lapsteel-slide-into",
};

export function hasInstrumentPattern(item: { lessonId?: string; process?: string }) {
  return (
    item.process !== "respond" &&
    item.process !== "create" &&
    !!DAILY_EXERCISES[item.lessonId ?? ""]
  );
}

/** Quarter-note positions, with explicit pitches, mutes and bow directions. */
export function dailyInstrumentCues(item: PlanItem): PracticeCue[] | undefined {
  if (!hasInstrumentPattern(item)) return undefined;
  const exercise = lessonExercise(DAILY_EXERCISES[item.lessonId])!;
  const cues: PracticeCue[] = [];
  const total = item.bars * 4;
  const chordBars = Math.max(1, Math.floor(item.bars / Math.max(1, item.chords.length)));
  for (let bar = 0; bar < item.bars; bar++) {
    const chord = item.chords[Math.floor(bar / chordBars) % item.chords.length] ?? "G";
    if (item.lessonId === "lesson_banjo_roll_01") {
      cues.push(...banjoRollBar(bar * 4, chord));
      continue;
    }
    if (item.lessonId === "lesson_violin_walk_01") {
      for (let i = 0; i < 3; i++) {
        const down = (bar * 3 + i) % 2 === 0;
        cues.push({
          beat: bar * 4 + i,
          notes: [[62], [64], [66]][i],
          duration: 0.85,
          label: ["D", "E", "F♯"][i] + (down ? " ⊓" : " ∨"),
          detail: "D string: open, first finger, second finger; keep alternating bows",
        });
      }
      cues.push({
        beat: bar * 4 + 3,
        label: "Rest",
        detail: "Stop on the string; the next note continues the bow alternation",
      });
      continue;
    }
    const cycleBeat = (bar * 4) % exercise.beats;
    for (const cue of exercise.cues.filter((c) => c.beat >= cycleBeat && c.beat < cycleBeat + 4)) {
      const next = { ...cue, beat: bar * 4 + cue.beat - cycleBeat };
      // The daily chop can move from G to C; retain its mute on every backbeat.
      if (item.lessonId === "lesson_mandolin_chop_01") {
        next.chord = chord;
        if (!cue.muted) {
          const shapeCue = lessonExercise("mandolin-g-and-c")!.cues.find((c) => c.chord === chord)!;
          next.notes = shapeCue.notes;
          next.label = chord + " ↓";
          next.detail = chord + ": ring on the beat";
        }
      }
      if (next.duration) next.duration = Math.min(next.duration, total - next.beat);
      cues.push(next);
    }
  }
  return cues;
}

/** One hit in a declared daily drums pattern. Beat is inside one phrase. */
export type DrumPatternHit = {
  beat: number;
  pads: number[];
  label: string;
  detail: string;
};

/** A declared daily drums pattern: one phrase of `beats` beats, looped. */
export type DrumDailyPattern = {
  beats: number;
  hits: DrumPatternHit[];
};

const DRUM_PAD_NAMES = ["Kick", "Snare", "Hat", "Tom"];
const drumHitCue = (
  beat: number,
  pads: number[],
  detail: string,
  label?: string,
): DrumPatternHit => ({
  beat,
  pads,
  detail,
  label: label ?? pads.map((pad) => DRUM_PAD_NAMES[pad]).join(" + "),
});
const drumBar = (hits: DrumPatternHit[], offset: number): DrumPatternHit[] =>
  hits.map((hit) => ({ ...hit, beat: hit.beat + offset }));
const stickingBar = (hands: string[]): DrumPatternHit[] =>
  hands.map((hand, i) => ({
    beat: i * 0.5,
    pads: [1],
    label: hand,
    detail: hand === "R" ? "Right hand." : "Left hand.",
  }));

/**
 * The daily groove line is one pad per slot, the convention every daily
 * drums lesson has always used: kick and snare take their beats, the hat
 * takes the eighths around them.
 */
const hatsGrooveBar: DrumPatternHit[] = [
  drumHitCue(0, [0], "Kick on 1."),
  drumHitCue(0.5, [2], "Hat — right hand."),
  drumHitCue(1, [1], "Snare on 2."),
  drumHitCue(1.5, [2], "Hat."),
  drumHitCue(2, [0], "Kick on 3."),
  drumHitCue(2.5, [2], "Hat."),
  drumHitCue(3, [1], "Snare on 4."),
  drumHitCue(3.5, [2], "Hat."),
];

const fillPhrase: DrumPatternHit[] = [
  ...drumBar(hatsGrooveBar, 0),
  ...drumBar(hatsGrooveBar, 4),
  ...drumBar(hatsGrooveBar, 8),
  drumHitCue(12, [1], "Fill: start on the snare."),
  drumHitCue(12.5, [1], "Snare."),
  drumHitCue(13, [3], "Tom."),
  drumHitCue(13.5, [3], "Tom."),
  drumHitCue(14, [1], "Snare."),
  drumHitCue(14.5, [3], "Tom."),
  drumHitCue(15, [3], "Tom."),
  drumHitCue(15.5, [3], "Last fill hit — get ready to land."),
  drumHitCue(16, [0], "Land on 1."),
  drumHitCue(16.5, [2], "Hat — the groove is back."),
  drumHitCue(17, [1], "Snare on 2."),
  drumHitCue(17.5, [2], "Hat."),
  drumHitCue(18, [0], "Kick on 3."),
  drumHitCue(18.5, [2], "Hat."),
  drumHitCue(19, [1], "Snare on 4."),
  drumHitCue(19.5, [2], "Hat."),
];

const shuffleBar: DrumPatternHit[] = [
  drumHitCue(0, [0], "Kick on 1."),
  drumHitCue(2 / 3, [2], "Hat — the swung and."),
  drumHitCue(1, [1], "Snare on 2."),
  drumHitCue(1 + 2 / 3, [2], "Hat."),
  drumHitCue(2, [0], "Kick on 3."),
  drumHitCue(2 + 2 / 3, [2], "Hat."),
  drumHitCue(3, [1], "Snare on 4."),
  drumHitCue(3 + 2 / 3, [2], "Hat."),
];

const hatFootBar: DrumPatternHit[] = [
  drumHitCue(0, [0], "Kick on 1."),
  drumHitCue(1, [1], "Snare on 2."),
  drumHitCue(1, [2], "Left foot: chick under the snare."),
  drumHitCue(2, [0], "Kick on 3."),
  drumHitCue(3, [1], "Snare on 4."),
  drumHitCue(3, [2], "Left foot: chick under the snare."),
];

const DRUM_DAILY_PATTERNS: Record<string, DrumDailyPattern> = {
  lesson_drums_hats_eighths_01: { beats: 4, hits: hatsGrooveBar },
  lesson_drums_fill_land_01: { beats: 20, hits: fillPhrase },
  lesson_drums_singles_01: {
    beats: 4,
    hits: stickingBar(["R", "L", "R", "L", "R", "L", "R", "L"]),
  },
  lesson_drums_doubles_01: {
    beats: 4,
    hits: stickingBar(["R", "R", "L", "L", "R", "R", "L", "L"]),
  },
  lesson_drums_paradiddle_01: {
    beats: 8,
    hits: [
      ...stickingBar(["R", "L", "R", "R", "L", "R", "L", "L"]),
      ...drumBar(stickingBar(["R", "L", "R", "R", "L", "R", "L", "L"]), 4),
    ],
  },
  lesson_drums_shuffle_01: { beats: 4, hits: shuffleBar },
  lesson_drums_hat_foot_01: { beats: 4, hits: hatFootBar },
};

/** Declared pad pattern for a daily drums lesson, if it has one. */
export function drumDailyPattern(lessonId?: string): DrumDailyPattern | undefined {
  return lessonId ? DRUM_DAILY_PATTERNS[lessonId] : undefined;
}

export function hasDrumPattern(item: { lessonId?: string }) {
  return !!drumDailyPattern(item.lessonId);
}
