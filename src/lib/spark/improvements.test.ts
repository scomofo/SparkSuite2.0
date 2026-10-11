import test from "node:test";
import assert from "node:assert/strict";
import { analyserSizeFor, nearestString } from "./tuner.ts";
import { diatonicChords, scalePcs, pcOf } from "./theory.ts";

test("analyserSizeFor returns appropriate FFT sizes", () => {
  assert.equal(analyserSizeFor(41.2), 4096); // Low E on bass (2 * 48000 / 4096 = 23.4 Hz < 32.96 Hz)
  assert.equal(analyserSizeFor(82.4), 2048); // Low E on guitar
  assert.equal(analyserSizeFor(261.63), 2048); // Middle C
});

test("nearestString correctly identifies target note and cents", () => {
  const freqs = [82.41, 110.0, 146.83, 196.0, 246.94, 329.63];
  const names = ["E2", "A2", "D3", "G3", "B3", "E4"];

  const resInTune = nearestString(110.0, freqs, names);
  assert.equal(resInTune.name, "A2");
  assert.equal(Math.abs(resInTune.cents), 0);

  const resSharp = nearestString(112.0, freqs, names);
  assert.equal(resSharp.name, "A2");
  assert.ok(resSharp.cents > 0);
});

test("scalePcs returns 7 pitch classes for major and minor scales", () => {
  const cPc = pcOf("C");
  const cMajor = scalePcs(cPc, "major");
  assert.equal(cMajor.length, 7);
  assert.deepEqual(cMajor, [0, 2, 4, 5, 7, 9, 11]);

  const aPc = pcOf("A");
  const aMinor = scalePcs(aPc, "minor");
  assert.equal(aMinor.length, 7);
  assert.deepEqual(aMinor, [9, 11, 0, 2, 4, 5, 7]);
});

test("diatonicChords returns 7 chords for major scale", () => {
  const cPc = pcOf("C");
  const chords = diatonicChords(cPc, "major", false, false);
  assert.equal(chords.length, 7);
  assert.equal(chords[0].roman, "I");
  assert.equal(chords[0].quality, "maj");
  assert.equal(chords[4].roman, "V");
  assert.equal(chords[4].quality, "maj");
});
