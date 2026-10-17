import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { buildTimeline, consumeHit, countInBeats, patternEndSec } from "./practice.ts";
import { dailyInstrumentCues, drumDailyPattern } from "./instrument-patterns.ts";
import { generateDailyPlan } from "./daily-plan.ts";
import { defaultProgress } from "./storage.ts";
import {
  instrumentById,
  lessonsFor,
  withSurface,
  type InstrumentId,
} from "./instruments.ts";
import { beatsPerBarOf, type PlanItem } from "./types.ts";

/**
 * Build a plan item the way daily-plan's fromLesson does — the lesson's
 * own fields, meter included. (The judging suites hand-roll items
 * without the meter; this file is about the meter, so it mirrors the
 * real construction point.)
 */
function itemFor(instrument: InstrumentId, lessonId: string, extra?: Partial<PlanItem>): PlanItem {
  const lesson = lessonsFor(instrument).find((l) => l.id === lessonId)!;
  return withSurface(
    {
      id: lesson.id,
      type: lesson.type,
      title: lesson.title,
      subtitle: "",
      durationSec: 1,
      lessonId: lesson.id,
      chords: lesson.chords,
      pattern: lesson.pattern,
      bars: lesson.bars,
      beatsPerBar: lesson.beatsPerBar,
      bpm: lesson.bpm,
      process: lesson.process,
      ...extra,
    } satisfies PlanItem,
    instrumentById(instrument),
  );
}

describe("beats per bar — the meter helper", () => {
  it("defaults to 4 and honors an explicit meter", () => {
    assert.equal(beatsPerBarOf({}), 4);
    assert.equal(beatsPerBarOf({ beatsPerBar: 3 }), 3);
    assert.equal(beatsPerBarOf({ beatsPerBar: 0 }), 4);
    assert.equal(beatsPerBarOf(itemFor("drums", "lesson_drums_hats_eighths_01")), 4);
    assert.equal(beatsPerBarOf(itemFor("drums", "lesson_drums_waltz_01")), 3);
  });

  it("count-in is one bar of the item's meter", () => {
    assert.equal(countInBeats(), 4);
    assert.equal(countInBeats(itemFor("drums", "lesson_drums_hats_eighths_01")), 4);
    assert.equal(countInBeats(itemFor("drums", "lesson_drums_waltz_01")), 3);
  });

  it("patternEndSec stops the session at bars × meter beats", () => {
    // Waltz pulse: 8 bars × 3 beats at 72 bpm = exactly 20 seconds.
    assert.equal(patternEndSec(itemFor("drums", "lesson_drums_waltz_01")), (8 * 3 * 60) / 72);
    // The 4/4 default is the arithmetic the session player always used.
    assert.equal(patternEndSec(itemFor("drums", "lesson_drums_hats_eighths_01")), (8 * 4 * 60) / 88);
  });

  it("Home Sweet Home: the lap steel waltz declares 3, in 9 bars of it", () => {
    // The rider on the beats-per-bar build: the tune's phrase was authored
    // on a 4-grid (7 bars), but the tune is a waltz — the lesson declares
    // its meter and re-expresses the span as 9 bars, so the session end
    // resolves to 9 × 3 beats (27 seconds at the lesson's 60 bpm).
    const lesson = lessonsFor("lapsteel").find((l) => l.id === "lesson_lapsteel_hsh_01")!;
    assert.equal(lesson.beatsPerBar, 3);
    assert.equal(lesson.bars, 9);
    const item = itemFor("lapsteel", "lesson_lapsteel_hsh_01");
    assert.equal(beatsPerBarOf(item), 3);
    assert.equal(patternEndSec(item), (9 * 3 * 60) / 60);
  });

  it("the daily plan copies the meter onto the item and prices durationSec in it", () => {
    const progress = defaultProgress();
    progress.history = [{ date: "2026-10-14", accuracy: 0.9, xp: 10 }];
    progress.lastAccuracy = 0.7; // a normal day: no extra-warmup override
    for (const lesson of lessonsFor("drums")) {
      if (!lesson.id.includes("waltz")) progress.mastery[lesson.id] = 1;
    }
    const plan = generateDailyPlan(progress, "2026-10-15", "drums");
    const waltz = plan.items.find((i) => i.id === "lesson_drums_waltz_01")!;
    assert.ok(waltz, "the waltz lesson is the day's new lesson once the 4/4 path is mastered");
    assert.equal(waltz.beatsPerBar, 3);
    assert.equal(waltz.durationSec, Math.round((waltz.bars * 3 * 60) / waltz.bpm));
    const warmup = plan.items[0];
    assert.equal(warmup.beatsPerBar, undefined);
    assert.equal(warmup.durationSec, Math.round((warmup.bars * 4 * 60) / warmup.bpm));
  });
});

describe("beats per bar — 3/4 timelines", () => {
  it("waltz pulse fills exactly 24 beats, cycling beats 0–1–2 with kick on 1", () => {
    const item = itemFor("drums", "lesson_drums_waltz_01");
    const notes = buildTimeline(item);
    assert.equal(notes.length, 24);
    notes.forEach((note, i) => {
      assert.equal(note.bar, Math.floor(i / 3));
      assert.equal(note.beat, i % 3);
      assert.equal(note.string, [0, 2, 2][i % 3], "kick, hat, hat");
    });
    assert.equal(notes[notes.length - 1].t, (23 * 60) / 72);
    assert.ok(notes.every((n) => n.t < patternEndSec(item)), "no event at or past the hard stop");
  });

  it("the waltz fill phrase (12 beats) loops twice across 8 bars and lands on 1", () => {
    const item = itemFor("drums", "lesson_drums_waltz_fill_01");
    const notes = buildTimeline(item);
    assert.equal(notes.length, 60);
    const fillStarts = notes.filter((n) => n.detail === "Fill: start on the snare.");
    assert.deepEqual(fillStarts.map((n) => n.t), [(6 * 60) / 76, (18 * 60) / 76]);
    const landings = notes.filter((n) => n.detail === "Land on 1.");
    assert.deepEqual(landings.map((n) => [n.bar, n.beat]), [[3, 0], [7, 0]]);
    assert.equal(notes[notes.length - 1].t, (23.5 * 60) / 76);
  });

  it("a pattern longer than the session is clipped at bars × meter", () => {
    const notes = buildTimeline(itemFor("drums", "lesson_drums_waltz_fill_01", { bars: 2 }));
    assert.equal(notes.length, 16, "only the two groove bars of the phrase fit");
    assert.ok(notes.every((n) => n.t < (6 * 60) / 76), "nothing at or past beat 6");
  });

  it("judged timing in 3/4 scores by milliseconds on the 0–1–2 grid", () => {
    const notes = buildTimeline(itemFor("drums", "lesson_drums_waltz_01"));
    const onTime = consumeHit(notes, notes[1].t);
    assert.equal(onTime.judge, "perfect");
    assert.equal(onTime.note?.beat, 1);
    assert.equal(consumeHit(notes, notes[1].t + 0.1).judge, "good");
    const last = notes[notes.length - 1];
    assert.equal(last.beat, 2, "the bar still turns after beat 2");
    assert.equal(consumeHit(notes, last.t + 0.4).hit, false);
  });

  it("the generic tiler windows follow the meter; explicit 4 is the absent default", () => {
    const inThree = dailyInstrumentCues(itemFor("mandolin", "lesson_mandolin_gc_01", { bars: 2, beatsPerBar: 3 }))!;
    assert.deepEqual(inThree.map((c) => c.beat), [0, 1, 2, 3, 4, 5]);
    const absent = dailyInstrumentCues(itemFor("mandolin", "lesson_mandolin_gc_01", { bars: 2 }))!;
    const explicit = dailyInstrumentCues(
      itemFor("mandolin", "lesson_mandolin_gc_01", { bars: 2, beatsPerBar: 4 }),
    )!;
    assert.deepEqual(explicit, absent);
    assert.deepEqual(absent.map((c) => c.beat), [0, 1, 2, 3, 4, 5, 6, 7]);
  });
});

describe("beats per bar — golden 4/4 pins (default behavior unchanged)", () => {
  it("declared drums pattern: eighth-note hats, 64 events", () => {
    const notes = buildTimeline(itemFor("drums", "lesson_drums_hats_eighths_01"));
    assert.equal(notes.length, 64);
    assert.equal(notes[0].t, 0);
    assert.equal(notes[notes.length - 1].t, (31.5 * 60) / 88);
    assert.deepEqual([notes[notes.length - 1].bar, notes[notes.length - 1].beat], [7, 3.5]);
  });

  it("bespoke cues: lap steel C/F brushes, 16 events a bar apart", () => {
    const notes = buildTimeline(itemFor("lapsteel", "lesson_lapsteel_cf_01"));
    assert.equal(notes.length, 16);
    assert.deepEqual(notes.map((n) => n.t), Array.from({ length: 16 }, (_, i) => i * 4));
  });

  it("strum pattern: guitar Em chord lesson, 8 events", () => {
    const notes = buildTimeline(itemFor("guitar", "lesson_guitar_em_chord_01"));
    assert.equal(notes.length, 8);
    assert.equal(notes[0].t, 0);
    assert.equal(notes[notes.length - 1].t, 28 * (60 / 72));
  });
});

describe("the waltz family in the drums curriculum", () => {
  it("sits at the end of the ramp, chained, every lesson in 3", () => {
    const drums = lessonsFor("drums");
    const waltz = drums.filter((l) => l.id.includes("waltz"));
    assert.deepEqual(waltz.map((l) => l.id), [
      "lesson_drums_waltz_01",
      "lesson_drums_waltz_snare_01",
      "lesson_drums_waltz_eighths_01",
      "lesson_drums_waltz_fill_01",
    ]);
    assert.deepEqual(waltz.map((l) => l.order), [18, 19, 20, 21]);
    assert.equal(waltz[0].prerequisites[0], "lesson_drums_hat_foot_01");
    for (let i = 1; i < waltz.length; i++) {
      assert.equal(waltz[i].prerequisites[0], waltz[i - 1].id);
    }
    for (const lesson of waltz) assert.equal(lesson.beatsPerBar, 3, lesson.id);
    // The family's only 4/4-free zone: no other drums lesson declares a meter.
    for (const lesson of drums) {
      if (!lesson.id.includes("waltz")) assert.equal(lesson.beatsPerBar, undefined, lesson.id);
    }
  });

  it("every waltz pattern is declared, with hits inside its phrase", () => {
    const beats: Record<string, number> = {
      lesson_drums_waltz_01: 3,
      lesson_drums_waltz_snare_01: 3,
      lesson_drums_waltz_eighths_01: 3,
      lesson_drums_waltz_fill_01: 12,
    };
    for (const [id, phrase] of Object.entries(beats)) {
      const pattern = drumDailyPattern(id)!;
      assert.ok(pattern, id);
      assert.equal(pattern.beats, phrase, id);
      assert.ok(pattern.hits.every((h) => h.beat >= 0 && h.beat < pattern.beats), id);
      assert.equal(pattern.hits.find((h) => h.beat === 0)?.pads[0], 0, `${id} lands on the kick`);
    }
  });
});
