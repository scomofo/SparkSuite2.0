import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { buildTimeline, patternEndSec } from "./practice.ts";
import { drumDailyPattern } from "./instrument-patterns.ts";
import { instrumentById, lessonsFor, withSurface } from "./instruments.ts";
import { beatsPerBarOf, type PlanItem } from "./types.ts";

function itemFor(lessonId: string): PlanItem {
  const lesson = lessonsFor("drums").find((l) => l.id === lessonId)!;
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
    instrumentById("drums"),
  );
}

const SONGS = [
  { id: "lesson_drums_rock_you_01", order: 17, title: "We Will Rock You", artist: "Queen", bpm: 80, events: 24 },
  { id: "lesson_drums_back_in_black_01", order: 18, title: "Back in Black", artist: "AC/DC", bpm: 88, events: 72 },
  { id: "lesson_drums_billie_jean_01", order: 19, title: "Billie Jean", artist: "Michael Jackson", bpm: 96, events: 72 },
  { id: "lesson_drums_another_one_01", order: 20, title: "Another One Bites the Dust", artist: "Queen", bpm: 92, events: 80 },
  { id: "lesson_drums_come_together_01", order: 21, title: "Come Together", artist: "The Beatles", bpm: 80, events: 36 },
] as const;

describe("drums famous-groove lessons", () => {
  it("close the drums sequence at orders 17–21, easiest first", () => {
    const drums = lessonsFor("drums");
    assert.equal(drums.length, 21);
    SONGS.forEach((song, i) => {
      const lesson = drums.find((l) => l.id === song.id)!;
      assert.ok(lesson, song.id);
      assert.equal(lesson.order, song.order, song.id);
      assert.equal(lesson.title, song.title, song.id);
      assert.equal(lesson.repertoire, song.title, song.id);
      assert.equal(lesson.type, "song", song.id);
      assert.equal(lesson.process, "perform", song.id);
      assert.equal(lesson.trackId, "track_drums_groove", song.id);
      assert.equal(lesson.bpm, song.bpm, song.id);
      // 4/4 songs: no meter declared (the waltz family stays the only 3/4 zone).
      assert.equal(lesson.beatsPerBar, undefined, song.id);
      const previous = i === 0 ? "lesson_drums_backbeat_01" : SONGS[i - 1].id;
      assert.deepEqual(lesson.prerequisites, [previous], song.id);
    });
    assert.deepEqual(
      drums.map((l) => l.order),
      Array.from({ length: 21 }, (_, i) => i + 1),
    );
  });

  it("credit the original artist and state the tempo in each lesson's copy", () => {
    for (const song of SONGS) {
      const lesson = lessonsFor("drums").find((l) => l.id === song.id)!;
      assert.ok(lesson.why?.includes(song.artist), `${song.id} credits ${song.artist}`);
      assert.ok(lesson.why?.includes(String(song.bpm)), `${song.id} states its BPM`);
    }
  });

  it("each song lesson carries a declared pattern; the fallback lessons still don't", () => {
    for (const song of SONGS) assert.ok(drumDailyPattern(song.id), song.id);
    for (const old of ["lesson_drums_kick_01", "lesson_drums_backbeat_01", "lesson_drums_four_01"])
      assert.equal(drumDailyPattern(old), undefined, old);
  });

  it("every declared hit sits inside its phrase, on the pad map", () => {
    for (const song of SONGS) {
      const pattern = drumDailyPattern(song.id)!;
      for (const hit of pattern.hits) {
        assert.ok(hit.beat >= 0 && hit.beat < pattern.beats, `${song.id} beat ${hit.beat}`);
        assert.ok(hit.pads.length >= 1, song.id);
        for (const pad of hit.pads) assert.ok([0, 1, 2, 3].includes(pad), `${song.id} pad ${pad}`);
        assert.ok(hit.detail.length > 0, song.id);
      }
    }
  });

  it("We Will Rock You: stomp, stomp, clap — kick, kick, snare, then space", () => {
    const events = buildTimeline(itemFor("lesson_drums_rock_you_01"));
    assert.equal(events.length, 24);
    const bar = events.slice(0, 3);
    assert.deepEqual(bar.map((e) => e.beat), [0, 1, 2]);
    assert.deepEqual(bar.map((e) => e.string), [0, 0, 1], "kick, kick, snare");
    assert.ok(events.every((e) => e.beat !== 3), "beat 4 is always empty");
  });

  it("Back in Black: the backbeat and hats joined, plus the push on the and of 4", () => {
    const events = buildTimeline(itemFor("lesson_drums_back_in_black_01"));
    assert.equal(events.length, 72);
    const bar = events.slice(0, 9);
    assert.deepEqual(bar.map((e) => e.beat), [0, 0.5, 1, 1.5, 2, 2.5, 3, 3.5, 3.5]);
    assert.deepEqual(bar.map((e) => e.string), [0, 2, 1, 2, 0, 2, 1, 0, 2]);
    const kicks = events.filter((e) => e.string === 0 && e.bar === 0).map((e) => e.beat);
    assert.deepEqual(kicks, [0, 2, 3.5], "kick on 1, 3, and the and of 4");
  });

  it("Billie Jean: the kick pushes once a bar, on the and of 2", () => {
    const events = buildTimeline(itemFor("lesson_drums_billie_jean_01"));
    assert.equal(events.length, 72);
    const kicks = events.filter((e) => e.string === 0 && e.bar === 0).map((e) => e.beat);
    assert.deepEqual(kicks, [0, 1.5, 2], "kick on 1, the and of 2, and 3");
    const snares = events.filter((e) => e.string === 1 && e.bar === 0).map((e) => e.beat);
    assert.deepEqual(snares, [1, 3], "the backbeat never moves");
  });

  it("Another One Bites the Dust: four on the floor under offbeat hats", () => {
    const events = buildTimeline(itemFor("lesson_drums_another_one_01"));
    assert.equal(events.length, 80);
    const kicks = events.filter((e) => e.string === 0 && e.bar === 0).map((e) => e.beat);
    assert.deepEqual(kicks, [0, 1, 2, 3], "a kick on every beat");
    const hats = events.filter((e) => e.string === 2 && e.bar === 0).map((e) => e.beat);
    assert.deepEqual(hats, [0.5, 1.5, 2.5, 3.5], "hats live on the offbeats");
  });

  it("Come Together: a bar of toms, then the groove lands", () => {
    const events = buildTimeline(itemFor("lesson_drums_come_together_01"));
    assert.equal(events.length, 36);
    const phrase = events.slice(0, 9);
    assert.deepEqual(phrase.map((e) => e.beat), [0, 1, 1.5, 2, 3, 0, 1, 2, 3]);
    assert.deepEqual(phrase.map((e) => e.bar), [0, 0, 0, 0, 0, 1, 1, 1, 1]);
    assert.deepEqual(
      phrase.map((e) => e.string),
      [3, 3, 3, 3, 3, 0, 1, 0, 1],
      "five toms, then kick, snare, kick, snare",
    );
  });

  it("timelines stay inside the lesson and in time order", () => {
    for (const song of SONGS) {
      const item = itemFor(song.id);
      const events = buildTimeline(item);
      assert.equal(events.length, song.events, song.id);
      assert.ok(events.every((e) => e.t < patternEndSec(item)), song.id);
      for (let i = 1; i < events.length; i++)
        assert.ok(events[i].t >= events[i - 1].t, `${song.id}: events in time order`);
    }
  });
});
