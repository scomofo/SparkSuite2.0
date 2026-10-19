import assert from "node:assert/strict";
import test from "node:test";
import { defaultProgress } from "./storage.ts";
import { completeItem, recordHit, recordMiss, resumeOrStartSession, skipItem } from "./session.ts";
import type { DailyPlan } from "./types.ts";

const item = (id: string) => ({
  id,
  type: "song" as const,
  title: id,
  subtitle: "",
  durationSec: 10,
  lessonId: "lesson_guitar_em_chord_01",
  chords: ["Em"],
  pattern: "D",
  bars: 4,
  bpm: 70,
});

const plan = (date: string): DailyPlan => ({
  date,
  minutes: 5,
  promise: "Practice",
  items: [item("first"), item("second")],
});

test("repeated Start/Resume preserves an active attempt and its combo", () => {
  const progress = defaultProgress();
  const today = plan("2026-10-18");
  const started = resumeOrStartSession(progress, today, null);
  const active = recordMiss(recordHit(recordHit(started)));
  assert.equal(active.itemHits, 2);
  assert.equal(active.itemMisses, 1);
  const resumed = resumeOrStartSession(progress, today, active);
  assert.strictEqual(resumed, active);
  assert.equal(resumed.peakCombo, 2);
  assert.equal(resumed.itemHits, 2);
  assert.equal(resumed.itemMisses, 1);
});

test("repeat launch never loses completed items or advances the cursor", () => {
  const progress = defaultProgress();
  const today = plan("2026-10-18");
  const completed = completeItem(recordHit(resumeOrStartSession(progress, today, null)));
  const resumed = resumeOrStartSession(progress, today, completed);
  assert.strictEqual(resumed, completed);
  assert.equal(resumed.index, 1);
  assert.equal(resumed.results.length, 1);
  assert.equal(resumed.results[0].itemId, "first");
});

test("a new day starts a fresh loop without carrying previous hits", () => {
  const progress = defaultProgress();
  const active = recordHit(resumeOrStartSession(progress, plan("2026-10-18"), null));
  const next = resumeOrStartSession(progress, plan("2026-10-19"), active);
  assert.notStrictEqual(next, active);
  assert.equal(next.plan.date, "2026-10-19");
  assert.equal(next.index, 0);
  assert.equal(next.itemHits, 0);
  assert.deepEqual(next.results, []);
});

test("skipped items do not become scored results on resume", () => {
  const progress = defaultProgress();
  const today = plan("2026-10-18");
  const skipped = skipItem(resumeOrStartSession(progress, today, null));
  const resumed = resumeOrStartSession(progress, today, skipped);
  assert.equal(resumed.index, 1);
  assert.deepEqual(resumed.results, []);
});
