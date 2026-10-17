import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { buildTimeline } from "./practice.ts";
import { GUITAR_DAILY_CUES, dailyInstrumentCues, hasInstrumentPattern } from "./instrument-patterns.ts";
import { instrumentById, lessonsFor, withSurface } from "./instruments.ts";
import { CHORDS } from "./guitar.ts";
import { beatsPerBarOf, type PlanItem } from "./types.ts";

function itemFor(lessonId: string): PlanItem {
  const lesson = lessonsFor("guitar").find((l) => l.id === lessonId)!;
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
    instrumentById("guitar"),
  );
}

const SONGS = [
  { id: "lesson_guitar_smoke_water_01", order: 6, title: "Smoke on the Water", artist: "Deep Purple", bpm: 76, prereq: ["lesson_guitar_pick_downstrokes_01"], cues: 24 },
  { id: "lesson_guitar_come_as_you_are_01", order: 7, title: "Come As You Are", artist: "Nirvana", bpm: 84, prereq: ["lesson_guitar_smoke_water_01"], cues: 64 },
  { id: "lesson_guitar_horse_no_name_01", order: 13, title: "Horse with No Name", artist: "America", bpm: 84, prereq: ["lesson_guitar_song_first_two_chord_01"], cues: 32 },
  { id: "lesson_guitar_sunshine_love_01", order: 8, title: "Sunshine of Your Love", artist: "Cream", bpm: 72, prereq: ["lesson_guitar_come_as_you_are_01"], cues: 36 },
  { id: "lesson_guitar_knockin_heaven_01", order: 21, title: "Knockin' on Heaven's Door", artist: "Bob Dylan", bpm: 66, prereq: ["lesson_guitar_am_c_switch_01"], cues: 64 },
] as const;

describe("guitar famous-riff and famous-song lessons", () => {
  it("the famous songs scatter to their own gates (orders 6, 7, 8, 13, 21)", () => {
    const guitar = lessonsFor("guitar");
    assert.equal(guitar.length, 36);
    for (const song of SONGS) {
      const lesson = guitar.find((l) => l.id === song.id)!;
      assert.ok(lesson, song.id);
      assert.equal(lesson.order, song.order, song.id);
      assert.equal(lesson.title, song.title, song.id);
      assert.equal(lesson.repertoire, song.title, song.id);
      assert.equal(lesson.type, "song", song.id);
      assert.equal(lesson.process, "perform", song.id);
      assert.equal(lesson.trackId, "track_guitar_performance", song.id);
      assert.equal(lesson.bpm, song.bpm, song.id);
      assert.deepEqual(lesson.prerequisites, [...song.prereq], song.id);
    }
    assert.deepEqual(
      guitar.map((l) => l.order),
      Array.from({ length: 36 }, (_, i) => i + 1),
    );
  });

  it("credit the original artist and state the tempo in each lesson's copy", () => {
    for (const song of SONGS) {
      const lesson = lessonsFor("guitar").find((l) => l.id === song.id)!;
      assert.ok(lesson.why?.includes(song.artist), `${song.id} credits ${song.artist}`);
      assert.ok(lesson.why?.includes(String(song.bpm)), `${song.id} states its BPM`);
    }
  });

  it("discloses its arrangement choices in the copy", () => {
    const come = lessonsFor("guitar").find((l) => l.id === "lesson_guitar_come_as_you_are_01")!;
    assert.ok(come.why?.includes("standard tuning"), "Come As You Are: standard tuning, record sits lower");
    const knockin = lessonsFor("guitar").find((l) => l.id === "lesson_guitar_knockin_heaven_01")!;
    assert.ok(knockin.why?.includes("Cadd9"), "Knockin': Cadd9 stands in for C — and says so");
    assert.ok(knockin.objectives.some((o) => o.includes("ring and pinky")), "the anchor trick is taught");
  });

  it("adds the two new chord shapes the songs need", () => {
    assert.deepEqual(CHORDS.D6.frets, [2, 0, 0, 2, 0, 0]);
    assert.deepEqual(CHORDS.Cadd9.frets, [null, 3, 2, 0, 3, 3]);
  });

  it("each song lesson carries bespoke cues; the older guitar lessons don't", () => {
    for (const song of SONGS) {
      assert.ok(GUITAR_DAILY_CUES[song.id], song.id);
      assert.ok(hasInstrumentPattern(itemFor(song.id)), song.id);
      assert.ok(dailyInstrumentCues(itemFor(song.id)), song.id);
    }
    for (const old of ["lesson_guitar_em_chord_01", "lesson_guitar_four_chord_loop_01", "lesson_guitar_song_rising_sun_01"]) {
      assert.equal(GUITAR_DAILY_CUES[old], undefined, old);
      assert.equal(hasInstrumentPattern(itemFor(old)), false, old);
      assert.equal(dailyInstrumentCues(itemFor(old)), undefined, old);
    }
  });

  it("cue phrases sit inside their beats and tile the lesson exactly", () => {
    for (const song of SONGS) {
      const entry = GUITAR_DAILY_CUES[song.id];
      for (const cue of entry.cues) {
        assert.ok(cue.beat >= 0 && cue.beat < entry.beats, `${song.id} beat ${cue.beat}`);
        assert.ok((cue.beat + (cue.duration ?? 0)) <= entry.beats + 0.001, `${song.id} holds inside the phrase`);
      }
      const cues = dailyInstrumentCues(itemFor(song.id))!;
      assert.equal(cues.length, song.cues, song.id);
    }
  });

  it("Smoke on the Water: pairs up the D and G strings — 0, 3, 5, then the turn", () => {
    const cues = dailyInstrumentCues(itemFor("lesson_guitar_smoke_water_01"))!;
    assert.deepEqual(
      cues.slice(0, 12).map((c) => c.notes),
      [
        [50, 55], [53, 58], [55, 60], [50, 55],
        [53, 58], [56, 61], [55, 60],
        [50, 55], [53, 58], [55, 60], [53, 58], [50, 55],
      ],
    );
  });

  it("Come As You Are: E E F G B G F E on the low strings, twice round", () => {
    const cues = dailyInstrumentCues(itemFor("lesson_guitar_come_as_you_are_01"))!;
    assert.deepEqual(
      cues.slice(0, 16).map((c) => c.notes?.[0]),
      [40, 40, 41, 43, 47, 43, 41, 40, 40, 40, 41, 43, 47, 43, 41, 40],
    );
    assert.deepEqual(
      cues.slice(0, 8).map((c) => c.beat),
      [0, 0.5, 1, 1.5, 2, 2.5, 3, 3.5],
      "steady eighth notes",
    );
  });

  it("Sunshine of Your Love: D D C D, the A♭–G turn, F–D home", () => {
    const cues = dailyInstrumentCues(itemFor("lesson_guitar_sunshine_love_01"))!;
    assert.deepEqual(
      cues.slice(0, 9).map((c) => c.notes?.[0]),
      [50, 50, 48, 50, 44, 43, 50, 53, 50],
    );
  });

  it("Horse with No Name: Em for a bar, D6 for a bar, strummed every beat", () => {
    const cues = dailyInstrumentCues(itemFor("lesson_guitar_horse_no_name_01"))!;
    assert.deepEqual(cues.slice(0, 4).map((c) => c.chord), ["Em", "Em", "Em", "Em"]);
    assert.deepEqual(cues.slice(4, 8).map((c) => c.chord), ["D6", "D6", "D6", "D6"]);
    assert.deepEqual(cues[0].notes, [40, 45, 50, 55, 59, 64], "Em tones");
    assert.deepEqual(cues[4].notes, [42, 45, 50, 57, 59, 64], "D6 tones");
  });

  it("Knockin' on Heaven's Door: the loop is G–D–Am Am, G–D–Cadd9 Cadd9", () => {
    const cues = dailyInstrumentCues(itemFor("lesson_guitar_knockin_heaven_01"))!;
    const barChords = Array.from({ length: 8 }, (_, bar) => cues[bar * 4].chord);
    assert.deepEqual(barChords, ["G", "D", "Am", "Am", "G", "D", "Cadd9", "Cadd9"]);
  });

  it("the practice timeline carries the same notes as the daily cues", () => {
    for (const song of SONGS) {
      const item = itemFor(song.id);
      const cues = dailyInstrumentCues(item)!;
      const events = buildTimeline(item);
      assert.equal(events.length, cues.length, song.id);
      events.forEach((event, i) => assert.deepEqual(event.notes, cues[i].notes, `${song.id} cue ${i}`));
    }
  });
});
