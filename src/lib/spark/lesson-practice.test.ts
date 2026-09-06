import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { CURRICULUM, learningLesson, learningPath } from "./curriculum.ts";
import { INSTRUMENTS } from "./instruments.ts";
import {
  beginLearning,
  advanceLearning,
  answerLearning,
  beginLessonPractice,
  emptyLearning,
  finishLearning,
  parseLearning,
  updateLessonPractice,
} from "./learning.ts";
import {
  LESSON_EXERCISES,
  lessonExercise,
  practiceBar,
  practiceShape,
  PRACTICE_TEMPOS,
} from "./lesson-practice.ts";

describe("lesson-specific practice content", () => {
  it("covers the first four lessons of every instrument with bounded, playable patterns", () => {
    assert.equal(LESSON_EXERCISES.length, 24);
    assert.equal(new Set(LESSON_EXERCISES.map((exercise) => exercise.lessonId)).size, 24);
    for (const inst of INSTRUMENTS) {
      for (const lesson of learningPath(inst.id).slice(0, 4))
        assert.ok(lessonExercise(lesson.id), lesson.id);
    }
    for (const exercise of LESSON_EXERCISES) {
      const lesson = learningLesson(exercise.lessonId)!;
      assert.ok(lesson);
      assert.ok((PRACTICE_TEMPOS as readonly number[]).includes(exercise.bpm));
      assert.ok(exercise.beats >= 4 && exercise.beats <= 20);
      for (const text of [exercise.goal, exercise.setup, exercise.hint, exercise.takeaway])
        assert.ok(text.length > 30);
      for (const cue of exercise.cues) {
        assert.ok(cue.beat >= 0 && cue.beat < exercise.beats, exercise.lessonId);
        assert.ok(Number.isInteger(cue.beat * 2));
        assert.ok(cue.detail);
        if (cue.duration) assert.ok(cue.duration > 0 && cue.beat + cue.duration <= exercise.beats);
        for (const midi of cue.notes ?? [])
          assert.ok(Number.isInteger(midi) && midi >= 21 && midi <= 108);
        for (const pad of cue.pads ?? []) assert.ok([0, 1, 2, 3].includes(pad));
      }
      for (const chord of exercise.shapes ?? []) assert.ok(practiceShape(lesson.instrument, chord));
      for (let beat = 0; beat < exercise.beats; beat++)
        assert.ok(
          exercise.cues.some((cue) => cue.beat === beat),
          `${exercise.lessonId}, beat ${beat}`,
        );
    }
    assert.equal(lessonExercise("missing"), undefined);
    assert.equal(lessonExercise("guitar-arrangement"), undefined);
    assert.equal(CURRICULUM.length, 48, "The later curriculum remains available");
  });

  it("matches the taught chord voicings and prepares changes on silent counts", () => {
    const guitar = lessonExercise("guitar-em-to-g")!;
    assert.deepEqual(
      guitar.cues.filter((cue) => cue.notes).map((cue) => [cue.beat, cue.chord, cue.notes]),
      [
        [0, "Em", [40, 47, 52, 55, 59, 64]],
        [4, "G", [43, 47, 50, 55, 59, 67]],
        [8, "Em", [40, 47, 52, 55, 59, 64]],
        [12, "G", [43, 47, 50, 55, 59, 67]],
      ],
    );
    assert.equal(guitar.cues.find((cue) => cue.beat === 2)?.label, "Prepare");
    assert.deepEqual(
      lessonExercise("ukulele-c-f-am")!
        .cues.filter((cue) => cue.notes)
        .map((cue) => cue.chord),
      ["C", "Am", "F"],
    );
  });

  it("puts eighths halfway between beats, preserves rests, and lands a drum fill on the next 1", () => {
    assert.deepEqual(
      lessonExercise("guitar-eighths")!
        .cues.filter((cue) => cue.beat < 4 && cue.notes)
        .map((cue) => cue.beat),
      [0, 1, 1.5, 2, 3, 3.5],
    );
    assert.deepEqual(
      lessonExercise("ukulele-island-rhythm")!
        .cues.filter((cue) => cue.beat < 4 && cue.notes)
        .map((cue) => cue.beat),
      [0, 1, 1.5, 2.5, 3, 3.5],
    );
    const hats = lessonExercise("drums-eighth-hats")!;
    assert.equal(hats.cues.filter((cue) => cue.beat < 4 && cue.pads?.includes(2)).length, 8);
    assert.deepEqual(hats.cues.find((cue) => cue.beat === 1)?.pads, [1, 2]);
    const fill = lessonExercise("drums-first-fill")!;
    assert.deepEqual(
      fill.cues.slice(-3).map((cue) => [cue.beat, cue.pads]),
      [
        [15, [1]],
        [15.5, [1]],
        [16, [0]],
      ],
    );
    assert.deepEqual(
      practiceBar(fill, 4).map((item) => item.beat),
      [16],
    );
    const mute = lessonExercise("bass-one-note")!;
    assert.equal(mute.cues[2].notes, undefined);
    assert.ok(mute.cues[0].duration! <= 2, "The note ends by the mute count");
  });

  it("preserves a held left hand while the right moves, and includes the minor third", () => {
    const hands = lessonExercise("piano-hands-together")!;
    assert.deepEqual(
      hands.cues.filter((cue) => cue.beat === 0).map((cue) => cue.notes),
      [[48], [60]],
    );
    assert.equal(hands.cues[0].duration, 3.8);
    assert.deepEqual(lessonExercise("piano-major-minor")!.cues[2].notes, [60, 63, 67]);
    assert.deepEqual(lessonExercise("vocals-thirds")!.cues[5].notes, [63]);
  });
});

describe("recoverable guided practice", () => {
  const id = "guitar-em-to-g";
  it("requires a learner check-in before returning to the check, and never completes the lesson", () => {
    let data = beginLessonPractice(emptyLearning(), id);
    assert.equal(data.records[id].step, 1);
    assert.equal(data.records[id].practice?.phase, "ready");
    assert.equal(updateLessonPractice(data, id, { type: "return" }), data);
    assert.equal(updateLessonPractice(data, id, { type: "reflect", reflection: "ready" }), data);
    data = updateLessonPractice(data, id, { type: "attempt" });
    assert.equal(updateLessonPractice(data, id, { type: "return" }), data);
    data = updateLessonPractice(data, id, { type: "reflect", reflection: "again" });
    data = updateLessonPractice(data, id, { type: "return" });
    assert.equal(data.records[id].step, 2, "Either reflection permits moving on");
    assert.equal(data.records[id].completedOn, undefined);
    assert.equal(finishLearning(data, id), data, "The understanding check is still required");
  });

  it("keeps per-lesson tempo, guide, and reflection across reloads and instrument changes", () => {
    let data = beginLessonPractice(emptyLearning(), id);
    data = updateLessonPractice(data, id, { type: "tempo", bpm: 40 });
    data = updateLessonPractice(data, id, { type: "guide", guide: "silent" });
    data = updateLessonPractice(data, id, { type: "attempt" });
    data = updateLessonPractice(data, id, { type: "reflect", reflection: "again" });
    data = beginLessonPractice(data, "piano-find-c");
    const restored = parseLearning(JSON.stringify(data));
    assert.deepEqual(restored, data);
    assert.deepEqual(restored.records[id].practice, {
      bpm: 40,
      guide: "silent",
      phase: "reflect",
      reflection: "again",
    });
    assert.equal(restored.active.guitar, id);
    assert.equal(restored.active.piano, "piano-find-c");
    data = updateLessonPractice(restored, id, { type: "retry" });
    assert.deepEqual(data.records[id].practice, { bpm: 40, guide: "silent", phase: "ready" });
  });

  it("loads existing learning saves and ignores malformed or unrelated practice records", () => {
    const old = advanceLearning(beginLearning(emptyLearning(), id), id);
    assert.deepEqual(parseLearning(JSON.stringify(old)), old);
    assert.equal(beginLessonPractice(old, "guitar-arrangement"), old);
    const raw = JSON.parse(JSON.stringify(old));
    raw.records[id].practice = { bpm: "999", guide: "bad", phase: "finished", reflection: "ready" };
    assert.deepEqual(parseLearning(JSON.stringify(raw)).records[id].practice, {
      bpm: 60,
      guide: "notes",
      phase: "ready",
    });
    raw.records[id].practice.bpm = 900;
    assert.equal(parseLearning(JSON.stringify(raw)).records[id].practice?.bpm, 100);
    raw.records[id].practice.bpm = -100;
    assert.equal(parseLearning(JSON.stringify(raw)).records[id].practice?.bpm, 40);
  });

  it("revisits completed learning without losing milestones or advancing the review schedule", () => {
    let data = beginLessonPractice(emptyLearning(), id);
    data = advanceLearning(data, id);
    data = answerLearning(data, id, 2);
    data = finishLearning(data, id, "2026-09-06");
    const finished = data.records[id];
    data = beginLessonPractice(data, id);
    assert.equal(data.records[id].step, 1);
    assert.equal(data.records[id].answer, undefined);
    assert.equal(data.records[id].completedOn, finished.completedOn);
    assert.equal(data.records[id].reviewOn, finished.reviewOn);
    assert.equal(data.records[id].reviews, 0);
  });
});
