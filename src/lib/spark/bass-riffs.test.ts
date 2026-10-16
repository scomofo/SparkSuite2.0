import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { buildTimeline } from "./practice.ts";
import { BASS_DAILY_CUES, dailyInstrumentCues, hasInstrumentPattern } from "./instrument-patterns.ts";
import { instrumentById, lessonsFor, withSurface } from "./instruments.ts";
import { beatsPerBarOf, type PlanItem } from "./types.ts";

function itemFor(lessonId: string): PlanItem {
  const lesson = lessonsFor("bass").find((l) => l.id === lessonId)!;
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
    instrumentById("bass"),
  );
}

const RIFFS = [
  { id: "lesson_bass_rocknroll_01", order: 17, title: "I Love Rock 'n' Roll", artist: "Joan Jett", bpm: 92, cues: 64 },
  { id: "lesson_bass_seven_nation_01", order: 18, title: "Seven Nation Army", artist: "The White Stripes", bpm: 112, cues: 28 },
  { id: "lesson_bass_something_01", order: 19, title: "Something in the Way", artist: "Nirvana", bpm: 72, cues: 16 },
  { id: "lesson_bass_zombie_01", order: 20, title: "Zombie", artist: "The Cranberries", bpm: 84, cues: 64 },
  { id: "lesson_bass_under_pressure_01", order: 21, title: "Under Pressure", artist: "Bowie", bpm: 108, cues: 28 },
] as const;

describe("bass famous-riff lessons", () => {
  it("close the bass sequence at orders 17–21, chained in the video's skill order", () => {
    const bass = lessonsFor("bass");
    assert.equal(bass.length, 21);
    RIFFS.forEach((riff, i) => {
      const lesson = bass.find((l) => l.id === riff.id)!;
      assert.ok(lesson, riff.id);
      assert.equal(lesson.order, riff.order, riff.id);
      assert.equal(lesson.title, riff.title, riff.id);
      assert.equal(lesson.repertoire, riff.title, riff.id);
      assert.equal(lesson.type, "song", riff.id);
      assert.equal(lesson.process, "perform", riff.id);
      assert.equal(lesson.trackId, "track_bass_grooves", riff.id);
      assert.equal(lesson.bpm, riff.bpm, riff.id);
      const previous = i === 0 ? "lesson_bass_song_saints_01" : RIFFS[i - 1].id;
      assert.deepEqual(lesson.prerequisites, [previous], riff.id);
    });
    // Orders stay contiguous across the whole bass path.
    assert.deepEqual(
      bass.map((l) => l.order),
      Array.from({ length: 21 }, (_, i) => i + 1),
    );
  });

  it("credit the original artist and state the tempo in each lesson's copy", () => {
    for (const riff of RIFFS) {
      const lesson = lessonsFor("bass").find((l) => l.id === riff.id)!;
      assert.ok(lesson.why?.includes(riff.artist), `${riff.id} credits ${riff.artist}`);
      assert.ok(lesson.why?.includes(String(riff.bpm)), `${riff.id} states its BPM`);
    }
    const pressure = lessonsFor("bass").find((l) => l.id === "lesson_bass_under_pressure_01")!;
    assert.ok(pressure.why?.includes("Queen"), "Under Pressure credits Queen as well as Bowie");
  });

  it("each riff lesson carries a bespoke judged pattern; the older bass lessons do not", () => {
    for (const riff of RIFFS) {
      assert.ok(BASS_DAILY_CUES[riff.id], riff.id);
      assert.equal(hasInstrumentPattern(itemFor(riff.id)), true, riff.id);
      assert.ok(dailyInstrumentCues(itemFor(riff.id)), riff.id);
    }
    for (const old of ["lesson_bass_e_pulse_01", "lesson_bass_song_saints_01", "lesson_bass_blues_12bar_01"]) {
      assert.equal(hasInstrumentPattern(itemFor(old)), false, old);
      assert.equal(dailyInstrumentCues(itemFor(old)), undefined, old);
    }
  });

  it("every riff cue is a single judged note inside the bass's range", () => {
    for (const riff of RIFFS) {
      const cues = dailyInstrumentCues(itemFor(riff.id))!;
      assert.equal(cues.length, riff.cues, riff.id);
      for (const cue of cues) {
        assert.equal(cue.notes?.length, 1, `${riff.id} beat ${cue.beat}`);
        const midi = cue.notes![0];
        assert.ok(midi >= 28 && midi <= 43, `${riff.id}: midi ${midi} on the bass`);
        assert.equal(cue.expectedMidi, undefined, `${riff.id}: bass judging rides notes, not expectedMidi`);
      }
      // The phrase never spills past the lesson's last beat.
      assert.ok(cues[cues.length - 1].beat < 8 * 4, riff.id);
    }
  });

  it("I Love Rock 'n' Roll: eighth-note roots — two bars of E, a bar of A, a bar of B", () => {
    const cues = dailyInstrumentCues(itemFor("lesson_bass_rocknroll_01"))!;
    const phrase = cues.slice(0, 32);
    assert.deepEqual(
      phrase.map((c) => c.notes![0]),
      [...Array(16).fill(28), ...Array(8).fill(33), ...Array(8).fill(35)],
    );
    assert.deepEqual(
      phrase.map((c) => c.beat),
      Array.from({ length: 32 }, (_, i) => i * 0.5),
    );
    // The second half of the lesson is the same phrase again.
    assert.deepEqual(
      cues.slice(32).map((c) => c.notes![0]),
      phrase.map((c) => c.notes![0]),
    );
  });

  it("Seven Nation Army: the seven-note A-string line, B held at the end", () => {
    const cues = dailyInstrumentCues(itemFor("lesson_bass_seven_nation_01"))!;
    const phrase = cues.slice(0, 7);
    assert.deepEqual(phrase.map((c) => c.notes![0]), [40, 40, 43, 40, 38, 36, 35]);
    assert.deepEqual(phrase.map((c) => c.beat), [0, 1.5, 2, 3, 4, 5, 6]);
    assert.equal(phrase[6].duration, 1.9, "the B rings for two beats");
    assert.equal(cues.length, 28, "four passes across eight bars");
  });

  it("Something in the Way: half notes that ring — four F♯, then four D", () => {
    const cues = dailyInstrumentCues(itemFor("lesson_bass_something_01"))!;
    assert.deepEqual(cues.slice(0, 8).map((c) => c.notes![0]), [30, 30, 30, 30, 38, 38, 38, 38]);
    assert.deepEqual(cues.slice(0, 8).map((c) => c.beat), [0, 2, 4, 6, 8, 10, 12, 14]);
    for (const cue of cues) assert.ok((cue.duration ?? 0) >= 1.9, "legato: the ring hands over");
  });

  it("Zombie: one bar of eighth-note roots per chord around Em–C–G–F♯", () => {
    const cues = dailyInstrumentCues(itemFor("lesson_bass_zombie_01"))!;
    const phrase = cues.slice(0, 32);
    const perBar = [28, 36, 31, 30].flatMap((midi) => Array(8).fill(midi));
    assert.deepEqual(phrase.map((c) => c.notes![0]), perBar);
    assert.deepEqual(
      phrase.map((c) => c.beat),
      Array.from({ length: 32 }, (_, i) => i * 0.5),
    );
  });

  it("Under Pressure: three Ds on the beat, three off it, then the A rings", () => {
    const cues = dailyInstrumentCues(itemFor("lesson_bass_under_pressure_01"))!;
    const phrase = cues.slice(0, 7);
    assert.deepEqual(phrase.map((c) => c.notes![0]), [38, 38, 38, 38, 38, 38, 33]);
    assert.deepEqual(phrase.map((c) => c.beat), [0, 1, 2, 2.5, 3, 3.5, 4]);
    assert.equal(phrase[6].duration, 3.8, "the A rings for its whole bar");
    assert.equal(cues.length, 28, "four passes across eight bars");
  });

  it("timelines carry the same judged notes the cues declare", () => {
    for (const riff of RIFFS) {
      const cues = dailyInstrumentCues(itemFor(riff.id))!;
      const events = buildTimeline(itemFor(riff.id));
      assert.equal(events.length, cues.length, riff.id);
      assert.deepEqual(
        events.map((e) => e.notes?.[0]),
        cues.map((c) => c.notes![0]),
        riff.id,
      );
      for (let i = 1; i < events.length; i++)
        assert.ok(events[i].t > events[i - 1].t, `${riff.id}: events in time order`);
    }
  });
});
