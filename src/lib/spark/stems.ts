/**
 * Stem Lab — pure logic.
 *
 * A hard invariant runs through this file and the engine that consumes it:
 * every stem stays glued to the original song's timeline. Sample 0 of every
 * stem is song time 0. Nothing here trims, aligns, pads or offsets a stem —
 * stems exist so a single part can be analysed or muted against the full
 * recording, and any shift would silently break that.
 */

export const STEM_IDS = ["vocals", "drums", "bass", "guitar", "piano", "other"] as const;
export type StemId = (typeof STEM_IDS)[number];

export type StemDef = { id: StemId; label: string; hint: string };

export const STEM_DEFS: Record<StemId, StemDef> = {
  vocals: { id: "vocals", label: "Vocals", hint: "Lead and backing voices" },
  drums: { id: "drums", label: "Drums", hint: "Kit and percussion" },
  bass: { id: "bass", label: "Bass", hint: "Bass line" },
  guitar: { id: "guitar", label: "Guitar", hint: "Guitars" },
  piano: { id: "piano", label: "Piano", hint: "Piano and keys" },
  other: { id: "other", label: "Other", hint: "Everything else in the mix" },
};

const STEM_ALIASES: Record<string, StemId> = {
  vocals: "vocals",
  vocal: "vocals",
  vox: "vocals",
  voice: "vocals",
  drums: "drums",
  drum: "drums",
  percussion: "drums",
  bass: "bass",
  guitar: "guitar",
  guitars: "guitar",
  gtr: "guitar",
  piano: "piano",
  keys: "piano",
  keyboard: "piano",
  other: "other",
  accompaniment: "other",
  instrumental: "other",
  music: "other",
  rest: "other",
  no_vocals: "other",
};

/**
 * Match a file name to a stem by its name tokens. Demucs names its outputs
 * exactly (`vocals.wav`), so an exact stem token anywhere in the name wins.
 * Returns null when nothing matches — the caller puts the file in the
 * manual-assignment tray instead of guessing.
 */
export function stemForFileName(name: string): StemId | null {
  const base = name.split(/[\\/]/).pop() ?? name;
  const stem = base.replace(/\.[^.]+$/, "").toLowerCase();
  const joined = stem.replace(/[^a-z]+/g, "_");
  if (STEM_ALIASES[joined]) return STEM_ALIASES[joined];
  for (const token of stem.split(/[^a-z]+/)) {
    if (token && STEM_ALIASES[token]) return STEM_ALIASES[token];
  }
  return null;
}

export type ClassifiedStemFile = { path: string; stem: StemId | null };

export type StemFileClassification = {
  /** Song name when a Demucs-style folder grouping was detected. */
  song: string | null;
  files: ClassifiedStemFile[];
};

/**
 * Classify dropped/picked files. With a folder import (paths carry
 * directories) the Demucs layout is `<model>/<song>/<stem>.<ext>`: files are
 * matched by name, and the song is the parent folder of the largest group of
 * matched files. The 4-stem model simply has no guitar/piano files — those
 * parts live inside `other.wav`, which matches by name like any other stem.
 * Unmatched files keep stem: null for the assignment tray.
 */
export function classifyStemFiles(paths: string[]): StemFileClassification {
  const files = paths.map((path) => ({ path, stem: stemForFileName(path) }));
  const groups = new Map<string, number>();
  for (const f of files) {
    if (!f.stem) continue;
    const parts = f.path.split(/[\\/]/).filter(Boolean);
    if (parts.length < 2) continue;
    const parent = parts[parts.length - 2];
    groups.set(parent, (groups.get(parent) ?? 0) + 1);
  }
  let song: string | null = null;
  let best = 1;
  for (const [dir, count] of groups) {
    if (count > best) {
      best = count;
      song = dir;
    }
  }
  return { song, files };
}

/* ------------------------------------------------------------------ */
/* Song timeline — the no-shift invariant, made concrete.              */
/* ------------------------------------------------------------------ */

export type StemTrackInput = {
  stem: StemId;
  /** Exact decoded duration of this stem, seconds. */
  durationSec: number;
  /** Index of the first sample above silence in the decoded stem. */
  firstNonSilentSample: number;
  sampleRate: number;
};

export type StemTrackPlan = {
  stem: StemId;
  /** Always exactly 0: a stem is never shifted against the song. */
  offsetSec: 0;
  /** The stem's own duration, untouched — a short stem ends early, period. */
  durationSec: number;
  /** Passed through unchanged: preparation never eats leading silence. */
  firstNonSilentSample: number;
  /** When this stem first sounds, on the song timeline. */
  firstSoundSec: number;
};

export type SongTimeline = {
  /** The longest stem's duration. Nothing is padded to reach it. */
  durationSec: number;
  tracks: StemTrackPlan[];
};

/**
 * Lay the loaded stems out on one song timeline. Every track starts at 0;
 * a stem shorter than the song simply ends early. This function is the one
 * place layout is decided, and it decides: no offsets, ever.
 */
export function planSongTimeline(tracks: StemTrackInput[]): SongTimeline {
  let durationSec = 0;
  for (const t of tracks) durationSec = Math.max(durationSec, t.durationSec);
  return {
    durationSec,
    tracks: tracks.map((t) => ({
      stem: t.stem,
      offsetSec: 0,
      durationSec: t.durationSec,
      firstNonSilentSample: t.firstNonSilentSample,
      firstSoundSec: t.sampleRate > 0 ? t.firstNonSilentSample / t.sampleRate : 0,
    })),
  };
}

/* ------------------------------------------------------------------ */
/* Mix state and presets.                                              */
/* ------------------------------------------------------------------ */

export type StemMix = {
  gains: Record<StemId, number>;
  muted: Record<StemId, boolean>;
  soloed: Record<StemId, boolean>;
  master: number;
};

export function emptyStemMix(): StemMix {
  const gains = {} as Record<StemId, number>;
  const muted = {} as Record<StemId, boolean>;
  const soloed = {} as Record<StemId, boolean>;
  for (const id of STEM_IDS) {
    gains[id] = 1;
    muted[id] = false;
    soloed[id] = false;
  }
  return { gains, muted, soloed, master: 1 };
}

/**
 * The gain a stem actually plays at. Solo wins over everything: when any
 * stem is soloed, only soloed (and unmuted) stems sound.
 */
export function effectiveStemGain(mix: StemMix, stem: StemId): number {
  if (mix.muted[stem]) return 0;
  const anySolo = STEM_IDS.some((id) => mix.soloed[id]);
  if (anySolo && !mix.soloed[stem]) return 0;
  return mix.gains[stem];
}

export type StemPreset = { id: string; label: string; mix: StemMix };

function presetMix(patch: (mix: StemMix) => void): StemMix {
  const mix = emptyStemMix();
  patch(mix);
  return mix;
}

function minusPreset(stem: StemId): StemPreset {
  return {
    id: `minus-${stem}`,
    label: `Minus ${STEM_DEFS[stem].label.toLowerCase()}`,
    mix: presetMix((m) => {
      m.muted[stem] = true;
    }),
  };
}

export const STEM_PRESETS: StemPreset[] = [
  { id: "full", label: "Full mix", mix: emptyStemMix() },
  minusPreset("guitar"),
  minusPreset("bass"),
  minusPreset("drums"),
  minusPreset("vocals"),
  minusPreset("piano"),
  {
    id: "band-only",
    label: "Band only",
    mix: presetMix((m) => {
      m.muted.vocals = true;
    }),
  },
  {
    id: "vocals-only",
    label: "Vocals only",
    mix: presetMix((m) => {
      m.soloed.vocals = true;
    }),
  },
];

export function stemPresetById(id: string): StemPreset | null {
  return STEM_PRESETS.find((p) => p.id === id) ?? null;
}

/* ------------------------------------------------------------------ */
/* Per-song custom-mix persistence.                                    */
/* ------------------------------------------------------------------ */

export const STEM_MIX_STORAGE_PREFIX = "sparksuite.stems.v1:";

/**
 * A song is identified by the names and decoded durations of its stems —
 * the same set dropped again later finds its saved mix.
 */
export function songKeyFor(parts: { name: string; durationSec: number }[]): string {
  const body = [...parts]
    .sort((a, b) => a.name.localeCompare(b.name))
    .map((p) => `${p.name}@${p.durationSec.toFixed(2)}`)
    .join("|");
  return `${STEM_MIX_STORAGE_PREFIX}${body}`;
}

export function serializeStemMix(mix: StemMix): string {
  return JSON.stringify({ v: 1, mix });
}

function isFiniteNumber(v: unknown): v is number {
  return typeof v === "number" && Number.isFinite(v);
}

function clampGain(v: number): number {
  return Math.min(1.5, Math.max(0, v));
}

/** Parse a stored mix, returning null for anything that is not one. */
export function parseStemMix(text: string | null): StemMix | null {
  if (!text) return null;
  try {
    const data = JSON.parse(text) as { v?: unknown; mix?: Partial<StemMix> };
    if (data.v !== 1 || !data.mix) return null;
    const raw = data.mix;
    const mix = emptyStemMix();
    if (raw.gains) {
      for (const id of STEM_IDS) {
        const g = (raw.gains as Record<string, unknown>)[id];
        if (isFiniteNumber(g)) mix.gains[id] = clampGain(g);
      }
    }
    if (raw.muted) {
      for (const id of STEM_IDS) {
        mix.muted[id] = (raw.muted as Record<string, unknown>)[id] === true;
      }
    }
    if (raw.soloed) {
      for (const id of STEM_IDS) {
        mix.soloed[id] = (raw.soloed as Record<string, unknown>)[id] === true;
      }
    }
    if (isFiniteNumber(raw.master)) mix.master = clampGain(raw.master);
    return mix;
  } catch {
    return null;
  }
}

export type StemMixStorage = {
  getItem: (key: string) => string | null;
  setItem: (key: string, value: string) => void;
};

function defaultStorage(): StemMixStorage | null {
  try {
    return typeof localStorage !== "undefined" ? localStorage : null;
  } catch {
    return null;
  }
}

export function loadStemMix(key: string, storage: StemMixStorage | null = defaultStorage()): StemMix | null {
  if (!storage) return null;
  try {
    return parseStemMix(storage.getItem(key));
  } catch {
    return null;
  }
}

export function saveStemMix(key: string, mix: StemMix, storage: StemMixStorage | null = defaultStorage()): void {
  if (!storage) return;
  try {
    storage.setItem(key, serializeStemMix(mix));
  } catch {
    /* Storage full or blocked: the mix simply does not persist. */
  }
}

/** mm:ss for transport readouts. */
export function formatStemTime(sec: number): string {
  const total = Math.max(0, Math.floor(sec));
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}
