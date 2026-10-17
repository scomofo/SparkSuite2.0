import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { LAPSTEEL_DAILY_CUES, dailyInstrumentCues } from "./instrument-patterns.ts";
import { instrumentById, lessonsFor, withSurface } from "./instruments.ts";
import { beatsPerBarOf, type PlanItem } from "./types.ts";

function itemFor(lessonId: string): PlanItem {
  const lesson = lessonsFor("lapsteel").find((l) => l.id === lessonId)!;
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
    instrumentById("lapsteel"),
  );
}

const SONGS = [
  { id: "lesson_lapsteel_sleep_walk_01", order: 14, title: "Sleep Walk", artist: "Santo & Johnny", bpm: 66, prereq: ["lesson_lapsteel_melody_01"], cues: 24 },
  { id: "lesson_lapsteel_rag_01", order: 15, title: "Steel Guitar Rag", artist: "McAuliffe", bpm: 80, prereq: ["lesson_lapsteel_sleep_walk_01"], cues: 60 },
  { id: "lesson_lapsteel_blue_hawaii_01", order: 16, title: "Blue Hawaii", artist: "Elvis Presley", bpm: 60, prereq: ["lesson_lapsteel_rag_01"], cues: 24 },
  { id: "lesson_lapsteel_cheatin_heart_01", order: 17, title: "Your Cheatin' Heart", artist: "Hank Williams", bpm: 66, prereq: ["lesson_lapsteel_blue_hawaii_01"], cues: 30 },
] as const;

describe("lap steel famous-song lessons", () => {
  it("the famous songs sit at orders 14–17, gated on the melody lesson", () => {
    const steel = lessonsFor("lapsteel");
    assert.equal(steel.length, 20);
    for (const song of SONGS) {
      const lesson = steel.find((l) => l.id === song.id)!;
      assert.ok(lesson, song.id);
      assert.equal(lesson.order, song.order, song.id);
      assert.equal(lesson.title, song.title, song.id);
      assert.equal(lesson.repertoire, song.title, song.id);
      assert.equal(lesson.type, "song", song.id);
      assert.equal(lesson.process, "perform", song.id);
      assert.equal(lesson.trackId, "track_lapsteel_songs", song.id);
      assert.equal(lesson.bpm, song.bpm, song.id);
      assert.deepEqual(lesson.prerequisites, [...song.prereq], song.id);
    }
    assert.deepEqual(
      steel.map((l) => l.order),
      Array.from({ length: 20 }, (_, i) => i + 1),
    );
  });

  it("credit the original artist and state the tempo in each lesson's copy", () => {
    for (const song of SONGS) {
      const lesson = lessonsFor("lapsteel").find((l) => l.id === song.id)!;
      assert.ok(lesson.why?.includes(song.artist), `${song.id} credits ${song.artist}`);
      assert.ok(lesson.why?.includes(String(song.bpm)), `${song.id} states its BPM`);
    }
  });

  it("every song is a single-note line: one note per cue, no brushes, no chord sets", () => {
    for (const song of SONGS) {
      const pattern = LAPSTEEL_DAILY_CUES[song.id];
      assert.ok(pattern, song.id);
      for (const cue of pattern.cues) {
        assert.equal(cue.notes?.length, 1, `${song.id} beat ${cue.beat}: a single note`);
        assert.equal(cue.chord, undefined, `${song.id} beat ${cue.beat}: no chord judging`);
        assert.ok(cue.beat >= 0 && cue.beat < pattern.beats, `${song.id} beat ${cue.beat}`);
        assert.ok(cue.beat + (cue.duration ?? 0) <= pattern.beats + 0.001, `${song.id}: inside the phrase`);
        // The whole batch plays on the 2nd string's ladder plus the Rag's
        // one open-3rd-string answer: midis 57 and 60–72.
        const midi = cue.notes![0];
        assert.ok(midi === 57 || (midi >= 60 && midi <= 72), `${song.id}: ${midi} on the ladder`);
      }
      const cues = dailyInstrumentCues(itemFor(song.id))!;
      assert.equal(cues.length, song.cues, song.id);
    }
  });

  it("barred notes are judged by expectedMidi; open-string pitches are not", () => {
    const cues = dailyInstrumentCues(itemFor("lesson_lapsteel_sleep_walk_01"))!;
    const highC = cues.find((c) => c.beat === 0)!;
    assert.equal(highC.expectedMidi, 72, "the barred high C is judged");
    const home = cues.find((c) => c.beat === 14)!;
    assert.equal(home.notes?.[0], 60);
    assert.equal(home.expectedMidi, undefined, "the open string needs no bar placement");
    const judged = cues.filter((c) => c.expectedMidi !== undefined);
    assert.ok(judged.length > 0, "the line is judged");
  });

  it("Sleep Walk: high C down to home, on the ladder", () => {
    const pattern = LAPSTEEL_DAILY_CUES["lesson_lapsteel_sleep_walk_01"];
    assert.deepEqual(
      pattern.cues.map((c) => c.notes?.[0]),
      [72, 71, 69, 67, 69, 67, 64, 69, 67, 64, 62, 60],
    );
  });

  it("Steel Guitar Rag: even eighth notes, and the copy owns the single-note arrangement", () => {
    const pattern = LAPSTEEL_DAILY_CUES["lesson_lapsteel_rag_01"];
    assert.equal(pattern.cues.length, 15);
    assert.deepEqual(
      pattern.cues.slice(0, 8).map((c) => c.beat),
      [0, 0.5, 1, 1.5, 2, 2.5, 3, 3.5],
      "eighth notes",
    );
    assert.equal(pattern.cues.at(-1)?.notes?.[0], 57, "the low A answers at the end");
    const lesson = lessonsFor("lapsteel").find((l) => l.id === "lesson_lapsteel_rag_01")!;
    assert.ok(lesson.why?.includes("single-note"), "the copy says the head is a single-note line");
    assert.ok(lesson.objectives.some((o) => o.includes("no brushes")), "no brush judging, by design");
  });

  it("Your Cheatin' Heart: the second line climbs to the high C once", () => {
    const pattern = LAPSTEEL_DAILY_CUES["lesson_lapsteel_cheatin_heart_01"];
    const midis = pattern.cues.map((c) => c.notes?.[0]);
    assert.equal(midis.filter((m) => m === 72).length, 1, "one trip to the top");
    assert.equal(midis.at(-1), 60, "ends at home");
  });
});
