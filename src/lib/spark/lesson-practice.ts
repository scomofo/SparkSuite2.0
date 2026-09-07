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
export type PracticeSubdivision = 1 | 2 | 3 | 4;
export type LessonExercise = {
  lessonId: string;
  title: string;
  goal: string;
  setup: string;
  hint: string;
  takeaway: string;
  bpm: number;
  beats: number;
  subdivision?: PracticeSubdivision;
  cues: PracticeCue[];
  shapes?: string[];
  positions?: BassPos[];
  retryLabel?: string;
  project?: LessonProject;
};
export type PracticeGuide = "notes" | "pulse" | "silent";
export type PracticeReflection = "again" | "ready";
export type PracticeRetryFocus = "pulse" | "technique";
export type PracticeProjectStage = 0 | 1 | 2;
export type LessonProject = {
  buildBeats: number;
  stages: [
    { label: "Build"; title: string; instruction: string; button: string },
    { label: "Choose"; title: string; instruction: string; button: string },
    { label: "Refine"; title: string; instruction: string; button: string },
  ];
  choices: [{ label: string; detail: string }, { label: string; detail: string }];
};
export type LearningPractice = {
  bpm: number;
  guide: PracticeGuide;
  phase: "ready" | "reflect";
  reflection?: PracticeReflection;
  retryFocus?: PracticeRetryFocus;
  projectStage?: PracticeProjectStage;
  projectChoice?: 0 | 1;
};

export const PRACTICE_TEMPOS = [40, 50, 60, 70, 80, 90, 100] as const;
export function practiceTempo(value: unknown, fallback = 60): number {
  return typeof value === "number" && Number.isFinite(value)
    ? Math.max(40, Math.min(100, Math.round(value / 10) * 10))
    : fallback;
}
export function parsePractice(
  value: unknown,
  bpm: number,
  project?: LessonProject,
): LearningPractice | undefined {
  if (!value || typeof value !== "object") return undefined;
  const raw = value as Record<string, unknown>;
  const projectChoice: 0 | 1 | undefined =
    raw.projectChoice === 0 || raw.projectChoice === 1 ? raw.projectChoice : undefined;
  const projectStage: PracticeProjectStage =
    project && raw.projectStage === 2
      ? projectChoice !== undefined
        ? 2
        : 1
      : project && raw.projectStage === 1
        ? 1
        : 0;
  const projectCanReflect = !project || (projectStage === 2 && projectChoice !== undefined);
  const phase = raw.phase === "reflect" && projectCanReflect ? "reflect" : "ready";
  const reflection =
    phase === "reflect" && (raw.reflection === "again" || raw.reflection === "ready")
      ? raw.reflection
      : undefined;
  return {
    bpm: practiceTempo(raw.bpm, bpm),
    guide: raw.guide === "pulse" || raw.guide === "silent" ? raw.guide : "notes",
    phase,
    ...(reflection ? { reflection } : {}),
    ...(projectCanReflect &&
    (phase === "ready" || reflection === "again") &&
    (raw.retryFocus === "pulse" || raw.retryFocus === "technique")
      ? { retryFocus: raw.retryFocus }
      : {}),
    ...(project ? { projectStage } : {}),
    ...(project && projectStage > 0 && projectChoice !== undefined ? { projectChoice } : {}),
  };
}

export function practiceSequence(exercise: LessonExercise, practice?: LearningPractice) {
  const beats =
    practice?.phase === "ready" && practice.retryFocus === "pulse"
      ? Math.min(4, exercise.beats)
      : exercise.project && (practice?.projectStage ?? 0) === 0
        ? exercise.project.buildBeats
        : exercise.beats;
  return {
    beats,
    cues: exercise.cues.filter((cue) => cue.beat < beats),
    positions: exercise.positions,
    subdivision: exercise.subdivision,
  };
}

export function retryCoaching(exercise: LessonExercise) {
  const instrument = learningLesson(exercise.lessonId)!.instrument;
  const techniqueLabel =
    exercise.retryLabel ??
    (instrument === "drums"
      ? "My hands or feet tangled"
      : instrument === "vocals"
        ? "The sound or range felt uncomfortable"
        : instrument === "piano"
          ? "The notes or hand movement felt awkward"
          : instrument === "bass"
            ? "The notes or string changes felt awkward"
            : "The notes or shapes felt awkward");
  return [
    {
      id: "pulse" as const,
      label: "I lost the pulse or my place",
      adjustment: "Try only Bar 1 at 40 BPM with Click only. Count aloud, then stop after the bar.",
    },
    { id: "technique" as const, label: techniqueLabel, adjustment: exercise.hint },
  ];
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
function repeatEvery(cues: PracticeCue[], times: number, beats: number) {
  return Array.from({ length: times }, (_, index) =>
    cues.map((cue) => ({ ...cue, beat: cue.beat + index * beats })),
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
const bassFSharp: BassPos = { string: 0, fret: 2, name: "F♯", role: "ap" };
const bassWalkingD: BassPos = { string: 1, fret: 5, name: "D", role: "R" };
const bassWalkingF: BassPos = { string: 2, fret: 3, name: "F", role: "ap" };
const bassWalkingFSharp: BassPos = { string: 2, fret: 4, name: "F♯", role: "ap" };
const bassWalkingG: BassPos = { string: 2, fret: 5, name: "G", role: "R" };
const bassWalkingA: BassPos = { string: 3, fret: 2, name: "A", role: "5" };
const bassWalkingBHigh: BassPos = { string: 3, fret: 4, name: "B", role: "ap" };
const bassWalkingB: BassPos = { string: 1, fret: 2, name: "B", role: "ap" };
const bassWalkingC: BassPos = { string: 1, fret: 3, name: "C", role: "R" };
const bassWalkingE: BassPos = { string: 2, fret: 2, name: "E", role: "ap" };

function advancedProject(
  buildBeats: number,
  build: { title: string; instruction: string; button: string },
  choose: { title: string; instruction: string; button: string },
  refine: { title: string; instruction: string; button: string },
  choices: LessonProject["choices"],
): LessonProject {
  return {
    buildBeats,
    stages: [
      { label: "Build", ...build },
      { label: "Choose", ...choose },
      { label: "Refine", ...refine },
    ],
    choices,
  };
}

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
  {
    lessonId: "guitar-triads",
    title: "Two notes stay, one note moves",
    bpm: 50,
    beats: 16,
    goal: "Alternate upper-string C and Am/C triads for four bars, changing only one pitch.",
    setup:
      "Use only the G, B, and high-E strings. C is 5–5–3; Am/C is 5–5–5. Reset if the small barre feels tense.",
    hint: "Loop only the high-E note from fret 3 to fret 5 and back at 40 BPM, then restore the two shared notes.",
    retryLabel: "The three-note change feels awkward",
    takeaway:
      "C and E stayed in place while G moved to A. That small move changed C into an Am inversion.",
    shapes: ["C-upper", "Am-C-upper"],
    cues: ["C-upper", "Am-C-upper", "C-upper", "Am-C-upper"].flatMap((chord, bar) => [
      {
        ...strum(bar * 4, "guitar", chord),
        label: chord === "C-upper" ? "C ↓" : "Am/C ↓",
        detail: chord === "C-upper" ? "Upper strings: 5–5–3" : "Upper strings: 5–5–5",
        duration: 1.95,
      },
      { beat: bar * 4 + 1, label: "Hold", detail: "Let all three notes continue" },
      { beat: bar * 4 + 2, label: "Release", detail: "Release without squeezing" },
      {
        beat: bar * 4 + 3,
        label: chord === "C-upper" ? "Move 3 → 5" : "Move 5 → 3",
        detail: "Prepare only the high-E note for the next shape",
      },
    ]),
  },
  {
    lessonId: "guitar-pentatonic",
    title: "A question, then an answer",
    bpm: 50,
    beats: 16,
    goal: "Play the two-bar A-minor-pentatonic phrase twice, keeping beat 4 silent.",
    setup: "High E: fret 5 is A and fret 8 is C. B string: fret 5 is E and fret 8 is G.",
    hint: "Say “rest” on beat 4 while your foot keeps tapping, then begin the answer only on the next beat 1.",
    retryLabel: "I rush through the planned rest",
    takeaway:
      "The repeated rhythm and silence make these notes sound like a question and answer, not a scale run.",
    cues: repeatEvery(
      [
        note(0, "A", [69], "High E string, fret 5"),
        note(1, "C", [72], "High E string, fret 8"),
        note(2, "A", [69], "High E string, fret 5"),
        rest(3, "Count the silence at the end of the question"),
        note(4, "E", [64], "B string, fret 5"),
        note(5, "G", [67], "B string, fret 8"),
        note(6, "A", [69], "High E string, fret 5"),
        rest(7, "Count the silence at the end of the answer"),
      ],
      2,
      8,
    ),
  },
  {
    lessonId: "guitar-secondary-dominant",
    title: "Hear E7 lean into Am",
    bpm: 50,
    beats: 16,
    goal: "Play C–E7–Am–G once and follow G♯ rising one fret to A.",
    setup: "Give each chord one bar. In E7, G♯ is G-string fret 1; in Am, A is G-string fret 2.",
    hint: "Play only G-string fret 1 followed by fret 2 four times, then rebuild E7 and Am at 40 BPM.",
    retryLabel: "E7 to Am tangles my fingers",
    takeaway:
      "The borrowed G♯ rises to A, giving E7 a directed pull toward Am without changing the whole key.",
    shapes: ["C", "E7", "Am", "G"],
    project: advancedProject(
      12,
      {
        title: "Find the pull",
        instruction: "Play C, E7, then Am. Listen for G♯ rising one fret into A.",
        button: "I heard the arrival",
      },
      {
        title: "Choose what to track",
        instruction: "Choose one listening target, then play the full four-chord guide once.",
        button: "Save my listening choice",
      },
      {
        title: "Refine the cadence",
        instruction: "Replay C–E7–Am–G and make the chosen arrival easier to hear.",
        button: "I tried my refined pass",
      },
      [
        { label: "The half-step", detail: "Track G♯ in E7 rising to A in Am." },
        { label: "The chord arrival", detail: "Track the whole E7 chord settling into Am." },
      ],
    ),
    cues: chordBars("guitar", ["C", "E7", "Am", "G"]),
  },
  {
    lessonId: "guitar-arrangement",
    title: "Sparse bar, busier bar",
    bpm: 50,
    beats: 16,
    goal: "Compare sparse and busier rhythm on Em, then repeat the comparison on G.",
    setup: "Bars 1 and 3 use one downstroke. Bars 2 and 4 use down, down-up, down, down-up.",
    hint: "Mute the strings and play only the busy bar at 40 BPM while saying every number and and.",
    retryLabel: "The busy bar loses the beat",
    takeaway:
      "Changing density while holding chord, tempo, and touch steady creates contrast you can compare.",
    shapes: ["Em", "G"],
    project: advancedProject(
      8,
      {
        title: "Build the contrast",
        instruction: "Play one sparse Em bar, then one busier Em bar without changing tempo.",
        button: "I built two textures",
      },
      {
        title: "Choose what to notice",
        instruction: "Choose one listening focus, then compare the same sparse and busy bars on G.",
        button: "Save my listening focus",
      },
      {
        title: "Refine the ending",
        instruction:
          "After the four-bar reference stops, play eight bars yourself: sparse Em–G–Em–G, then busier Em–G–Em–Em. Keep the tempo steady, let the final Em ring, and revise one detail using your listening choice.",
        button: "I tried my refined arrangement",
      },
      [
        { label: "Steady pulse", detail: "Track each beat 1 while the number of strokes changes." },
        {
          label: "Clear density",
          detail: "Notice whether the busy bars sound fuller without speeding up.",
        },
      ],
    ),
    cues: ["Em", "G"].flatMap((chord, pair) => {
      const first = pair * 8;
      return [
        { ...strum(first, "guitar", chord), duration: 3.8 },
        { beat: first + 1, label: "Hold", detail: "Keep counting through the sparse bar" },
        { beat: first + 2, label: "Hold", detail: "No new stroke" },
        { beat: first + 3, label: "Prepare", detail: "Keep the pulse into the busier bar" },
        { ...strum(first + 4, "guitar", chord), duration: 0.4 },
        rest(first + 4.5, "Silent upward motion"),
        { ...strum(first + 5, "guitar", chord), duration: 0.4 },
        { ...strum(first + 5.5, "guitar", chord, true), duration: 0.4 },
        { ...strum(first + 6, "guitar", chord), duration: 0.4 },
        rest(first + 6.5, "Silent upward motion"),
        { ...strum(first + 7, "guitar", chord), duration: 0.4 },
        { ...strum(first + 7.5, "guitar", chord, true), duration: 0.4 },
      ];
    }),
  },
  {
    lessonId: "piano-voice-leading",
    title: "Keep C, move two notes",
    bpm: 50,
    beats: 16,
    goal: "Alternate C major and F/C for four bars while C stays in the same place.",
    setup: "Keep the pedal up. Play C4–E4–G4, then keep C4 and move E4 to F4 and G4 to A4.",
    hint: "Keep C4 down and move only E4–G4 to F4–A4 three times at 40 BPM, then reverse.",
    retryLabel: "The two-note move feels too large",
    takeaway:
      "C–F–A is still F major. Keeping the shared C makes the connection smaller and smoother.",
    cues: [
      [0, "C major upper notes", [64, 67], "E4–G4 over the held C4"],
      [4, "F/C upper notes", [65, 69], "F4–A4 over the held C4"],
      [8, "C major upper notes", [64, 67], "Return E4–G4 by the short route"],
      [12, "F/C upper notes", [65, 69], "Finish with F4–A4 over C4"],
    ].flatMap(([beat, label, notes, detail]) => [
      note(beat as number, "C4 anchor", [60], "Hold C4 through the whole bar", 3.8),
      note(beat as number, label as string, notes as number[], detail as string, 1.95),
      { beat: (beat as number) + 1, label: "Hold C", detail: "Keep C4 as the anchor" },
      { beat: (beat as number) + 2, label: "Release two", detail: "Release only the moving notes" },
      { beat: (beat as number) + 3, label: "Look ahead", detail: "Prepare the next two notes" },
    ]),
  },
  {
    lessonId: "piano-seventh-cadence",
    title: "Three chords find their way home",
    bpm: 50,
    beats: 12,
    goal: "Play Dm7–G7–Cmaj7, one chord per bar, and hear F4 settle down to E4.",
    setup:
      "Keep the pedal up. Left hand plays D3, G3, then C3; the right hand supplies the other tones.",
    hint: "Play only F4 from G7 and E4 from Cmaj7, then rebuild those two chords at 40 BPM.",
    retryLabel: "The return to C is unclear",
    takeaway:
      "Dm7 prepares, G7 creates tension, and Cmaj7 resolves it; F moving to E makes the return audible.",
    cues: [
      note(0, "Dm7", [50, 65, 69, 72], "D3 with F4–A4–C5", 2.8),
      { beat: 1, label: "Hold", detail: "Keep Dm7 down" },
      { beat: 2, label: "Hear F", detail: "Notice F4 in the right hand" },
      { beat: 3, label: "Find G7", detail: "Prepare G3–B3–D4–F4" },
      note(4, "G7", [55, 59, 62, 65], "G3–B3–D4–F4", 2.8),
      { beat: 5, label: "Hold", detail: "Keep G7 down" },
      { beat: 6, label: "Hear F", detail: "F4 is ready to move down" },
      { beat: 7, label: "Find Cmaj7", detail: "Prepare C3 with E4–G4–B4" },
      note(8, "Cmaj7", [48, 64, 67, 71], "C3 with E4–G4–B4", 2.95),
      { beat: 9, label: "Hear E", detail: "F4 has resolved down to E4" },
      { beat: 10, label: "Hold", detail: "Let the home chord settle" },
      { beat: 11, label: "Release", detail: "Release Cmaj7 together" },
    ],
  },
  {
    lessonId: "piano-secondary-dominant",
    title: "Let D7 point toward G",
    bpm: 50,
    beats: 16,
    goal: "Play C–D7–G7–C and follow F♯4 rising to G4.",
    setup: "Keep the pedal up. D7 uses D3–C4–F♯4–A4; F♯ is the new note pointing toward G.",
    hint: "Play F♯4 followed by G4 three times, then play only D7 to G7 at 40 BPM.",
    retryLabel: "The pull toward G is missing",
    takeaway:
      "F♯ is outside C major, but its half-step rise to G gives D7 a clear temporary destination.",
    project: advancedProject(
      12,
      {
        title: "Build the detour",
        instruction: "Play C–D7–G7 and listen for F♯ rising into G.",
        button: "I heard the detour",
      },
      {
        title: "Choose a listening line",
        instruction: "Choose one moving note, then add the final C bar.",
        button: "Save my listening line",
      },
      {
        title: "Refine the return",
        instruction: "Replay all four chords and make the chosen line clear without adding speed.",
        button: "I tried my refined cadence",
      },
      [
        { label: "F♯ to G", detail: "Hear D7 point into G7 through the rising half-step." },
        { label: "F to E", detail: "Hear G7 settle into C through the falling half-step." },
      ],
    ),
    cues: [
      [0, "C", [48, 60, 64, 67], "C3 with C4–E4–G4"],
      [4, "D7", [50, 60, 66, 69], "D3–C4–F♯4–A4"],
      [8, "G7", [55, 59, 62, 65, 67], "G3–B3–D4–F4 with G4"],
      [12, "C", [48, 60, 64, 67], "Return to C"],
    ].flatMap(([beat, label, notes, detail], index) => [
      note(
        beat as number,
        label as string,
        notes as number[],
        detail as string,
        index === 3 ? 3.8 : 2.8,
      ),
      { beat: (beat as number) + 1, label: "Hold", detail: "Keep the chord down" },
      { beat: (beat as number) + 2, label: "Listen", detail: "Track the closest moving note" },
      { beat: (beat as number) + 3, label: "Prepare", detail: "Find the next chord before beat 1" },
    ]),
  },
  {
    lessonId: "piano-miniature",
    title: "Four bars become a return",
    bpm: 50,
    beats: 16,
    goal: "Play a four-bar phrase using one left-hand root and three right-hand notes per bar.",
    setup: "Left hand holds C3–F3–G3–C3. Right hand rises C–D–E, then turns E–D–C.",
    hint: "Play only the four left-hand roots at 40 BPM, then add the first right-hand note on beat 1.",
    retryLabel: "My hands miss beat 1",
    takeaway:
      "A recognizable phrase can return with one controlled change; softer roots leave room for melody.",
    project: advancedProject(
      8,
      {
        title: "Build the opening",
        instruction: "Play the first two bars with one root and a three-note idea in each.",
        button: "I built the opening",
      },
      {
        title: "Choose the return",
        instruction:
          "Compare the fixed four-bar reference, then choose one change for a separate eight-bar A–A′ performance after the guide stops.",
        button: "Save my return choice",
      },
      {
        title: "Refine the balance",
        instruction:
          "After the guide stops, play C–F–G–C twice. Apply your chosen change to the second four-bar phrase, keep the roots softer than the melody, and end on C.",
        button: "I tried my refined miniature",
      },
      [
        {
          label: "Longer final C",
          detail:
            "In bar 8 of your own performance, hold the final C through beat 4 instead of resting.",
        },
        {
          label: "Higher return",
          detail:
            "In bars 5–8 of your own performance, play the returning melody one octave higher if comfortable.",
        },
      ],
    ),
    cues: [
      [0, 48, 60, 62, 64, "C"],
      [4, 53, 60, 62, 64, "F"],
      [8, 55, 60, 62, 64, "G"],
      [12, 48, 64, 62, 60, "C"],
    ].flatMap(([beat, root, first, second, third, name]) => [
      note(beat as number, "LH " + name + "3", [root as number], "Hold the root", 3.8),
      note(beat as number, "RH start", [first as number], "Melody note on beat 1"),
      note((beat as number) + 1, "RH next", [second as number], "Melody note on beat 2"),
      note((beat as number) + 2, "RH finish", [third as number], "Melody note on beat 3"),
      rest((beat as number) + 3, "Leave one counted beat of space"),
    ]),
  },
  {
    lessonId: "ukulele-fingerpicking",
    title: "C to Am, one string at a time",
    bpm: 50,
    beats: 16,
    goal: "Pick C–E–C–E for two bars on C, then C–E–A–E for two bars on Am.",
    setup:
      "Keep one C–E–A–E string order. Use thumb, index, middle, index; only one chord tone changes.",
    hint: "Hold C and play C string → E string → A string → E string for one bar at 40 BPM.",
    retryLabel: "The picking order gets scrambled",
    takeaway:
      "The picking order stayed constant while one chord tone changed, keeping the texture steady.",
    shapes: ["C", "Am"],
    cues: [
      [60, 64, 72, 64, "C"],
      [60, 64, 72, 64, "C"],
      [60, 64, 69, 64, "Am"],
      [60, 64, 69, 64, "Am"],
    ].flatMap(([a, b, c, d, chord], bar) =>
      [a, b, c, d].map((midi, beat) =>
        note(
          bar * 4 + beat,
          ["C string", "E string", "A string", "E string"][beat],
          [midi as number],
          String(chord) + " chord · " + ["C", "E", "A", "E"][beat] + " string",
        ),
      ),
    ),
  },
  {
    lessonId: "ukulele-transpose",
    title: "Same four jobs, a new home",
    bpm: 40,
    beats: 16,
    goal: "Hear I–IV–V–I in C, then play the same four functions in G.",
    setup: "Give each chord two counts: C–F–G–C, then G–C–D–G. D is 2–2–2–0.",
    hint: "Play only D to G at 40 BPM; keep C-string fret 2 as an anchor while other fingers move.",
    retryLabel: "The D chord has a muted string",
    takeaway: "The chord names changed, but I–IV–V–I kept the same departure, tension, and return.",
    shapes: ["C", "F", "G", "D"],
    cues: ["C", "F", "G", "C", "G", "C", "D", "G"].flatMap((chord, index) => [
      { ...strum(index * 2, "ukulele", chord), duration: 1.8 },
      { beat: index * 2 + 1, label: "Hold", detail: "Let " + chord + " continue" },
    ]),
  },
  {
    lessonId: "ukulele-melody-chord",
    title: "Brush softly, let the top note speak",
    bpm: 50,
    beats: 12,
    goal: "Place a light three-string brush before top notes C–E–C, then let the final C ring.",
    setup:
      "Brush open G–C–E strings. Play the melody on the A string: fret 3 is C and fret 7 is E.",
    hint: "Play A-string frets 3 → 7 → 3 alone, then add each open-string brush at half the volume.",
    retryLabel: "The top melody note gets buried",
    takeaway:
      "Keeping accompaniment lighter and earlier gives the top notes a line the listener can follow.",
    shapes: ["C"],
    project: advancedProject(
      4,
      {
        title: "Build the first gesture",
        instruction: "Brush the open G–C–E strings lightly, then let top C speak.",
        button: "I built the first gesture",
      },
      {
        title: "Choose the spotlight",
        instruction: "Choose one contrast, then follow the full C–E–C melody.",
        button: "Save my spotlight choice",
      },
      {
        title: "Refine the final note",
        instruction:
          "After the three-bar reference stops, play a four-bar phrase yourself: brush then top C, brush then top E, brush then top C, and let that final C ring through bar 4. Refine your chosen contrast.",
        button: "I tried my refined texture",
      },
      [
        { label: "Softer brush", detail: "Keep the melody louder than the three-string brush." },
        { label: "Longer melody", detail: "Let each top note ring longer than its brush." },
      ],
    ),
    cues: [
      note(0, "Light brush", [67, 60, 64], "Open G–C–E strings", 0.6),
      note(1, "Top C", [72], "A string, fret 3", 1.8),
      { beat: 2, label: "Hold", detail: "Let top C continue" },
      rest(3, "Keep counting"),
      note(4, "Light brush", [67, 60, 64], "Open G–C–E strings", 0.6),
      note(5, "Top E", [76], "A string, fret 7", 1.8),
      { beat: 6, label: "Hold", detail: "Let top E continue" },
      rest(7, "Keep counting"),
      note(8, "Light brush", [67, 60, 64], "Open G–C–E strings", 0.6),
      note(9, "Top C", [72], "A string, fret 3", 2.8),
      { beat: 10, label: "Hold", detail: "Let the final C continue" },
      { beat: 11, label: "Finish", detail: "Let the final C end naturally" },
    ],
  },
  {
    lessonId: "ukulele-arrange",
    title: "Two textures, one clear ending",
    bpm: 50,
    beats: 17,
    goal: "Build a four-bar C–Am–F–G guide with two textures, then land on C.",
    setup:
      "Pick C and Am, strum F and G on beats 1 and 3, then let one final C ring on the next beat 1.",
    hint: "Loop the final picked Am bar into the first strummed F bar at 40 BPM and say every count.",
    retryLabel: "The texture switch loses beat 1",
    takeaway:
      "Changing only the texture created contrast while the four-chord harmony stayed recognizable.",
    shapes: ["C", "Am", "F", "G"],
    project: advancedProject(
      8,
      {
        title: "Build the picked half",
        instruction: "Pick one C bar and one Am bar with the same four-string order.",
        button: "I built the picked half",
      },
      {
        title: "Choose what to notice",
        instruction: "Choose one listening focus, then add the two-strum F and G bars and final C.",
        button: "Save my listening focus",
      },
      {
        title: "Refine the switch",
        instruction:
          "After the four-bar reference and final C stop, play C–Am–F–G twice yourself: fingerpick all four chords first, then strum all four. Protect the G-to-C texture switch between bars 4 and 5, and add a final ringing C.",
        button: "I tried my refined arrangement",
      },
      [
        {
          label: "Texture switch",
          detail:
            "Track picked Am changing to strummed F in the reference; in your eight-bar piece, track picked G changing to strummed C.",
        },
        {
          label: "Final landing",
          detail: "Track G moving to the final C without adding an extra count.",
        },
      ],
    ),
    cues: [
      ...[60, 64, 72, 64].map((midi, beat) =>
        note(beat, ["C", "E", "top C", "E"][beat], [midi], "C chord picking"),
      ),
      ...[60, 64, 69, 64].map((midi, beat) =>
        note(4 + beat, ["C", "E", "A", "E"][beat], [midi], "Am chord picking"),
      ),
      ...["F", "G"].flatMap((chord, bar) => [
        strum(8 + bar * 4, "ukulele", chord),
        { beat: 9 + bar * 4, label: "Count", detail: "Keep counting" },
        strum(10 + bar * 4, "ukulele", chord),
        { beat: 11 + bar * 4, label: "Prepare", detail: "Prepare the next bar" },
      ]),
      {
        ...strum(16, "ukulele", "C"),
        label: "C ↓ · land",
        detail: "Return to C on the new beat 1 and let it ring",
      },
    ],
  },
  {
    lessonId: "bass-offbeats",
    title: "E on 1, and-of-2, and 4",
    bpm: 50,
    beats: 16,
    goal: "Play the three-note syncopation for four bars and keep every next beat 1 in place.",
    setup: "Count 1-and-2-and-3-and-4-and. Play open E on 1, and-of-2, and 4.",
    hint: "At 40 BPM, tap eight even motions while speaking the full count; sound only 1, and-of-2, and 4.",
    retryLabel: "The offbeat lands beside beat 2",
    takeaway: "The offbeat stayed connected because the silent counts continued underneath it.",
    positions: [bassE],
    cues: repeat(
      [
        note(0, "E", [28], "E string, open", 0.4),
        rest(1, "Say beat 2"),
        note(1.5, "E", [28], "E string, open on and-of-2", 0.4),
        rest(2, "Say beat 3"),
        note(3, "E", [28], "E string, open on beat 4"),
      ],
      4,
    ),
  },
  {
    lessonId: "bass-approach-note",
    title: "F♯ points to G",
    bpm: 50,
    beats: 13,
    goal: "Play E–E–E–F♯, land on G, then repeat the approach and finish on G.",
    setup: "Open E starts the line. F♯ is E-string fret 2 and G is fret 3; land G on beat 1.",
    hint: "Loop only F♯ on 4 and G on the next 1 at 40 BPM, saying 4-and-1.",
    retryLabel: "The fret-3 landing misses",
    takeaway: "F♯ gained direction by resolving one fret upward to G on the strong beat.",
    positions: [bassE, bassFSharp, bassG],
    cues: [
      note(0, "E", [28], "E string, open"),
      note(1, "E", [28], "E string, open"),
      note(2, "E", [28], "E string, open"),
      note(3, "F♯", [30], "E string, fret 2", 0.5),
      note(4, "G", [31], "E string, fret 3", 3.8),
      { beat: 5, label: "Hold G", detail: "Let G continue" },
      { beat: 6, label: "Hold G", detail: "Keep counting" },
      { beat: 7, label: "Prepare E", detail: "Prepare the open string" },
      note(8, "E", [28], "E string, open"),
      note(9, "E", [28], "E string, open"),
      note(10, "E", [28], "E string, open"),
      note(11, "F♯", [30], "E string, fret 2", 0.5),
      note(12, "G", [31], "E string, fret 3"),
    ],
  },
  {
    lessonId: "bass-walking",
    title: "Three bars, three clear arrivals",
    bpm: 50,
    beats: 13,
    goal: "Walk through Dm7–G7–Cmaj7, then land once more on C.",
    setup: "Stay between frets 2 and 5. Roots arrive on beat 1; F♯ on beat 4 leads into G.",
    hint: "Play only D → G → C, one whole bar each. Add inside notes after all roots land on beat 1.",
    retryLabel: "There are too many neck locations",
    takeaway:
      "Interior notes created motion while D, G, and C on beat 1 kept the harmony readable.",
    positions: [
      bassWalkingD,
      bassWalkingF,
      bassWalkingA,
      bassWalkingFSharp,
      bassWalkingG,
      bassWalkingBHigh,
      bassWalkingB,
      bassWalkingC,
      bassWalkingE,
    ],
    project: advancedProject(
      12,
      {
        title: "Build three connected bars",
        instruction: "Play the full Dm7–G7–Cmaj7 walking line and keep every quarter note even.",
        button: "I built three bars",
      },
      {
        title: "Choose the motion",
        instruction:
          "Choose one guide through the inside notes, then play the 12-note line and its final C landing.",
        button: "Save my walking choice",
      },
      {
        title: "Refine the landing",
        instruction: "Replay the line and make the final C arrival clear without rushing.",
        button: "I tried my refined line",
      },
      [
        { label: "Track roots", detail: "Aim attention at D, G, and C on each beat 1." },
        { label: "Track approach", detail: "Aim attention at F♯ moving one fret into G." },
      ],
    ),
    cues: [
      note(0, "D", [38], "A string, fret 5"),
      note(1, "F", [41], "D string, fret 3"),
      note(2, "A", [45], "G string, fret 2"),
      note(3, "F♯", [42], "D string, fret 4"),
      note(4, "G", [43], "D string, fret 5"),
      note(5, "B", [47], "G string, fret 4"),
      note(6, "D", [38], "A string, fret 5"),
      note(7, "B", [35], "A string, fret 2"),
      note(8, "C", [36], "A string, fret 3"),
      note(9, "E", [40], "D string, fret 2"),
      note(10, "G", [43], "D string, fret 5"),
      note(11, "E", [40], "D string, fret 2"),
      note(12, "C", [36], "A string, fret 3"),
    ],
  },
  {
    lessonId: "bass-support-and-fill",
    title: "Support, fill, return",
    bpm: 50,
    beats: 13,
    goal: "Keep two supporting bars steady, add one short fill, and land back on E.",
    setup: "Use quarter-note E and G roots. The final G–D–F♯–G fill leads to open E.",
    hint: "Tap G–D–F♯–G–E as five equal motions at 40 BPM before adding pitches.",
    retryLabel: "The fill speeds up",
    takeaway: "The fill served the phrase because it kept the pulse and returned clearly to E.",
    positions: [bassE, bassG, bassD, bassFSharp],
    project: advancedProject(
      8,
      {
        title: "Build the support",
        instruction: "Play one E bar and one G bar with even quarter notes.",
        button: "I built the support",
      },
      {
        title: "Choose the fill focus",
        instruction: "Choose one guardrail, then play the guide through its four-note fill.",
        button: "Save my fill choice",
      },
      {
        title: "Refine the return",
        instruction:
          "After the short reference stops, play eight bars of alternating Em–G roots yourself. Replace bar 8 with G–D–F♯–G, land on E on the next beat 1, and revise using your chosen focus.",
        button: "I tried my refined bass part",
      },
      [
        { label: "Equal spacing", detail: "Keep all fill notes the same rhythmic distance apart." },
        { label: "Clear landing", detail: "Place the returning E exactly on the next beat 1." },
      ],
    ),
    cues: [
      ...Array.from({ length: 4 }, (_, beat) => note(beat, "E", [28], "E string, open")),
      ...Array.from({ length: 4 }, (_, beat) => note(4 + beat, "G", [31], "E string, fret 3")),
      note(8, "G", [31], "E string, fret 3"),
      note(9, "D", [38], "A string, fret 5"),
      note(10, "F♯", [30], "E string, fret 2"),
      note(11, "G", [31], "E string, fret 3"),
      note(12, "E", [28], "Return to open E"),
    ],
  },
  {
    lessonId: "drums-sixteenths",
    title: "Three taps, one deliberate gap",
    bpm: 40,
    beats: 8,
    subdivision: 4,
    goal: "Play two bars of number–e–and–rest, leaving every “a” completely silent.",
    setup:
      "Use one pad or knee. Say every sixteenth syllable; tap the number, e, and, then leave “a” silent.",
    hint: "Loop one beat: say 1-e-and-a, tap only 1-e-and, and hold the stick up through a.",
    retryLabel: "The silent “a” disappears",
    takeaway:
      "The silent a takes the same space as every tap. Preserving it keeps the next beat from arriving early.",
    cues: Array.from({ length: 8 }, (_, beat) => [
      {
        ...drum(beat, [1]),
        label: String((beat % 4) + 1) + " · S",
        detail: "Snare on the number",
      },
      { ...drum(beat + 0.25, [1]), label: "e · S", detail: "Snare on e" },
      { ...drum(beat + 0.5, [1]), label: "and · S", detail: "Snare on and" },
      { beat: beat + 0.75, label: "a · rest", detail: "Leave a silent; keep counting" },
    ]).flat(),
  },
  {
    lessonId: "drums-accents",
    title: "Strong two and four, quiet detail",
    bpm: 50,
    beats: 8,
    subdivision: 2,
    goal: "Play two bars with strong snares on 2 and 4 and one quiet note on and-of-3.",
    setup:
      "Use one surface. Begin strong strokes higher than the quiet stroke. The sound guide marks timing at one even level; make the volume contrast yourself.",
    hint: "Play only 3-and-4: no hit on 3, a low quiet stroke on and, then an easy higher stroke on 4.",
    retryLabel: "The quiet note is too loud",
    takeaway: "The quiet note adds detail without competing with the backbeat on beats 2 and 4.",
    cues: repeat(
      [
        rest(0, "Beat 1; keep the pulse"),
        { ...drum(1, [1]), label: "S · strong", detail: "Strong, relaxed snare on 2" },
        rest(2, "Beat 3; keep the pulse"),
        { ...drum(2.5, [1]), label: "s · quiet", detail: "Very quiet snare on and-of-3" },
        { ...drum(3, [1]), label: "S · strong", detail: "Strong, relaxed snare on 4" },
      ],
      2,
    ),
  },
  {
    lessonId: "drums-three-over-two",
    title: "Six slots, two steady streams",
    bpm: 40,
    beats: 8,
    subdivision: 3,
    goal: "Play four 3:2 cycles: hat on slots 1, 3, 5 and snare on slots 1 and 4.",
    setup: "Each two-beat cycle has six equal slots. Hat and snare begin together.",
    hint: "Say “together, two, hat, snare, hat, six”; freeze the snare hand until slot 4.",
    retryLabel: "The two streams merge together",
    takeaway:
      "Three and two stay even because both parts share one six-slot grid and meet at the next cycle.",
    project: advancedProject(
      4,
      {
        title: "Build two cycles",
        instruction: "Say all six slots and play the two hand patterns through two cycles.",
        button: "I built two cycles",
      },
      {
        title: "Choose an anchor",
        instruction: "Choose one anchor, then play all four cycles with that anchor steady.",
        button: "Save my anchor",
      },
      {
        title: "Refine the overlap",
        instruction: "Replay four cycles and make each together point feel relaxed.",
        button: "I tried my refined pattern",
      },
      [
        {
          label: "Voice the six slots",
          detail: "Keep saying every slot while the hands leave gaps.",
        },
        { label: "Mark the two", detail: "Use a foot tap on the two large beats in each cycle." },
      ],
    ),
    cues: Array.from({ length: 4 }, (_, cycle) => {
      const first = cycle * 2;
      return [
        { ...drum(first, [1, 2]), label: "1 · together", detail: "Snare and hat together" },
        { beat: first + 1 / 3, label: "2 · rest", detail: "Both sides wait" },
        { ...drum(first + 2 / 3, [2]), label: "3 · H", detail: "Hat side only" },
        { ...drum(first + 1, [1]), label: "4 · S", detail: "Snare side only" },
        { ...drum(first + 4 / 3, [2]), label: "5 · H", detail: "Hat side only" },
        { beat: first + 5 / 3, label: "6 · rest", detail: "Prepare the next together" },
      ];
    }).flat(),
  },
  {
    lessonId: "drums-arrange",
    title: "Two textures, one clear landing",
    bpm: 50,
    beats: 13,
    subdivision: 2,
    goal: "Move from quarter-note hats to eighth-note hats, add a short fill, and land on kick.",
    setup:
      "Keep the kick–snare backbeat. Only hat density changes; the last snare–tom fill leads to beat 1.",
    hint: "Loop only 4-and-1 three times—snare, tom, kick—before replaying the guide.",
    retryLabel: "The fill hides the landing",
    takeaway:
      "A stable pulse made the denser section intentional, and the landing completed the transition.",
    project: advancedProject(
      8,
      {
        title: "Build the section change",
        instruction: "Play one bar of quarter hats, then one bar of eighth hats at one tempo.",
        button: "I built the section change",
      },
      {
        title: "Choose what to notice",
        instruction:
          "Choose one listening focus, then play the fixed snare–tom fill into the landing.",
        button: "Save my listening focus",
      },
      {
        title: "Refine the landing",
        instruction:
          "After the short reference stops, play four bars of quarter hats and four bars of eighth hats yourself. Put the snare–tom fill on bar 8’s last beat, return to one full bar of quarter hats, and compare the transition using your listening choice.",
        button: "I tried my refined arrangement",
      },
      [
        {
          label: "Section pulse",
          detail: "Track the backbeat while the hi-hat changes from quarters to eighths.",
        },
        { label: "Fill landing", detail: "Track the snare–tom fill arriving on the next kick." },
      ],
    ),
    cues: [
      ...Array.from({ length: 4 }, (_, beat) => drum(beat, [beat % 2, 2])),
      ...Array.from({ length: 8 }, (_, slot) =>
        drum(4 + slot / 2, slot % 2 ? [2] : [Math.floor(slot / 2) % 2, 2]),
      ),
      ...Array.from({ length: 6 }, (_, slot) =>
        drum(8 + slot / 2, slot % 2 ? [2] : [Math.floor(slot / 2) % 2, 2]),
      ),
      { ...drum(11, [1]), label: "S · fill", detail: "Snare on beat 4" },
      { ...drum(11.5, [3]), label: "T · fill", detail: "Tom on and-of-4" },
      { ...drum(12, [0, 2]), label: "K + H · land", detail: "Kick and hat on the new beat 1" },
    ],
  },
  {
    lessonId: "vocals-rhythmic-phrasing",
    title: "Wait, then enter between the beats",
    bpm: 50,
    beats: 8,
    subdivision: 2,
    goal: "Place “come” on and-of-2, “back” on 3, and “home” on 4 twice.",
    setup: "Speak, use one easy pitch, or listen and tap each word. The C reference is optional.",
    hint: "Tap four quarters and say only “come” halfway between taps 2 and 3; then add “back home.”",
    retryLabel: "“Come” lands on beat 3",
    takeaway:
      "Counting the silence prepared the offbeat entrance without changing the quarter-note pulse.",
    cues: repeat(
      [
        rest(0, "Count 1 and keep waiting"),
        rest(1, "Count 2; enter halfway to 3"),
        note(1.5, "Come", [60], "Speak, sing comfortably, or tap on and-of-2", 0.35),
        note(2, "Back", [60], "Speak, sing comfortably, or tap on beat 3", 0.75),
        note(3, "Home", [60], "Speak, sing comfortably, or tap on beat 4", 0.75),
      ],
      2,
    ),
  },
  {
    lessonId: "vocals-harmony-line",
    title: "Two lines, then both together",
    bpm: 60,
    beats: 12,
    goal: "Hear C–D–E, hear E–F–G, then follow one chosen line while both sound.",
    setup:
      "Listening and pointing to the lower or upper line is a complete attempt. Hum only if comfortable.",
    hint: "Replay the melody bar twice and harmony bar twice; point low or high during the final bar.",
    retryLabel: "The two lines blur together",
    takeaway:
      "The melody and harmony keep their own direction when combined, even as the interval changes.",
    cues: [
      note(0, "Melody C", [60]),
      note(1, "Melody D", [62]),
      note(2, "Melody E", [64]),
      rest(3, "The melody line ends"),
      note(4, "Harmony E", [64]),
      note(5, "Harmony F", [65]),
      note(6, "Harmony G", [67]),
      rest(7, "The harmony line ends"),
      note(8, "C + E", [60, 64], "Follow either line"),
      note(9, "D + F", [62, 65], "Follow either line"),
      note(10, "E + G", [64, 67], "Follow either line"),
      rest(11, "Both lines finish"),
    ],
  },
  {
    lessonId: "vocals-interpretation",
    title: "Same words, different focus",
    bpm: 60,
    beats: 8,
    goal: "Compare emphasis on “I” with emphasis on “home” and name how the intention changes.",
    setup:
      "The neutral C marks timing only. Speak, sing comfortably, or silently tap the highlighted word.",
    hint: "Say only “I” on the first bar's beat 1 and “home” on the second bar's beat 4, then add the other words.",
    retryLabel: "Both versions feel the same",
    takeaway:
      "Changing one stressed word can change meaning while the words and pulse stay the same.",
    project: advancedProject(
      8,
      {
        title: "Build two readings",
        instruction: "Follow both four-beat versions once: first stress I, then stress home.",
        button: "I compared both readings",
      },
      {
        title: "Choose the intention",
        instruction:
          "Use the fixed guide to compare both readings. After it stops, choose the meaning you want and speak or comfortably sing that reading twice, resting between attempts.",
        button: "Save my intention",
      },
      {
        title: "Refine one word",
        instruction:
          "After the guide stops, repeat your chosen reading at an easy volume, clarify only the selected stressed word, and leave a planned rest afterward.",
        button: "I tried my refined reading",
      },
      [
        { label: "Speaker matters", detail: "Stress I to clarify who will return." },
        { label: "Destination matters", detail: "Stress home to clarify where the return leads." },
      ],
    ),
    cues: [
      note(0, "I · stress", [60], "Emphasize I; neutral pitch marks timing", 0.7),
      note(1, "will", [60], "Ordinary stress", 0.7),
      note(2, "come", [60], "Ordinary stress", 0.7),
      note(3, "home", [60], "Ordinary stress", 0.7),
      note(4, "I", [60], "Ordinary stress", 0.7),
      note(5, "will", [60], "Ordinary stress", 0.7),
      note(6, "come", [60], "Ordinary stress", 0.7),
      note(7, "home · stress", [60], "Emphasize home; neutral pitch marks timing", 0.7),
    ],
  },
  {
    lessonId: "vocals-performance-plan",
    title: "Two phrases, one clear revision",
    bpm: 50,
    beats: 8,
    subdivision: 2,
    goal: "Complete two connected phrases with planned rests using speech, singing, or listening.",
    setup: "Use I–will on 1-and, come on 2, home on 3, rest on 4; repeat the shape with new words.",
    hint: "Count the first phrase's rest as 4, then place “Leave” only on the next 1 before rebuilding.",
    retryLabel: "Phrase B starts before its new 1",
    takeaway:
      "A specific plan for rhythm, direction, and rests creates a performance you can revise.",
    project: advancedProject(
      4,
      {
        title: "Build phrase A",
        instruction:
          "Choose a comfortable mode and follow the first four-beat phrase with its rest.",
        button: "I built phrase A",
      },
      {
        title: "Choose a review lens",
        instruction: "Choose one thing to notice, then join phrase A to phrase B.",
        button: "Save my review lens",
      },
      {
        title: "Refine one thing",
        instruction: "Make one adjustment to the chosen lens and replay the same two phrases.",
        button: "I tried my refined performance",
      },
      [
        {
          label: "Entrance timing",
          detail: "Listen for phrase B beginning exactly on its new beat 1.",
        },
        {
          label: "Pitch direction",
          detail: "Trace the up-and-down contour without forcing range.",
        },
      ],
    ),
    cues: [
      note(0, "I", [60], "Speech, a comfortable octave, or listening", 0.35),
      note(0.5, "will", [60], "and-of-1", 0.35),
      note(1, "come", [62], "Beat 2", 0.75),
      note(2, "home", [64], "Beat 3", 0.75),
      rest(3, "Rest on beat 4; breathe normally"),
      note(4, "Leave", [64], "Begin phrase B on the new beat 1", 0.35),
      note(4.5, "the", [64], "and-of-1", 0.35),
      note(5, "light", [62], "Beat 2", 0.75),
      note(6, "on", [60], "Beat 3", 0.75),
      rest(7, "Rest on beat 4; finish comfortably"),
    ],
  },
];

export function lessonExercise(id: string | undefined): LessonExercise | undefined {
  return id && learningLesson(id)
    ? LESSON_EXERCISES.find((exercise) => exercise.lessonId === id)
    : undefined;
}

export function practiceBar(exercise: Pick<LessonExercise, "beats" | "cues">, bar: number) {
  const first = Math.max(0, Math.min(Math.ceil(exercise.beats / 4) - 1, bar)) * 4;
  return Array.from({ length: Math.min(4, exercise.beats - first) }, (_, index) => {
    const beat = first + index;
    return { beat, cues: exercise.cues.filter((cue) => cue.beat >= beat && cue.beat < beat + 1) };
  });
}
