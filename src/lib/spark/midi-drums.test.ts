import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { gmNoteToPad } from "./midi-drums.ts";

describe("gmNoteToPad", () => {
  it("maps the kick, snare, hat, and tom voices", () => {
    assert.equal(gmNoteToPad(36), 0); // Bass Drum 1
    assert.equal(gmNoteToPad(38), 1); // Acoustic Snare
    assert.equal(gmNoteToPad(42), 2); // Closed Hi-Hat
    assert.equal(gmNoteToPad(45), 3); // Low Tom
  });

  it("maps kit variations onto the same pads", () => {
    assert.equal(gmNoteToPad(40), 1); // Electric Snare / rim
    assert.equal(gmNoteToPad(44), 2); // Pedal Hi-Hat
    assert.equal(gmNoteToPad(46), 2); // Open Hi-Hat
    for (const tom of [41, 43, 45, 47, 48, 50]) assert.equal(gmNoteToPad(tom), 3);
  });

  it("lands crash and ride on the hat pad, the kit's only cymbal voice", () => {
    assert.equal(gmNoteToPad(49), 2); // Crash Cymbal 1
    assert.equal(gmNoteToPad(51), 2); // Ride Cymbal 1
  });

  it("returns null for notes outside the drum map", () => {
    assert.equal(gmNoteToPad(35), null); // Acoustic Bass Drum sits below our kick
    assert.equal(gmNoteToPad(60), null); // Middle C
    assert.equal(gmNoteToPad(0), null);
    assert.equal(gmNoteToPad(37), null); // Side Stick — not mapped
    assert.equal(gmNoteToPad(39), null); // Hand Clap — not mapped
    assert.equal(gmNoteToPad(127), null);
  });
});
