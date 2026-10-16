import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { buildTimeline } from "./practice.ts";
import { UKE_DAILY_CUES, dailyInstrumentCues, hasInstrumentPattern } from "./instrument-patterns.ts";
import { instrumentById, lessonsFor, withSurface } from "./instruments.ts";
import { beatsPerBarOf, type PlanItem } from "./types.ts";

function itemFor(lessonId: string): PlanItem {
  const lesson = lessonsFor("ukulele").find((l) => l.id === lessonId)!;
  return withSurface(
    {
      id: lesson.id,
      type: lesson.type,
      title: lesson.title,
      subtitle: "",
      durationSec: Math.round((lesson.bars * beatsPerBarOf(lesson) * 60) / lesson.bpm),
      lessonId: lesson.id,
      chords: lesson.chords,
      pattern: lesson.pattern,
      bars: lesson.bars,
      beatsPerBar: lesson.beatsPerBar,
      bpm: lesson.bpm,
      process: lesson.process,
    } satisfies PlanItem,
    instrumentById("ukulele"),
  );
}

const SONGS = [
  { id: "lesson_uke_lava_01", order: 13, title: "Lava", artist: "Lava", year: 2014, bpm: 76, prereq: ["lesson_uke_cg_01"], cues: 32 },
  { id: "lesson_uke_riptide_01", order: 14, title: "Riptide", artist: "Vance Joy", year: 2013, bpm: 88, prereq: ["lesson_uke_island_01"], cues: 48 },
  { id: "lesson_uke_im_yours_01", order: 15, title: "I'm Yours", artist: "Jason Mraz", year: 2008, bpm: 76, prereq: ["lesson_uke_riptide_01"], cues: 48 },
  { id: "lesson_uke_rainbow_01", order: 16, title: "Over the Rainbow", artist: "Kamakawiwo", year: 1990, bpm: 72, prereq: ["lesson_uke_im_yours_01"], cues: 32 },
  { id: "lesson_uke_count_on_me_01", order: 17, title: "Count on Me", artist: "Bruno Mars", year: 2010, bpm: 84, prereq: ["lesson_uke_rainbow_01"], cues: 60 },
] as const;

describe("ukulele famous-song lessons", () => {
  it("extend the ukulele sequence at orders 13–17", () => {
    const uke = lessonsFor("ukulele");
    assert.equal(uke.length, 17);
    for (const song of SONGS) {
      const lesson = uke.find((l) => l.id === song.id)!;
      assert.ok(lesson, song.id);
      assert.equal(lesson.order, song.order, song.id);
      assert.equal(lesson.title, song.title, song.id);
      assert.equal(lesson.repertoire, song.title, song.id);
      assert.equal(lesson.type, "song", song.id);
      assert.equal(lesson.process, "perform", song.id);
      assert.equal(lesson.trackId, "track_uke_songs", song.id);
      assert.equal(lesson.bpm, song.bpm, song.id);
      assert.deepEqual(lesson.prerequisites, [...song.prereq], song.id);
    }
    assert.deepEqual(
      uke.map((l) => l.order),
      Array.from({ length: 17 }, (_, i) => i + 1),
    );
  });

  it("credit the source and state the tempo in each lesson's copy", () => {
    for (const song of SONGS) {
      const lesson = lessonsFor("ukulele").find((l) => l.id === song.id)!;
      assert.ok(lesson.why?.includes(song.artist), `${song.id} credits ${song.artist}`);
      assert.ok(lesson.why?.includes(String(song.bpm)), `${song.id} states its BPM`);
      assert.ok(lesson.why?.includes(String(song.year)), `${song.id} states its year`);
    }
  });

  it("each song carries bespoke cues; the older ukulele lessons don't", () => {
    for (const song of SONGS) {
      assert.ok(UKE_DAILY_CUES[song.id], song.id);
      assert.ok(hasInstrumentPattern(itemFor(song.id)), song.id);
      const cues = dailyInstrumentCues(itemFor(song.id))!;
      assert.equal(cues.length, song.cues, song.id);
      const entry = UKE_DAILY_CUES[song.id];
      for (const cue of entry.cues) {
        assert.ok(cue.beat >= 0 && cue.beat < entry.beats, `${song.id} beat ${cue.beat}`);
        assert.equal(cue.notes?.length, 4, `${song.id}: four strings per strike`);
      }
      const events = buildTimeline(itemFor(song.id));
      assert.equal(events.length, cues.length, `${song.id}: timeline parity`);
    }
    for (const old of ["lesson_uke_c_01", "lesson_uke_cg_01", "lesson_uke_island_01", "lesson_uke_melody_01"]) {
      assert.equal(UKE_DAILY_CUES[old], undefined, old);
      assert.equal(hasInstrumentPattern(itemFor(old)), false, old);
    }
  });

  it("the island-strum songs strike on 0, 1, 1.5, 2.5, 3, 3.5 of every bar", () => {
    for (const id of ["lesson_uke_riptide_01", "lesson_uke_im_yours_01", "lesson_uke_count_on_me_01"]) {
      const firstBar = UKE_DAILY_CUES[id].cues.filter((c) => c.beat < 4);
      assert.deepEqual(firstBar.map((c) => c.beat), [0, 1, 1.5, 2.5, 3, 3.5], id);
      assert.deepEqual(firstBar.map((c) => c.label.at(-1)), ["↓", "↓", "↑", "↑", "↓", "↑"], id);
    }
    for (const id of ["lesson_uke_lava_01", "lesson_uke_rainbow_01"]) {
      const firstBar = UKE_DAILY_CUES[id].cues.filter((c) => c.beat < 4);
      assert.deepEqual(firstBar.map((c) => c.beat), [0, 1, 2, 3], `${id}: one downstrum a beat`);
    }
  });

  it("chord loops match the lessons: Lava C–G7–F–G7, Riptide Am–G–C–C", () => {
    const lava = UKE_DAILY_CUES["lesson_uke_lava_01"].cues;
    assert.deepEqual([0, 4, 8, 12].map((b) => lava.find((c) => c.beat === b)?.chord), ["C", "G7", "F", "G7"]);
    const riptide = UKE_DAILY_CUES["lesson_uke_riptide_01"].cues;
    assert.deepEqual([0, 4, 8, 12].map((b) => riptide.find((c) => c.beat === b)?.chord), ["Am", "G", "C", "C"]);
    const count = UKE_DAILY_CUES["lesson_uke_count_on_me_01"].cues;
    assert.deepEqual([0, 4, 8, 12, 16].map((b) => count.find((c) => c.beat === b)?.chord), ["C", "Em", "Am", "G", "F"]);
  });

  it("Em is taught in Over the Rainbow and reused, identically, in Count on Me", () => {
    const rainbowEm = UKE_DAILY_CUES["lesson_uke_rainbow_01"].cues.find((c) => c.chord === "Em")!;
    const countEm = UKE_DAILY_CUES["lesson_uke_count_on_me_01"].cues.find((c) => c.chord === "Em")!;
    assert.deepEqual(rainbowEm.notes, [67, 64, 67, 71], "Em: the staircase — G, E, G, B");
    assert.deepEqual(countEm.notes, rainbowEm.notes, "the same shape, reused");
    assert.ok(rainbowEm.detail.includes("staircase"), "Rainbow teaches the shape");
    const rainbow = lessonsFor("ukulele").find((l) => l.id === "lesson_uke_rainbow_01")!;
    assert.ok(rainbow.objectives.some((o) => o.includes("Em")), "the Em objective is in the teaching lesson");
  });
});
