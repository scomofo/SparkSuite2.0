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
  lesson_mandolin_gc_01: "mandolin-g-and-c",
  lesson_mandolin_pulse_01: "mandolin-down-pulse",
  lesson_mandolin_downup_01: "mandolin-down-up",
  lesson_mandolin_tremolo_01: "mandolin-tremolo",
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

/**
 * Bespoke daily cue passes for mandolin lessons no Learn exercise covers.
 * `beats` is the length of one pass; dailyInstrumentCues repeats the pass
 * until it fills the lesson's bars.
 */
const MANDOLIN_DAILY_CUES: Record<string, { beats: number; cues: PracticeCue[] }> = {
  // The eight-note line from "Melody, then backing", on its own.
  lesson_mandolin_melody_01: {
    beats: 8,
    cues: [
      { beat: 0, label: "D ↓", notes: [62], detail: "Melody, D course", duration: 0.9 },
      { beat: 1, label: "E ↑", notes: [64], detail: "Melody, D course", duration: 0.9 },
      { beat: 2, label: "F♯ ↓", notes: [66], detail: "Melody, D course", duration: 0.9 },
      { beat: 3, label: "G ↑", notes: [67], detail: "Melody, D course", duration: 0.9 },
      { beat: 4, label: "A ↓", notes: [69], detail: "Melody, A course", duration: 0.9 },
      { beat: 5, label: "G ↑", notes: [67], detail: "Melody, A then D course", duration: 0.9 },
      { beat: 6, label: "F♯ ↓", notes: [66], detail: "Melody, A then D course", duration: 0.9 },
      { beat: 7, label: "D ↑", notes: [62], detail: "Melody, A then D course", duration: 0.9 },
    ],
  },
  // Closed G chop shape: frets 7–5–2–3 over G–D–A–E ring D G B G.
  lesson_mandolin_closed_chop_01: {
    beats: 4,
    cues: [
      { beat: 0, label: "G closed ↓", notes: [62, 67, 71, 79], chord: "G", detail: "Closed G: frets 7–5–2–3, ring on the beat", duration: 0.85 },
      { beat: 1, label: "Chop", muted: true, chord: "G", detail: "Strike, then release pressure so the closed chord stops dead" },
      { beat: 2, label: "G closed ↓", notes: [62, 67, 71, 79], chord: "G", detail: "Closed G: frets 7–5–2–3, ring on the beat", duration: 0.85 },
      { beat: 3, label: "Chop", muted: true, chord: "G", detail: "Strike, then release pressure so the closed chord stops dead" },
    ],
  },
  // One bar each of G, C, D, Am, strummed on beat 1.
  lesson_mandolin_am_song_01: {
    beats: 16,
    cues: [
      { beat: 0, label: "G ↓", notes: [55, 62, 71, 79], chord: "G", detail: "G: ring on beat 1", duration: 0.9 },
      { beat: 4, label: "C ↓", notes: [55, 64, 72, 76], chord: "C", detail: "C: change on beat 1", duration: 0.9 },
      { beat: 8, label: "D ↓", notes: [57, 62, 69, 78], chord: "D", detail: "D: change on beat 1", duration: 0.9 },
      { beat: 12, label: "Am ↓", notes: [57, 64, 72, 76], chord: "Am", detail: "Am: the minor shape lands the loop", duration: 0.9 },
    ],
  },
  // The traditional chorus, in G: B and C on the A course, A open, G on the
  // D course. Held notes take two beats, as the song is sung.
  lesson_mandolin_cabbage_01: {
    beats: 32,
    cues: [
      { beat: 0, label: "B ↓", notes: [71], detail: "A course, fret 2 — 'Boil them cabbage down'", duration: 0.9 },
      { beat: 1, label: "B ↑", notes: [71], detail: "A course, fret 2", duration: 0.9 },
      { beat: 2, label: "B ↓", notes: [71], detail: "A course, fret 2", duration: 0.9 },
      { beat: 3, label: "B ↑", notes: [71], detail: "A course, fret 2", duration: 0.9 },
      { beat: 4, label: "C ↓", notes: [72], detail: "A course, fret 3 — held through 'down'", duration: 1.8 },
      { beat: 6, label: "C ↑", notes: [72], detail: "A course, fret 3 — held", duration: 1.8 },
      { beat: 8, label: "B ↓", notes: [71], detail: "A course, fret 2 — 'Turn them hoecakes round'", duration: 0.9 },
      { beat: 9, label: "B ↑", notes: [71], detail: "A course, fret 2", duration: 0.9 },
      { beat: 10, label: "B ↓", notes: [71], detail: "A course, fret 2", duration: 0.9 },
      { beat: 11, label: "B ↑", notes: [71], detail: "A course, fret 2", duration: 0.9 },
      { beat: 12, label: "A ↓", notes: [69], detail: "A course, open — held", duration: 1.8 },
      { beat: 14, label: "A ↑", notes: [69], detail: "A course, open — held", duration: 1.8 },
      { beat: 16, label: "B ↓", notes: [71], detail: "A course, fret 2 — 'The only song that I can sing is'", duration: 0.9 },
      { beat: 17, label: "B ↑", notes: [71], detail: "A course, fret 2", duration: 0.9 },
      { beat: 18, label: "B ↓", notes: [71], detail: "A course, fret 2", duration: 0.9 },
      { beat: 19, label: "B ↑", notes: [71], detail: "A course, fret 2", duration: 0.9 },
      { beat: 20, label: "C ↓", notes: [72], detail: "A course, fret 3", duration: 0.9 },
      { beat: 21, label: "C ↑", notes: [72], detail: "A course, fret 3", duration: 0.9 },
      { beat: 22, label: "C ↓", notes: [72], detail: "A course, fret 3", duration: 0.9 },
      { beat: 23, label: "C ↑", notes: [72], detail: "A course, fret 3", duration: 0.9 },
      { beat: 24, label: "B ↓", notes: [71], detail: "A course, fret 2 — 'Boil them cabbage down'", duration: 0.9 },
      { beat: 25, label: "B ↑", notes: [71], detail: "A course, fret 2", duration: 0.9 },
      { beat: 26, label: "A ↓", notes: [69], detail: "A course, open", duration: 0.9 },
      { beat: 27, label: "A ↑", notes: [69], detail: "A course, open", duration: 0.9 },
      { beat: 28, label: "G ↓", notes: [67], detail: "D course, fret 5 — home, held", duration: 1.8 },
      { beat: 30, label: "G ↑", notes: [67], detail: "D course, fret 5 — held to the end", duration: 1.8 },
    ],
  },
  // One octave of G major: G course up to C, D course up to G, and back.
  lesson_mandolin_scale_01: {
    beats: 16,
    cues: [
      { beat: 0, label: "G ↓", notes: [55], detail: "G course, open — the tonic", duration: 0.9 },
      { beat: 1, label: "A ↑", notes: [57], detail: "G course, fret 2", duration: 0.9 },
      { beat: 2, label: "B ↓", notes: [59], detail: "G course, fret 4", duration: 0.9 },
      { beat: 3, label: "C ↑", notes: [60], detail: "G course, fret 5", duration: 0.9 },
      { beat: 4, label: "D ↓", notes: [62], detail: "D course, open", duration: 0.9 },
      { beat: 5, label: "E ↑", notes: [64], detail: "D course, fret 2", duration: 0.9 },
      { beat: 6, label: "F♯ ↓", notes: [66], detail: "D course, fret 4", duration: 0.9 },
      { beat: 7, label: "G ↑", notes: [67], detail: "D course, fret 5 — top of the scale", duration: 0.9 },
      { beat: 8, label: "F♯ ↓", notes: [66], detail: "D course, fret 4 — heading back down", duration: 0.9 },
      { beat: 9, label: "E ↑", notes: [64], detail: "D course, fret 2", duration: 0.9 },
      { beat: 10, label: "D ↓", notes: [62], detail: "D course, open", duration: 0.9 },
      { beat: 11, label: "C ↑", notes: [60], detail: "G course, fret 5", duration: 0.9 },
      { beat: 12, label: "B ↓", notes: [59], detail: "G course, fret 4", duration: 0.9 },
      { beat: 13, label: "A ↑", notes: [57], detail: "G course, fret 2", duration: 0.9 },
      { beat: 14, label: "G ↓", notes: [55], detail: "G course, open — home", duration: 0.9 },
      { beat: 15, label: "Rest", detail: "Name the scale before you play it again: G major" },
    ],
  },
  // Same fret on the D and A courses: the fifths tuning answers a fifth below.
  lesson_mandolin_double_stops_01: {
    beats: 8,
    cues: [
      { beat: 0, label: "D + A ↓", notes: [62, 69], detail: "Both courses open", duration: 0.9 },
      { beat: 1, label: "E + B ↑", notes: [64, 71], detail: "Same fret, 2, on both courses", duration: 0.9 },
      { beat: 2, label: "G + D ↓", notes: [67, 74], detail: "Same fret, 5, on both courses", duration: 0.9 },
      { beat: 3, label: "E + B ↑", notes: [64, 71], detail: "Same fret, 2, on both courses", duration: 0.9 },
      { beat: 4, label: "D + A ↓", notes: [62, 69], detail: "Both courses open", duration: 0.9 },
      { beat: 5, label: "E + B ↑", notes: [64, 71], detail: "Same fret, 2, on both courses", duration: 0.9 },
      { beat: 6, label: "G + D ↓", notes: [67, 74], detail: "Same fret, 5 — let this one ring", duration: 1.8 },
      { beat: 7, label: "Hold", detail: "Let the fifth ring to the end of the bar" },
    ],
  },
};

const NOTE_NAME: Record<number, string> = {
  41: "F", 43: "G", 48: "C", 50: "D", 52: "E", 53: "F", 55: "G", 57: "A", 59: "B",
  60: "C", 62: "D", 64: "E", 65: "F", 67: "G", 69: "A", 71: "B", 72: "C", 74: "D",
};
const pc = (
  beat: number,
  label: string,
  notes: number[],
  detail: string,
  duration = 0.9,
): PracticeCue => ({ beat, label, notes, detail, duration });

/** Left hand holds the bar's root; right hand walks root–third–fifth–third. */
function handsTogetherCues(): PracticeCue[] {
  const blocks: { chord: string; root: number; tones: [number, number, number] }[] = [
    { chord: "C", root: 48, tones: [60, 64, 67] },
    { chord: "F", root: 41, tones: [53, 57, 60] },
    { chord: "G", root: 43, tones: [67, 71, 74] },
  ];
  const cues: PracticeCue[] = [];
  blocks.forEach((block, blockIndex) => {
    for (let bar = 0; bar < 4; bar++) {
      const base = (blockIndex * 4 + bar) * 4;
      cues.push(
        pc(base, `LH ${NOTE_NAME[block.root]}`, [block.root], `Left hand: hold the ${block.chord} root for the bar`, 3.8),
      );
      [block.tones[0], block.tones[1], block.tones[2], block.tones[1]].forEach((midi, i) => {
        cues.push(pc(base + i, `RH ${NOTE_NAME[midi]}`, [midi], `Right hand: ${NOTE_NAME[midi]}`));
      });
    }
  });
  return cues;
}

/** The Learn voice-leading pattern: C4 anchor held while the upper notes swap. */
function inversionCues(): PracticeCue[] {
  const cues: PracticeCue[] = [];
  for (let bar = 0; bar < 12; bar++) {
    const base = bar * 4;
    cues.push(pc(base, "C anchor", [60], "Hold C4 through the whole bar", 3.8));
    cues.push(
      bar % 2 === 1
        ? pc(base, "F/C upper notes", [65, 69], "F4–A4 over the held C4", 1.95)
        : pc(base, "C upper notes", [64, 67], "E4–G4 over the held C4", 1.95),
    );
  }
  return cues;
}

/** Ode to Joy, both phrases; the phrase-ending note is held, as on ukulele. */
function odeToJoyCues(): PracticeCue[] {
  const bars: { root: number; rootName: string; notes: number[] }[] = [
    { root: 48, rootName: "C", notes: [64, 64, 65, 67] },
    { root: 48, rootName: "C", notes: [67, 65, 64, 62] },
    { root: 48, rootName: "C", notes: [60, 60, 62, 64] },
    { root: 43, rootName: "G", notes: [64, 62, 62] },
    { root: 48, rootName: "C", notes: [64, 64, 65, 67] },
    { root: 48, rootName: "C", notes: [67, 65, 64, 62] },
    { root: 48, rootName: "C", notes: [60, 60, 62, 64] },
    { root: 48, rootName: "C", notes: [62, 60, 60] },
  ];
  const cues: PracticeCue[] = [];
  bars.forEach((bar, barIndex) => {
    const base = barIndex * 4;
    bar.notes.forEach((midi, i) => {
      const held = bar.notes.length === 3 && i === 2;
      cues.push(
        pc(
          base + i,
          NOTE_NAME[midi],
          i === 0 ? [bar.root, midi] : [midi],
          i === 0
            ? `Left hand: ${bar.rootName} root — right hand: ${NOTE_NAME[midi]}`
            : `Right hand: ${NOTE_NAME[midi]}`,
          held ? 1.9 : 0.9,
        ),
      );
    });
  });
  return cues;
}

/** One octave up and down per hand; details land only on the thumb moves. */
function cMajorScaleCues(): PracticeCue[] {
  const up = [60, 62, 64, 65, 67, 69, 71, 72];
  const right = [...up, 71, 69, 67, 65, 64, 62, 60];
  const left = right.map((midi) => midi - 12);
  const cues: PracticeCue[] = [];
  right.forEach((midi, i) => {
    let detail = "Right hand";
    if (i === 3) detail = "Right hand: thumb tucks under to F";
    if (i === 11) detail = "Right hand: thumb on F — fingers cross over for E";
    cues.push(pc(i, NOTE_NAME[midi], [midi], detail));
  });
  cues.push({
    beat: 15,
    label: "Rest",
    detail: "Hands swap: the left hand takes the same shape, an octave lower",
  });
  left.forEach((midi, i) => {
    let detail = "Left hand";
    if (i === 4) detail = "Left hand: thumb on G — middle finger crosses over for A";
    if (i === 10) detail = "Left hand: thumb tucks under to G";
    cues.push(pc(16 + i, NOTE_NAME[midi], [midi], detail));
  });
  return cues;
}

/** Each bar breaks its triad into root–third–fifth–third over a left-hand root. */
function arpeggioCues(): PracticeCue[] {
  const shapes: { chord: string; root: number; tones: [number, number, number] }[] = [
    { chord: "C", root: 48, tones: [60, 64, 67] },
    { chord: "F", root: 53, tones: [65, 69, 72] },
    { chord: "G", root: 55, tones: [67, 71, 74] },
  ];
  const cues: PracticeCue[] = [];
  for (let bar = 0; bar < 12; bar++) {
    const shape = shapes[bar % 3];
    const base = bar * 4;
    [shape.tones[0], shape.tones[1], shape.tones[2], shape.tones[1]].forEach((midi, i) => {
      cues.push(
        i === 0
          ? pc(base, shape.chord, [shape.root, midi], `Left hand: ${shape.chord} root — right hand climbs`)
          : pc(base + i, NOTE_NAME[midi], [midi], "Right hand"),
      );
    });
  }
  return cues;
}

/** One chord per bar, held; the pedal work is in the lesson's words. */
function pedalCues(): PracticeCue[] {
  const shapes: { chord: string; notes: number[] }[] = [
    { chord: "C", notes: [60, 64, 67] },
    { chord: "F", notes: [53, 57, 60] },
    { chord: "G", notes: [67, 71, 74] },
  ];
  const cues: PracticeCue[] = [];
  for (let bar = 0; bar < 6; bar++) {
    const shape = shapes[Math.floor(bar / 2)];
    const base = bar * 4;
    cues.push(pc(base, shape.chord, shape.notes, "Press the pedal just after the chord lands", 3.8));
    cues.push({ beat: base + 3, label: "Change", detail: "Lift and re-press the pedal at the change — no smear" });
  }
  return cues;
}

/**
 * Piano daily lessons with through-composed cue sets (the tiling above is for
 * short looping exercises). Authored at absolute beats, played as written.
 */
const PIANO_DAILY_CUES: Record<string, PracticeCue[]> = {
  lesson_piano_hands_together_01: handsTogetherCues(),
  lesson_piano_inversions_01: inversionCues(),
  lesson_piano_song_ode_01: odeToJoyCues(),
  lesson_piano_scale_c_01: cMajorScaleCues(),
  lesson_piano_arpeggio_01: arpeggioCues(),
  lesson_piano_pedal_01: pedalCues(),
};

export function hasInstrumentPattern(item: { lessonId?: string; process?: string }) {
  return (
    item.process !== "respond" &&
    item.process !== "create" &&
    (!!DAILY_EXERCISES[item.lessonId ?? ""] ||
      !!PIANO_DAILY_CUES[item.lessonId ?? ""] ||
      !!VOCAL_DAILY_CUES[item.lessonId ?? ""] ||
      !!MANDOLIN_DAILY_CUES[item.lessonId ?? ""])
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
  if (item.process === "respond" || item.process === "create") return undefined;
  const bespoke = MANDOLIN_DAILY_CUES[item.lessonId ?? ""];
  if (bespoke) {
    const cues: PracticeCue[] = [];
    const total = item.bars * 4;
    for (let start = 0; start < total; start += bespoke.beats) {
      for (const cue of bespoke.cues) {
        const beat = start + cue.beat;
        if (beat >= total) continue;
        cues.push({
          ...cue,
          beat,
          duration: cue.duration ? Math.min(cue.duration, total - beat) : cue.duration,
        });
      }
    }
    return cues;
  }
  if (!hasInstrumentPattern(item)) return undefined;
  const piano = PIANO_DAILY_CUES[item.lessonId];
  if (piano) return piano;
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
