import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { buildTimeline } from "./practice.ts";
import { MANDOLIN_DAILY_CUES, dailyInstrumentCues, hasInstrumentPattern } from "./instrument-patterns.ts";
import { instrumentById, lessonsFor, withSurface } from "./instruments.ts";
import { beatsPerBarOf, type PlanItem } from "./types.ts";

function itemFor(lessonId: string): PlanItem {
  const lesson = lessonsFor("mandolin").find((l) => l.id === lessonId)!;
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
    instrumentById("mandolin"),
  );
}

const SONGS = [
  { id: "lesson_mandolin_losing_religion_01", order: 20, title: "Losing My Religion", artist: "R.E.M.", bpm: 84, prereq: ["lesson_mandolin_am_song_01"], cues: 64 },
  { id: "lesson_mandolin_copperhead_01", order: 21, title: "Copperhead Road", artist: "Steve Earle", bpm: 88, prereq: ["lesson_mandolin_losing_religion_01"], cues: 64 },
  { id: "lesson_mandolin_maggie_may_01", order: 13, title: "Maggie May", artist: "Rod Stewart", bpm: 80, prereq: ["lesson_mandolin_melody_01"], cues: 32 },
  { id: "lesson_mandolin_evermore_01", order: 22, title: "The Battle of Evermore", artist: "Led Zeppelin", bpm: 72, prereq: ["lesson_mandolin_maggie_may_01"], cues: 64 },
] as const;

describe("mandolin famous-song lessons", () => {
  it("Maggie May sits at order 13, gated on the melody lesson; the other songs extend the sequence at orders 20–22", () => {
    const mandolin = lessonsFor("mandolin");
    assert.equal(mandolin.length, 22);
    for (const song of SONGS) {
      const lesson = mandolin.find((l) => l.id === song.id)!;
      assert.ok(lesson, song.id);
      assert.equal(lesson.order, song.order, song.id);
      assert.equal(lesson.title, song.title, song.id);
      assert.equal(lesson.repertoire, song.title, song.id);
      assert.equal(lesson.type, "song", song.id);
      assert.equal(lesson.process, "perform", song.id);
      assert.equal(lesson.trackId, "track_mandolin_songs", song.id);
      assert.equal(lesson.bpm, song.bpm, song.id);
      assert.deepEqual(lesson.prerequisites, [...song.prereq], song.id);
    }
    assert.deepEqual(
      mandolin.map((l) => l.order),
      Array.from({ length: 22 }, (_, i) => i + 1),
    );
  });

  it("credit the original artist and state the tempo in each lesson's copy", () => {
    for (const song of SONGS) {
      const lesson = lessonsFor("mandolin").find((l) => l.id === song.id)!;
      assert.ok(lesson.why?.includes(song.artist), `${song.id} credits ${song.artist}`);
      assert.ok(lesson.why?.includes(String(song.bpm)), `${song.id} states its BPM`);
    }
  });

  it("Losing My Religion owns its label: the pattern in eighths, at practice tempo", () => {
    const lesson = lessonsFor("mandolin").find((l) => l.id === "lesson_mandolin_losing_religion_01")!;
    assert.ok(lesson.why?.includes("sixteenth"), "the record's speed is named");
    assert.ok(lesson.why?.includes("practice tempo"), "and the lesson's honesty with it");
    assert.ok(lesson.objectives.some((o) => o.includes("Em")), "Em is taught in the lesson");
  });

  it("each song carries bespoke cues; phrase layouts tile the lesson exactly", () => {
    for (const song of SONGS) {
      const pattern = MANDOLIN_DAILY_CUES[song.id];
      assert.ok(pattern, song.id);
      for (const cue of pattern.cues) {
        assert.ok(cue.beat >= 0 && cue.beat < pattern.beats, `${song.id} beat ${cue.beat}`);
        assert.equal(cue.notes?.length, 1, `${song.id}: single picked notes, no double stops`);
      }
      assert.ok(hasInstrumentPattern(itemFor(song.id)), song.id);
      const cues = dailyInstrumentCues(itemFor(song.id))!;
      assert.equal(cues.length, song.cues, song.id);
      const events = buildTimeline(itemFor(song.id));
      assert.equal(events.length, cues.length, `${song.id}: timeline parity`);
    }
  });

  it("Losing My Religion: Am bars roll A–E–C–E; Em bars roll E–B–G–B", () => {
    const cues = dailyInstrumentCues(itemFor("lesson_mandolin_losing_religion_01"))!;
    assert.deepEqual(cues.slice(0, 8).map((c) => c.notes?.[0]), [69, 76, 72, 76, 69, 76, 72, 76]);
    assert.deepEqual(cues.slice(16, 24).map((c) => c.notes?.[0]), [76, 71, 67, 71, 76, 71, 67, 71]);
    assert.deepEqual(
      cues.slice(0, 8).map((c) => c.beat),
      [0, 0.5, 1, 1.5, 2, 2.5, 3, 3.5],
      "steady eighths — not the record's sixteenths",
    );
  });

  it("Copperhead Road: the D-course drone under A-course answers", () => {
    const cues = dailyInstrumentCues(itemFor("lesson_mandolin_copperhead_01"))!;
    assert.deepEqual(cues.slice(0, 8).map((c) => c.notes?.[0]), [62, 62, 69, 62, 62, 62, 69, 71]);
    assert.deepEqual(cues.slice(8, 16).map((c) => c.notes?.[0]), [62, 62, 69, 62, 62, 64, 66, 62], "the F♯ lift in bar 2");
  });

  it("Maggie May: a quarter-note melody that ends held on A", () => {
    const cues = dailyInstrumentCues(itemFor("lesson_mandolin_maggie_may_01"))!;
    assert.deepEqual(cues.slice(0, 4).map((c) => c.notes?.[0]), [74, 71, 69, 71]);
    const last = cues.slice(0, 16).at(-1)!;
    assert.equal(last.notes?.[0], 69);
    assert.equal(last.duration, 1.9, "the final note is held");
  });

  it("The Battle of Evermore: the figure tops out on G, E course fret 3", () => {
    const cues = dailyInstrumentCues(itemFor("lesson_mandolin_evermore_01"))!;
    assert.deepEqual(cues.slice(0, 8).map((c) => c.notes?.[0]), [69, 72, 76, 72, 69, 72, 76, 79]);
    assert.equal(Math.max(...cues.map((c) => c.notes?.[0] ?? 0)), 79);
  });
});
