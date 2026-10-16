import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { buildTimeline } from "./practice.ts";
import { dailyInstrumentCues, hasInstrumentPattern } from "./instrument-patterns.ts";
import { instrumentById, lessonsFor, withSurface } from "./instruments.ts";
import { beatsPerBarOf, type PlanItem } from "./types.ts";

function itemFor(lessonId: string): PlanItem {
  const lesson = lessonsFor("piano").find((l) => l.id === lessonId)!;
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
    instrumentById("piano"),
  );
}

const SONGS = [
  { id: "lesson_piano_heart_soul_01", order: 18, title: "Heart and Soul", artist: "Hoagy Carmichael", bpm: 72, prereq: ["lesson_piano_four_01"], cues: 16 },
  { id: "lesson_piano_hallelujah_01", order: 19, title: "Hallelujah", artist: "Leonard Cohen", bpm: 60, prereq: ["lesson_piano_song_ode_01"], cues: 31 },
  { id: "lesson_piano_imagine_01", order: 20, title: "Imagine", artist: "John Lennon", bpm: 76, prereq: ["lesson_piano_arpeggio_01"], cues: 32 },
  { id: "lesson_piano_let_it_be_01", order: 21, title: "Let It Be", artist: "The Beatles", bpm: 72, prereq: ["lesson_piano_imagine_01"], cues: 32 },
] as const;

describe("piano famous-song lessons", () => {
  it("extend the piano sequence at orders 18–21", () => {
    const piano = lessonsFor("piano");
    assert.equal(piano.length, 21);
    for (const song of SONGS) {
      const lesson = piano.find((l) => l.id === song.id)!;
      assert.ok(lesson, song.id);
      assert.equal(lesson.order, song.order, song.id);
      assert.equal(lesson.title, song.title, song.id);
      assert.equal(lesson.repertoire, song.title, song.id);
      assert.equal(lesson.type, "song", song.id);
      assert.equal(lesson.process, "perform", song.id);
      assert.equal(lesson.trackId, "track_piano_cadences", song.id);
      assert.equal(lesson.bpm, song.bpm, song.id);
      assert.deepEqual(lesson.prerequisites, [...song.prereq], song.id);
    }
    assert.deepEqual(
      piano.map((l) => l.order),
      Array.from({ length: 21 }, (_, i) => i + 1),
    );
  });

  it("credit the original artist and state the tempo in each lesson's copy", () => {
    for (const song of SONGS) {
      const lesson = lessonsFor("piano").find((l) => l.id === song.id)!;
      assert.ok(lesson.why?.includes(song.artist), `${song.id} credits ${song.artist}`);
      assert.ok(lesson.why?.includes(String(song.bpm)), `${song.id} states its BPM`);
    }
  });

  it("each song carries a through-composed cue set spanning its bars exactly", () => {
    for (const song of SONGS) {
      const item = itemFor(song.id);
      assert.ok(hasInstrumentPattern(item), song.id);
      const cues = dailyInstrumentCues(item)!;
      assert.ok(cues, song.id);
      assert.equal(cues.length, song.cues, song.id);
      const total = item.bars * 4;
      for (const cue of cues) {
        assert.ok(cue.beat >= 0 && cue.beat < total, `${song.id} beat ${cue.beat}`);
        assert.ok(cue.beat + (cue.duration ?? 0) <= total + 0.001, `${song.id} ends inside the lesson`);
      }
      const events = buildTimeline(item);
      assert.equal(events.length, cues.length, `${song.id}: timeline parity`);
    }
    // The older non-pattern piano lessons still have no bespoke set.
    assert.equal(dailyInstrumentCues(itemFor("lesson_piano_c_triad_01")), undefined);
  });

  it("Heart and Soul: left-hand roots walk C–Am–F–G under right-hand chords", () => {
    const cues = dailyInstrumentCues(itemFor("lesson_piano_heart_soul_01"))!;
    const barStarts = cues.filter((c) => c.beat % 4 === 0);
    assert.deepEqual(barStarts.map((c) => c.label), ["C", "Am", "F", "G", "C", "Am", "F", "G"]);
    assert.deepEqual(
      barStarts.map((c) => c.notes?.[0]),
      [48, 45, 41, 43, 48, 45, 41, 43],
      "the walking roots",
    );
    assert.deepEqual(cues[0].notes, [48, 60, 64, 67], "C: root plus the triad");
    assert.ok(cues.every((c) => c.beat % 2 === 0), "two hits a bar — beats 1 and 3");
  });

  it("Hallelujah: the right hand sings the vocals track's line over bundled roots", () => {
    const cues = dailyInstrumentCues(itemFor("lesson_piano_hallelujah_01"))!;
    assert.deepEqual(cues[0].notes, [48, 55], "C root under the low G");
    const melody = cues.map((c) => c.notes!.at(-1));
    assert.deepEqual(melody.slice(0, 8), [55, 60, 62, 64, 62, 60, 62, 64], "the verse's first two bars");
    assert.deepEqual(melody.slice(-4), [67, 67, 67, 67], "the last bar sits on G");
  });

  it("Imagine: C–Cmaj7–F broken chords; the Cmaj7 bar carries the B", () => {
    const cues = dailyInstrumentCues(itemFor("lesson_piano_imagine_01"))!;
    const barLabels = cues.filter((c) => c.beat % 4 === 0).map((c) => c.label);
    assert.deepEqual(barLabels, ["C", "Cmaj7", "F", "F", "C", "Cmaj7", "F", "F"]);
    assert.deepEqual(
      cues.slice(4, 8).map((c) => c.notes),
      [[48, 60], [64], [71], [64]],
      "the Cmaj7 roll: C root bundled, then E, B, E",
    );
  });

  it("Let It Be: the four-chord loop as broken chords, twice round", () => {
    const cues = dailyInstrumentCues(itemFor("lesson_piano_let_it_be_01"))!;
    const barLabels = cues.filter((c) => c.beat % 4 === 0).map((c) => c.label);
    assert.deepEqual(barLabels, ["C", "G", "Am", "F", "C", "G", "Am", "F"]);
    assert.deepEqual(
      cues.slice(0, 4).map((c) => c.notes),
      [[48, 60], [64], [67], [64]],
      "the C roll: root–third–fifth–third",
    );
  });
});
