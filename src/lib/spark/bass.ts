export type TechTab =
  | "alt"
  | "ghost"
  | "thumb"
  | "rake"
  | "double"
  | "hammer"
  | "roots"
  | "fifth"
  | "octave"
  | "walk";

export type BassRole = "R" | "5" | "8" | "ap" | "ct" | "gh" | "hm";
export type Finger = "p" | "i" | "m";

export type BassPos = {
  string: number;
  fret: number;
  name: string;
  role: BassRole;
};

export const BASS_STRINGS = ["E", "A", "D", "G"] as const;
export const BASS_OPEN_PC = [4, 9, 2, 7];
export const BASS_OPEN_FREQ = [41.2, 55.0, 73.42, 98.0];
export const BASS_CHORDS = ["Em", "G", "C", "D", "A", "Am"] as const;
export type BassChord = (typeof BASS_CHORDS)[number];

const PC_NAMES = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];

export const HAND_TABS: { id: TechTab; label: string }[] = [
  { id: "alt", label: "Alt" },
  { id: "ghost", label: "Ghost" },
  { id: "thumb", label: "Thumb" },
  { id: "rake", label: "Rake" },
  { id: "double", label: "Double" },
];

export const LINE_TABS: { id: TechTab; label: string }[] = [
  { id: "roots", label: "Root" },
  { id: "fifth", label: "5th" },
  { id: "octave", label: "8ve" },
  { id: "walk", label: "Walk" },
  { id: "hammer", label: "Hammer" },
];

export const TABS = [...HAND_TABS, ...LINE_TABS];

const TAB_IDS = new Set<string>(TABS.map((t) => t.id));

export function parseTechTab(raw: unknown): TechTab {
  if (raw === "pluck") return "alt";
  if (typeof raw === "string" && TAB_IDS.has(raw)) return raw as TechTab;
  return "alt";
}

export function parseBassChord(raw: unknown): BassChord {
  if (typeof raw === "string" && (BASS_CHORDS as readonly string[]).includes(raw)) return raw as BassChord;
  return "Em";
}

export const DEFAULT_TECH_SEARCH = { tab: "alt" as TechTab, chord: "Em" as BassChord };

export function bassNoteName(stringIndex: number, fret: number) {
  const pc = ((BASS_OPEN_PC[stringIndex] ?? 4) + fret) % 12;
  return PC_NAMES[pc] ?? "?";
}

export function bassFreq(stringIndex: number, fret: number) {
  const open = BASS_OPEN_FREQ[stringIndex] ?? 41.2;
  return open * Math.pow(2, fret / 12);
}

export function posOf(stringIndex: number, fret: number, role: BassRole = "R"): BassPos {
  const s = Math.max(0, Math.min(3, stringIndex));
  const f = Math.max(0, Math.min(7, fret));
  return { string: s, fret: f, name: bassNoteName(s, f), role };
}

/** Lowest root for a named chord on E or A. */
export const BASS_ROOTS: Record<BassChord, BassPos> = {
  Em: posOf(0, 0, "R"),
  G: posOf(0, 3, "R"),
  C: posOf(1, 3, "R"),
  D: posOf(1, 5, "R"),
  A: posOf(1, 0, "R"),
  Am: posOf(1, 0, "R"),
};

/** Next string, two frets up — the box fifth. */
export function fifthOf(root: BassPos): BassPos {
  return posOf(root.string + 1, root.fret + 2, "5");
}

/** Skip a string, two frets up — the octave punch. */
export function octaveOf(root: BassPos): BassPos {
  return posOf(root.string + 2, root.fret + 2, "8");
}

export function hammerOf(root: BassPos): BassPos {
  return posOf(root.string, root.fret + 2, "hm");
}

export type LineEvent = {
  pos: BassPos;
  beat: number;
  ghost?: boolean;
  hammer?: boolean;
  rake?: boolean;
  together?: BassPos;
  finger?: Finger;
};

const IM: Finger[] = ["i", "m", "i", "m", "i", "m", "i", "m"];

export function lineFor(tab: TechTab, chord: BassChord): LineEvent[] {
  const root = BASS_ROOTS[chord];
  if (tab === "alt") {
    return Array.from({ length: 8 }, (_, i) => ({ pos: root, beat: i, finger: IM[i] }));
  }
  if (tab === "ghost") {
    return Array.from({ length: 8 }, (_, i) => ({
      pos: i % 2 === 1 ? { ...root, role: "gh" as const } : root,
      beat: i,
      ghost: i % 2 === 1,
      finger: IM[i],
    }));
  }
  if (tab === "thumb") {
    const fifth = fifthOf(root);
    const oct = octaveOf(root);
    const cycle: { pos: BassPos; finger: Finger }[] = [
      { pos: root, finger: "p" },
      { pos: fifth, finger: "i" },
      { pos: root, finger: "p" },
      { pos: oct, finger: "m" },
    ];
    return Array.from({ length: 8 }, (_, i) => ({ ...cycle[i % 4], beat: i }));
  }
  if (tab === "rake") {
    const mute = posOf(root.string + 1, root.fret, "gh");
    return Array.from({ length: 8 }, (_, i) =>
      i % 2 === 0
        ? { pos: root, beat: i, rake: true, together: mute, finger: "i" as const }
        : { pos: root, beat: i, finger: "m" as const },
    );
  }
  if (tab === "double") {
    const fifth = fifthOf(root);
    return Array.from({ length: 8 }, (_, i) => ({
      pos: root,
      beat: i,
      together: fifth,
      finger: i % 2 === 0 ? "p" : "i",
    }));
  }
  if (tab === "hammer") {
    const hm = hammerOf(root);
    const out: LineEvent[] = [];
    for (let i = 0; i < 4; i++) {
      out.push({ pos: root, beat: i * 2, finger: IM[i] });
      out.push({ pos: hm, beat: i * 2 + 1, hammer: true, finger: IM[i] });
    }
    return out;
  }
  if (tab === "roots") {
    return Array.from({ length: 8 }, (_, i) => ({ pos: root, beat: i, finger: IM[i] }));
  }
  if (tab === "fifth") {
    const fifth = fifthOf(root);
    return Array.from({ length: 8 }, (_, i) => ({
      pos: i % 2 === 0 ? root : fifth,
      beat: i,
      finger: IM[i],
    }));
  }
  if (tab === "octave") {
    const oct = octaveOf(root);
    return Array.from({ length: 8 }, (_, i) => ({
      pos: i % 2 === 0 ? root : oct,
      beat: i,
      finger: IM[i],
    }));
  }
  return walkLine(chord);
}

const BASS_OPEN_MIDI = [28, 33, 38, 43];

/** A position for an exact pitch, preferring the string nearest `near`. */
function posForMidi(midi: number, near: number, role: BassRole): BassPos {
  const strings = [0, 1, 2, 3].sort((a, b) => Math.abs(a - near) - Math.abs(b - near) || a - b);
  for (const s of strings) {
    const fret = midi - (BASS_OPEN_MIDI[s] ?? 28);
    if (fret >= 0 && fret <= 7) return posOf(s, fret, role);
  }
  return posOf(near, 0, role);
}

/**
 * Walk into the selected chord's root: state it, step below it, climb back
 * in, then sit on it. Em and C keep the two original door walks exactly —
 * Em climbs into G, and C is arrived at by the G→C climb — the reference
 * instances the general pattern was taken from.
 */
function walkLine(chord: BassChord): LineEvent[] {
  const fingers: Finger[] = ["i", "m", "i", "m", "i", "m", "i", "m"];
  const line = (notes: BassPos[]) => notes.map((pos, i) => ({ pos, beat: i, finger: fingers[i] }));
  if (chord === "C") {
    return line([
      posOf(0, 3, "R"),
      posOf(0, 5, "ap"),
      posOf(1, 0, "ap"),
      posOf(1, 2, "ap"),
      posOf(1, 3, "R"),
      posOf(1, 3, "R"),
      posOf(1, 3, "R"),
      posOf(1, 3, "R"),
    ]);
  }
  if (chord === "Em") {
    return line([
      posOf(0, 0, "R"),
      posOf(0, 0, "R"),
      posOf(0, 2, "ap"),
      posOf(0, 3, "R"),
      posOf(0, 3, "R"),
      posOf(0, 3, "R"),
      posOf(0, 3, "R"),
      posOf(0, 3, "R"),
    ]);
  }
  const root = BASS_ROOTS[chord];
  const rootMidi = (BASS_OPEN_MIDI[root.string] ?? 28) + root.fret;
  const below2 = posForMidi(rootMidi - 2, root.string, "ap");
  const below1 = posForMidi(rootMidi - 1, root.string, "ap");
  return line([root, root, below2, below1, root, root, root, root]);
}

export const TECH_COPY: Record<TechTab, { kicker: string; title: string; body: string; hear: string }> = {
  alt: {
    kicker: "i–m",
    title: "Never the same finger twice",
    body: "Index, middle, index, middle. One string. The stroke that just played is already coming back. If both fingers land as one blob, slow down until you hear two attacks.",
    hear: "i m i m on one pitch. The drone is cheap. The hand is the work.",
  },
  ghost: {
    kicker: "Dead stroke",
    title: "Keep the motion. Kill the pitch.",
    body: "Mute with the left hand, pluck anyway. The click is a drum. Funk, reggae, every busy line that isn’t actually busy — ghosts in the holes.",
    hear: "Tone, chuck, tone, chuck. The chuck is the groove.",
  },
  thumb: {
    kicker: "p–i–m",
    title: "Thumb owns the root string",
    body: "Plant the thumb on the root. Index takes the fifth (next string, two up). Middle takes the octave (skip a string, two up). Three strings, three fingers. Nobody crosses.",
    hear: "p on the root, i on the fifth, m on the octave.",
  },
  rake: {
    kicker: "One finger, two strings",
    title: "Drag into the note",
    body: "Start on the string above, muted, and land on the target in one motion. The extra click is a grace. Don’t pluck twice — fall once.",
    hear: "A muted scrape, then the root. Same finger.",
  },
  double: {
    kicker: "Two at once",
    title: "Root and fifth, one attack",
    body: "Thumb on the low string, index on the next. It’s a power chord with no strum. If you hear a flam, the fingers aren’t together.",
    hear: "Two pitches, one hit.",
  },
  hammer: {
    kicker: "Left hand finish",
    title: "Pluck once. The next note is free.",
    body: "Sound the first note, then hammer a finger onto a higher fret. No right hand on the second. The arrival should be as loud as the pluck — that’s the work.",
    hear: "A pluck, then a hammer two frets up. No second attack.",
  },
  roots: {
    kicker: "The job",
    title: "Name it. Play the lowest one.",
    body: "A bass line starts as the name of the chord, in the lowest place you can reach. Open E is Em. Third fret, E string, is G. The rest of the neck is optional.",
    hear: "One root, eight times. Fat and late is better than early and thin.",
  },
  fifth: {
    kicker: "Skeleton",
    title: "Skip the third",
    body: "Root plus fifth is a power chord, played one note at a time. Next string, two frets up. No major, no minor — just the frame a whole band hangs on.",
    hear: "Root, fifth, root, fifth. Lock it to the kick.",
  },
  octave: {
    kicker: "Same letter",
    title: "Twelve semitones, one shape",
    body: "Skip a string, two frets up. That’s the octave. Disco, funk, every chorus that needed to jump without changing the harmony. Same name. Higher floor.",
    hear: "Low, high, low, high. The punch is the jump.",
  },
  walk: {
    kicker: "Connect",
    title: "Don’t jump. Walk.",
    body: "The notes around a root are the sentence. State the root, step below it, and climb back in. Arriving from underneath makes the root feel like home, not a guess — the Em line climbs into G the same way.",
    hear: "Root, root, the two steps below, then sit on the root.",
  },
};

export const ROLE_LABEL: Record<BassRole, string> = {
  R: "Root",
  "5": "Fifth",
  "8": "Octave",
  ap: "Approach",
  ct: "Chord tone",
  gh: "Ghost",
  hm: "Hammer",
};

export const FINGER_LABEL: Record<Finger, string> = {
  p: "thumb",
  i: "index",
  m: "middle",
};
