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
    (!!DAILY_EXERCISES[item.lessonId ?? ""] || !!PIANO_DAILY_CUES[item.lessonId ?? ""])
  );
}

/** Quarter-note positions, with explicit pitches, mutes and bow directions. */
export function dailyInstrumentCues(item: PlanItem): PracticeCue[] | undefined {
  if (!hasInstrumentPattern(item)) return undefined;
  const piano = PIANO_DAILY_CUES[item.lessonId];
  if (piano) return piano;
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
