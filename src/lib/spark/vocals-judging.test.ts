import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { buildTimeline, consumeHit } from "./practice.ts";
import {
  firstLessonIds,
  instrumentById,
  lessonsFor,
  midiToFreq,
  withSurface,
  type InstrumentId,
} from "./instruments.ts";
import type { PlanItem } from "./types.ts";
import {
  centsFromExpected,
  pitchWithinTolerance,
  VocalHoldJudge,
  VOCAL_CENTS_TOLERANCE,
} from "./vocal-judge.ts";
import { sideQuestExercise } from "./side-quest-practice.ts";

function itemFor(instrument: InstrumentId, lessonId: string): PlanItem {
  const lesson = lessonsFor(instrument).find((l) => l.id === lessonId)!;
  return withSurface(
    {
      id: lesson.id,
      type: lesson.type,
      title: lesson.title,
      subtitle: "",
      durationSec: (lesson.bars * 4 * 60) / lesson.bpm,
      lessonId: lesson.id,
      chords: lesson.chords,
      pattern: lesson.pattern,
      bars: lesson.bars,
      bpm: lesson.bpm,
      process: lesson.process,
    } satisfies PlanItem,
    instrumentById(instrument),
  );
}

const freqAt = (midi: number, cents = 0) => midiToFreq(midi) * Math.pow(2, cents / 1200);

describe("vocals cents judging (unrounded, 20-cent standard)", () => {
  it("uses the lab's 20-cent tolerance", () => {
    assert.equal(VOCAL_CENTS_TOLERANCE, 20);
  });

  it("an in-tune attempt passes", () => {
    assert.equal(centsFromExpected(freqAt(60), 60), 0);
    assert.equal(pitchWithinTolerance(freqAt(60), 60), true);
  });

  it("+15 cents passes, −15 cents passes", () => {
    assert.equal(pitchWithinTolerance(freqAt(60, 15), 60), true);
    assert.equal(pitchWithinTolerance(freqAt(60, -15), 60), true);
  });

  it("+30 cents fails, −30 cents fails", () => {
    assert.equal(pitchWithinTolerance(freqAt(60, 30), 60), false);
    assert.equal(pitchWithinTolerance(freqAt(60, -30), 60), false);
  });

  it("a wrong pitch class fails", () => {
    assert.equal(pitchWithinTolerance(freqAt(61), 60), false);
    assert.equal(pitchWithinTolerance(freqAt(59), 60), false);
  });

  it("an octave error fails for bespoke cues (unlike the drone)", () => {
    assert.equal(pitchWithinTolerance(freqAt(72), 60), false);
    assert.equal(pitchWithinTolerance(freqAt(48), 60), false);
  });

  it("unusable frequencies never pass", () => {
    assert.equal(pitchWithinTolerance(0, 60), false);
    assert.equal(pitchWithinTolerance(Number.NaN, 60), false);
  });
});

describe("vocals hold judging", () => {
  // A 4-beat hold at 60 bpm with the caller's graces: judged span 1000–4850 ms.
  const START = 1000;
  const END = 4850;
  function runHold(freq: (t: number) => number | null): VocalHoldJudge {
    const judge = new VocalHoldJudge(60, START, END);
    for (let t = START; t <= END; t += 50) judge.observe(t, freq(t));
    return judge;
  }

  it("a hold sustained in tune for the window passes", () => {
    const judge = runHold(() => freqAt(60));
    assert.ok(judge.samples > 0);
    assert.equal(judge.passes(), true);
  });

  it("a hold sustained 15 cents sharp passes", () => {
    assert.equal(runHold(() => freqAt(60, 15)).passes(), true);
  });

  it("a hold sustained 30 cents sharp fails", () => {
    assert.equal(runHold(() => freqAt(60, 30)).passes(), false);
  });

  it("a hold sung an octave up fails", () => {
    assert.equal(runHold(() => freqAt(72)).passes(), false);
  });

  it("a half-length hold fails even though it started clean", () => {
    const mid = START + (END - START) / 2;
    const judge = runHold((t) => (t <= mid ? freqAt(60) : null));
    assert.equal(judge.passes(), false);
  });

  it("silence for the whole window fails", () => {
    const judge = runHold(() => null);
    assert.equal(judge.samples, 0);
    assert.equal(judge.passes(), false);
  });

  it("mostly off-pitch with an in-tune tail still fails (majority rule)", () => {
    const judge = runHold((t) => (t < END - 300 ? freqAt(60, 30) : freqAt(60)));
    assert.equal(judge.passes(), false);
  });

  it("a hold kept to the end with a mid breath gap passes", () => {
    const judge = runHold((t) => (t > 2400 && t < 2900 ? null : freqAt(60)));
    assert.equal(judge.passes(), true);
  });
});

describe("bespoke vocals cue timelines", () => {
  it("Match C: one expected-pitch cue per bar, C at 20-cent judging", () => {
    const notes = buildTimeline(itemFor("vocals", "lesson_vocals_match_c_01"));
    assert.equal(notes.length, 8);
    assert.deepEqual(notes.map((n) => n.t), [0, 4, 8, 12, 16, 20, 24, 28]);
    for (const n of notes) {
      assert.equal(n.expectedMidi, 60);
      assert.equal(n.string, 60);
      assert.equal(n.holdBeats, undefined);
    }
  });

  it("held C: one 4-beat hold per bar", () => {
    const notes = buildTimeline(itemFor("vocals", "lesson_vocals_hold_01"));
    assert.equal(notes.length, 8);
    for (const n of notes) {
      assert.equal(n.expectedMidi, 60);
      assert.equal(n.holdBeats, 4);
      assert.equal(n.duration, 4);
    }
  });

  it("thirds: E over C, A over F, B over G, twice through", () => {
    const notes = buildTimeline(itemFor("vocals", "lesson_vocals_thirds_01"));
    assert.equal(notes.length, 12);
    assert.deepEqual(
      notes.map((n) => n.expectedMidi),
      [64, 64, 69, 69, 71, 71, 64, 64, 69, 69, 71, 71],
    );
    assert.deepEqual(notes[0].notes, [60, 64]);
    assert.deepEqual(notes[4].notes, [67, 71]);
  });

  it("offbeat: entrances on the and-of-2 and and-of-4, on C", () => {
    const notes = buildTimeline(itemFor("vocals", "lesson_vocals_offbeat_01"));
    assert.equal(notes.length, 16);
    assert.deepEqual(
      notes.map((n) => n.t),
      [1.5, 3.5, 5.5, 7.5, 9.5, 11.5, 13.5, 15.5, 17.5, 19.5, 21.5, 23.5, 25.5, 27.5, 29.5, 31.5],
    );
    for (const n of notes) assert.equal(n.expectedMidi, 60);
  });

  it("harmony: four 6-beat holds of E, the third above the melody's home", () => {
    const notes = buildTimeline(itemFor("vocals", "lesson_vocals_harmony_01"));
    assert.equal(notes.length, 4);
    assert.deepEqual(notes.map((n) => n.t), [0, 8, 16, 24]);
    for (const n of notes) {
      assert.equal(n.expectedMidi, 64);
      assert.equal(n.holdBeats, 6);
    }
  });

  it("range finder: a semitone staircase with guide pitches and NO pitch judging", () => {
    const notes = buildTimeline(itemFor("vocals", "lesson_vocals_range_01"));
    assert.equal(notes.length, 20);
    assert.deepEqual(
      notes.map((n) => n.notes?.[0]),
      [60, 61, 62, 63, 64, 65, 66, 67, 66, 65, 64, 63, 62, 61, 60, 59, 58, 57, 56, 55],
    );
    for (const n of notes) {
      assert.equal(n.expectedMidi, undefined);
      assert.equal(n.string, undefined);
    }
  });

  it("five-note scale: C D E F G F E D C, then repeated", () => {
    const notes = buildTimeline(itemFor("vocals", "lesson_vocals_scale_01"));
    assert.equal(notes.length, 18);
    assert.deepEqual(
      notes.map((n) => n.expectedMidi),
      [60, 62, 64, 65, 67, 65, 64, 62, 60, 60, 62, 64, 65, 67, 65, 64, 62, 60],
    );
  });

  it("the timeline layer stays timing-based: consumeHit resolves bespoke cues by onset alone", () => {
    // The cents gate lives in the mic path (session-player attempt evidence).
    // With no pitch data the timeline/judging core behaves exactly as before.
    const notes = buildTimeline(itemFor("vocals", "lesson_vocals_match_c_01"));
    assert.equal(consumeHit(notes, 0, 230).hit, true);
    assert.equal(consumeHit(notes, 4.1, 230).hit, true);
  });

  it("Frère Jacques: the whole song, once through, note for note", () => {
    const notes = buildTimeline(itemFor("vocals", "lesson_vocals_song_01"));
    // 32 cues in a single 32-beat pass — the pattern must not loop.
    assert.equal(notes.length, 32);
    assert.deepEqual(
      notes.map((n) => n.expectedMidi),
      [
        60, 62, 64, 60, // Frè-re Jac-ques
        60, 62, 64, 60, // Frè-re Jac-ques
        64, 65, 67, // Dor-mez-vous
        64, 65, 67, // Dor-mez-vous
        67, 69, 67, 65, 64, 60, // Son-nez les ma-ti-nes
        67, 69, 67, 65, 64, 60, // Son-nez les ma-ti-nes
        60, 55, 60, // Din din don
        60, 55, 60, // Din din don
      ],
    );
    assert.deepEqual(
      notes.map((n) => n.t),
      [
        0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 12, 13, 14, 16, 16.5, 17, 17.5, 18, 19, 20, 20.5, 21, 21.5,
        22, 23, 24, 25, 26, 28, 29, 30,
      ],
    );
    // The melody's range is G3–A4.
    assert.equal(Math.min(...notes.map((n) => n.expectedMidi!)), 55);
    assert.equal(Math.max(...notes.map((n) => n.expectedMidi!)), 69);
    // Only the four half notes are holds; every other cue is a plain note.
    const holds = notes.filter((n) => n.holdBeats !== undefined);
    assert.deepEqual(holds.map((n) => n.t), [10, 14, 26, 30]);
    for (const n of holds) {
      assert.equal(n.holdBeats, 2);
      assert.equal(n.duration, 2);
    }
  });
});

describe("legacy vocals timelines are untouched", () => {
  it("the drone keeps keyWarmup events: expected string, no expectedMidi", () => {
    const notes = buildTimeline(itemFor("vocals", "lesson_vocals_drone_01"));
    assert.ok(notes.length > 0);
    for (const n of notes) {
      assert.equal(n.expectedMidi, undefined);
      assert.equal(n.string, 60);
    }
  });

  it("respond and create lessons carry neither expectedMidi nor string", () => {
    for (const id of ["lesson_vocals_respond_pitch_01", "lesson_vocals_create_hang_01"]) {
      const notes = buildTimeline(itemFor("vocals", id));
      assert.ok(notes.length > 0, id);
      for (const n of notes) {
        assert.equal(n.expectedMidi, undefined, id);
        assert.equal(n.string, undefined, id);
      }
    }
  });

  it("non-vocals timelines gain no new fields", () => {
    const mandolin = buildTimeline(itemFor("mandolin", "lesson_mandolin_open_01"));
    assert.ok(mandolin.length > 0);
    for (const n of mandolin) assert.ok(!("expectedMidi" in n) && !("holdBeats" in n));
    const guitar = buildTimeline(itemFor("guitar", "lesson_guitar_open_strings_01"));
    assert.ok(guitar.length > 0);
    for (const n of guitar) assert.ok(!("expectedMidi" in n) && !("holdBeats" in n));
  });
});

describe("vocals daily curriculum after tiers 2a–2b", () => {
  const lessons = lessonsFor("vocals");

  it("has eleven daily lessons, orders 1–11 unique", () => {
    assert.equal(lessons.length, 11);
    assert.deepEqual(
      lessons.map((l) => l.order).sort((a, b) => a - b),
      [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11],
    );
  });

  it("every prerequisite exists and comes earlier", () => {
    const byId = new Map(lessons.map((l) => [l.id, l]));
    for (const lesson of lessons) {
      for (const pre of lesson.prerequisites) {
        assert.ok(byId.has(pre), `${lesson.id} -> ${pre}`);
        assert.ok(byId.get(pre)!.order < lesson.order, `${lesson.id} -> ${pre}`);
      }
    }
  });

  it("firstLessonIds for vocals is unchanged", () => {
    assert.deepEqual(firstLessonIds("vocals"), [
      "lesson_vocals_drone_01",
      "lesson_vocals_match_c_01",
      "lesson_vocals_hold_01",
    ]);
  });

  it("Match C claims the measured 20 cents again", () => {
    const match = lessons.find((l) => l.id === "lesson_vocals_match_c_01")!;
    assert.deepEqual(match.objectives, ["Land inside 20 cents of the reference C"]);
    assert.ok(match.criteria?.some((c) => c.includes("With the mic on")));
  });

  it("the range finder's copy claims no measurement", () => {
    const range = lessons.find((l) => l.id === "lesson_vocals_range_01")!;
    const copy = [...range.objectives, ...(range.criteria ?? [])].join(" ");
    assert.ok(!/cent|judged|scored/i.test(copy), copy);
    assert.ok(range.criteria?.some((c) => c.includes("stops feeling easy")));
  });

  it("the song lesson closes the path: order 11, after the scale, named as the first song", () => {
    const song = lessons.find((l) => l.id === "lesson_vocals_song_01")!;
    assert.equal(song.order, 11);
    assert.equal(song.type, "song");
    assert.equal(song.repertoire, "Frère Jacques");
    assert.deepEqual(song.prerequisites, ["lesson_vocals_scale_01"]);
    assert.ok(song.why?.includes("Brother John"), song.why);
  });
});

describe("sideways-harmony side quest holds one tone per phrase", () => {
  const exercise = sideQuestExercise("vocals-side-intermediate")!;

  it("runs two 8-beat phrases", () => {
    assert.equal(exercise.beats, 16);
    assert.ok(exercise.cues.every((cue) => cue.beat >= 0 && cue.beat < 16));
  });

  it("phrase 1 holds E while the reference melody moves C–D–E–D–C", () => {
    const hold = exercise.cues.find((cue) => cue.label === "You hold E")!;
    assert.equal(hold.beat, 0);
    assert.deepEqual(hold.notes, [64]);
    assert.equal(hold.duration, 7.6);
    const melody = exercise.cues.filter(
      (cue) => cue.label.startsWith("Melody") && cue.beat < 8,
    );
    assert.deepEqual(
      melody.map((cue) => cue.notes?.[0]),
      [60, 62, 64, 62, 60],
    );
    // Nothing the singer is asked to sustain in phrase 1 moves off E.
    const sung = exercise.cues.filter(
      (cue) => (cue.label.startsWith("You hold") || cue.label.startsWith("Still")) && cue.beat < 8,
    );
    assert.ok(sung.length >= 2);
    for (const cue of sung) assert.deepEqual(cue.notes, [64]);
  });

  it("phrase 2 holds C while the reference melody moves G–F–E–D–C", () => {
    const hold = exercise.cues.find((cue) => cue.label === "You hold C")!;
    assert.equal(hold.beat, 8);
    assert.deepEqual(hold.notes, [60]);
    assert.equal(hold.duration, 7.6);
    const melody = exercise.cues.filter(
      (cue) => cue.label.startsWith("Melody") && cue.beat >= 8,
    );
    assert.deepEqual(
      melody.map((cue) => cue.notes?.[0]),
      [67, 65, 64, 62, 60],
    );
    const sung = exercise.cues.filter(
      (cue) => (cue.label.startsWith("You hold") || cue.label.startsWith("Still")) && cue.beat >= 8,
    );
    assert.ok(sung.length >= 2);
    for (const cue of sung) assert.deepEqual(cue.notes, [60]);
  });

  it("no cue asks the singer to follow the melody a third above (the old pattern)", () => {
    const following = exercise.cues.filter((cue) => cue.label.startsWith("Harmony"));
    assert.equal(following.length, 0);
  });
});
