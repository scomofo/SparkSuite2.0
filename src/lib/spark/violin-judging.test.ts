import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { buildTimeline, consumeHit, type NoteEvent } from "./practice.ts";
import { dailyInstrumentCues, judgeViolinFingeredCues } from "./instrument-patterns.ts";
import {
  firstLessonIds,
  instrumentById,
  lessonsFor,
  midiToFreq,
  withSurface,
  type InstrumentId,
} from "./instruments.ts";
import type { PlanItem } from "./types.ts";
import { centsFromExpected, pitchWithinTolerance, VOCAL_CENTS_TOLERANCE } from "./vocal-judge.ts";
import { musicalMilestone } from "./milestones.ts";
import { learningLesson } from "./curriculum.ts";
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
const OPEN = new Set([55, 62, 69, 76]);

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
  "lesson_violin_first_finger_01",
  "lesson_violin_tetrachord_01",
  "lesson_violin_walk_01",
  "lesson_violin_slur_01",
  "lesson_violin_phrase_01",
  "lesson_violin_a_tetrachord_01",
  "lesson_violin_scale_01",
  "lesson_violin_low2_01",
  "lesson_violin_twinkle_01",
  "lesson_violin_g_tetrachord_01",
];
const UNJUDGED = [
  "lesson_violin_open_01",
  "lesson_violin_bow_pulse_01",
  "lesson_violin_crossing_01",
  "lesson_violin_doublestop_01",
  "lesson_violin_respond_bow_01",
  "lesson_violin_create_hang_01",
];

describe("violin cents judging (unrounded, 20-cent standard)", () => {
  it("uses the same 20-cent tolerance as vocals and the lab needle", () => {
    assert.equal(VOCAL_CENTS_TOLERANCE, 20);
  });

  it("every fingered single-note cue in the judged lessons declares expectedMidi; open strings do not", () => {
    for (const id of JUDGED) {
      const notes = buildTimeline(itemFor("violin", id));
      assert.ok(notes.length > 0, id);
      let judged = 0;
      for (const n of notes) {
        assert.equal(n.string, undefined, `${id}: string stays a string index field, unset`);
        if (n.notes?.length === 1 && !OPEN.has(n.notes[0])) {
          assert.equal(n.expectedMidi, n.notes[0], `${id}: fingered ${n.notes[0]} judged`);
          judged++;
        } else {
          assert.equal(n.expectedMidi, undefined, `${id}: open/multi-note cue unjudged`);
        }
      }
      assert.ok(judged > 0, `${id}: has judged notes`);
    }
  });

  it("first finger: E and B are judged, the open strings around them are not", () => {
    const notes = buildTimeline(itemFor("violin", "lesson_violin_first_finger_01")).filter((n) => n.bar < 2);
    assert.deepEqual(notes.map((n) => n.notes?.[0]), [62, 64, 62, 69, 71, 69]);
    assert.deepEqual(notes.map((n) => n.expectedMidi), [undefined, 64, undefined, undefined, 71, undefined]);
  });

  it("the unjudged lessons carry no expectedMidi anywhere", () => {
    for (const id of UNJUDGED) {
      const notes = buildTimeline(itemFor("violin", id));
      assert.ok(notes.length > 0, id);
      for (const n of notes) assert.equal(n.expectedMidi, undefined, id);
    }
  });

  it("double stops stay onset-judged: two notes, no single target", () => {
    const notes = buildTimeline(itemFor("violin", "lesson_violin_doublestop_01"));
    assert.equal(notes.length, 16);
    for (const n of notes) {
      assert.equal(n.notes?.length, 2);
      assert.equal(n.expectedMidi, undefined);
    }
  });

  it("respond and create lessons have no bespoke pattern and no judging", () => {
    for (const id of ["lesson_violin_respond_bow_01", "lesson_violin_create_hang_01"]) {
      assert.equal(dailyInstrumentCues(itemFor("violin", id)), undefined, id);
    }
  });

  it("judgeViolinFingeredCues tags only single-note non-open cues and never overwrites", () => {
    const input = [
      { beat: 0, label: "E", detail: "", notes: [64] },
      { beat: 1, label: "D", detail: "", notes: [62] },
      { beat: 2, label: "E + A", detail: "", notes: [64, 69] },
      { beat: 3, label: "Rest", detail: "" },
      { beat: 4, label: "Set", detail: "", notes: [66], expectedMidi: 66 },
    ];
    const cues = judgeViolinFingeredCues(input);
    assert.deepEqual(cues.map((c) => c.expectedMidi), [64, undefined, undefined, undefined, 66]);
    // Unjudged cues pass through untouched — the same objects, no new keys.
    assert.equal(cues[1], input[1]);
    assert.equal(cues[2], input[2]);
    assert.equal(cues[3], input[3]);
    assert.ok(!("expectedMidi" in cues[1]));
  });
});

describe("violin session gate simulations", () => {
  const e4 = buildTimeline(itemFor("violin", "lesson_violin_first_finger_01")).find((n) => n.expectedMidi === 64)!;
  const openD = buildTimeline(itemFor("violin", "lesson_violin_first_finger_01")).find((n) => n.notes?.[0] === 62)!;

  it("an in-tune fingered note passes", () => {
    assert.equal(centsFromExpected(freqAt(64), 64), 0);
    assert.equal(sessionGate(e4, true, freqAt(64)), true);
    assert.equal(sessionGate(e4, true, freqAt(64, 15)), true);
    assert.equal(sessionGate(e4, true, freqAt(64, -15)), true);
  });

  it("a +40-cent fingered note fails (and −40 too)", () => {
    assert.equal(sessionGate(e4, true, freqAt(64, 40)), false);
    assert.equal(sessionGate(e4, true, freqAt(64, -40)), false);
  });

  it("an octave-up fingered note fails", () => {
    assert.equal(sessionGate(e4, true, freqAt(76)), false);
    assert.equal(pitchWithinTolerance(freqAt(76), 64), false);
  });

  it("a judged note scores nothing without mic pitch evidence", () => {
    assert.equal(sessionGate(e4, false, freqAt(64)), false);
    assert.equal(sessionGate(e4, true, undefined), false);
  });

  it("an open-string cue still passes on onset alone", () => {
    // No expectedMidi: the cents gate never engages, and the timeline
    // layer resolves the cue by timing, exactly as before tier 3.
    assert.equal(openD.expectedMidi, undefined);
    assert.equal(sessionGate(openD, true, undefined), true);
    const notes = buildTimeline(itemFor("violin", "lesson_violin_first_finger_01"));
    assert.equal(consumeHit(notes, openD.t, 230).hit, true);
  });
});

describe("violin daily curriculum after the polish tiers", () => {
  const lessons = lessonsFor("violin");

  it("has sixteen daily lessons, orders 1–16 unique", () => {
    assert.equal(lessons.length, 16);
    assert.deepEqual(
      lessons.map((l) => l.order).sort((a, b) => a - b),
      [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16],
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

  it("the tetrachord daily sits between first finger and the walk, and unlocks both dependents", () => {
    const tet = lessons.find((l) => l.id === "lesson_violin_tetrachord_01")!;
    assert.equal(tet.order, 4);
    assert.deepEqual(tet.prerequisites, ["lesson_violin_first_finger_01"]);
    assert.deepEqual(lessons.find((l) => l.id === "lesson_violin_walk_01")!.prerequisites, [
      "lesson_violin_tetrachord_01",
    ]);
    assert.deepEqual(lessons.find((l) => l.id === "lesson_violin_slur_01")!.prerequisites, [
      "lesson_violin_tetrachord_01",
    ]);
  });

  it("firstLessonIds for violin is unchanged", () => {
    assert.deepEqual(firstLessonIds("violin"), [
      "lesson_violin_open_01",
      "lesson_violin_first_finger_01",
      "lesson_violin_walk_01",
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

  it("Twinkle: the whole tune, once through, note for note", () => {
    const notes = buildTimeline(itemFor("violin", "lesson_violin_twinkle_01"));
    assert.equal(notes.length, 42);
    assert.deepEqual(
      notes.map((n) => n.notes?.[0]),
      [
        62, 62, 69, 69, 71, 71, 69, // Twin-kle twin-kle lit-tle star
        67, 67, 66, 66, 64, 64, 62, // How I won-der what you are
        69, 69, 67, 67, 66, 66, 64, // Up a-bove the world so high
        69, 69, 67, 67, 66, 66, 64, // Like a dia-mond in the sky
        62, 62, 69, 69, 71, 71, 69,
        67, 67, 66, 66, 64, 64, 62,
      ],
    );
    // The arrangement's range is D4–B4, as the review states.
    assert.equal(Math.min(...notes.map((n) => n.notes![0])), 62);
    assert.equal(Math.max(...notes.map((n) => n.notes![0])), 71);
    // Each unit's last note is held for two beats; bows alternate continuously.
    for (let k = 0; k < notes.length; k++) {
      assert.equal(notes[k].duration, (k + 1) % 7 === 0 ? 1.85 : 0.9, `attack ${k}`);
      assert.ok(notes[k].label!.endsWith(k % 2 === 0 ? "⊓" : "∨"), `attack ${k} bow`);
    }
    const lesson = lessons.find((l) => l.id === "lesson_violin_twinkle_01")!;
    assert.equal(lesson.repertoire, "Twinkle, Twinkle, Little Star");
    assert.deepEqual(lesson.prerequisites, ["lesson_violin_tetrachord_01"]);
  });

  it("the scale lesson completes and names D major", () => {
    const notes = buildTimeline(itemFor("violin", "lesson_violin_scale_01"));
    assert.deepEqual(
      notes.slice(0, 16).map((n) => n.notes?.[0]),
      [62, 64, 66, 67, 69, 71, 73, 74, 74, 73, 71, 69, 67, 66, 64, 62],
    );
    const lesson = lessons.find((l) => l.id === "lesson_violin_scale_01")!;
    assert.ok(lesson.title.includes("D major"));
  });
});

describe("tier 1 fixes hold", () => {
  it("the advanced side quest names the E string for its second version", () => {
    const exercise = sideQuestExercise("violin-side-advanced")!;
    const second = exercise.cues.filter((c) => c.beat >= 4 && c.notes?.length);
    assert.deepEqual(second.map((c) => c.notes?.[0]), [76, 78, 79]);
    assert.equal(second[0].label, "E string E");
    assert.ok(exercise.cues.every((c) => !c.label.includes("A string E")));
  });

  it("the milestone's preparation includes the tetrachord lesson", () => {
    assert.deepEqual(musicalMilestone("violin").lessons, [
      "violin-open-strings-and-bow",
      "violin-bow-pulse",
      "violin-first-finger",
      "violin-d-tetrachord",
    ]);
  });

  it("lesson 1 carries the tuning instruction and the capstone has a demo", () => {
    const first = learningLesson("violin-open-strings-and-bow")!;
    assert.ok(first.explanation.includes("tune each string to its note with a tuner"));
    const capstone = learningLesson("violin-performance-plan")!;
    assert.deepEqual(capstone.demo?.notes, [
      [62], [64], [66], [67],
      [69], [], [], [],
      [67], [66], [64], [62],
      [64], [], [], [],
      [62],
    ]);
  });
});
