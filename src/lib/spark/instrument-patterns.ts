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

export function hasInstrumentPattern(item: { lessonId?: string; process?: string }) {
  return (
    item.process !== "respond" &&
    item.process !== "create" &&
    (!!DAILY_EXERCISES[item.lessonId ?? ""] || !!MANDOLIN_DAILY_CUES[item.lessonId ?? ""])
  );
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
