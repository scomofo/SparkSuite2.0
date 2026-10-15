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
    (!!DAILY_EXERCISES[item.lessonId ?? ""] || !!VOCAL_DAILY_CUES[item.lessonId ?? ""])
  );
}

export type VocalDailyCue = {
  beat: number;
  /** Guide pitches for modeling: the target, plus any reference tone under it. */
  notes: number[];
  /**
   * The pitch the singer is judged against, on the tracker's unrounded cents
   * (vocal-judge.ts). Omitted on purpose for the range finder — its steps are
   * guide pitches only and its criteria are self-report.
   */
  expectedMidi?: number;
  /** Beats the expected pitch must be sustained; judged as a hold. */
  holdBeats?: number;
  label: string;
  detail: string;
  chord?: string;
};

/**
 * Bespoke daily vocals cues, declared per lesson like the other daily
 * patterns. `beats` is the phrase length; the phrase loops across the
 * lesson's bars. Phrase layouts keep every hold's end at least a frame
 * inside the lesson so its verdict lands before the item closes.
 */
export const VOCAL_DAILY_CUES: Record<string, { beats: number; cues: VocalDailyCue[] }> = {
  lesson_vocals_match_c_01: {
    beats: 4,
    cues: [
      {
        beat: 0,
        notes: [60],
        expectedMidi: 60,
        label: "C",
        detail: "Sing C — land inside 20 cents of the reference",
      },
    ],
  },
  lesson_vocals_hold_01: {
    beats: 4,
    cues: [
      {
        beat: 0,
        notes: [60],
        expectedMidi: 60,
        holdBeats: 4,
        label: "Hold C",
        detail: "One breath — hold C in tune for the whole bar",
      },
    ],
  },
  lesson_vocals_thirds_01: {
    beats: 12,
    cues: [
      { beat: 0, notes: [60, 64], expectedMidi: 64, chord: "C", label: "E — third of C", detail: "Root is C; sing E, the third above" },
      { beat: 2, notes: [60, 64], expectedMidi: 64, chord: "C", label: "E — third of C", detail: "Root is C; sing E, the third above" },
      { beat: 4, notes: [65, 69], expectedMidi: 69, chord: "F", label: "A — third of F", detail: "Root is F; sing A, the third above" },
      { beat: 6, notes: [65, 69], expectedMidi: 69, chord: "F", label: "A — third of F", detail: "Root is F; sing A, the third above" },
      { beat: 8, notes: [67, 71], expectedMidi: 71, chord: "G", label: "B — third of G", detail: "Root is G; sing B, the third above" },
      { beat: 10, notes: [67, 71], expectedMidi: 71, chord: "G", label: "B — third of G", detail: "Root is G; sing B, the third above" },
    ],
  },
  lesson_vocals_offbeat_01: {
    beats: 4,
    cues: [
      { beat: 1.5, notes: [60], expectedMidi: 60, label: "And of 2 — C", detail: "Enter on the offbeat: the 'and' of 2" },
      { beat: 3.5, notes: [60], expectedMidi: 60, label: "And of 4 — C", detail: "Enter on the offbeat: the 'and' of 4" },
    ],
  },
  lesson_vocals_harmony_01: {
    beats: 16,
    cues: [
      {
        beat: 0,
        notes: [60, 64],
        expectedMidi: 64,
        holdBeats: 6,
        chord: "C",
        label: "Hold E",
        detail: "Melody overhead: C–D–E–D–C. You hold E, the third above its home",
      },
      {
        beat: 8,
        notes: [60, 64],
        expectedMidi: 64,
        holdBeats: 6,
        chord: "C",
        label: "Hold E",
        detail: "The melody passes overhead again. Your E stays still",
      },
    ],
  },
  lesson_vocals_range_01: {
    beats: 20,
    cues: [
      { beat: 0, notes: [60], label: "C4", detail: "Start on middle C — one step per beat from here" },
      { beat: 1, notes: [61], label: "C♯4", detail: "One semitone up" },
      { beat: 2, notes: [62], label: "D4", detail: "One semitone up" },
      { beat: 3, notes: [63], label: "D♯4", detail: "One semitone up" },
      { beat: 4, notes: [64], label: "E4", detail: "One semitone up" },
      { beat: 5, notes: [65], label: "F4", detail: "One semitone up" },
      { beat: 6, notes: [66], label: "F♯4", detail: "One semitone up" },
      { beat: 7, notes: [67], label: "G4", detail: "The top step for today — notice how it feels" },
      { beat: 8, notes: [66], label: "F♯4", detail: "Back down, one step per beat" },
      { beat: 9, notes: [65], label: "F4", detail: "One semitone down" },
      { beat: 10, notes: [64], label: "E4", detail: "One semitone down" },
      { beat: 11, notes: [63], label: "D♯4", detail: "One semitone down" },
      { beat: 12, notes: [62], label: "D4", detail: "One semitone down" },
      { beat: 13, notes: [61], label: "C♯4", detail: "One semitone down" },
      { beat: 14, notes: [60], label: "C4", detail: "Middle C again — keep going down" },
      { beat: 15, notes: [59], label: "B3", detail: "One semitone down" },
      { beat: 16, notes: [58], label: "B♭3", detail: "One semitone down" },
      { beat: 17, notes: [57], label: "A3", detail: "One semitone down" },
      { beat: 18, notes: [56], label: "A♭3", detail: "One semitone down" },
      { beat: 19, notes: [55], label: "G3", detail: "The bottom step for today — note where it stopped feeling easy" },
    ],
  },
  lesson_vocals_scale_01: {
    beats: 16,
    cues: [
      { beat: 0, notes: [60], expectedMidi: 60, label: "C", detail: "Five-note scale: C D E F G and back — sing C" },
      { beat: 1, notes: [62], expectedMidi: 62, label: "D", detail: "Sing D" },
      { beat: 2, notes: [64], expectedMidi: 64, label: "E", detail: "Sing E" },
      { beat: 3, notes: [65], expectedMidi: 65, label: "F", detail: "Sing F" },
      { beat: 4, notes: [67], expectedMidi: 67, label: "G", detail: "Sing G — the top, turn around here" },
      { beat: 5, notes: [65], expectedMidi: 65, label: "F", detail: "Sing F" },
      { beat: 6, notes: [64], expectedMidi: 64, label: "E", detail: "Sing E" },
      { beat: 7, notes: [62], expectedMidi: 62, label: "D", detail: "Sing D" },
      { beat: 8, notes: [60], expectedMidi: 60, label: "C", detail: "Sing C — home" },
    ],
  },
  lesson_vocals_song_01: {
    // The whole song is one 32-beat phrase (8 bars at the lesson's bars: 8),
    // so it plays through once — no looping. One phrase per bar; the two
    // half notes are the breaths, judged as short holds.
    beats: 32,
    cues: [
      { beat: 0, notes: [60], expectedMidi: 60, label: "Frè- — C", detail: "Frère Jacques, phrase 1 — sing C" },
      { beat: 1, notes: [62], expectedMidi: 62, label: "re — D", detail: "Sing D" },
      { beat: 2, notes: [64], expectedMidi: 64, label: "Jac- — E", detail: "Sing E" },
      { beat: 3, notes: [60], expectedMidi: 60, label: "-ques — C", detail: "Sing C — that's the phrase" },
      { beat: 4, notes: [60], expectedMidi: 60, label: "Frè- — C", detail: "The same phrase again — sing C" },
      { beat: 5, notes: [62], expectedMidi: 62, label: "re — D", detail: "Sing D" },
      { beat: 6, notes: [64], expectedMidi: 64, label: "Jac- — E", detail: "Sing E" },
      { beat: 7, notes: [60], expectedMidi: 60, label: "-ques — C", detail: "Sing C" },
      { beat: 8, notes: [64], expectedMidi: 64, label: "Dor- — E", detail: "Dormez-vous — 'are you sleeping': sing E" },
      { beat: 9, notes: [65], expectedMidi: 65, label: "-mez — F", detail: "Sing F" },
      { beat: 10, notes: [67], expectedMidi: 67, holdBeats: 2, label: "-vous — G", detail: "Sing G and hold it for two beats — breathe here" },
      { beat: 12, notes: [64], expectedMidi: 64, label: "Dor- — E", detail: "Again — sing E" },
      { beat: 13, notes: [65], expectedMidi: 65, label: "-mez — F", detail: "Sing F" },
      { beat: 14, notes: [67], expectedMidi: 67, holdBeats: 2, label: "-vous — G", detail: "Sing G and hold it for two beats" },
      { beat: 16, notes: [67], expectedMidi: 67, label: "Son- — G", detail: "Sonnez les matines — 'ring the morning bells': short notes now, sing G" },
      { beat: 16.5, notes: [69], expectedMidi: 69, label: "-nez — A", detail: "Sing A" },
      { beat: 17, notes: [67], expectedMidi: 67, label: "les — G", detail: "Sing G" },
      { beat: 17.5, notes: [65], expectedMidi: 65, label: "ma- — F", detail: "Sing F" },
      { beat: 18, notes: [64], expectedMidi: 64, label: "-ti- — E", detail: "Sing E" },
      { beat: 19, notes: [60], expectedMidi: 60, label: "-nes — C", detail: "Sing C — end of the line" },
      { beat: 20, notes: [67], expectedMidi: 67, label: "Son- — G", detail: "The same line again — sing G" },
      { beat: 20.5, notes: [69], expectedMidi: 69, label: "-nez — A", detail: "Sing A" },
      { beat: 21, notes: [67], expectedMidi: 67, label: "les — G", detail: "Sing G" },
      { beat: 21.5, notes: [65], expectedMidi: 65, label: "ma- — F", detail: "Sing F" },
      { beat: 22, notes: [64], expectedMidi: 64, label: "-ti- — E", detail: "Sing E" },
      { beat: 23, notes: [60], expectedMidi: 60, label: "-nes — C", detail: "Sing C" },
      { beat: 24, notes: [60], expectedMidi: 60, label: "Din — C", detail: "Din din don — sing C" },
      { beat: 25, notes: [55], expectedMidi: 55, label: "din — G", detail: "Sing the low G, below middle C" },
      { beat: 26, notes: [60], expectedMidi: 60, holdBeats: 2, label: "don — C", detail: "Sing C and hold it for two beats" },
      { beat: 28, notes: [60], expectedMidi: 60, label: "Din — C", detail: "Last time — sing C" },
      { beat: 29, notes: [55], expectedMidi: 55, label: "din — G", detail: "Sing the low G" },
      { beat: 30, notes: [60], expectedMidi: 60, holdBeats: 2, label: "don — C", detail: "Sing C and hold it to the end of the song" },
    ],
  },
};

/** Expand a lesson's bespoke vocals phrase across its bars. */
export function vocalDailyCues(item: PlanItem): PracticeCue[] | undefined {
  const pattern = VOCAL_DAILY_CUES[item.lessonId ?? ""];
  if (!pattern || item.process === "respond" || item.process === "create") return undefined;
  const total = item.bars * 4;
  const cues: PracticeCue[] = [];
  for (let start = 0; start < total; start += pattern.beats) {
    for (const cue of pattern.cues) {
      const beat = start + cue.beat;
      if (beat >= total) continue;
      const holdBeats = cue.holdBeats ? Math.min(cue.holdBeats, total - beat) : undefined;
      cues.push({
        beat,
        label: cue.label,
        detail: cue.detail,
        notes: cue.notes,
        chord: cue.chord,
        expectedMidi: cue.expectedMidi,
        holdBeats,
        duration: holdBeats,
      });
    }
  }
  return cues;
}

/** Quarter-note positions, with explicit pitches, mutes and bow directions. */
export function dailyInstrumentCues(item: PlanItem): PracticeCue[] | undefined {
  if (!hasInstrumentPattern(item)) return undefined;
  const vocal = vocalDailyCues(item);
  if (vocal) return vocal;
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
