import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { buildTimeline } from "./practice.ts";
import { VIOLIN_DAILY_CUES, dailyInstrumentCues, hasInstrumentPattern } from "./instrument-patterns.ts";
import { instrumentById, lessonsFor, withSurface } from "./instruments.ts";
import { beatsPerBarOf, type PlanItem } from "./types.ts";

function itemFor(lessonId: string): PlanItem {
  const lesson = lessonsFor("violin").find((l) => l.id === lessonId)!;
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
    instrumentById("violin"),
  );
}

const SONGS = [
  { id: "lesson_violin_ashokan_01", order: 17, title: "Ashokan Farewell", artist: "Jay Ungar", bpm: 60, prereq: ["lesson_violin_twinkle_01"], cues: 20 },
  { id: "lesson_violin_bittersweet_01", order: 18, title: "Bittersweet Symphony", artist: "The Verve", bpm: 76, prereq: ["lesson_violin_ashokan_01"], cues: 32 },
  { id: "lesson_violin_viva_01", order: 19, title: "Viva la Vida", artist: "Coldplay", bpm: 92, prereq: ["lesson_violin_bittersweet_01"], cues: 64 },
  { id: "lesson_violin_hallelujah_01", order: 20, title: "Hallelujah", artist: "Leonard Cohen", bpm: 60, prereq: ["lesson_violin_viva_01"], cues: 31 },
] as const;

describe("violin famous-song lessons", () => {
  it("extend the violin sequence at orders 17–20, chained from Twinkle", () => {
    const violin = lessonsFor("violin");
    assert.equal(violin.length, 20);
    for (const song of SONGS) {
      const lesson = violin.find((l) => l.id === song.id)!;
      assert.ok(lesson, song.id);
      assert.equal(lesson.order, song.order, song.id);
      assert.equal(lesson.title, song.title, song.id);
      assert.equal(lesson.repertoire, song.title, song.id);
      assert.equal(lesson.type, "song", song.id);
      assert.equal(lesson.process, "perform", song.id);
      assert.equal(lesson.trackId, "track_violin_songs", song.id);
      assert.equal(lesson.bpm, song.bpm, song.id);
      assert.deepEqual(lesson.prerequisites, [...song.prereq], song.id);
    }
    assert.deepEqual(
      violin.map((l) => l.order),
      Array.from({ length: 20 }, (_, i) => i + 1),
    );
  });

  it("credit the original artist and state the tempo in each lesson's copy", () => {
    for (const song of SONGS) {
      const lesson = lessonsFor("violin").find((l) => l.id === song.id)!;
      assert.ok(lesson.why?.includes(song.artist), `${song.id} credits ${song.artist}`);
      assert.ok(lesson.why?.includes(String(song.bpm)), `${song.id} states its BPM`);
    }
  });

  it("every song is single notes inside the first-position fingering map (55–74)", () => {
    for (const song of SONGS) {
      const pattern = VIOLIN_DAILY_CUES[song.id];
      assert.ok(pattern, song.id);
      for (const cue of pattern.cues) {
        assert.equal(cue.notes?.length, 1, `${song.id} beat ${cue.beat}: single notes only, no double stops`);
        const midi = cue.notes![0];
        assert.ok(midi >= 55 && midi <= 74, `${song.id}: ${midi} has a first-position fingering`);
        assert.ok(cue.beat >= 0 && cue.beat < pattern.beats, `${song.id} beat ${cue.beat}`);
        assert.ok(cue.detail.length > 0, `${song.id}: every cue names its fingering`);
      }
      assert.ok(hasInstrumentPattern(itemFor(song.id)), song.id);
      const cues = dailyInstrumentCues(itemFor(song.id))!;
      assert.equal(cues.length, song.cues, song.id);
      const events = buildTimeline(itemFor(song.id));
      assert.equal(events.length, cues.length, `${song.id}: timeline parity`);
    }
  });

  it("bow marks alternate down/up from a down-bow, Twinkle-style", () => {
    for (const song of SONGS) {
      const cues = dailyInstrumentCues(itemFor(song.id))!;
      cues.forEach((cue, i) => {
        assert.ok(cue.label.endsWith(i % 2 === 0 ? "⊓" : "∨"), `${song.id} cue ${i}: ${cue.label}`);
      });
    }
  });

  it("Ashokan Farewell: D up to B and home, the last note held four beats", () => {
    const cues = dailyInstrumentCues(itemFor("lesson_violin_ashokan_01"))!;
    assert.deepEqual(cues.slice(0, 4).map((c) => c.notes?.[0]), [62, 66, 69, 71]);
    assert.equal(cues.at(-1)?.notes?.[0], 62, "ends at home D");
    assert.equal(cues.at(-1)?.duration, 3.8, "the final D is held");
  });

  it("Bittersweet Symphony: the A-string loop, D–C♯–B–A and back", () => {
    const cues = dailyInstrumentCues(itemFor("lesson_violin_bittersweet_01"))!;
    assert.deepEqual(
      cues.slice(0, 8).map((c) => c.notes?.[0]),
      [74, 73, 71, 69, 71, 73, 74, 73],
    );
    assert.ok(cues.every((c) => (c.notes?.[0] ?? 0) >= 69), "the loop never leaves the A string");
  });

  it("Viva la Vida: the transposition is stated in the copy; the figure pulses in eighths", () => {
    const lesson = lessonsFor("violin").find((l) => l.id === "lesson_violin_viva_01")!;
    assert.ok(lesson.why?.includes("C sharp minor"), "the record's key is named");
    assert.ok(lesson.why?.includes("A minor"), "and the taught key with it");
    const cues = dailyInstrumentCues(itemFor("lesson_violin_viva_01"))!;
    assert.deepEqual(
      cues.slice(0, 8).map((c) => c.beat),
      [0, 0.5, 1, 1.5, 2, 2.5, 3, 3.5],
      "pulsing eighth notes",
    );
    assert.deepEqual(cues.slice(0, 8).map((c) => c.notes?.[0]), [69, 72, 69, 72, 74, 72, 69, 72], "the Am bar");
  });

  it("Hallelujah: the verse in G — the vocals line a fourth up", () => {
    const cues = dailyInstrumentCues(itemFor("lesson_violin_hallelujah_01"))!;
    assert.deepEqual(cues.slice(0, 8).map((c) => c.notes?.[0]), [62, 67, 69, 71, 69, 67, 69, 71]);
    assert.deepEqual(cues.slice(-4).map((c) => c.notes?.[0]), [74, 74, 74, 74], "the last bar sits on D");
    const held = cues.find((c) => c.beat === 26)!;
    assert.equal(held.duration, 1.9, "one held note, like the sung verse");
  });

  it("Twinkle is untouched: still a 48-beat phrase of 42 attacks", () => {
    assert.equal(VIOLIN_DAILY_CUES["lesson_violin_twinkle_01"].beats, 48);
    assert.equal(dailyInstrumentCues(itemFor("lesson_violin_twinkle_01"))!.length, 42);
  });
});
