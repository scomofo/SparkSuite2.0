import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  consumeHit,
  judgeHit,
  starsFor,
  summarizeItem,
  type NoteEvent,
} from "./practice.ts";
import { chordsFromCreatePick } from "./nafme.ts";
import { prefersFlats } from "./theory.ts";
import { defaultProgress } from "./storage.ts";
import { finalizeSession } from "./progress.ts";
import { closeSession, skipItem, startSession } from "./session.ts";
import type { DailyPlan } from "./types.ts";

describe("practice scoring thresholds", () => {
  it("stars step at 0.4 / 0.7 / 0.9", () => {
    assert.equal(starsFor(0.95), 3);
    assert.equal(starsFor(0.7), 2);
    assert.equal(starsFor(0.4), 1);
    assert.equal(starsFor(0.39), 0);
  });

  it("empty item summarizes to zero, not NaN", () => {
    const r = summarizeItem(
      { id: "x", lessonId: "l", type: "song", title: "t", subtitle: "", durationSec: 1, chords: [], pattern: "D", bars: 1, bpm: 60 } as never,
      0,
      0,
    );
    assert.equal(r.accuracy, 0);
    assert.equal(r.stars, 0);
    assert.equal(r.xp, 0);
  });

  it("judgeHit respects perfect/good/ok windows", () => {
    assert.equal(judgeHit(10), "perfect");
    assert.equal(judgeHit(100), "good");
    assert.equal(judgeHit(200), "ok");
    assert.equal(judgeHit(500), "miss");
  });

  it("consumeHit matches nearest note inside the window only", () => {
    const notes: NoteEvent[] = [
      { t: 1, kind: "down", bar: 0, beat: 0 },
      { t: 2, kind: "down", bar: 0, beat: 1 },
    ];
    const hit = consumeHit(notes, 1.05, 230);
    assert.equal(hit.hit, true);
    const miss = consumeHit(notes, 5, 230);
    assert.equal(miss.hit, false);
  });
});

describe("create-pick parsing", () => {
  it("splits en-dash and hyphen forms", () => {
    assert.deepEqual(chordsFromCreatePick("C–G", ["C"]), ["C", "G"]);
    assert.deepEqual(chordsFromCreatePick("C-G", ["C"]), ["C", "G"]);
    assert.deepEqual(chordsFromCreatePick("C", ["G"]), ["C"]);
  });

  it("falls back for free-text picks", () => {
    assert.deepEqual(chordsFromCreatePick("Kick on one", ["K"]), ["K"]);
  });
});

describe("theory spelling", () => {
  it("prefers flats for flat keys, sharps for C", () => {
    assert.equal(prefersFlats(5, "major"), true);
    assert.equal(prefersFlats(0, "major"), false);
  });
});

describe("empty sessions do not complete the day", () => {
  it("finalizeSession with no items leaves progress untouched", () => {
    const before = defaultProgress();
    const next = finalizeSession(
      before,
      { date: "2026-01-01", accuracy: 0, stars: 0, xp: 0, items: [] },
      "guitar",
    );
    assert.deepEqual(next.dailyComplete, {});
    assert.equal(next.streak, 0);
    assert.equal(next.history.length, 0);
  });

  it("skipping every item yields no dailyComplete", () => {
    const plan: DailyPlan = {
      date: "2026-01-01",
      minutes: 10,
      promise: "p",
      items: [
        { id: "a", type: "song", title: "a", subtitle: "", durationSec: 10, lessonId: "lesson_guitar_em_chord_01", chords: ["Em"], pattern: "D", bars: 4, bpm: 70 },
      ],
    };
    let s = startSession(defaultProgress(), plan);
    s = skipItem(s);
    const { progress, result } = closeSession(defaultProgress(), s, "guitar");
    assert.equal(result.items.length, 0);
    assert.deepEqual(progress.dailyComplete, {});
  });
});
