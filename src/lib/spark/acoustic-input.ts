import { rmsLevel } from "./strum-detection.ts";
import { yinPitchFast } from "./tuner.ts";

export type AcousticInputMode = "strum" | "pitch" | "percussion" | "attack";

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

export type PercussionOnset = {
  onsetMs: number;
  /** 0 = low-frequency kick-like hit, 1 = brighter snare-like hit. */
  padIndex: 0 | 1;
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

/**
 * Percussion onset detection uses a short attack and spectrum brightness.
 * This is a practical kick-vs-snare heuristic, not a substitute for a drum
 * trigger or a trained drum classifier.
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

    let weightedPower = 0;
    let totalPower = 0;
    const binHz = sampleRate / fftSize;
    for (let i = 1; i < spectrumDb.length; i++) {
      const db = spectrumDb[i];
      if (!Number.isFinite(db) || db <= -100) continue;
      const power = 10 ** (Math.max(-120, Math.min(0, db)) / 10);
      weightedPower += i * binHz * power;
      totalPower += power;
    }
    if (totalPower <= 0) return null;

    this.lastEventMs = nowMs;
    const centroidHz = weightedPower / totalPower;
    return {
      onsetMs: nowMs - (chunkSize / sampleRate) * 500,
      padIndex: centroidHz < 900 ? 0 : 1,
      level: rmsLevel(samples),
    };
  }

  reset() {
    this.lastEventMs = Number.NEGATIVE_INFINITY;
  }
}

