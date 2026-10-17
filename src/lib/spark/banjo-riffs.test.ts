import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { buildTimeline } from "./practice.ts";
import { BANJO_DAILY_CUES, dailyInstrumentCues, hasInstrumentPattern } from "./instrument-patterns.ts";
import { instrumentById, lessonsFor, withSurface } from "./instruments.ts";
import { beatsPerBarOf, type PlanItem } from "./types.ts";

function itemFor(lessonId: string): PlanItem {
  const lesson = lessonsFor("banjo").find((l) => l.id === lessonId)!;
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
    instrumentById("banjo"),
  );
}

const SONGS = [
  { id: "lesson_banjo_foggy_01", order: 19, title: "Foggy Mountain Breakdown", artist: "Flatt & Scruggs", bpm: 96, prereq: ["lesson_banjo_roll_01", "lesson_banjo_minors_01"], cues: 64 },
  { id: "lesson_banjo_dueling_01", order: 20, title: "Dueling Banjos", artist: "Arthur Smith", bpm: 84, prereq: ["lesson_banjo_foggy_01"], cues: 48 },
  { id: "lesson_banjo_jed_01", order: 10, title: "The Ballad of Jed Clampett", artist: "Flatt & Scruggs", bpm: 92, prereq: ["lesson_banjo_loop_01"], cues: 64 },
  { id: "lesson_banjo_wagon_wheel_01", order: 21, title: "Wagon Wheel", artist: "Old Crow Medicine Show", bpm: 80, prereq: ["lesson_banjo_jed_01"], cues: 32 },
] as const;

describe("banjo famous-song lessons", () => {
  it("Jed Clampett sits at order 10, gated on the three-chord loop; the other songs extend the sequence at orders 19–21", () => {
    const banjo = lessonsFor("banjo");
    assert.equal(banjo.length, 21);
    for (const song of SONGS) {
      const lesson = banjo.find((l) => l.id === song.id)!;
      assert.ok(lesson, song.id);
      assert.equal(lesson.order, song.order, song.id);
      assert.equal(lesson.title, song.title, song.id);
      assert.equal(lesson.repertoire, song.title, song.id);
      assert.equal(lesson.type, "song", song.id);
      assert.equal(lesson.process, "perform", song.id);
      assert.equal(lesson.trackId, "track_banjo_songs", song.id);
      assert.equal(lesson.bpm, song.bpm, song.id);
      assert.deepEqual(lesson.prerequisites, [...song.prereq], song.id);
    }
    assert.deepEqual(
      banjo.map((l) => l.order),
      Array.from({ length: 21 }, (_, i) => i + 1),
    );
  });

  it("credit the original artist and state the tempo in each lesson's copy", () => {
    for (const song of SONGS) {
      const lesson = lessonsFor("banjo").find((l) => l.id === song.id)!;
      assert.ok(lesson.why?.includes(song.artist), `${song.id} credits ${song.artist}`);
      assert.ok(lesson.why?.includes(String(song.bpm)), `${song.id} states its BPM`);
    }
  });

  it("Foggy Mountain owns its arrangement: the opening break, at half tempo", () => {
    const lesson = lessonsFor("banjo").find((l) => l.id === "lesson_banjo_foggy_01")!;
    assert.ok(lesson.why?.includes("opening break"), "the excerpt is named");
    assert.ok(lesson.why?.includes("half tempo"), "the tempo is owned");
    assert.ok(lesson.objectives.some((o) => o.includes("Half tempo")), "and in the objectives");
  });

  it("each song carries bespoke cues; the older banjo lessons keep their own paths", () => {
    for (const song of SONGS) {
      assert.ok(BANJO_DAILY_CUES[song.id], song.id);
      assert.ok(hasInstrumentPattern(itemFor(song.id)), song.id);
      const cues = dailyInstrumentCues(itemFor(song.id))!;
      assert.equal(cues.length, song.cues, song.id);
      const events = buildTimeline(itemFor(song.id));
      assert.equal(events.length, cues.length, `${song.id}: timeline parity`);
    }
    for (const old of ["lesson_banjo_roll_01", "lesson_banjo_cripple_01", "lesson_banjo_closedvamp_01"]) {
      assert.equal(BANJO_DAILY_CUES[old], undefined, old);
    }
  });

  it("the forward roll runs strings 3–2–1–5–2–1–3–1 in every roll bar", () => {
    const cues = dailyInstrumentCues(itemFor("lesson_banjo_foggy_01"))!;
    assert.deepEqual(
      cues.slice(0, 8).map((c) => c.notes?.[0]),
      [55, 59, 62, 67, 59, 62, 55, 62],
      "G bar: strings 3, 2, 1, 5, 2, 1, 3, 1 on open G",
    );
    assert.deepEqual(
      cues.slice(0, 8).map((c) => c.beat),
      [0, 0.5, 1, 1.5, 2, 2.5, 3, 3.5],
      "eight even eighth notes",
    );
    const emBar = cues.filter((c) => c.beat >= 8 && c.beat < 12);
    assert.deepEqual(
      emBar.map((c) => c.notes?.[0]),
      [55, 59, 64, 67, 59, 64, 55, 64],
      "Em bar: the first string moves to fret 2",
    );
    const barChords = Array.from({ length: 8 }, (_, bar) => cues[bar * 8].chord);
    assert.deepEqual(barChords, ["G", "G", "Em", "Em", "G", "G", "D7", "G"], "the break's chord path");
  });

  it("Dueling Banjos: eight picked answers, then the roll-out", () => {
    const cues = dailyInstrumentCues(itemFor("lesson_banjo_dueling_01"))!;
    assert.deepEqual(
      cues.slice(0, 8).map((c) => c.notes?.[0]),
      [62, 59, 55, 59, 62, 67, 62, 59],
      "the answering phrase",
    );
    assert.deepEqual(
      cues.slice(8, 16).map((c) => c.notes?.[0]),
      [55, 59, 62, 67, 59, 62, 55, 62],
      "the roll-out is the forward roll on G",
    );
  });

  it("Jed Clampett: the roll walks G–C–G–D7 twice", () => {
    const cues = dailyInstrumentCues(itemFor("lesson_banjo_jed_01"))!;
    const barChords = Array.from({ length: 8 }, (_, bar) => cues[bar * 8].chord);
    assert.deepEqual(barChords, ["G", "C", "G", "D7", "G", "C", "G", "D7"]);
  });

  it("Wagon Wheel: brush, chop, brush, chop over G–D–Em–C", () => {
    const cues = dailyInstrumentCues(itemFor("lesson_banjo_wagon_wheel_01"))!;
    const bar = cues.slice(0, 4);
    assert.deepEqual(bar.map((c) => !!c.muted), [false, true, false, true], "brush and chop alternate");
    assert.deepEqual(bar[0].notes, [50, 55, 59, 62], "open G, strings 4–1");
    const barChords = Array.from({ length: 4 }, (_, b) => cues[b * 4].chord);
    assert.deepEqual(barChords, ["G", "D", "Em", "C"]);
  });
});
