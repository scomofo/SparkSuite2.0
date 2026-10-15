import { midiToFreq } from "./instruments.ts";

/**
 * Judging for bespoke daily vocals cues (instrument-patterns.ts
 * VOCAL_DAILY_CUES). The lab's PitchMatch needle already uses this rule —
 * |cents| < 20 against the target — and the daily path now uses the same
 * standard on the tracker's UNROUNDED frequency, so an octave error or a
 * quarter-tone miss fails instead of rounding into a pass.
 */
export const VOCAL_CENTS_TOLERANCE = 20;

/** Signed distance from the expected note, in cents. NaN for unusable input. */
export function centsFromExpected(frequencyHz: number, expectedMidi: number): number {
  if (!Number.isFinite(frequencyHz) || frequencyHz <= 0) return Number.NaN;
  return 1200 * Math.log2(frequencyHz / midiToFreq(expectedMidi));
}

export function pitchWithinTolerance(
  frequencyHz: number,
  expectedMidi: number,
  toleranceCents: number = VOCAL_CENTS_TOLERANCE,
): boolean {
  const cents = centsFromExpected(frequencyHz, expectedMidi);
  return Number.isFinite(cents) && Math.abs(cents) <= toleranceCents;
}

/**
 * Accumulates one hold cue's verdict from the pitch tracker's samples.
 *
 * The judged span runs from `startMs` to `endMs` (the caller shaves a short
 * attack grace off the front and a frame off the back). The tracker reports
 * at its own throttled cadence (~50 ms); silence produces no sample at all.
 * The hold passes when BOTH:
 *   - at least half the samples inside the span are within
 *     VOCAL_CENTS_TOLERANCE of the target, and
 *   - an in-tune sample lands in the final quarter of the span — the singer
 *     was still holding the pitch near the end, not just at the start.
 * So a hold sustained for the full window passes, one dropped halfway fails
 * on the second condition however clean it started, and a mostly-off-pitch
 * hold fails on the first. No samples at all (silence) fails.
 */
export class VocalHoldJudge {
  readonly expectedMidi: number;
  readonly startMs: number;
  readonly endMs: number;
  private sampleCount = 0;
  private inTuneCount = 0;
  private lastInTuneMs = Number.NEGATIVE_INFINITY;

  constructor(expectedMidi: number, startMs: number, endMs: number) {
    this.expectedMidi = expectedMidi;
    this.startMs = startMs;
    this.endMs = endMs;
  }

  observe(nowMs: number, frequencyHz: number | null): void {
    if (nowMs < this.startMs || nowMs > this.endMs) return;
    if (frequencyHz === null || !Number.isFinite(frequencyHz) || frequencyHz <= 0) return;
    this.sampleCount++;
    if (pitchWithinTolerance(frequencyHz, this.expectedMidi)) {
      this.inTuneCount++;
      this.lastInTuneMs = nowMs;
    }
  }

  get samples(): number {
    return this.sampleCount;
  }

  get inTuneSamples(): number {
    return this.inTuneCount;
  }

  passes(): boolean {
    if (this.sampleCount === 0) return false;
    const finalQuarterStart = this.startMs + (this.endMs - this.startMs) * 0.75;
    return this.inTuneCount * 2 >= this.sampleCount && this.lastInTuneMs >= finalQuarterStart;
  }
}
