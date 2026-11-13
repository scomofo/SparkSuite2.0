import test from "node:test";
import assert from "node:assert/strict";
import {
  dayGap,
  nextStreak,
  reentryCue,
  STREAK_GRACE_DAYS,
  streakTone,
} from "./psychology.ts";
import { defaultProgress } from "./storage.ts";
import type { ProgressState } from "./types.ts";

function playedOn(date: string, streak = 6): ProgressState {
  return {
    ...defaultProgress(),
    lastPlayedDay: date,
    streak,
    history: [{ date, accuracy: 0.8, xp: 50 }],
  };
}

test("dayGap counts calendar days between local day keys", () => {
  assert.equal(dayGap("2026-09-01", "2026-09-02"), 1);
  assert.equal(dayGap("2026-09-01", "2026-09-08"), 7);
  assert.equal(dayGap(null, "2026-09-08"), Number.POSITIVE_INFINITY);
});

test("nextStreak holds the streak inside the grace window and resets past it", () => {
  const held = nextStreak(playedOn("2026-09-05", 6), "2026-09-0" + (5 + 1 + STREAK_GRACE_DAYS));
  assert.equal(held, 6);
  const lapsed = nextStreak(playedOn("2026-09-01", 6), "2026-09-08");
  assert.equal(lapsed, 1);
  assert.equal(streakTone(playedOn("2026-09-01"), "2026-09-08"), "fresh");
});

test("reentryCue names the return after a lapse", () => {
  const cue = reentryCue(playedOn("2026-09-01"), "2026-09-08");
  assert.ok(cue);
  assert.match(cue!, /Welcome back/);
  assert.match(cue!, /Nothing to catch up/);
});

test("reentryCue stays silent within the grace window and for new learners", () => {
  assert.equal(reentryCue(playedOn("2026-09-05"), "2026-09-08"), null); // gap 3, streak held
  assert.equal(reentryCue(playedOn("2026-09-07"), "2026-09-08"), null); // gap 1, live
  assert.equal(reentryCue(defaultProgress(), "2026-09-08"), null); // never played
  const noHistory = { ...defaultProgress(), lastPlayedDay: "2026-09-01", streak: 6 };
  assert.equal(reentryCue(noHistory, "2026-09-08"), null); // nothing to return to
});
