import { rmsLevel } from "./strum-detection.ts";
import { yinPitchFast } from "./tuner.ts";

export type AcousticInputMode = "strum" | "pitch" | "percussion" | "attack";

export type ChordSpectrumAnalysis = {
  midiNotes: number[];
  confidence: number;
  strongestDb: number;
};

export type ChordAssessment = {
  status: "match" | "mismatch" | "uncertain";
  coverage: number;
  confidence: number;
  matchedNotes: number;
  expectedNotes: number;
  missingMidi: number[];
};

function powerAtDb(db: number) {
  return 10 ** (Math.max(-120, Math.min(0, db)) / 10);
}

/**
 * Extracts likely fundamentals from a chord spectrum. Peaks explained by a
 * much stronger lower harmonic are discarded, so one loud string is less
 * likely to masquerade as an entire chord.
 */
export function analyzeChordSpectrum(
  spectrumDb: Float32Array,
  sampleRate: number,
  fftSize: number,
): ChordSpectrumAnalysis {
  if (!spectrumDb.length || sampleRate <= 0 || fftSize <= 0) {
    return { midiNotes: [], confidence: 0, strongestDb: -120 };
  }
  const binHz = sampleRate / fftSize;
  const minBin = Math.max(2, Math.floor(65 / binHz));
  const maxBin = Math.min(spectrumDb.length - 2, Math.ceil(1250 / binHz));
  let strongestDb = -120;
  for (let i = minBin; i <= maxBin; i++) {
    if (Number.isFinite(spectrumDb[i])) strongestDb = Math.max(strongestDb, spectrumDb[i]);
  }
  if (strongestDb < -75) return { midiNotes: [], confidence: 0, strongestDb };

  const thresholdDb = Math.max(-72, strongestDb - 30);
  const peaks: { midi: number; hz: number; db: number }[] = [];
  for (let i = minBin + 1; i < maxBin; i++) {
    const left = spectrumDb[i - 1];
    const center = spectrumDb[i];
    const right = spectrumDb[i + 1];
    if (
      !Number.isFinite(center) ||
      center < thresholdDb ||
      center < left + 2 ||
      center < right + 2
    ) continue;
    const denominator = left - 2 * center + right;
    const offset = denominator === 0 ? 0 : Math.max(-0.5, Math.min(0.5, 0.5 * (left - right) / denominator));
    const hz = (i + offset) * binHz;
    if (hz < 65 || hz > 1250) continue;
    const midiFloat = 69 + 12 * Math.log2(hz / 440);
    const midi = Math.round(midiFloat);
    if (Math.abs(midiFloat - midi) * 100 > 65) continue;
    const existing = peaks.find((peak) => peak.midi === midi);
    if (!existing) peaks.push({ midi, hz, db: center });
    else if (center > existing.db) Object.assign(existing, { hz, db: center });
  }

  // Suppress octave and upper partials only when a lower candidate is clearly
  // stronger. Conservative suppression is preferable to falsely certifying a
  // chord from harmonics of one note.
  const independent = peaks.filter((candidate) => !peaks.some((lower) => {
    if (lower.midi >= candidate.midi || lower.db < candidate.db + 8) return false;
    const ratio = candidate.hz / lower.hz;
    const harmonic = Math.round(ratio);
    if (harmonic < 2 || harmonic > 6) return false;
    return Math.abs(1200 * Math.log2(ratio / harmonic)) <= 45;
  }));
  const midiNotes = independent.map((peak) => peak.midi).sort((a, b) => a - b);
  const confidence = midiNotes.length >= 2 ? Math.min(1, 0.55 + (midiNotes.length - 2) * 0.1) : 0;
  return { midiNotes, confidence, strongestDb };
}

/**
 * Grades note coverage only when the spectrum contains enough independent
 * pitches. Weak or ambiguous recordings remain timing-only rather than being
 * mislabeled as a wrong chord.
 */
export function assessChordPitches(
  analysis: ChordSpectrumAnalysis,
  expectedMidi: number[],
): ChordAssessment {
  const expected = expectedMidi.filter((midi) => Number.isInteger(midi) && midi >= 0 && midi <= 127);
  if (expected.length < 2 || analysis.midiNotes.length < 2 || analysis.confidence < 0.35) {
    return {
      status: "uncertain",
      coverage: 0,
      confidence: analysis.confidence,
      matchedNotes: 0,
      expectedNotes: expected.length,
      missingMidi: expected,
    };
  }
  const available = [...analysis.midiNotes];
  const missingMidi: number[] = [];
  let matchedNotes = 0;
  for (const target of expected) {
    const index = available.findIndex((midi) => Math.abs(midi - target) <= 1);
    if (index < 0) missingMidi.push(target);
    else {
      matchedNotes++;
      available.splice(index, 1);
    }
  }
  const coverage = expected.length ? matchedNotes / expected.length : 0;
  // A chord only passes when every expected sounding note is represented.
  // A confident partial chord is a mismatch, not a near-perfect match; weak
  // spectra remain uncertain so room noise or masking is not treated as proof.
  let status: ChordAssessment["status"] = "uncertain";
  if (coverage === 1 && analysis.confidence >= 0.5) status = "match";
  else if (coverage < 1 && analysis.confidence >= 0.5) status = "mismatch";
  return {
    status,
    coverage,
    confidence: analysis.confidence,
    matchedNotes,
    expectedNotes: expected.length,
    missingMidi,
  };
}

export function acousticInputModeFor(input: {
  instrument: string;
  surface: "strings" | "keys" | "pads" | "voice";
  pluckDrill: boolean;
  hasPattern: boolean;
  lessonId?: string;
}): AcousticInputMode {
  if (input.surface === "pads") return "percussion";
  if (input.surface === "voice") return "pitch";
  if (input.instrument === "mandolin" && input.lessonId === "lesson_mandolin_chop_01") return "attack";
  if (input.surface === "keys") return input.pluckDrill ? "pitch" : "strum";
  if (input.surface === "strings") {
    if (
      input.instrument === "bass" ||
      input.instrument === "violin" ||
      input.pluckDrill ||
      input.hasPattern
    ) return "pitch";
    return "strum";
  }
  return "pitch";
}

export type PitchOnset = {
  onsetMs: number;
  frequencyHz: number;
  midi: number;
  level: number;
};

export type PitchSample = {
  frequencyHz: number;
  midi: number;
  level: number;
};

/** Reads a sustained pitch at a throttled rate, useful for voice and held notes. */
export class PitchTracker {
  private readonly minimumLevel: number;
  private lastAnalysisMs = Number.NEGATIVE_INFINITY;

  constructor(minimumLevel = 0.003) {
    this.minimumLevel = minimumLevel;
  }

  process(
    samples: Float32Array,
    sampleRate: number,
    nowMs: number,
    decimate = 2,
    minimumHz = 70,
    maximumHz = 1200,
  ): PitchSample | null {
    if (
      !samples.length ||
      !Number.isFinite(sampleRate) ||
      sampleRate <= 0 ||
      !Number.isFinite(nowMs) ||
      nowMs - this.lastAnalysisMs < 48
    ) return null;
    this.lastAnalysisMs = nowMs;
    const level = rmsLevel(samples);
    if (level < this.minimumLevel) return null;
    const frequencyHz = yinPitchFast(samples, sampleRate, 0.14, decimate);
    if (!Number.isFinite(frequencyHz) || frequencyHz < minimumHz || frequencyHz > maximumHz) return null;
    return { frequencyHz, midi: frequencyToMidi(frequencyHz), level };
  }

  reset() {
    this.lastAnalysisMs = Number.NEGATIVE_INFINITY;
  }
}

export type DrumClass = "kick" | "snare" | "hat" | "tom" | "unknown";

export type DrumClassification = {
  drumClass: DrumClass;
  padIndex: 0 | 1 | 2 | 3 | null;
  confidence: number;
};

export type PercussionOnset = {
  onsetMs: number;
  /** 0 = kick, 1 = snare, 2 = hi-hat/cymbal, 3 = tom. */
  padIndex: 0 | 1 | 2 | 3;
  drumClass: Exclude<DrumClass, "unknown">;
  confidence: number;
  level: number;
};

export function frequencyToMidi(frequencyHz: number): number {
  if (!Number.isFinite(frequencyHz) || frequencyHz <= 0) return -1;
  return Math.round(69 + 12 * Math.log2(frequencyHz / 440));
}

/** Detects a fresh pitched attack while avoiding repeat events for sustained notes. */
export class PitchOnsetDetector {
  private readonly minimumLevel: number;
  private readonly cooldownMs: number;
  private readonly attackRatio: number;
  private lastEventMs = Number.NEGATIVE_INFINITY;
  private lastMidi: number | null = null;
  private lastAnalysisMs = Number.NEGATIVE_INFINITY;

  constructor(options: { minimumLevel?: number; cooldownMs?: number; attackRatio?: number } = {}) {
    this.minimumLevel = options.minimumLevel ?? 0.003;
    this.cooldownMs = options.cooldownMs ?? 135;
    this.attackRatio = options.attackRatio ?? 1.3;
  }

  process(
    samples: Float32Array,
    sampleRate: number,
    nowMs: number,
    decimate = 2,
    minimumHz = 35,
    maximumHz = 1200,
  ): PitchOnset | null {
    if (
      !samples.length ||
      !Number.isFinite(sampleRate) ||
      sampleRate <= 0 ||
      !Number.isFinite(nowMs) ||
      nowMs - this.lastAnalysisMs < 48
    ) return null;
    this.lastAnalysisMs = nowMs;

    const chunkSize = Math.max(64, Math.min(512, Math.floor(samples.length / 4)));
    const tailStart = samples.length - chunkSize;
    const previousStart = tailStart - chunkSize;
    const tailRms = rmsLevel(samples.subarray(tailStart));
    const previousRms = previousStart >= 0
      ? rmsLevel(samples.subarray(previousStart, tailStart))
      : 0;
    const overallRms = rmsLevel(samples);
    const attack = tailRms >= this.minimumLevel &&
      tailRms >= Math.max(this.minimumLevel, previousRms * this.attackRatio);
    if (overallRms < this.minimumLevel * 0.5) this.lastMidi = null;

    // Avoid the quadratic pitch estimate when there is no useful signal.
    if (overallRms < this.minimumLevel) return null;
    const frequencyHz = yinPitchFast(samples, sampleRate, 0.14, decimate);
    if (!Number.isFinite(frequencyHz) || frequencyHz < minimumHz || frequencyHz > maximumHz) {
      return null;
    }

    const midi = frequencyToMidi(frequencyHz);
    const changedPitch = this.lastMidi !== null && midi !== this.lastMidi;
    const firstPitch = this.lastMidi === null;
    this.lastMidi = midi;

    if (
      nowMs - this.lastEventMs < this.cooldownMs ||
      (!attack && !changedPitch && !firstPitch)
    ) return null;

    this.lastEventMs = nowMs;
    // The attack lies in the newest chunk of the rolling analyser window.
    const onsetMs = nowMs - (chunkSize / sampleRate) * 500;
    return { onsetMs, frequencyHz, midi, level: overallRms };
  }

  reset() {
    this.lastEventMs = Number.NEGATIVE_INFINITY;
    this.lastMidi = null;
    this.lastAnalysisMs = Number.NEGATIVE_INFINITY;
  }
}

function spectrumFeatures(spectrumDb: Float32Array, sampleRate: number, fftSize: number) {
  const binHz = sampleRate / fftSize;
  let total = 0;
  let weighted = 0;
  let low = 0;
  let lowMid = 0;
  let mid = 0;
  let high = 0;
  let logPower = 0;
  let flatnessCount = 0;
  let arithmeticPower = 0;
  for (let i = 1; i < spectrumDb.length; i++) {
    const hz = i * binHz;
    if (hz < 35 || hz > 12000) continue;
    const db = spectrumDb[i];
    if (!Number.isFinite(db)) continue;
    const power = powerAtDb(db);
    total += power;
    weighted += hz * power;
    if (hz < 150) low += power;
    else if (hz < 500) lowMid += power;
    else if (hz < 2500) mid += power;
    else high += power;
    if (hz >= 500) {
      const safePower = Math.max(1e-12, power);
      logPower += Math.log(safePower);
      arithmeticPower += safePower;
      flatnessCount++;
    }
  }
  const centroidHz = total > 0 ? weighted / total : 0;
  const ratio = (part: number) => total > 0 ? part / total : 0;
  const flatness = flatnessCount && arithmeticPower > 0
    ? Math.exp(logPower / flatnessCount) / (arithmeticPower / flatnessCount)
    : 0;
  return {
    total,
    centroidHz,
    lowRatio: ratio(low),
    lowMidRatio: ratio(lowMid),
    midRatio: ratio(mid),
    highRatio: ratio(high),
    flatness,
  };
}

/** Multi-feature acoustic classifier; still heuristic, so ambiguous hits are not guessed. */
export function classifyDrumSpectrum(
  spectrumDb: Float32Array,
  sampleRate: number,
  fftSize: number,
): DrumClassification {
  if (!spectrumDb.length || sampleRate <= 0 || fftSize <= 0) {
    return { drumClass: "unknown", padIndex: null, confidence: 0 };
  }
  const strongestDb = spectrumDb.reduce((best, value) => Number.isFinite(value) ? Math.max(best, value) : best, -120);
  if (strongestDb < -85) return { drumClass: "unknown", padIndex: null, confidence: 0 };
  const f = spectrumFeatures(spectrumDb, sampleRate, fftSize);
  if (f.total <= 0) return { drumClass: "unknown", padIndex: null, confidence: 0 };

  const candidates: { drumClass: Exclude<DrumClass, "unknown">; padIndex: 0 | 1 | 2 | 3; confidence: number }[] = [];
  if (f.lowRatio >= 0.42 && f.centroidHz < 320) {
    candidates.push({
      drumClass: "kick",
      padIndex: 0,
      confidence: Math.min(1, 0.52 + Math.max(0, f.lowRatio - 0.42) * 0.8 + Math.max(0, 320 - f.centroidHz) / 900),
    });
  }
  if (f.highRatio >= 0.35 && f.centroidHz > 2200 && f.flatness > 0.08) {
    candidates.push({
      drumClass: "hat",
      padIndex: 2,
      confidence: Math.min(1, 0.48 + f.highRatio * 0.35 + f.flatness * 0.2 + Math.max(0, f.centroidHz - 2200) / 18000),
    });
  }
  if (f.lowMidRatio >= 0.28 && f.centroidHz >= 150 && f.centroidHz < 850 && f.lowRatio < 0.55) {
    candidates.push({
      drumClass: "tom",
      padIndex: 3,
      confidence: Math.min(1, 0.48 + f.lowMidRatio * 0.4 + Math.max(0, 850 - f.centroidHz) / 2400),
    });
  }
  if (f.midRatio + f.highRatio >= 0.48 && f.centroidHz >= 650 && f.centroidHz < 6500 && f.lowRatio < 0.5) {
    candidates.push({
      drumClass: "snare",
      padIndex: 1,
      confidence: Math.min(1, 0.48 + (f.midRatio + f.highRatio) * 0.38 - Math.abs(f.centroidHz - 2200) / 10000),
    });
  }
  candidates.sort((a, b) => b.confidence - a.confidence);
  const best = candidates[0];
  if (!best || best.confidence < 0.58) {
    return { drumClass: "unknown", padIndex: null, confidence: best?.confidence ?? 0 };
  }
  return best;
}

/**
 * Uses a short attack plus low/mid/high spectral shape to distinguish kick,
 * snare, hi-hat/cymbal and tom. Real-room overlap can still be ambiguous; those
 * hits are ignored instead of being confidently mislabeled.
 */
export class PercussionOnsetDetector {
  private readonly minimumLevel: number;
  private readonly cooldownMs: number;
  private readonly attackRatio: number;
  private lastEventMs = Number.NEGATIVE_INFINITY;

  constructor(options: { minimumLevel?: number; cooldownMs?: number; attackRatio?: number } = {}) {
    this.minimumLevel = options.minimumLevel ?? 0.006;
    this.cooldownMs = options.cooldownMs ?? 120;
    this.attackRatio = options.attackRatio ?? 1.45;
  }

  process(
    samples: Float32Array,
    spectrumDb: Float32Array,
    sampleRate: number,
    fftSize: number,
    nowMs: number,
  ): PercussionOnset | null {
    if (!samples.length || !spectrumDb.length || !Number.isFinite(nowMs)) return null;
    const chunkSize = Math.max(64, Math.min(512, Math.floor(samples.length / 4)));
    const tailStart = samples.length - chunkSize;
    const previousStart = tailStart - chunkSize;
    const tailRms = rmsLevel(samples.subarray(tailStart));
    const previousRms = previousStart >= 0
      ? rmsLevel(samples.subarray(previousStart, tailStart))
      : 0;
    if (
      tailRms < this.minimumLevel ||
      tailRms < Math.max(this.minimumLevel, previousRms * this.attackRatio) ||
      nowMs - this.lastEventMs < this.cooldownMs
    ) return null;

    const classification = classifyDrumSpectrum(spectrumDb, sampleRate, fftSize);
    if (classification.padIndex === null || classification.drumClass === "unknown" || classification.confidence < 0.58) return null;

    this.lastEventMs = nowMs;
    return {
      onsetMs: nowMs - (chunkSize / sampleRate) * 500,
      padIndex: classification.padIndex,
      drumClass: classification.drumClass,
      confidence: classification.confidence,
      level: tailRms,
    };
  }

  reset() {
    this.lastEventMs = Number.NEGATIVE_INFINITY;
  }
}

