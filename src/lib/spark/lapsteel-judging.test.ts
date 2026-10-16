import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { buildTimeline, consumeHit, type NoteEvent } from "./practice.ts";
import { dailyInstrumentCues, judgeLapSteelBarCues } from "./instrument-patterns.ts";
import { assessChordPitches, type ChordSpectrumAnalysis } from "./acoustic-input.ts";
import {
  firstLessonIds,
  instrumentById,
  lessonsFor,
  midiToFreq,
  withSurface,
  type InstrumentId,
} from "./instruments.ts";
import { beatsPerBarOf, type PlanItem } from "./types.ts";
import { centsFromExpected, pitchWithinTolerance, VOCAL_CENTS_TOLERANCE } from "./vocal-judge.ts";

function itemFor(instrument: InstrumentId, lessonId: string): PlanItem {
  const lesson = lessonsFor(instrument).find((l) => l.id === lessonId)!;
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
    instrumentById(instrument),
  );
}

const freqAt = (midi: number, cents = 0) => midiToFreq(midi) * Math.pow(2, cents / 1200);
const OPEN = new Set([48, 52, 55, 57, 60, 64]);

/**
 * The session player's judged-cue gate (session-player.tsx attempt()),
 * replayed with the same judge the component imports: a judged note
 * scores only from the mic, only with pitch evidence, and only when the
 * UNROUNDED frequency is within tolerance of the note's expectedMidi.
 */
function sessionGate(note: NoteEvent, fromMic: boolean, frequencyHz?: number): boolean {
  if (note.expectedMidi === undefined) return true; // unjudged: onset path, as before
  if (!fromMic || frequencyHz === undefined) return false;
  return pitchWithinTolerance(frequencyHz, note.expectedMidi);
}

const JUDGED = [
  "lesson_lapsteel_vibrato_01",
  "lesson_lapsteel_melody_01",
  "lesson_lapsteel_hsh_01",
];
const UNJUDGED = [
  "lesson_lapsteel_open_01",
  "lesson_lapsteel_c_01",
  "lesson_lapsteel_f_01",
  "lesson_lapsteel_cf_01",
  "lesson_lapsteel_respond_cf_01",
  "lesson_lapsteel_g_01",
  "lesson_lapsteel_slide_01",
  "lesson_lapsteel_create_hang_01",
  "lesson_lapsteel_block_01",
  "lesson_lapsteel_d_01",
  "lesson_lapsteel_walk_01",
  "lesson_lapsteel_harmony_01",
  "lesson_lapsteel_slant_01",
];

describe("lap steel cents judging (unrounded, 20-cent standard)", () => {
  it("uses the same 20-cent tolerance as vocals, violin, and the lab needle", () => {
    assert.equal(VOCAL_CENTS_TOLERANCE, 20);
  });

  it("every barred single-note cue in the judged lessons declares expectedMidi; open strings do not", () => {
    for (const id of JUDGED) {
      const notes = buildTimeline(itemFor("lapsteel", id));
      assert.ok(notes.length > 0, id);
      let judged = 0;
      for (const n of notes) {
        assert.equal(n.string, undefined, `${id}: string stays a string index field, unset`);
        if (n.notes?.length === 1 && !OPEN.has(n.notes[0])) {
          assert.equal(n.expectedMidi, n.notes[0], `${id}: barred ${n.notes[0]} judged`);
          judged++;
        } else {
          assert.equal(n.expectedMidi, undefined, `${id}: open/multi-note cue unjudged`);
        }
      }
      assert.ok(judged > 0, `${id}: has judged notes`);
    }
  });

  it("melody: the fret 3 and fret 5 notes are judged, the open E between them is not", () => {
    const notes = buildTimeline(itemFor("lapsteel", "lesson_lapsteel_melody_01")).slice(0, 7);
    assert.deepEqual(notes.map((n) => n.notes?.[0]), [64, 67, 69, 67, 69, 67, 64]);
    assert.deepEqual(notes.map((n) => n.expectedMidi), [undefined, 67, 69, 67, 69, 67, undefined]);
  });

  it("vibrato: both held bar positions (A at fret 5, B at fret 7) are judged at the attack", () => {
    const notes = buildTimeline(itemFor("lapsteel", "lesson_lapsteel_vibrato_01"));
    assert.deepEqual(notes.map((n) => n.notes?.[0]), [69, 71, 69, 71, 69, 71, 69, 71]);
    assert.deepEqual(notes.map((n) => n.expectedMidi), [69, 71, 69, 71, 69, 71, 69, 71]);
  });

  it("Home Sweet Home: 40 of 58 notes are bar placements and judged; the open-string notes are not", () => {
    const notes = buildTimeline(itemFor("lapsteel", "lesson_lapsteel_hsh_01"));
    assert.equal(notes.length, 58);
    assert.equal(notes.filter((n) => n.expectedMidi !== undefined).length, 40);
    const highC = notes.find((n) => n.notes?.[0] === 72)!;
    assert.equal(highC.expectedMidi, 72, "the fret-12 octave C is a bar placement");
    for (const n of notes) {
      if (n.notes?.[0] === 60 || n.notes?.[0] === 64) {
        assert.equal(n.expectedMidi, undefined, "open-string notes stay onset-judged");
      }
    }
  });

  it("the unjudged lessons carry no expectedMidi anywhere", () => {
    for (const id of UNJUDGED) {
      const notes = buildTimeline(itemFor("lapsteel", id));
      assert.ok(notes.length > 0, id);
      for (const n of notes) assert.equal(n.expectedMidi, undefined, id);
    }
  });

  it("harmony pairs and slant grips stay onset-judged: several notes, no single target", () => {
    for (const [id, size] of [["lesson_lapsteel_harmony_01", 2], ["lesson_lapsteel_slant_01", 3]] as const) {
      const notes = buildTimeline(itemFor("lapsteel", id)).filter((n) => n.notes?.length);
      assert.ok(notes.length > 0, id);
      for (const n of notes) {
        assert.equal(n.notes?.length, size, id);
        assert.equal(n.expectedMidi, undefined, id);
      }
    }
  });

  it("respond and create lessons have no bespoke pattern and no judging", () => {
    for (const id of ["lesson_lapsteel_respond_cf_01", "lesson_lapsteel_create_hang_01"]) {
      assert.equal(dailyInstrumentCues(itemFor("lapsteel", id)), undefined, id);
    }
  });

  it("judgeLapSteelBarCues tags only single-note non-open cues and never overwrites", () => {
    const input = [
      { beat: 0, label: "A", detail: "", notes: [69] },
      { beat: 1, label: "E", detail: "", notes: [64] },
      { beat: 2, label: "Brush", detail: "", notes: [53, 57, 60, 62, 65, 69] },
      { beat: 3, label: "Rest", detail: "" },
      { beat: 4, label: "Set", detail: "", notes: [67], expectedMidi: 67 },
    ];
    const cues = judgeLapSteelBarCues(input);
    assert.deepEqual(cues.map((c) => c.expectedMidi), [69, undefined, undefined, undefined, 67]);
    // Unjudged cues pass through untouched — the same objects, no new keys.
    assert.equal(cues[1], input[1]);
    assert.equal(cues[2], input[2]);
    assert.equal(cues[3], input[3]);
    assert.ok(!("expectedMidi" in cues[1]));
  });
});

describe("lap steel session gate simulations", () => {
  const a4 = buildTimeline(itemFor("lapsteel", "lesson_lapsteel_melody_01")).find((n) => n.expectedMidi === 69)!;
  const openE = buildTimeline(itemFor("lapsteel", "lesson_lapsteel_melody_01")).find((n) => n.notes?.[0] === 64)!;

  it("an in-tune bar position passes", () => {
    assert.equal(centsFromExpected(freqAt(69), 69), 0);
    assert.equal(sessionGate(a4, true, freqAt(69)), true);
    assert.equal(sessionGate(a4, true, freqAt(69, 15)), true);
    assert.equal(sessionGate(a4, true, freqAt(69, -15)), true);
  });

  it("a uniform +40-cent bar error fails (and −40 too)", () => {
    assert.equal(sessionGate(a4, true, freqAt(69, 40)), false);
    assert.equal(sessionGate(a4, true, freqAt(69, -40)), false);
  });

  it("a bar one fret off fails in both directions", () => {
    assert.equal(sessionGate(a4, true, freqAt(70)), false);
    assert.equal(sessionGate(a4, true, freqAt(68)), false);
  });

  it("an octave-up barred note fails", () => {
    assert.equal(sessionGate(a4, true, freqAt(81)), false);
    assert.equal(pitchWithinTolerance(freqAt(81), 69), false);
  });

  it("a judged note scores nothing without mic pitch evidence", () => {
    assert.equal(sessionGate(a4, false, freqAt(69)), false);
    assert.equal(sessionGate(a4, true, undefined), false);
  });

  it("an open-position cue still passes on onset alone", () => {
    // No expectedMidi: the cents gate never engages, and the timeline
    // layer resolves the cue by timing, exactly as before this tier.
    assert.equal(openE.expectedMidi, undefined);
    assert.equal(sessionGate(openE, true, undefined), true);
    const notes = buildTimeline(itemFor("lapsteel", "lesson_lapsteel_melody_01"));
    assert.equal(consumeHit(notes, openE.t, 230).hit, true);
  });

  it("brushes cannot be cents-judged by the chord path — it hears rounded pitch classes", () => {
    // Porch Swing's fret-5 brush carries no expectedMidi…
    const brush = buildTimeline(itemFor("lapsteel", "lesson_lapsteel_cf_01")).find((n) => n.notes?.[0] === 53)!;
    assert.deepEqual(brush.notes, [53, 57, 60, 62, 65, 69]);
    assert.equal(brush.expectedMidi, undefined);
    // …because the spectrum path can only report integer midis: even a bar
    // a whole fret low (every string a semitone flat) still "matches" the
    // fret-5 expectation inside its ±1-semitone matching. A uniform
    // 40-cent error is not representable in the analysis at all.
    const oneFretLow: ChordSpectrumAnalysis = {
      midiNotes: [52, 56, 59, 61, 64, 68],
      confidence: 1,
      strongestDb: -20,
    };
    assert.equal(assessChordPitches(oneFretLow, [53, 57, 60, 62, 65, 69]).status, "match");
  });
});

describe("lap steel daily curriculum with bar judging", () => {
  const lessons = lessonsFor("lapsteel");

  it("has twenty daily lessons, orders 1–20 unique", () => {
    assert.equal(lessons.length, 20);
    assert.deepEqual(
      lessons.map((l) => l.order).sort((a, b) => a - b),
      [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20],
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

  it("firstLessonIds for lap steel is unchanged (open, C, F)", () => {
    assert.deepEqual(firstLessonIds("lapsteel"), [
      "lesson_lapsteel_open_01",
      "lesson_lapsteel_c_01",
      "lesson_lapsteel_f_01",
    ]);
  });

  it("judged lessons' copy claims the 20-cent measurement; unjudged lessons' copy claims none", () => {
    for (const id of JUDGED) {
      const lesson = lessons.find((l) => l.id === id)!;
      assert.ok(
        lesson.criteria?.some((c) => c.includes("With the mic on") && c.includes("20 cents")),
        `${id} criteria`,
      );
      assert.ok(lesson.criteria?.some((c) => c.includes("isn't scored")), `${id} no-mic line`);
    }
    for (const id of UNJUDGED) {
      const lesson = lessons.find((l) => l.id === id)!;
      const copy = [...lesson.objectives, ...(lesson.criteria ?? [])].join(" ");
      assert.ok(!/cent|judged|scored/i.test(copy), `${id}: ${copy}`);
    }
  });
});
