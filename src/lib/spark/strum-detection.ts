export type StrumOnset = {
  /** The estimated attack time on the same monotonic clock as requestAnimationFrame. */
  onsetMs: number;
  /** RMS level of the detected attack. */
  level: number;
};

export type StrumDetectorOptions = {
  minimumLevel?: number;
  cooldownMs?: number;
  confirmationMs?: number;
  maxConfirmationMs?: number;
  maxFlatness?: number;
};

/** Root-mean-square signal level for one microphone frame. */
export function rmsLevel(samples: Float32Array): number {
  if (!samples.length) return 0;
  let energy = 0;
  for (let i = 0; i < samples.length; i++) energy += samples[i] * samples[i];
  return Math.sqrt(energy / samples.length);
}

/**
 * Spectral flatness is near 1 for broadband noise and lower for pitched,
 * harmonic material. This is only a strum-vs-click gate, not chord recognition.
 */
export function spectralFlatness(
  spectrumDb: Float32Array,
  sampleRate: number,
  fftSize: number,
  lowHz = 100,
  highHz = 2200,
): number {
  if (
    !spectrumDb.length ||
    !Number.isFinite(sampleRate) ||
    sampleRate <= 0 ||
    !Number.isFinite(fftSize) ||
    fftSize <= 0
  ) return 1;

  const binHz = sampleRate / fftSize;
  let powerSum = 0;
  let logPowerSum = 0;
  let count = 0;

  for (let i = 1; i < spectrumDb.length; i++) {
    const hz = i * binHz;
    if (hz < lowHz || hz > highHz) continue;
    const db = spectrumDb[i];
    if (!Number.isFinite(db)) continue;
    const power = 10 ** (Math.max(-120, Math.min(0, db)) / 10);
    powerSum += power;
    logPowerSum += Math.log(Math.max(power, 1e-12));
    count++;
  }

  if (!count || powerSum <= 0) return 1;
  return Math.exp(logPowerSum / count) / (powerSum / count);
}

export function isTonalStrumSpectrum(
  spectrumDb: Float32Array,
  sampleRate: number,
  fftSize: number,
  maxFlatness = 0.7,
): boolean {
  return spectralFlatness(spectrumDb, sampleRate, fftSize) <= maxFlatness;
}

function prominentPeakCount(
  spectrumDb: Float32Array,
  sampleRate: number,
  fftSize: number,
): number {
  const binHz = sampleRate / fftSize;
  const first = Math.max(1, Math.ceil(150 / binHz));
  const last = Math.min(spectrumDb.length - 2, Math.floor(1200 / binHz));
  const levels: number[] = [];
  for (let i = first; i <= last; i++) {
    if (Number.isFinite(spectrumDb[i])) levels.push(spectrumDb[i]);
  }
  if (levels.length < 3) return 0;
  levels.sort((a, b) => a - b);
  const floorDb = levels[Math.floor(levels.length * 0.55)] ?? -100;
  const thresholdDb = Math.max(-78, floorDb + 12);
  let count = 0;
  let lastPeakHz = Number.NEGATIVE_INFINITY;

  for (let i = first + 1; i < last; i++) {
    const db = spectrumDb[i];
    const hz = i * binHz;
    if (
      Number.isFinite(db) &&
      db >= thresholdDb &&
      db >= spectrumDb[i - 1] + 3 &&
      db >= spectrumDb[i + 1] + 3 &&
      hz - lastPeakHz >= 30
    ) {
      count++;
      lastPeakHz = hz;
    }
  }
  return count;
}

/** Rejects the narrow, sustained metronome tone as well as broadband clicks. */
export function isHarmonicStrumSpectrum(
  spectrumDb: Float32Array,
  sampleRate: number,
  fftSize: number,
  maxFlatness = 0.7,
): boolean {
  return (
    isTonalStrumSpectrum(spectrumDb, sampleRate, fftSize, maxFlatness) &&
    prominentPeakCount(spectrumDb, sampleRate, fftSize) >= 2
  );
}

/**
 * Detects acoustic strum attacks from microphone frames. A transient is only
 * accepted when the following frame still contains energy and a reasonably
 * harmonic spectrum, which rejects most clicks and hand claps. The timestamp
 * returned is the original attack time so confirmation latency does not skew
 * rhythm scoring.
 */
export class StrumOnsetDetector {
  private readonly options: Required<StrumDetectorOptions>;
  private noiseFloor = 0.001;
  private previousRms = 0;
  private lastDetectedMs = Number.NEGATIVE_INFINITY;
  private pending: { onsetMs: number; peakRms: number } | null = null;

  constructor(options: StrumDetectorOptions = {}) {
    this.options = {
      minimumLevel: options.minimumLevel ?? 0.008,
      cooldownMs: options.cooldownMs ?? 140,
      confirmationMs: options.confirmationMs ?? 28,
      maxConfirmationMs: options.maxConfirmationMs ?? 112,
      maxFlatness: options.maxFlatness ?? 0.7,
    };
  }

  process(
    samples: Float32Array,
    spectrumDb: Float32Array,
    sampleRate: number,
    fftSize: number,
    nowMs: number,
  ): StrumOnset | null {
    if (!Number.isFinite(nowMs) || !samples.length) return null;

    const level = rmsLevel(samples);
    let detected: StrumOnset | null = null;

    if (this.pending) {
      this.pending.peakRms = Math.max(this.pending.peakRms, level);
      const age = nowMs - this.pending.onsetMs;
      if (age >= this.options.confirmationMs) {
        const sustained = level >= Math.max(
          this.options.minimumLevel * 0.35,
          this.pending.peakRms * 0.12,
        );
        if (
          sustained &&
          isHarmonicStrumSpectrum(
            spectrumDb,
            sampleRate,
            fftSize,
            this.options.maxFlatness,
          )
        ) {
          detected = { onsetMs: this.pending.onsetMs, level: this.pending.peakRms };
          this.lastDetectedMs = nowMs;
        }
        if (detected || age >= this.options.maxConfirmationMs) this.pending = null;
      }
    } else {
      const threshold = Math.max(
        this.options.minimumLevel,
        this.noiseFloor * 2.6,
        this.previousRms * 1.3,
      );
      if (
        level >= threshold &&
        nowMs - this.lastDetectedMs >= this.options.cooldownMs
      ) {
        this.pending = { onsetMs: nowMs, peakRms: level };
      } else if (
        level < Math.max(this.options.minimumLevel * 0.75, this.noiseFloor * 3)
      ) {
        this.noiseFloor = Math.max(0.0004, this.noiseFloor * 0.96 + level * 0.04);
      }
    }

    this.previousRms = level;
    return detected;
  }

  reset() {
    this.noiseFloor = 0.001;
    this.previousRms = 0;
    this.lastDetectedMs = Number.NEGATIVE_INFINITY;
    this.pending = null;
  }
}


export type StrumDirection = "down" | "up" | "unknown";

export type StrumDirectionEstimate = {
  direction: StrumDirection;
  confidence: number;
  leadMs: number;
};

/** Pure direction decision: downstrokes usually excite lower strings first. */
export function classifyStrumDirection(
  lowOnsetMs: number | null,
  highOnsetMs: number | null,
  minimumLeadMs = 18,
): StrumDirectionEstimate {
  if (lowOnsetMs === null || highOnsetMs === null) {
    return { direction: "unknown", confidence: 0, leadMs: 0 };
  }
  const leadMs = highOnsetMs - lowOnsetMs;
  if (Math.abs(leadMs) < minimumLeadMs) {
    return { direction: "unknown", confidence: 0, leadMs };
  }
  return {
    direction: leadMs > 0 ? "down" : "up",
    confidence: Math.max(0, Math.min(1, (Math.abs(leadMs) - 12) / 36)),
    leadMs,
  };
}

type DirectionFrame = { at: number; lowDb: number; highDb: number };

function bandLevelDb(
  spectrumDb: Float32Array,
  sampleRate: number,
  fftSize: number,
  minHz: number,
  maxHz: number,
): number {
  if (!spectrumDb.length || sampleRate <= 0 || fftSize <= 0) return -120;
  const binHz = sampleRate / fftSize;
  const start = Math.max(1, Math.floor(minHz / binHz));
  const end = Math.min(spectrumDb.length - 1, Math.ceil(maxHz / binHz));
  let power = 0;
  let count = 0;
  for (let i = start; i <= end; i++) {
    const db = spectrumDb[i];
    if (!Number.isFinite(db)) continue;
    power += 10 ** (Math.max(-120, Math.min(0, db)) / 10);
    count++;
  }
  return count ? 10 * Math.log10(power / count) : -120;
}

/**
 * Estimates stroke direction from the order of low- and high-frequency attack
 * energy. A single microphone cannot always resolve this, so weak/ambiguous
 * estimates deliberately return "unknown" instead of inventing a direction.
 */
export class StrumDirectionDetector {
  private frames: DirectionFrame[] = [];

  process(
    spectrumDb: Float32Array,
    sampleRate: number,
    fftSize: number,
    nowMs: number,
  ) {
    if (!Number.isFinite(nowMs) || !spectrumDb.length) return;
    this.frames.push({
      at: nowMs,
      lowDb: bandLevelDb(spectrumDb, sampleRate, fftSize, 75, 420),
      highDb: bandLevelDb(spectrumDb, sampleRate, fftSize, 420, 2600),
    });
    this.frames = this.frames.filter((frame) => nowMs - frame.at <= 220);
  }

  classify(onsetMs: number): StrumDirectionEstimate {
    const before = this.frames.filter((frame) => frame.at >= onsetMs - 55 && frame.at < onsetMs - 5);
    const during = this.frames.filter((frame) => frame.at >= onsetMs - 5 && frame.at <= onsetMs + 100);
    if (before.length < 2 || during.length < 2) {
      return { direction: "unknown", confidence: 0, leadMs: 0 };
    }

    const lowBase = Math.min(...before.map((frame) => frame.lowDb));
    const highBase = Math.min(...before.map((frame) => frame.highDb));
    const lowThreshold = Math.max(-58, lowBase + 7);
    const highThreshold = Math.max(-58, highBase + 7);
    const lowFirst = during.find((frame) => frame.lowDb >= lowThreshold)?.at ?? null;
    const highFirst = during.find((frame) => frame.highDb >= highThreshold)?.at ?? null;
    return classifyStrumDirection(lowFirst, highFirst);
  }

  reset() {
    this.frames = [];
  }
}
