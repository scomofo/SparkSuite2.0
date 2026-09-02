import { fretToFreq, STRING_NAMES } from "./guitar";
import type { ChordShape } from "./types";

export const PC_SHARP = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"] as const;
export const PC_FLAT = ["C", "Db", "D", "Eb", "E", "F", "Gb", "G", "Ab", "A", "Bb", "B"] as const;
/** Common guitar spellings for the root picker. */
export const PICKER_ROOTS = ["C", "C#", "D", "Eb", "E", "F", "F#", "G", "Ab", "A", "Bb", "B"] as const;

export const NAME_TO_PC: Record<string, number> = {
  C: 0,
  "C#": 1,
  Db: 1,
  D: 2,
  "D#": 3,
  Eb: 3,
  E: 4,
  F: 5,
  "F#": 6,
  Gb: 6,
  G: 7,
  "G#": 8,
  Ab: 8,
  A: 9,
  "A#": 10,
  Bb: 10,
  B: 11,
};

export type Mode = "major" | "minor";

export type Quality = {
  id: string;
  suffix: string;
  name: string;
  /** Semitones from root. */
  ivs: number[];
  formula: string[];
  group: "triad" | "seventh" | "colour";
  blurb: string;
};

export const QUALITIES: Quality[] = [
  {
    id: "maj",
    suffix: "",
    name: "Major",
    ivs: [0, 4, 7],
    formula: ["1", "3", "5"],
    group: "triad",
    blurb: "Bright triad. The major third sits four semitones above the root — one fret farther than minor.",
  },
  {
    id: "min",
    suffix: "m",
    name: "Minor",
    ivs: [0, 3, 7],
    formula: ["1", "b3", "5"],
    group: "triad",
    blurb: "Dark triad. Flatten the third one fret and the colour flips. Fifth stays put.",
  },
  {
    id: "dim",
    suffix: "dim",
    name: "Diminished",
    ivs: [0, 3, 6],
    formula: ["1", "b3", "b5"],
    group: "triad",
    blurb: "Stacked minor thirds. Unstable — the lowered fifth wants to collapse inward.",
  },
  {
    id: "aug",
    suffix: "aug",
    name: "Augmented",
    ivs: [0, 4, 8],
    formula: ["1", "3", "#5"],
    group: "triad",
    blurb: "Stacked major thirds. Symmetrical and tense; it can resolve in more than one direction.",
  },
  {
    id: "sus2",
    suffix: "sus2",
    name: "Sus2",
    ivs: [0, 2, 7],
    formula: ["1", "2", "5"],
    group: "triad",
    blurb: "No third, so no major/minor. The 2 hangs open until you let a third back in.",
  },
  {
    id: "sus4",
    suffix: "sus4",
    name: "Sus4",
    ivs: [0, 5, 7],
    formula: ["1", "4", "5"],
    group: "triad",
    blurb: "The classic suspension. The 4 wants to fall to 3 — that’s the resolution you already know from songs.",
  },
  {
    id: "7",
    suffix: "7",
    name: "Dominant 7",
    ivs: [0, 4, 7, 10],
    formula: ["1", "3", "5", "b7"],
    group: "seventh",
    blurb: "Major triad plus a minor seventh. The tritone between 3 and b7 is why V7 falls into I.",
  },
  {
    id: "maj7",
    suffix: "maj7",
    name: "Major 7",
    ivs: [0, 4, 7, 11],
    formula: ["1", "3", "5", "7"],
    group: "seventh",
    blurb: "A major third and a major seventh. Soft, wide, a little jazzy — not a dominant pull.",
  },
  {
    id: "m7",
    suffix: "m7",
    name: "Minor 7",
    ivs: [0, 3, 7, 10],
    formula: ["1", "b3", "5", "b7"],
    group: "seventh",
    blurb: "Minor colour with a smooth seventh. The workhorse ii chord in a ii–V–I.",
  },
  {
    id: "m7b5",
    suffix: "m7b5",
    name: "Half-diminished",
    ivs: [0, 3, 6, 10],
    formula: ["1", "b3", "b5", "b7"],
    group: "seventh",
    blurb: "The viiø7 in major, the iiø7 in minor. Dark, and it points at a dominant.",
  },
  {
    id: "dim7",
    suffix: "dim7",
    name: "Diminished 7",
    ivs: [0, 3, 6, 9],
    formula: ["1", "b3", "b5", "bb7"],
    group: "seventh",
    blurb: "All minor thirds. Four equivalent roots — a hinge you can pivot on.",
  },
  {
    id: "6",
    suffix: "6",
    name: "Major 6",
    ivs: [0, 4, 7, 9],
    formula: ["1", "3", "5", "6"],
    group: "colour",
    blurb: "A major triad with a sweet sixth. Older popular music, swing, and a lot of western swing guitar.",
  },
  {
    id: "m6",
    suffix: "m6",
    name: "Minor 6",
    ivs: [0, 3, 7, 9],
    formula: ["1", "b3", "5", "6"],
    group: "colour",
    blurb: "Minor, but the sixth keeps it from sinking. Gypsy jazz and film-noir colour.",
  },
  {
    id: "add9",
    suffix: "add9",
    name: "Add9",
    ivs: [0, 4, 7, 14],
    formula: ["1", "3", "5", "9"],
    group: "colour",
    blurb: "Major triad plus a ninth. No seventh, so it stays open instead of jazzy.",
  },
  {
    id: "9",
    suffix: "9",
    name: "Dominant 9",
    ivs: [0, 4, 7, 10, 14],
    formula: ["1", "3", "5", "b7", "9"],
    group: "colour",
    blurb: "Dominant 7 with a ninth on top. Funk, soul, and a rounder blues.",
  },
];

export const INTERVAL_INFO: Record<string, { name: string; semitones: number; role: string }> = {
  "1": { name: "Root", semitones: 0, role: "The note the chord is named after. Everything else is measured from here." },
  b2: { name: "Minor 2nd", semitones: 1, role: "A clash. Rare as a chord tone; it wants to resolve immediately." },
  "2": { name: "Major 2nd", semitones: 2, role: "The sus2 colour — airy, no major/minor." },
  "9": { name: "Ninth", semitones: 14, role: "A 2nd an octave up. Colour, not a new function." },
  b3: { name: "Minor 3rd", semitones: 3, role: "The whole minor sound. One fret below the major third." },
  "3": { name: "Major 3rd", semitones: 4, role: "The whole major sound. Four semitones above the root." },
  "4": { name: "Perfect 4th", semitones: 5, role: "Sus4. Wants to fall a fret to the third." },
  b5: { name: "Diminished 5th", semitones: 6, role: "Tritone. Unstable. The engine inside a diminished chord." },
  "5": { name: "Perfect 5th", semitones: 7, role: "The frame. Power chords are root + fifth — no colour yet." },
  "#5": { name: "Augmented 5th", semitones: 8, role: "Stretches the triad outward. Dreamy and tense at once." },
  "6": { name: "Major 6th", semitones: 9, role: "Sweet colour. Same pitch class as the thirteenth." },
  bb7: { name: "Diminished 7th", semitones: 9, role: "A 6th spelled as a seventh. Completes the dim7 stack." },
  b7: { name: "Minor 7th", semitones: 10, role: "Dominant flavour. Mixolydian. Wants to resolve down." },
  "7": { name: "Major 7th", semitones: 11, role: "A half-step below the octave. Lush, not dominant." },
};

export const MAJOR_SCALE = [0, 2, 4, 5, 7, 9, 11];
export const MINOR_SCALE = [0, 2, 3, 5, 7, 8, 10];

export type DiatonicDegree = {
  roman: string;
  roman7: string;
  quality: string;
  quality7: string;
  fn: "tonic" | "subdominant" | "dominant" | "mediant" | "leading";
  hint: string;
};

export const MAJOR_DEGREES: DiatonicDegree[] = [
  { roman: "I", roman7: "Imaj7", quality: "maj", quality7: "maj7", fn: "tonic", hint: "Home. The chord the key is named after." },
  { roman: "ii", roman7: "ii7", quality: "min", quality7: "m7", fn: "subdominant", hint: "Pre-dominant. Soft step toward V." },
  { roman: "iii", roman7: "iii7", quality: "min", quality7: "m7", fn: "mediant", hint: "Shares two notes with I — a colour change, not a move." },
  { roman: "IV", roman7: "IVmaj7", quality: "maj", quality7: "maj7", fn: "subdominant", hint: "Lift away from home. Often the first place a song goes." },
  { roman: "V", roman7: "V7", quality: "maj", quality7: "7", fn: "dominant", hint: "Has the leading tone. Gravity toward I." },
  { roman: "vi", roman7: "vi7", quality: "min", quality7: "m7", fn: "tonic", hint: "Relative minor. Same notes as I, darker center of gravity." },
  { roman: "vii°", roman7: "viiø7", quality: "dim", quality7: "m7b5", fn: "leading", hint: "Unstable. Almost always a doorway back to I." },
];

export const MINOR_DEGREES: DiatonicDegree[] = [
  { roman: "i", roman7: "i7", quality: "min", quality7: "m7", fn: "tonic", hint: "Home in minor. Heavier than I, same job." },
  { roman: "ii°", roman7: "iiø7", quality: "dim", quality7: "m7b5", fn: "subdominant", hint: "Points at V. The jazz ii in a minor ii–V–i." },
  { roman: "III", roman7: "IIImaj7", quality: "maj", quality7: "maj7", fn: "mediant", hint: "Relative major. The bright side of this key." },
  { roman: "iv", roman7: "iv7", quality: "min", quality7: "m7", fn: "subdominant", hint: "Minor subdominant. A deep step away from home." },
  { roman: "v", roman7: "v7", quality: "min", quality7: "m7", fn: "dominant", hint: "Natural minor dominant — weaker than V. Raise the third to make it pull." },
  { roman: "VI", roman7: "VImaj7", quality: "maj", quality7: "maj7", fn: "subdominant", hint: "Borrowed sunshine. Shares two notes with i." },
  { roman: "VII", roman7: "VII7", quality: "maj", quality7: "7", fn: "dominant", hint: "Mixolydian flavour from the flat seventh of the key." },
];

export type Progression = {
  id: string;
  name: string;
  numerals: string[];
  mode: Mode | "any";
  blurb: string;
};

export const PROGRESSIONS: Progression[] = [
  { id: "axis", name: "I–V–vi–IV", numerals: ["I", "V", "vi", "IV"], mode: "major", blurb: "The four-chord loop behind a thousand pop songs." },
  { id: "sensitive", name: "vi–IV–I–V", numerals: ["vi", "IV", "I", "V"], mode: "major", blurb: "Same four chords, starting on the relative minor. A sadder door into the same room." },
  { id: "fifties", name: "I–vi–IV–V", numerals: ["I", "vi", "IV", "V"], mode: "major", blurb: "Doo-wop changes. The 6 is a neighbour, not a new key." },
  { id: "folk", name: "I–IV–V", numerals: ["I", "IV", "V"], mode: "major", blurb: "Folk, country, hymns. Three functions, the whole map." },
  { id: "twofive", name: "ii–V–I", numerals: ["ii", "V", "I"], mode: "major", blurb: "Jazz cadence. ii prepares V; V delivers I." },
  { id: "twofive7", name: "ii7–V7–Imaj7", numerals: ["ii7", "V7", "Imaj7"], mode: "major", blurb: "The same cadence with sevenths — how standards actually move." },
  { id: "mixo", name: "I–bVII–IV", numerals: ["I", "bVII", "IV"], mode: "major", blurb: "Rock mixolydian. The bVII is a whole step below I — no leading tone, just weight." },
  { id: "creep", name: "I–III–IV–iv", numerals: ["I", "III", "IV", "iv"], mode: "major", blurb: "Chromatic lift, then a minor-plagal sigh. The iv is borrowed from parallel minor." },
  { id: "blues", name: "12-bar skeleton", numerals: ["I7", "I7", "I7", "I7", "IV7", "IV7", "I7", "I7", "V7", "IV7", "I7", "V7"], mode: "any", blurb: "Each chord is dominant. The I7 is already restless — that’s the blues." },
  { id: "andlus", name: "Andalusian", numerals: ["i", "VII", "VI", "V"], mode: "minor", blurb: "Descending minor tetrachord. Flamenco, baroque, and a lot of rock in A minor." },
  { id: "mincad", name: "iiø–V–i", numerals: ["iiø7", "V7", "i"], mode: "minor", blurb: "Minor jazz cadence. Raise the third of v to V so the leading tone appears." },
  { id: "aeolian", name: "i–VI–III–VII", numerals: ["i", "VI", "III", "VII"], mode: "minor", blurb: "Natural minor loop. No raised leading tone — it doesn’t need to resolve, it orbits." },
];

export const FIFTHS = [0, 7, 2, 9, 4, 11, 6, 1, 8, 3, 10, 5] as const;

export const FN_LABEL: Record<DiatonicDegree["fn"], string> = {
  tonic: "Tonic",
  subdominant: "Subdominant",
  dominant: "Dominant",
  mediant: "Mediant",
  leading: "Leading",
};

type ShapeTemplate = {
  caged: "C" | "A" | "G" | "E" | "D";
  quality: string;
  frets: (number | null)[];
  fingers: (number | null)[];
  openRootPc: number;
};

const T: ShapeTemplate[] = [
  { caged: "E", quality: "maj", openRootPc: 4, frets: [0, 2, 2, 1, 0, 0], fingers: [0, 2, 3, 1, 0, 0] },
  { caged: "E", quality: "min", openRootPc: 4, frets: [0, 2, 2, 0, 0, 0], fingers: [0, 2, 3, 0, 0, 0] },
  { caged: "E", quality: "7", openRootPc: 4, frets: [0, 2, 0, 1, 0, 0], fingers: [0, 2, 0, 1, 0, 0] },
  { caged: "E", quality: "maj7", openRootPc: 4, frets: [0, 2, 1, 1, 0, 0], fingers: [0, 2, 1, 1, 0, 0] },
  { caged: "E", quality: "m7", openRootPc: 4, frets: [0, 2, 0, 0, 0, 0], fingers: [0, 2, 0, 0, 0, 0] },
  { caged: "E", quality: "sus4", openRootPc: 4, frets: [0, 2, 2, 2, 0, 0], fingers: [0, 2, 3, 4, 0, 0] },
  { caged: "E", quality: "6", openRootPc: 4, frets: [0, 2, 2, 1, 2, 0], fingers: [0, 2, 3, 1, 4, 0] },
  { caged: "E", quality: "m6", openRootPc: 4, frets: [0, 2, 2, 0, 2, 0], fingers: [0, 2, 3, 0, 4, 0] },
  { caged: "E", quality: "add9", openRootPc: 4, frets: [0, 2, 2, 1, 0, 2], fingers: [0, 2, 3, 1, 0, 4] },
  { caged: "E", quality: "9", openRootPc: 4, frets: [0, 2, 0, 1, 0, 2], fingers: [0, 2, 0, 1, 0, 4] },
  { caged: "E", quality: "aug", openRootPc: 4, frets: [0, 3, 2, 1, 1, 0], fingers: [0, 4, 3, 1, 2, 0] },
  { caged: "E", quality: "dim", openRootPc: 4, frets: [0, 1, 2, 0, 2, 0], fingers: [0, 1, 3, 0, 4, 0] },
  { caged: "E", quality: "m7b5", openRootPc: 4, frets: [0, 1, 2, 0, 3, 0], fingers: [0, 1, 2, 0, 4, 0] },
  { caged: "E", quality: "dim7", openRootPc: 4, frets: [0, 1, 2, 0, 2, 0], fingers: [0, 1, 3, 0, 4, 0] },
  { caged: "A", quality: "maj", openRootPc: 9, frets: [null, 0, 2, 2, 2, 0], fingers: [null, 0, 1, 2, 3, 0] },
  { caged: "A", quality: "min", openRootPc: 9, frets: [null, 0, 2, 2, 1, 0], fingers: [null, 0, 2, 3, 1, 0] },
  { caged: "A", quality: "7", openRootPc: 9, frets: [null, 0, 2, 0, 2, 0], fingers: [null, 0, 1, 0, 2, 0] },
  { caged: "A", quality: "maj7", openRootPc: 9, frets: [null, 0, 2, 1, 2, 0], fingers: [null, 0, 2, 1, 3, 0] },
  { caged: "A", quality: "m7", openRootPc: 9, frets: [null, 0, 2, 0, 1, 0], fingers: [null, 0, 2, 0, 1, 0] },
  { caged: "A", quality: "sus2", openRootPc: 9, frets: [null, 0, 2, 2, 0, 0], fingers: [null, 0, 1, 2, 0, 0] },
  { caged: "A", quality: "sus4", openRootPc: 9, frets: [null, 0, 2, 2, 3, 0], fingers: [null, 0, 1, 2, 3, 0] },
  { caged: "A", quality: "6", openRootPc: 9, frets: [null, 0, 2, 2, 2, 2], fingers: [null, 0, 1, 2, 3, 4] },
  { caged: "A", quality: "add9", openRootPc: 9, frets: [null, 0, 2, 4, 2, 0], fingers: [null, 0, 1, 3, 2, 0] },
  { caged: "A", quality: "9", openRootPc: 9, frets: [null, 0, 2, 4, 2, 3], fingers: [null, 0, 1, 4, 2, 3] },
  { caged: "A", quality: "dim", openRootPc: 9, frets: [null, 0, 1, 2, 1, null], fingers: [null, 0, 1, 3, 2, null] },
  { caged: "A", quality: "aug", openRootPc: 9, frets: [null, 0, 3, 2, 2, 1], fingers: [null, 0, 4, 2, 3, 1] },
  { caged: "A", quality: "m7b5", openRootPc: 9, frets: [null, 0, 1, 0, 1, 3], fingers: [null, 0, 1, 0, 2, 4] },
  { caged: "D", quality: "maj", openRootPc: 2, frets: [null, null, 0, 2, 3, 2], fingers: [null, null, 0, 1, 3, 2] },
  { caged: "D", quality: "min", openRootPc: 2, frets: [null, null, 0, 2, 3, 1], fingers: [null, null, 0, 2, 3, 1] },
  { caged: "D", quality: "7", openRootPc: 2, frets: [null, null, 0, 2, 1, 2], fingers: [null, null, 0, 2, 1, 3] },
  { caged: "D", quality: "maj7", openRootPc: 2, frets: [null, null, 0, 2, 2, 2], fingers: [null, null, 0, 1, 1, 1] },
  { caged: "D", quality: "m7", openRootPc: 2, frets: [null, null, 0, 2, 1, 1], fingers: [null, null, 0, 2, 1, 1] },
  { caged: "D", quality: "sus2", openRootPc: 2, frets: [null, null, 0, 2, 3, 0], fingers: [null, null, 0, 1, 2, 0] },
  { caged: "D", quality: "sus4", openRootPc: 2, frets: [null, null, 0, 2, 3, 3], fingers: [null, null, 0, 1, 2, 3] },
  { caged: "D", quality: "6", openRootPc: 2, frets: [null, null, 0, 2, 0, 2], fingers: [null, null, 0, 1, 0, 2] },
  { caged: "D", quality: "add9", openRootPc: 2, frets: [null, null, 0, 2, 3, 0], fingers: [null, null, 0, 1, 2, 0] },
  { caged: "C", quality: "maj", openRootPc: 0, frets: [null, 3, 2, 0, 1, 0], fingers: [null, 3, 2, 0, 1, 0] },
  { caged: "C", quality: "min", openRootPc: 0, frets: [null, 3, 1, 0, 1, null], fingers: [null, 4, 2, 0, 1, null] },
  { caged: "C", quality: "7", openRootPc: 0, frets: [null, 3, 2, 3, 1, 0], fingers: [null, 3, 2, 4, 1, 0] },
  { caged: "C", quality: "maj7", openRootPc: 0, frets: [null, 3, 2, 0, 0, 0], fingers: [null, 3, 2, 0, 0, 0] },
  { caged: "C", quality: "m7", openRootPc: 0, frets: [null, 3, 1, 3, 1, null], fingers: [null, 3, 1, 4, 1, null] },
  { caged: "G", quality: "maj", openRootPc: 7, frets: [3, 2, 0, 0, 0, 3], fingers: [2, 1, 0, 0, 0, 3] },
  { caged: "G", quality: "min", openRootPc: 7, frets: [3, 1, 0, 0, 3, 3], fingers: [2, 1, 0, 0, 3, 4] },
  { caged: "G", quality: "7", openRootPc: 7, frets: [3, 2, 0, 0, 0, 1], fingers: [3, 2, 0, 0, 0, 1] },
  { caged: "G", quality: "m7", openRootPc: 7, frets: [3, 1, 0, 0, 3, 1], fingers: [3, 1, 0, 0, 4, 1] },
];

const TRIAD_FALLBACK: Record<string, string> = {
  "7": "maj",
  maj7: "maj",
  "6": "maj",
  add9: "maj",
  "9": "maj",
  m7: "min",
  m6: "min",
  m7b5: "dim",
  dim7: "dim",
};

export function qualityById(id: string) {
  return QUALITIES.find((q) => q.id === id) ?? QUALITIES[0];
}

export function parseRoot(raw: unknown): string {
  if (typeof raw === "string" && raw in NAME_TO_PC) return raw;
  return "C";
}

export function parseQuality(raw: unknown): string {
  if (typeof raw === "string" && QUALITIES.some((q) => q.id === raw)) return raw;
  return "maj";
}

export function pcOf(name: string) {
  return NAME_TO_PC[name] ?? 0;
}

export function useFlats(tonicPc: number, mode: Mode) {
  const majorPc = mode === "minor" ? (tonicPc + 3) % 12 : tonicPc;
  return majorPc === 5 || majorPc === 10 || majorPc === 3 || majorPc === 8;
}

export function noteName(pc: number, flats = false) {
  const n = ((pc % 12) + 12) % 12;
  return flats ? PC_FLAT[n] : PC_SHARP[n];
}

export function chordPcs(rootPc: number, qualityId: string) {
  const q = qualityById(qualityId);
  return q.ivs.map((iv) => (rootPc + (iv % 12)) % 12);
}

export function chordLabel(rootPc: number, qualityId: string, flats = false) {
  return `${noteName(rootPc, flats)}${qualityById(qualityId).suffix}`;
}

export function roleOfPc(rootPc: number, qualityId: string, pc: number) {
  const q = qualityById(qualityId);
  const iv = (pc - rootPc + 12) % 12;
  const idx = q.ivs.findIndex((x) => x % 12 === iv);
  if (idx < 0) return null;
  return q.formula[idx] ?? null;
}

export function scalePcs(tonicPc: number, mode: Mode) {
  const ivs = mode === "minor" ? MINOR_SCALE : MAJOR_SCALE;
  return ivs.map((iv) => (tonicPc + iv) % 12);
}

export function degreesFor(mode: Mode) {
  return mode === "minor" ? MINOR_DEGREES : MAJOR_DEGREES;
}

export function diatonicChords(tonicPc: number, mode: Mode, sevenths = false) {
  const scale = scalePcs(tonicPc, mode);
  return degreesFor(mode).map((deg, i) => {
    const quality = sevenths ? deg.quality7 : deg.quality;
    const roman = sevenths ? deg.roman7 : deg.roman;
    const rootPc = scale[i];
    return {
      ...deg,
      roman,
      quality,
      rootPc,
      label: chordLabel(rootPc, quality, useFlats(tonicPc, mode)),
    };
  });
}

const ROMAN_RE = /^(b|#)?(VII|VI|IV|III|II|V|I|vii|vi|iv|iii|ii|v|i)(ø7|maj7|m7|dim7|dim|aug|7|°)?$/;

export function parseNumeral(raw: string, keyPc: number, mode: Mode) {
  const m = raw.match(ROMAN_RE);
  if (!m) {
    return { rootPc: keyPc, qualityId: "maj", numeral: raw, label: raw };
  }
  const acc = m[1] ?? "";
  const rom = m[2];
  const suf = m[3] ?? "";
  const degree = { I: 0, II: 1, III: 2, IV: 3, V: 4, VI: 5, VII: 6 }[rom.toUpperCase()] ?? 0;
  const scale = mode === "minor" ? MINOR_SCALE : MAJOR_SCALE;
  let rootPc = (keyPc + scale[degree]) % 12;
  if (acc === "b") rootPc = (rootPc + 11) % 12;
  if (acc === "#") rootPc = (rootPc + 1) % 12;

  const upper = rom[0] === rom[0].toUpperCase() && rom[0] !== rom[0].toLowerCase();
  let qualityId = "maj";
  if (suf === "°" || suf === "dim") qualityId = "dim";
  else if (suf === "ø7") qualityId = "m7b5";
  else if (suf === "maj7") qualityId = "maj7";
  else if (suf === "m7") qualityId = "m7";
  else if (suf === "dim7") qualityId = "dim7";
  else if (suf === "aug") qualityId = "aug";
  else if (suf === "7") qualityId = upper ? "7" : rom.toUpperCase() === "VII" ? "m7b5" : "m7";
  else if (!upper) qualityId = "min";

  const flats = useFlats(keyPc, mode);
  return {
    rootPc,
    qualityId,
    numeral: raw,
    label: chordLabel(rootPc, qualityId, flats),
  };
}

function transposeTemplate(t: ShapeTemplate, targetPc: number): ChordShape | null {
  const offset = (targetPc - t.openRootPc + 12) % 12;
  const frets = t.frets.map((f) => (f == null ? null : f + offset));
  const played = frets.filter((f): f is number => f != null);
  if (played.length < 3) return null;
  const maxF = Math.max(...played);
  if (maxF > 15) return null;
  const span = maxF - Math.min(...played);
  if (span > 5) return null;
  const fingers = t.fingers.map((fin, i) => {
    if (frets[i] == null) return null;
    if (offset === 0) return fin;
    if (fin == null) return null;
    if (fin === 0) return 1;
    return Math.min(4, fin + 1);
  });
  const notes: string[] = [];
  const openPcs = [4, 9, 2, 7, 11, 4];
  frets.forEach((f, i) => {
    if (f == null) return;
    notes.push(noteName((openPcs[i] + f) % 12, false));
  });
  return {
    id: `${t.caged}-${offset}-${t.quality}`,
    name: `${chordLabel(targetPc, t.quality)} · ${t.caged} shape`,
    frets,
    fingers,
    notes,
  };
}

function templatesForQuality(qualityId: string): ShapeTemplate[] {
  const direct = T.filter((t) => t.quality === qualityId);
  if (direct.length) return direct;
  const fb = TRIAD_FALLBACK[qualityId];
  if (fb) return T.filter((t) => t.quality === fb);
  return T.filter((t) => t.quality === "maj");
}

export function listVoicings(rootPc: number, qualityId: string): ChordShape[] {
  const tpls = templatesForQuality(qualityId);
  const out: ChordShape[] = [];
  const seen = new Set<string>();
  for (const t of tpls) {
    const shape = transposeTemplate(t, rootPc);
    if (!shape) continue;
    const key = shape.frets.map((f) => (f == null ? "x" : f)).join("-");
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(shape);
  }
  out.sort((a, b) => {
    const minA = Math.min(...a.frets.filter((f): f is number => f != null && f > 0), 99);
    const minB = Math.min(...b.frets.filter((f): f is number => f != null && f > 0), 99);
    return minA - minB;
  });
  return out.slice(0, 5);
}

export function cagedShapes(rootPc: number, qualityId: string) {
  const want = qualityId === "min" || qualityId === "m7" || qualityId === "m6" ? "min" : "maj";
  const order: ShapeTemplate["caged"][] = ["C", "A", "G", "E", "D"];
  return order
    .map((caged) => {
      const t = T.find((x) => x.caged === caged && x.quality === want);
      if (!t) return null;
      const shape = transposeTemplate(t, rootPc);
      if (!shape) return null;
      const offset = (rootPc - t.openRootPc + 12) % 12;
      return { caged, offset, shape };
    })
    .filter((x): x is NonNullable<typeof x> => x != null);
}

export function voicingFreqs(shape: ChordShape) {
  return shape.frets
    .map((f, i) => (f == null ? null : fretToFreq(i, f)))
    .filter((f): f is number => f != null);
}

export function fretNote(stringIndex: number, fret: number, flats = false) {
  const open = [4, 9, 2, 7, 11, 4];
  const pc = (open[stringIndex] + fret) % 12;
  return { pc, name: noteName(pc, flats), freq: fretToFreq(stringIndex, fret) };
}

export function fretNoteOn(openPc: number[], openFreq: number[], stringIndex: number, fret: number, flats = false) {
  const open = openPc[stringIndex] ?? 0;
  const pc = (open + fret) % 12;
  const base = openFreq[stringIndex] ?? 110;
  return { pc, name: noteName(pc, flats), freq: base * Math.pow(2, fret / 12) };
}

/** Closest chord-tone-per-string shape for uke/bass necks. */
export function neckVoicing(openPc: number[], pcs: number[], maxFret = 5): (number | null)[] {
  const set = new Set(pcs.map((p) => ((p % 12) + 12) % 12));
  return openPc.map((open) => {
    for (let f = 0; f <= maxFret; f++) {
      if (set.has((open + f) % 12)) return f;
    }
    return null;
  });
}

export function chordMidis(rootPc: number, qualityId: string, rootMidi = 60) {
  const q = qualityById(qualityId);
  const root = rootMidi + (((rootPc % 12) + 12) % 12);
  return q.ivs.map((iv) => root + iv);
}

export const STRING_LABELS = STRING_NAMES;

export type TheoryTab = "build" | "key" | "changes" | "caged";

export function parseTab(raw: unknown): TheoryTab {
  if (raw === "key" || raw === "changes" || raw === "caged" || raw === "build") return raw;
  return "build";
}

export function parseMode(raw: unknown): Mode {
  return raw === "minor" ? "minor" : "major";
}

export const DEFAULT_THEORY_SEARCH = {
  tab: "build" as TheoryTab,
  root: "C",
  q: "maj",
  key: "C",
  mode: "major" as Mode,
};
