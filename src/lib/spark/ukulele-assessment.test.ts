import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { assessChordPitches, type ChordSpectrumAnalysis } from "./acoustic-input.ts";
import { instrumentById, UKE_CHORDS } from "./instruments.ts";
import {
  StrumOnsetDetector,
  supportsSpectralStrumDirection,
  UKULELE_STRUM_SETTLE_MS,
} from "./strum-detection.ts";

const ukulele = instrumentById("ukulele");
const openMidi = ukulele.openFreq.map((hz) => Math.round(69 + 12 * Math.log2(hz / 440)));
const voicing = (id: string) =>
  UKE_CHORDS[id].frets.flatMap((fret, index) => (fret === null ? [] : [openMidi[index] + fret]));
const analysis = (midiNotes: number[]): ChordSpectrumAnalysis => ({
  midiNotes,
  confidence: 0.8,
  strongestDb: -24,
});

describe("ukulele chord evidence", () => {
  for (const id of Object.keys(UKE_CHORDS)) {
    it(`recognizes ${id} without demanding separate peaks for unison strings`, () => {
      const expected = voicing(id);
      const distinct = [...new Set(expected)];
      const result = assessChordPitches(analysis(distinct), expected);
      assert.equal(result.status, "match");
      assert.equal(result.expectedNotes, distinct.length);
      assert.equal(result.matchedNotes, distinct.length);
      assert.deepEqual(result.missingMidi, []);
    });
  }

  it("does not certify an adjacent semitone or an unrelated extra pitch", () => {
    const c = voicing("C");
    assert.equal(assessChordPitches(analysis(c.map((midi) => midi + 1)), c).status, "mismatch");
    assert.equal(assessChordPitches(analysis([...c, 66]), c).status, "mismatch");
    assert.equal(assessChordPitches(analysis(voicing("Am")), c).status, "mismatch");
  });

  it("does not treat a masked string as proof of a wrong chord", () => {
    const result = assessChordPitches(analysis([60, 64]), voicing("Am"));
    assert.equal(result.status, "uncertain");
    assert.equal(result.coverage, 2 / 3);
    assert.deepEqual(result.missingMidi, [69]);
  });

  it("leaves one string, weak input, and harmonic-only evidence unverified", () => {
    assert.equal(assessChordPitches(analysis([60]), voicing("C")).status, "uncertain");
    assert.equal(
      assessChordPitches({ ...analysis([60, 64, 69]), confidence: 0.2 }, voicing("Am")).status,
      "uncertain",
    );
    assert.equal(assessChordPitches(analysis([60, 72, 79]), voicing("C")).status, "uncertain");
  });

  it("does not penalize reinforced upper partials as extra fretted notes", () => {
    assert.equal(assessChordPitches(analysis([60, 64, 67, 72, 84]), voicing("C")).status, "match");
    assert.equal(assessChordPitches(analysis([62, 67, 71, 79]), voicing("G")).status, "match");
  });

  it("does not claim spectral stroke direction for high-G or other re-entrant tunings", () => {
    assert.equal(supportsSpectralStrumDirection(ukulele.openFreq), false);
    assert.equal(supportsSpectralStrumDirection(instrumentById("banjo").openFreq), false);
    assert.equal(supportsSpectralStrumDirection(instrumentById("guitar").openFreq), true);
    assert.equal(supportsSpectralStrumDirection(instrumentById("mandolin").openFreq), true);
  });
});

describe("settled ukulele attacks", () => {
  const sampleRate = 48000;
  const fftSize = 8192;
  const spectrum = new Float32Array(fftSize / 2).fill(-110);
  for (const hz of [261.63, 329.63, 392, 523.25]) {
    const bin = Math.round((hz * fftSize) / sampleRate);
    spectrum[bin] = -24;
    // A half-bin peak has two almost-equal neighbours in a real windowed FFT.
    spectrum[bin + 1] = -24.1;
  }
  const silence = new Float32Array(fftSize);
  const attack = new Float32Array(fftSize);
  for (let i = fftSize - 512; i < fftSize; i++)
    attack[i] = 0.03 * Math.sin((2 * Math.PI * 392 * i) / sampleRate);

  it("waits for the spectrum without shifting rhythm timing or losing the next attack", () => {
    const detector = new StrumOnsetDetector({ settleMs: UKULELE_STRUM_SETTLE_MS });
    assert.equal(detector.process(silence, spectrum, sampleRate, fftSize, 80), null);
    assert.equal(detector.process(attack, spectrum, sampleRate, fftSize, 100), null);
    assert.equal(detector.process(attack, spectrum, sampleRate, fftSize, 132), null);
    assert.equal(detector.process(silence, spectrum, sampleRate, fftSize, 240), null);
    const first = detector.process(silence, spectrum, sampleRate, fftSize, 260);
    assert.ok(first);
    assert.ok(first.onsetMs > 90 && first.onsetMs < 100);
    detector.process(attack, spectrum, sampleRate, fftSize, 300);
    detector.process(attack, spectrum, sampleRate, fftSize, 332);
    const second = detector.process(silence, spectrum, sampleRate, fftSize, 460);
    assert.ok(second);
    assert.equal(second.onsetMs - first.onsetMs, 200);
  });

  it("clears buffered evidence when the exercise resets", () => {
    const detector = new StrumOnsetDetector({ settleMs: UKULELE_STRUM_SETTLE_MS });
    detector.process(attack, spectrum, sampleRate, fftSize, 100);
    detector.process(attack, spectrum, sampleRate, fftSize, 132);
    detector.reset();
    assert.equal(detector.process(silence, spectrum, sampleRate, fftSize, 400), null);
  });
});
