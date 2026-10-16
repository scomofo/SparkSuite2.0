import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { VOCAL_DAILY_CUES, vocalDailyCues } from "./instrument-patterns.ts";
import { instrumentById, lessonsFor, withSurface } from "./instruments.ts";
import { beatsPerBarOf, type PlanItem } from "./types.ts";

function itemFor(lessonId: string): PlanItem {
  const lesson = lessonsFor("vocals").find((l) => l.id === lessonId)!;
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
    instrumentById("vocals"),
  );
}

const SONGS = [
  { id: "lesson_vocals_stand_by_me_01", order: 12, title: "Stand By Me", artist: "Ben E. King", bpm: 66, prereq: ["lesson_vocals_song_01"], cues: 31 },
  { id: "lesson_vocals_lean_on_me_01", order: 13, title: "Lean on Me", artist: "Bill Withers", bpm: 72, prereq: ["lesson_vocals_stand_by_me_01"], cues: 27 },
  { id: "lesson_vocals_cant_help_01", order: 14, title: "Can't Help Falling in Love", artist: "Elvis Presley", bpm: 60, prereq: ["lesson_vocals_lean_on_me_01"], cues: 17 },
  { id: "lesson_vocals_hallelujah_01", order: 15, title: "Hallelujah", artist: "Leonard Cohen", bpm: 60, prereq: ["lesson_vocals_cant_help_01"], cues: 47 },
] as const;

describe("vocals famous-song lessons", () => {
  it("extend the vocals sequence at orders 12–15, chained from Frère Jacques", () => {
    const vocals = lessonsFor("vocals");
    assert.equal(vocals.length, 15);
    for (const song of SONGS) {
      const lesson = vocals.find((l) => l.id === song.id)!;
      assert.ok(lesson, song.id);
      assert.equal(lesson.order, song.order, song.id);
      assert.equal(lesson.title, song.title, song.id);
      assert.equal(lesson.repertoire, song.title, song.id);
      assert.equal(lesson.type, "song", song.id);
      assert.equal(lesson.process, "perform", song.id);
      assert.equal(lesson.trackId, "track_vocals_pitch", song.id);
      assert.equal(lesson.bpm, song.bpm, song.id);
      assert.deepEqual(lesson.prerequisites, [...song.prereq], song.id);
    }
    assert.deepEqual(
      vocals.map((l) => l.order),
      Array.from({ length: 15 }, (_, i) => i + 1),
    );
  });

  it("credit the original artist and state the tempo in each lesson's copy", () => {
    for (const song of SONGS) {
      const lesson = lessonsFor("vocals").find((l) => l.id === song.id)!;
      assert.ok(lesson.why?.includes(song.artist), `${song.id} credits ${song.artist}`);
      assert.ok(lesson.why?.includes(String(song.bpm)), `${song.id} states its BPM`);
    }
  });

  it("every song carries a bespoke phrase; every cue is judged and inside the phrase", () => {
    for (const song of SONGS) {
      const pattern = VOCAL_DAILY_CUES[song.id];
      assert.ok(pattern, song.id);
      const lesson = lessonsFor("vocals").find((l) => l.id === song.id)!;
      assert.equal(pattern.beats, lesson.bars * 4, `${song.id}: the phrase spans the whole lesson`);
      for (const cue of pattern.cues) {
        assert.equal(cue.expectedMidi, cue.notes[0], `${song.id} beat ${cue.beat}: judged on the sung note`);
        assert.ok(cue.beat >= 0 && cue.beat < pattern.beats, `${song.id} beat ${cue.beat}`);
        if (cue.holdBeats) assert.ok(cue.beat + cue.holdBeats <= pattern.beats, `${song.id}: hold ends inside the lesson`);
      }
      const cues = vocalDailyCues(itemFor(song.id))!;
      assert.equal(cues.length, song.cues, song.id);
    }
  });

  it("all four songs live in one singable band: G3 to A4", () => {
    for (const song of SONGS) {
      for (const cue of VOCAL_DAILY_CUES[song.id].cues) {
        assert.ok(cue.expectedMidi! >= 55 && cue.expectedMidi! <= 69, `${song.id}: ${cue.expectedMidi} in [55, 69]`);
      }
    }
  });

  it("Stand By Me: the verse climbs C–E–A, and the hook sits on A and G", () => {
    const cues = vocalDailyCues(itemFor("lesson_vocals_stand_by_me_01"))!;
    assert.deepEqual(cues.slice(0, 5).map((c) => c.expectedMidi), [60, 64, 69, 69, 67]);
    assert.deepEqual(cues.slice(-3).map((c) => c.expectedMidi), [64, 62, 60], "the hook walks home");
    assert.equal(cues.at(-1)?.holdBeats, 2, "the last note is held to the end");
  });

  it("Lean on Me: the verse staircase and the four-note chorus", () => {
    const cues = vocalDailyCues(itemFor("lesson_vocals_lean_on_me_01"))!;
    assert.deepEqual(cues.slice(0, 5).map((c) => c.expectedMidi), [60, 64, 67, 67, 69]);
    const chorus = cues.filter((c) => c.beat >= 16);
    assert.deepEqual(
      [...new Set(chorus.map((c) => c.expectedMidi))].sort((a, b) => a! - b!),
      [60, 62, 64, 67, 69],
      "the chorus stays inside the staircase notes",
    );
    assert.equal(cues.at(-1)?.expectedMidi, 60, "settles home on C");
  });

  it("Can't Help Falling in Love: a lesson of holds, one low G", () => {
    const cues = vocalDailyCues(itemFor("lesson_vocals_cant_help_01"))!;
    assert.ok(cues.slice(0, 13).every((c) => (c.holdBeats ?? 0) >= 2), "the wide part is all two-beat holds");
    assert.equal(cues.at(-1)?.holdBeats, 1, "the last note is held to the end");
    assert.equal(cues.filter((c) => c.expectedMidi === 55).length, 1, "one drop to the low G");
    assert.equal(Math.max(...cues.map((c) => c.holdBeats ?? 0)), 4, "the longest hold is the whole-bar C");
    assert.deepEqual(cues.slice(0, 7).map((c) => c.expectedMidi), [64, 64, 65, 67, 64, 62, 60]);
  });

  it("Hallelujah: the whole verse, and 'the fourth' lands on A over F", () => {
    const cues = vocalDailyCues(itemFor("lesson_vocals_hallelujah_01"))!;
    assert.equal(cues[0].expectedMidi, 55, "starts on the low G");
    assert.equal(cues.find((c) => c.beat === 33)?.expectedMidi, 69, "the fourth — A");
    assert.equal(cues.find((c) => c.beat === 42)?.expectedMidi, 69, "the major lift peaks on A");
    assert.equal(cues.at(-1)?.beat, 47, "the hallelujah is the last beat of the verse");
    assert.equal(cues.at(-1)?.expectedMidi, 67);
  });

  it("Frère Jacques is untouched: still one 32-cue pass", () => {
    const cues = vocalDailyCues(itemFor("lesson_vocals_song_01"))!;
    assert.equal(cues.length, 32);
    assert.equal(VOCAL_DAILY_CUES["lesson_vocals_song_01"].beats, 32);
  });
});
