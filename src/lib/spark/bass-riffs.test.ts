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
    assert.equal(bass.length, 26);
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
      Array.from({ length: 26 }, (_, i) => i + 1),
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

const RIFFS2 = [
  { id: "lesson_bass_peter_gunn_01", order: 22, title: "Peter Gunn", artist: "Mancini", bpm: 100, cues: 64 },
  { id: "lesson_bass_godzilla_01", order: 23, title: "Godzilla", artist: "Blue Öyster Cult", bpm: 80, cues: 28 },
  { id: "lesson_bass_smooth_operator_01", order: 24, title: "Smooth Operator", artist: "Sade", bpm: 84, cues: 32 },
  { id: "lesson_bass_bad_guy_01", order: 25, title: "bad guy", artist: "Billie Eilish", bpm: 96, cues: 32 },
  { id: "lesson_bass_mission_01", order: 26, title: "Mission: Impossible Theme", artist: "Schifrin", bpm: 92, cues: 30 },
] as const;

describe("bass famous-riff lessons, pack #2", () => {
  it("extend the bass sequence at orders 22–26, chained on from Under Pressure", () => {
    const bass = lessonsFor("bass");
    RIFFS2.forEach((riff, i) => {
      const lesson = bass.find((l) => l.id === riff.id)!;
      assert.ok(lesson, riff.id);
      assert.equal(lesson.order, riff.order, riff.id);
      assert.equal(lesson.title, riff.title, riff.id);
      assert.equal(lesson.repertoire, riff.title, riff.id);
      assert.equal(lesson.type, "song", riff.id);
      assert.equal(lesson.process, "perform", riff.id);
      assert.equal(lesson.trackId, "track_bass_grooves", riff.id);
      assert.equal(lesson.bpm, riff.bpm, riff.id);
      const previous = i === 0 ? "lesson_bass_under_pressure_01" : RIFFS2[i - 1].id;
      assert.deepEqual(lesson.prerequisites, [previous], riff.id);
    });
  });

  it("credit the original artist and state the tempo in each lesson's copy", () => {
    for (const riff of RIFFS2) {
      const lesson = lessonsFor("bass").find((l) => l.id === riff.id)!;
      assert.ok(lesson.why?.includes(riff.artist), `${riff.id} credits ${riff.artist}`);
      assert.ok(lesson.why?.includes(String(riff.bpm)), `${riff.id} states its BPM`);
    }
    const smooth = lessonsFor("bass").find((l) => l.id === "lesson_bass_smooth_operator_01")!;
    assert.ok(smooth.why?.includes("Denman"), "Smooth Operator credits Paul Denman's bassline");
    const mission = lessonsFor("bass").find((l) => l.id === "lesson_bass_mission_01")!;
    assert.ok(mission.why?.includes("Carol Kaye"), "Mission: Impossible credits the original bassist");
    assert.ok(mission.why?.includes("5/4"), "Mission: Impossible names its meter");
  });

  it("each pack #2 lesson carries a bespoke judged pattern", () => {
    for (const riff of RIFFS2) {
      assert.ok(BASS_DAILY_CUES[riff.id], riff.id);
      assert.equal(hasInstrumentPattern(itemFor(riff.id)), true, riff.id);
      assert.ok(dailyInstrumentCues(itemFor(riff.id)), riff.id);
    }
  });

  it("every pack #2 cue is a single judged note inside the bass's range", () => {
    for (const riff of RIFFS2) {
      const lesson = lessonsFor("bass").find((l) => l.id === riff.id)!;
      const cues = dailyInstrumentCues(itemFor(riff.id))!;
      assert.equal(cues.length, riff.cues, riff.id);
      for (const cue of cues) {
        assert.equal(cue.notes?.length, 1, `${riff.id} beat ${cue.beat}`);
        const midi = cue.notes![0];
        assert.ok(midi >= 28 && midi <= 43, `${riff.id}: midi ${midi} on the bass`);
        assert.equal(cue.expectedMidi, undefined, `${riff.id}: bass judging rides notes, not expectedMidi`);
      }
      // The phrase never spills past the lesson's last beat.
      assert.ok(cues[cues.length - 1].beat < lesson.bars * beatsPerBarOf(lesson), riff.id);
    }
  });

  it("Peter Gunn: the two-bar ostinato — E-string cell, one lift to A per pass", () => {
    const cues = dailyInstrumentCues(itemFor("lesson_bass_peter_gunn_01"))!;
    const phrase = cues.slice(0, 16);
    assert.deepEqual(
      phrase.map((c) => c.notes![0]),
      [28, 28, 30, 28, 31, 28, 31, 28, 28, 28, 30, 28, 31, 28, 33, 31],
    );
    assert.deepEqual(
      phrase.map((c) => c.beat),
      Array.from({ length: 16 }, (_, i) => i * 0.5),
    );
    // Four passes across eight bars, each one the phrase again.
    for (let pass = 1; pass < 4; pass++)
      assert.deepEqual(
        cues.slice(pass * 16, pass * 16 + 16).map((c) => c.notes![0]),
        phrase.map((c) => c.notes![0]),
        `pass ${pass}`,
      );
  });

  it("Godzilla: heavy quarters and real rests — E, E, G, then A, B♭, A, E", () => {
    const cues = dailyInstrumentCues(itemFor("lesson_bass_godzilla_01"))!;
    const phrase = cues.slice(0, 7);
    assert.deepEqual(phrase.map((c) => c.notes![0]), [28, 28, 31, 33, 34, 33, 28]);
    assert.deepEqual(phrase.map((c) => c.beat), [0, 2, 3, 4, 5, 6, 7]);
    assert.equal(phrase[0].duration, 1.8, "the first E lands and the rest stays empty");
  });

  it("Smooth Operator: the D-minor line flows — held roots, soft pickups", () => {
    const cues = dailyInstrumentCues(itemFor("lesson_bass_smooth_operator_01"))!;
    const phrase = cues.slice(0, 8);
    assert.deepEqual(phrase.map((c) => c.notes![0]), [38, 41, 33, 36, 38, 41, 43, 41]);
    assert.deepEqual(phrase.map((c) => c.beat), [0, 1.5, 2, 3, 4, 5.5, 6, 7]);
    assert.equal(phrase[0].duration, 1.4, "legato: the D holds into its pickup");
  });

  it("bad guy: the hook as call and answer, every note punched short", () => {
    const cues = dailyInstrumentCues(itemFor("lesson_bass_bad_guy_01"))!;
    const phrase = cues.slice(0, 8);
    assert.deepEqual(phrase.map((c) => c.notes![0]), [31, 31, 34, 31, 36, 34, 31, 31]);
    assert.deepEqual(phrase.map((c) => c.beat), [0, 1, 2, 3, 4, 5, 6, 7]);
    for (const cue of cues) assert.ok((cue.duration ?? 0) <= 0.55, "staccato: nothing rings");
  });

  it("Mission: Impossible: the whole lesson runs on the 5-grid", () => {
    const lesson = lessonsFor("bass").find((l) => l.id === "lesson_bass_mission_01")!;
    assert.equal(lesson.beatsPerBar, 5);
    assert.equal(beatsPerBarOf(lesson), 5);
    const cues = dailyInstrumentCues(itemFor(lesson.id))!;
    const phrase = cues.slice(0, 10);
    assert.deepEqual(phrase.map((c) => c.notes![0]), [31, 31, 34, 36, 31, 31, 31, 29, 39, 38]);
    assert.deepEqual(
      phrase.map((c) => c.beat),
      Array.from({ length: 10 }, (_, i) => i),
    );
    // Three passes of the two-bar phrase tile at beats 0, 10, 20 of the
    // 30-beat lesson; no cue crosses a five-beat bar line out of shape.
    assert.equal(cues.length, 30);
    assert.deepEqual(
      cues.filter((c) => c.beat % 10 === 0).map((c) => c.beat),
      [0, 10, 20],
    );
    for (const cue of cues) {
      const inPhrase = cue.beat % 10;
      assert.equal(cue.notes![0], phrase[inPhrase].notes![0], `beat ${cue.beat} repeats the phrase`);
    }
    // The timeline keeps the same grid: six bars, five beats each, five
    // attacks per bar, and the last bar closes the 30-beat lesson.
    const events = buildTimeline(itemFor(lesson.id));
    assert.equal(events.length, cues.length);
    for (let bar = 0; bar < 6; bar++)
      assert.equal(events.filter((e) => e.bar === bar).length, 5, `bar ${bar} holds five attacks`);
    assert.ok(events.every((e) => e.bar * 5 + e.beat < 30), "no event past the lesson's end");
    assert.deepEqual(
      events.map((e) => e.notes?.[0]),
      cues.map((c) => c.notes![0]),
    );
  });

  it("timelines carry the same judged notes the cues declare", () => {
    for (const riff of RIFFS2) {
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
