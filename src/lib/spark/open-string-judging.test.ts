import assert from "node:assert/strict";
import test from "node:test";
import { matchesOpenStringTarget } from "./open-string-judging.ts";

test("ukulele high G only matches its target and not adjacent A string", () => {
  assert.equal(matchesOpenStringTarget(392, 392), true);
  assert.equal(matchesOpenStringTarget(440, 392), false);
  assert.equal(matchesOpenStringTarget(392, 440), false);
});
test("ukulele C and E string pitches are distinguished", () => {
  assert.equal(matchesOpenStringTarget(261.63, 261.63), true);
  assert.equal(matchesOpenStringTarget(329.63, 261.63), false);
});
test("small tuning deviation passes but semitone and invalid inputs fail", () => {
  assert.equal(matchesOpenStringTarget(392 * 2 ** (40 / 1200), 392), true);
  assert.equal(matchesOpenStringTarget(392 * 2 ** (100 / 1200), 392), false);
  assert.equal(matchesOpenStringTarget(0, 392), false);
  assert.equal(matchesOpenStringTarget(Number.NaN, 392), false);
  assert.equal(matchesOpenStringTarget(392, undefined), false);
});
