import assert from "node:assert/strict";
import test from "node:test";
import { buildTimeline } from "./practice.ts";
import { matchesOpenStringTarget } from "./open-string-judging.ts";
import type { PlanItem } from "./types.ts";

test("introductory ukulele warmup follows G C E A, repeated", () => {
  const item: PlanItem = {
    id: "uke-open", lessonId: "lesson_uke_open_01", type: "warmup",
    title: "Open GCEA", subtitle: "", durationSec: 30, chords: [],
    pattern: "D", bars: 2, bpm: 70, stringCount: 4, surface: "strings",
  };
  const notes = buildTimeline(item);
  assert.deepEqual(notes.slice(0, 8).map((note) => note.string), [0, 1, 2, 3, 0, 1, 2, 3]);
  assert.ok(notes[0].t < notes[1].t);
});

test("steady in-tune pitch matches the scheduled string rather than nearest index", () => {
  const g4 = 392;
  const c4 = 261.63;
  assert.equal(matchesOpenStringTarget(g4, g4), true);
  assert.equal(matchesOpenStringTarget(g4, c4), false);
  assert.equal(matchesOpenStringTarget(c4, c4), true);
});
