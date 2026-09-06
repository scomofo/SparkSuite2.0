import { learningLesson } from "./curriculum.ts";
import { CHORDS } from "./guitar.ts";
import { UKE_CHORDS, type InstrumentId } from "./instruments.ts";
import type { BassPos } from "./bass.ts";
import type { ChordShape } from "./types.ts";

/** Beat positions are quarter notes. Half-beats are straight eighth notes. */
export type PracticeCue = {
  beat: number;
  label: string;
  detail: string;
  notes?: number[];
  pads?: number[];
  muted?: boolean;
  duration?: number;
  chord?: string;
};
export type LessonExercise = {
  lessonId: string;
  title: string;
  goal: string;
  setup: string;
  hint: string;
  takeaway: string;
  bpm: number;
  beats: number;
  cues: PracticeCue[];
  shapes?: string[];
  positions?: BassPos[];
};
export type PracticeGuide = "notes" | "pulse" | "silent";
export type PracticeReflection = "again" | "ready";
export type LearningPractice = {
  bpm: number;
  guide: PracticeGuide;
  phase: "ready" | "reflect";
  reflection?: PracticeReflection;
};

export const PRACTICE_TEMPOS = [40, 50, 60, 70, 80, 90, 100] as const;
export function practiceTempo(value: unknown, fallback = 60): number {
  return typeof value === "number" && Number.isFinite(value)
    ? Math.max(40, Math.min(100, Math.round(value / 10) * 10))
    : fallback;
}
export function parsePractice(value: unknown, bpm: number): LearningPractice | undefined {
  if (!value || typeof value !== "object") return undefined;
  const raw = value as Record<string, unknown>;
  const phase = raw.phase === "reflect" ? "reflect" : "ready";
  return {
    bpm: practiceTempo(raw.bpm, bpm),
    guide: raw.guide === "pulse" || raw.guide === "silent" ? raw.guide : "notes",
    phase,
    ...(phase === "reflect" && (raw.reflection === "again" || raw.reflection === "ready")
      ? { reflection: raw.reflection }
      : {}),
  };
}

export function practiceShape(instrument: InstrumentId, chord: string): ChordShape | undefined {
  if (instrument === "guitar") return CHORDS[chord];
  const shape = instrument === "ukulele" ? UKE_CHORDS[chord] : undefined;
  return shape ? { ...shape, id: chord, name: chord } : undefined;
}
function chordNotes(instrument: "guitar" | "ukulele", chord: string) {
  const open = instrument === "guitar" ? [40, 45, 50, 55, 59, 64] : [67, 60, 64, 69];
  return practiceShape(instrument, chord)!.frets.flatMap((fret, index) =>
    fret === null ? [] : [open[index] + fret],
  );
}
const note = (
  beat: number,
  label: string,
  notes: number[],
  detail = label,
  duration = 0.85,
): PracticeCue => ({ beat, label, notes, detail, duration });
const rest = (beat: number, detail = "Rest; keep counting"): PracticeCue => ({
  beat,
  label: "Rest",
  detail,
});
const drum = (beat: number, pads: number[]): PracticeCue => ({
  beat,
  pads,
  label: pads.map((pad) => ["K", "S", "H", "T"][pad]).join(" + "),
  detail: pads.map((pad) => ["Kick", "Snare", "Hi-hat", "Tom"][pad]).join(" + "),
});
const strum = (
  beat: number,
  instrument: "guitar" | "ukulele",
  chord: string,
  up = false,
): PracticeCue => ({
  ...note(
    beat,
    `${chord} ${up ? "↑" : "↓"}`,
    chordNotes(instrument, chord),
    `${chord}: ${up ? "upstroke" : "downstroke"}`,
  ),
  chord,
});
function repeat(cues: PracticeCue[], bars: number) {
  return Array.from({ length: bars }, (_, bar) =>
    cues.map((cue) => ({ ...cue, beat: cue.beat + bar * 4 })),
  ).flat();
}
function chordBars(instrument: "guitar" | "ukulele", chords: string[]) {
  return chords.flatMap((chord, bar) => [
    strum(bar * 4, instrument, chord),
    { beat: bar * 4 + 1, label: "Count", detail: "Keep counting; no new strum" },
    { beat: bar * 4 + 2, label: "Prepare", detail: "Prepare the next shape; no new strum" },
    { beat: bar * 4 + 3, label: "Prepare", detail: "Keep counting while you change shape" },
  ]);
}
const bassG: BassPos = { string: 0, fret: 3, name: "G", role: "R" };
const bassD: BassPos = { string: 1, fret: 5, name: "D", role: "5" };
const bassHighG: BassPos = { string: 2, fret: 5, name: "G", role: "8" };
const bassE: BassPos = { string: 0, fret: 0, name: "E", role: "R" };

export const LESSON_EXERCISES: LessonExercise[] = [
  {
    lessonId: "guitar-first-sound",
    title: "Open E → F → E",
    bpm: 60,
    beats: 12,
    goal: "Try the open note and first-fret note three times; notice which is higher.",
    setup: "Use the thickest string. F is just behind fret 1. Leave beat 4 quiet.",
    hint: "Try only open E and F once, without the guide. Press just behind the fret with enough pressure for a clear note.",
    takeaway:
      "The first fret raises open E to F. Keep exploring a clear sound before adding speed.",
    cues: repeat(
      [
        note(0, "E", [40], "Low E string, open"),
        note(1, "F", [41], "Low E string, fret 1"),
        note(2, "E", [40], "Low E string, open"),
        rest(3),
      ],
      3,
    ),
  },
  {
    lessonId: "guitar-pulse",
    title: "Two strums, four counts",
    bpm: 60,
    beats: 16,
    goal: "Brush the muted strings on 1 and 3 for four bars; count through 2 and 4.",
    setup:
      "Rest your fretting hand lightly across the strings so they make a soft, unpitched sound.",
    hint: "Tap the rhythm on your knee for one bar. Keep saying all four numbers, including the quiet ones.",
    takeaway: "The spaces belong to the beat too. If you miss a strum, join the next count.",
    cues: repeat(
      [
        { beat: 0, label: "↓", detail: "Brush muted strings down", muted: true },
        rest(1),
        { beat: 2, label: "↓", detail: "Brush muted strings down", muted: true },
        rest(3),
      ],
      4,
    ),
  },
  {
    lessonId: "guitar-em-to-g",
    title: "Em → G, one change at a time",
    bpm: 60,
    beats: 16,
    goal: "Alternate Em and G for four bars, strumming only on each beat 1.",
    setup:
      "Use beats 3 and 4 to prepare the next chord. It is fine to release the sound while changing.",
    hint: "Put the guide on hold and move silently between the two shapes three times. Then try two bars at 40 BPM.",
    takeaway:
      "You gave each change a place in the bar. Keep the same small goal on your next attempt.",
    shapes: ["Em", "G"],
    cues: chordBars("guitar", ["Em", "G", "Em", "G"]),
  },
  {
    lessonId: "guitar-eighths",
    title: "Downbeats and the spaces between",
    bpm: 60,
    beats: 16,
    goal: "Try four bars of down, down-up, down, down-up on Em.",
    setup:
      "Say 1-and-2-and-3-and-4-and. The hand keeps moving; only the marked strokes touch the strings.",
    hint: "Mute the strings and say the eight syllables first. An and sits halfway between two numbers.",
    takeaway: "A silent hand movement can keep the subdivision steady. Speed can wait.",
    shapes: ["Em"],
    cues: repeat(
      [
        strum(0, "guitar", "Em"),
        rest(0.5, "Silent upward motion"),
        strum(1, "guitar", "Em"),
        strum(1.5, "guitar", "Em", true),
        strum(2, "guitar", "Em"),
        rest(2.5, "Silent upward motion"),
        strum(3, "guitar", "Em"),
        strum(3.5, "guitar", "Em", true),
      ],
      4,
    ).map((cue) => ({ ...cue, duration: 0.4 })),
  },
  {
    lessonId: "piano-find-c",
    title: "Find C, then take a short walk",
    bpm: 60,
    beats: 8,
    goal: "Play C–D–E and E–D–C once, leaving a rest between the two groups.",
    setup:
      "C is the white key just left of a pair of black keys. Try near the middle of your keyboard.",
    hint: "Find the two black keys again. Play only the white key to their left, then add its neighbor D.",
    takeaway:
      "The black-key groups are landmarks. Use them to find another C before your next attempt.",
    cues: [
      note(0, "C", [60]),
      note(1, "D", [62]),
      note(2, "E", [64]),
      rest(3),
      note(4, "E", [64]),
      note(5, "D", [62]),
      note(6, "C", [60]),
      rest(7),
    ],
  },
  {
    lessonId: "piano-pulse-and-rest",
    title: "Play C, leave a space",
    bpm: 60,
    beats: 16,
    goal: "Play C on 1 and 3, and release on 2 and 4 for four bars.",
    setup: "Keep the pedal up so lifting the key leaves a clear silence.",
    hint: "Say play–release–play–release without the keyboard. Then add just one finger on C.",
    takeaway:
      "Releasing the key is part of the rhythm. Count the silence as deliberately as the sound.",
    cues: repeat(
      [
        note(0, "C", [60]),
        rest(1, "Release C; keep counting"),
        note(2, "C", [60]),
        rest(3, "Release C; keep counting"),
      ],
      4,
    ),
  },
  {
    lessonId: "piano-major-minor",
    title: "One note changes the chord",
    bpm: 60,
    beats: 8,
    goal: "Compare C major and C minor twice, changing only E to E♭.",
    setup: "Use C–E–G, then C–E♭–G. E♭ is the black key immediately left of E.",
    hint: "Play just E and E♭ first. Keep C and G in the same places when you rebuild the chords.",
    takeaway: "The third changed by one semitone while the root and fifth stayed put.",
    cues: repeat(
      [
        note(0, "C major", [60, 64, 67], "C–E–G", 1.8),
        { beat: 1, label: "Hold", detail: "Keep C–E–G down" },
        note(2, "C minor", [60, 63, 67], "C–E♭–G", 1.8),
        { beat: 3, label: "Hold", detail: "Keep C–E♭–G down" },
      ],
      2,
    ),
  },
  {
    lessonId: "piano-hands-together",
    title: "One anchor, one moving hand",
    bpm: 50,
    beats: 8,
    goal: "Hold a low C with your left hand while your right plays C–E–G–E, twice.",
    setup:
      "Left hand: C3. Right hand: C4–E4–G4–E4. Learn either part separately before combining them.",
    hint: "Try the right-hand pattern on its own. Add the left-hand C only on the next beat 1 when you are ready.",
    takeaway:
      "Each hand has its own job. A steady left-hand anchor gives the right hand room to move.",
    cues: repeat(
      [
        note(0, "LH C", [48], "Left hand: hold low C for the bar", 3.8),
        note(0, "RH C", [60], "Right hand: C"),
        note(1, "RH E", [64], "Right hand: E"),
        note(2, "RH G", [67], "Right hand: G"),
        note(3, "RH E", [64], "Right hand: E"),
      ],
      2,
    ),
  },
  {
    lessonId: "ukulele-gcea",
    title: "Meet G–C–E–A",
    bpm: 60,
    beats: 8,
    goal: "Pluck the four open strings in G–C–E–A order, twice.",
    setup:
      "In the usual playing position, start at the string nearest your face. This guide uses standard high-G tuning.",
    hint: "Name one string at a time with the guide stopped. High G means the first string is not the lowest pitch.",
    takeaway:
      "G–C–E–A names the strings in playing order. Their pitches do not simply rise from first to last.",
    cues: repeat(
      [
        note(0, "G", [67], "G string, open"),
        note(1, "C", [60], "C string, open"),
        note(2, "E", [64], "E string, open"),
        note(3, "A", [69], "A string, open"),
      ],
      2,
    ),
  },
  {
    lessonId: "ukulele-first-c",
    title: "One C chord, four counts",
    bpm: 60,
    beats: 16,
    goal: "Strum C only on beat 1 for four bars while you keep counting.",
    setup: "Place one finger on the A string at fret 3. Keep G, C, and E open.",
    hint: "Pluck each string of the shape slowly. Then count four with just one gentle downstroke at the start.",
    takeaway: "One strum can give a whole bar its harmony. The other counts still matter.",
    shapes: ["C"],
    cues: repeat(
      [
        strum(0, "ukulele", "C"),
        ...[1, 2, 3].map((beat) => ({
          beat,
          label: "Count",
          detail: "Keep counting; no new strum",
        })),
      ],
      4,
    ),
  },
  {
    lessonId: "ukulele-c-f-am",
    title: "C → Am → F",
    bpm: 50,
    beats: 12,
    goal: "Give C, Am, and F one bar each, strumming on beat 1.",
    setup:
      "The finger at G-string fret 2 can stay in place from Am to F. Use the remaining beats to prepare each change.",
    hint: "Practice only Am to F silently. Keep G-string fret 2 down and add E-string fret 1 for F.",
    takeaway: "Finding a finger that can stay makes a chord change smaller and easier to repeat.",
    shapes: ["C", "Am", "F"],
    cues: chordBars("ukulele", ["C", "Am", "F"]),
  },
  {
    lessonId: "ukulele-island-rhythm",
    title: "Keep moving through the missing stroke",
    bpm: 60,
    beats: 16,
    goal: "Try four bars of down, down-up, up-down-up on C.",
    setup: "The downstroke on 3 passes silently. The upstroke on and-of-3 sounds.",
    hint: "Speak the eight counts over muted strings. Keep the hand moving on the silent and-of-1 and beat 3.",
    takeaway:
      "The silent downstroke preserves the motion that brings the next upstroke into place.",
    shapes: ["C"],
    cues: repeat(
      [
        strum(0, "ukulele", "C"),
        rest(0.5, "Silent upward motion"),
        strum(1, "ukulele", "C"),
        strum(1.5, "ukulele", "C", true),
        rest(2, "Silent downward motion"),
        strum(2.5, "ukulele", "C", true),
        strum(3, "ukulele", "C"),
        strum(3.5, "ukulele", "C", true),
      ],
      4,
    ).map((cue) => ({ ...cue, duration: 0.4 })),
  },
  {
    lessonId: "bass-one-note",
    title: "Start E, then stop it",
    bpm: 60,
    beats: 16,
    goal: "Pluck open E, let it last two counts, then mute for two; try four times.",
    setup:
      "Touch the string gently on beat 3 to stop its vibration. Keep the unused strings quiet.",
    hint: "Focus on the stopping action once. Pluck E, then rest a finger gently on the string and listen for silence.",
    takeaway: "You chose both the start and the end of the note. Both help shape a bass groove.",
    positions: [bassE],
    cues: repeat(
      [
        note(0, "E", [28], "E string, open", 1.95),
        { beat: 1, label: "Hold", detail: "Let E ring" },
        rest(2, "Mute E with a light touch"),
        rest(3),
      ],
      4,
    ),
  },
  {
    lessonId: "bass-quarter-pulse",
    title: "Sixteen steady Es",
    bpm: 60,
    beats: 16,
    goal: "Play open E once on each number for four bars.",
    setup: "Use a light pluck. Keep saying 1–2–3–4 even if a note is late.",
    hint: "Try a single bar. If a note is missed, keep counting and rejoin on the next number.",
    takeaway:
      "Four groups of four made sixteen quarter-note beats. Returning to the pulse is part of practice.",
    positions: [bassE],
    cues: Array.from({ length: 16 }, (_, beat) => note(beat, "E", [28], "E string, open")),
  },
  {
    lessonId: "bass-follow-roots",
    title: "E roots → G roots",
    bpm: 60,
    beats: 16,
    goal: "Play four Es, then four Gs, and repeat the pair of bars.",
    setup: "E is open on the thickest string; G is fret 3 of that same string. Change on beat 1.",
    hint: "Play E and G once each with no guide. Then give each note a whole bar before adding the other plucks.",
    takeaway:
      "The root gives each chord a clear foundation. Prepare the new root before the next bar begins.",
    positions: [bassE, bassG],
    cues: Array.from({ length: 16 }, (_, beat) => {
      const isE = Math.floor(beat / 4) % 2 === 0;
      return note(
        beat,
        isE ? "E" : "G",
        [isE ? 28 : 31],
        isE ? "E string, open" : "E string, fret 3",
      );
    }),
  },
  {
    lessonId: "bass-fifth-octave",
    title: "Root → fifth → octave → fifth",
    bpm: 50,
    beats: 16,
    goal: "Try G–D–higher G–D for four bars, muting the string you leave.",
    setup: "G: E string, fret 3. D: A string, fret 5. Higher G: D string, fret 5.",
    hint: "Find just the root and fifth first. Add the higher G when the two-string movement feels manageable.",
    takeaway:
      "A fifth and an octave can expand one root into a line while keeping its harmony clear.",
    positions: [bassG, bassD, bassHighG],
    cues: repeat(
      [
        note(0, "G", [31], "E string, fret 3: root"),
        note(1, "D", [38], "A string, fret 5: fifth"),
        note(2, "High G", [43], "D string, fret 5: octave"),
        note(3, "D", [38], "A string, fret 5: fifth"),
      ],
      4,
    ),
  },
  {
    lessonId: "drums-pulse",
    title: "Sixteen taps, one pulse",
    bpm: 60,
    beats: 16,
    goal: "Tap your knee or one pad on sixteen steady counts.",
    setup:
      "Say 1 again after each 4. The guide uses a kick sound; your knee is enough to practice.",
    hint: "Count one bar aloud without tapping. Add the tap only when you can keep the numbers even.",
    takeaway:
      "A steady count gives the kit its shared clock. The sound you choose can change while the pulse stays.",
    cues: Array.from({ length: 16 }, (_, beat) => drum(beat, [0])),
  },
  {
    lessonId: "drums-backbeat",
    title: "Kick, snare, kick, snare",
    bpm: 60,
    beats: 16,
    goal: "Keep kick on 1 and 3 and snare on 2 and 4 for four bars.",
    setup: "Use a foot tap for kick and a knee tap for snare, or explore the app's pads.",
    hint: "Say kick–snare–kick–snare first. Use two different tapping surfaces so you can hear the pattern.",
    takeaway:
      "The snare on 2 and 4 gives this groove its backbeat. Let the space between hits stay even.",
    cues: Array.from({ length: 16 }, (_, beat) => drum(beat, [beat % 2])),
  },
  {
    lessonId: "drums-eighth-hats",
    title: "Put the hi-hat between the beats",
    bpm: 50,
    beats: 8,
    goal: "Try two bars with eight hi-hats per bar, kick on 1 and 3, snare on 2 and 4.",
    setup:
      "K = kick, S = snare, H = hi-hat. A plus means play those sounds together. Begin with only the hi-hat if needed.",
    hint: "Remove the snare for one pass. Keep eight even hi-hats and add only the kick on 1 and 3.",
    takeaway:
      "The ands split each beat in half. The hat continues through the kick and snare rather than waiting for them.",
    cues: Array.from({ length: 16 }, (_, index) =>
      drum(index / 2, index % 2 ? [2] : [Math.floor(index / 2) % 2, 2]),
    ),
  },
  {
    lessonId: "drums-first-fill",
    title: "A small fill, a clear return",
    bpm: 60,
    beats: 17,
    goal: "Play four bars, add a second snare on the last and-of-4, and land on the next kick.",
    setup:
      "The fifth bar shows only the landing beat. The guide ends there so you can stop and check in.",
    hint: "Practice only 4-and-1: snare, snare, kick. Keep those two snare taps inside beat 4.",
    takeaway:
      "The fill used the original beat and led to the next 1. A clear return makes even a tiny fill musical.",
    cues: [
      ...Array.from({ length: 16 }, (_, beat) => drum(beat, [beat % 2])),
      drum(15.5, [1]),
      drum(16, [0]),
    ],
  },
  {
    lessonId: "vocals-easy-tone",
    title: "Two counts of sound, two of space",
    bpm: 60,
    beats: 8,
    goal: "Try two easy hums with space between them, or listen and follow the rests.",
    setup:
      "Choose a comfortable note near your speaking range. The C reference is optional; stop singing if it feels uncomfortable.",
    hint: "Use an ordinary breath and an even shorter hum, or simply listen and notice where the sound ends.",
    takeaway:
      "A brief sound and a deliberate rest are enough for this attempt. Comfort comes before matching a reference.",
    cues: repeat(
      [
        note(0, "Hum", [60], "Hum a comfortable note, or listen", 1.9),
        { beat: 1, label: "Easy", detail: "Keep it gentle; finish sooner if needed" },
        rest(2, "Rest and breathe normally"),
        rest(3),
      ],
      2,
    ),
  },
  {
    lessonId: "vocals-pitch-direction",
    title: "A step up, a step down",
    bpm: 60,
    beats: 8,
    goal: "Listen to C–D and D–C, and name the direction of each pair.",
    setup: "You can point up and down, or echo in a comfortable octave. Singing is optional.",
    hint: "Listen only to the first pair. Ask whether the second pitch is higher or lower, without changing the volume.",
    takeaway:
      "Up and down describe pitch direction. The same direction is possible in any comfortable octave.",
    cues: [
      note(0, "C", [60]),
      note(1, "D ↑", [62], "D: one step higher"),
      rest(2, "Say up or point upward"),
      rest(3),
      note(4, "D", [62]),
      note(5, "C ↓", [60], "C: one step lower"),
      rest(6, "Say down or point downward"),
      rest(7),
    ],
  },
  {
    lessonId: "vocals-phrase-and-rest",
    title: "Here, we, go — then space",
    bpm: 60,
    beats: 16,
    goal: "Speak or sing here–we–go on 1–2–3, resting on 4, for four bars.",
    setup:
      "Use your speaking voice or one easy pitch. Keep the last count silent and breathe as needed.",
    hint: "Speak the words once. Keep counting silently on 4 so the next here starts on 1.",
    takeaway: "The rest gives the phrase a shape and a place to breathe while the pulse continues.",
    cues: repeat(
      [
        note(0, "Here", [60], "Speak or sing here"),
        note(1, "We", [60], "Speak or sing we"),
        note(2, "Go", [60], "Speak or sing go"),
        rest(3, "Leave space; breathe as needed"),
      ],
      4,
    ),
  },
  {
    lessonId: "vocals-thirds",
    title: "Two thirds from the same starting note",
    bpm: 60,
    beats: 8,
    goal: "Compare C–E with C–E♭ and name the smaller gap.",
    setup: "Listen first. Echoing either pair in a comfortable octave is optional.",
    hint: "Listen to the top notes E and E♭ separately. E♭ is one semitone lower, making a smaller gap above C.",
    takeaway: "C–E♭ is the minor third: three semitones. C–E is the major third: four.",
    cues: [
      note(0, "C", [60]),
      note(1, "E", [64], "E: a major third above C"),
      rest(2),
      rest(3),
      note(4, "C", [60]),
      note(5, "E♭", [63], "E-flat: a minor third above C"),
      rest(6),
      rest(7),
    ],
  },
];

export function lessonExercise(id: string | undefined): LessonExercise | undefined {
  return id && learningLesson(id)
    ? LESSON_EXERCISES.find((exercise) => exercise.lessonId === id)
    : undefined;
}

export function practiceBar(exercise: LessonExercise, bar: number) {
  const first = Math.max(0, Math.min(Math.ceil(exercise.beats / 4) - 1, bar)) * 4;
  return Array.from({ length: Math.min(4, exercise.beats - first) }, (_, index) => {
    const beat = first + index;
    return { beat, cues: exercise.cues.filter((cue) => cue.beat >= beat && cue.beat < beat + 1) };
  });
}
