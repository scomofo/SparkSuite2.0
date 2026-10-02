import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { CURRICULUM, LEARNING_LEVELS, learningPath, lessonCheck } from "./curriculum.ts";
import { lessonVoice } from "./curriculum-voice.ts";
import { INSTRUMENTS } from "./instruments.ts";
import {
  LEARNING_KEY,
  advanceLearning,
  answerLearning,
  beginLearning,
  beginLessonPractice,
  emptyLearning,
  finishLearning,
  learningSummary,
  loadLearning,
  parseLearning,
  saveLearning,
  updateLessonPractice,
  type LearningState,
} from "./learning.ts";
import { lessonExercise } from "./lesson-practice.ts";
import { SIDE_QUESTS, sideQuestsFor } from "./side-quests.ts";
import { SIDE_QUEST_PATTERNS, sideQuestExercise } from "./side-quest-practice.ts";

const TODAY = "2026-09-05";
const id = "guitar-first-sound";
function complete(data: LearningState, lessonId = id, day = TODAY) {
  const lesson = CURRICULUM.find((item) => item.id === lessonId)!;
  let next = beginLearning(data, lessonId);
  if (lessonExercise(lessonId)?.project) {
    next = beginLessonPractice(next, lessonId);
    next = updateLessonPractice(next, lessonId, { type: "project-next" });
    next = updateLessonPractice(next, lessonId, { type: "project-choice", choice: 0 });
    next = updateLessonPractice(next, lessonId, { type: "project-next" });
    next = updateLessonPractice(next, lessonId, { type: "attempt" });
    next = updateLessonPractice(next, lessonId, { type: "reflect", reflection: "ready" });
    next = updateLessonPractice(next, lessonId, { type: "return" });
  } else next = advanceLearning(advanceLearning(next, lessonId), lessonId);
  return finishLearning(answerLearning(next, lessonId, lesson.answer), lessonId, day);
}

describe("guided curriculum", () => {
  it("gives every curriculum lesson a human teaching frame", () => {
    for (const lesson of CURRICULUM) {
      const voice = lessonVoice(lesson);
      assert.ok(voice.opener.length > 60, lesson.id);
      assert.ok(voice.whyItMatters.length > 60, lesson.id);
      assert.ok(voice.listenFor.length > 60, lesson.id);
      assert.ok(voice.permission.length > 45, lesson.id);
      assert.ok(voice.reflection.length > 45, lesson.id);
      assert.ok(voice.opener.toLowerCase().includes(lesson.title.toLowerCase()), lesson.id);
    }
    assert.equal(
      new Set(CURRICULUM.map((lesson) => lessonVoice(lesson).listenFor)).size >= 5,
      true,
    );
    assert.ok(
      new Set(CURRICULUM.map((lesson) => lessonVoice(lesson).whyItMatters)).size >
        INSTRUMENTS.length,
    );
  });

  it("keeps core explanations direct and practice coaching specific", () => {
    for (const lesson of CURRICULUM) {
      assert.ok(lesson.explanation.length > 30);
      assert.ok(
        lessonVoice(lesson).whyItMatters.includes(lesson.practice[2].replace(/^[^:]+: /, "")),
      );
    }
  });

  it("offers four optional musicianship side quests per instrument without changing the core path", () => {
    assert.equal(SIDE_QUESTS.length, INSTRUMENTS.length * LEARNING_LEVELS.length);
    assert.equal(new Set(SIDE_QUESTS.map((quest) => quest.id)).size, SIDE_QUESTS.length);
    assert.equal(Object.keys(SIDE_QUEST_PATTERNS).length, SIDE_QUESTS.length);
    assert.deepEqual(
      Object.keys(SIDE_QUEST_PATTERNS).sort(),
      SIDE_QUESTS.map((quest) => quest.id).sort(),
    );
    for (const instrument of INSTRUMENTS) {
      const quests = sideQuestsFor(instrument.id);
      assert.equal(quests.length, LEARNING_LEVELS.length);
      for (const level of LEARNING_LEVELS) {
        const [quest] = sideQuestsFor(instrument.id, level.id);
        assert.ok(quest, `${instrument.id}-${level.id}`);
        assert.ok(quest.title.length > 10);
        assert.ok(quest.purpose.length > 35);
        assert.ok(quest.challenge.length > 45);
        assert.ok(quest.listenFor.length > 35);
        const exercise = sideQuestExercise(quest.id);
        assert.ok(exercise, quest.id);
        assert.equal(exercise!.lessonId, quest.id);
        assert.ok(exercise!.beats >= 4);
        assert.ok(exercise!.cues.length >= 4);
        assert.ok(exercise!.cues.every((cue) => cue.beat >= 0 && cue.beat < exercise!.beats));
      }
      assert.equal(learningPath(instrument.id).length, 8);
    }
  });

  it("has complete, uniquely identified lessons and an ordered prerequisite path for every instrument", () => {
    assert.equal(CURRICULUM.length, INSTRUMENTS.length * 8);
    assert.equal(INSTRUMENTS.length, 10);
    assert.equal(new Set(CURRICULUM.map((lesson) => lesson.id)).size, CURRICULUM.length);
    for (const instrument of INSTRUMENTS) {
      const lessons = learningPath(instrument.id);
      assert.equal(lessons.length, 8);
      for (const level of LEARNING_LEVELS)
        assert.equal(lessons.filter((lesson) => lesson.level === level.id).length, 2);
      lessons.forEach((lesson, index) => {
        assert.equal(lesson.prerequisite, lessons[index - 1]?.id);
        assert.equal(lesson.practice.length, 3);
        assert.equal(new Set(lesson.options).size, 3);
        assert.ok(lesson.options[lesson.answer]);
        for (const text of [
          lesson.outcome,
          lesson.explanation,
          lesson.example,
          lesson.feedback,
          ...lesson.practice,
        ])
          assert.ok(text.trim().length > 20, lesson.id);
        for (const chord of lesson.demo?.notes ?? [])
          for (const midi of chord)
            assert.ok(Number.isInteger(midi) && midi >= 21 && midi <= 108, lesson.id);
      });
    }
  });
});

describe("learning milestones and return flow", () => {
  it("requires the practice step and correct check, and completion is idempotent", () => {
    let data = beginLearning(emptyLearning(), id);
    assert.equal(answerLearning(data, id, 0), data);
    assert.equal(finishLearning(data, id, TODAY), data);
    data = advanceLearning(data, id);
    assert.equal(finishLearning(data, id, TODAY), data);
    data = advanceLearning(data, id);
    data = answerLearning(data, id, 1);
    assert.equal(finishLearning(data, id, TODAY), data);
    assert.equal(answerLearning(data, id, 8), data);
    data = answerLearning(data, id, 0);
    data = finishLearning(data, id, TODAY);
    assert.equal(data.records[id].completedOn, TODAY);
    assert.equal(data.records[id].reviewOn, "2026-09-06");
    assert.equal(finishLearning(data, id, TODAY), data);
    assert.equal(learningSummary(data, "guitar", TODAY).completed, 1);
    assert.equal(learningSummary(data, "guitar", TODAY).next?.id, "guitar-pulse");
  });

  it("keeps exact steps across days and instrument switches without marking them complete", () => {
    let data = advanceLearning(beginLearning(emptyLearning(), id), id);
    data = advanceLearning(beginLearning(data, "piano-find-c"), "piano-find-c");
    data = parseLearning(JSON.stringify(data));
    assert.equal(data.records[id].step, 1);
    assert.equal(data.records["piano-find-c"].step, 1);
    assert.equal(learningSummary(data, "guitar", "2027-01-01").recommended.id, id);
    assert.equal(learningSummary(data, "piano", "2027-01-01").recommended.id, "piano-find-c");
    assert.equal(learningSummary(data, "guitar", TODAY).completed, 0);
  });

  it("offers one due review, lets new learning continue, and never removes old milestones", () => {
    let data = complete(emptyLearning());
    let summary = learningSummary(data, "guitar", "2026-10-05");
    assert.equal(summary.reason, "review");
    assert.equal(summary.recommended.id, id);
    assert.equal(summary.next?.id, "guitar-pulse");
    data = beginLearning(data, summary.next!.id);
    summary = learningSummary(data, "guitar", "2026-10-05");
    assert.equal(summary.reason, "resume");
    assert.equal(summary.recommended.id, "guitar-pulse");
    assert.equal(summary.completed, 1);
    assert.equal(learningSummary(data, "bass", TODAY).due.length, 0);
  });

  it("spaces due reviews by 1, 3, 7, then 14 calendar days without same-day farming", () => {
    let data = complete(emptyLearning());
    data = complete(data); // An early revisit leaves the schedule alone.
    assert.equal(data.records[id].reviews, 0);
    assert.equal(data.records[id].reviewOn, "2026-09-06");
    data = complete(data, id, "2026-09-06");
    assert.equal(data.records[id].reviewOn, "2026-09-09");
    data = complete(data, id, "2026-09-06");
    assert.equal(data.records[id].reviews, 1);
    data = complete(data, id, "2026-09-09");
    assert.equal(data.records[id].reviewOn, "2026-09-16");
    data = complete(data, id, "2026-09-16");
    assert.equal(data.records[id].reviewOn, "2026-09-30");
    data = complete(data, id, "2026-09-30");
    assert.equal(data.records[id].reviewOn, "2026-10-14");
    assert.equal(data.records[id].completedOn, TODAY);
  });

  it("allows a learner to explore advanced work without falsely completing prerequisites", () => {
    const data = complete(emptyLearning(), "piano-miniature");
    assert.equal(learningSummary(data, "piano", TODAY).completed, 1);
    assert.equal(learningSummary(data, "piano", TODAY).next?.id, "piano-find-c");
  });

  it("rolls review dates through month, year, and daylight-saving boundaries", () => {
    assert.equal(complete(emptyLearning(), id, "2026-12-31").records[id].reviewOn, "2027-01-01");
    assert.equal(complete(emptyLearning(), id, "2028-02-28").records[id].reviewOn, "2028-02-29");
    assert.equal(complete(emptyLearning(), id, "2026-11-01").records[id].reviewOn, "2026-11-02");
  });
});

describe("learning storage", () => {
  it("rejects corrupt data, unknown lessons, cross-instrument resume IDs, and invalid completion", () => {
    for (const value of ["{", "null", "[]", '{"version":99}', "x".repeat(100_001)])
      assert.deepEqual(parseLearning(value), emptyLearning());
    const data = beginLearning(emptyLearning(), id);
    const raw = JSON.parse(JSON.stringify(data));
    raw.active.piano = id;
    raw.records.unknown = { step: 3, completedOn: TODAY };
    raw.records[id] = { step: 3, answer: 1, completedOn: "2026-02-30", reviews: 500 };
    const restored = parseLearning(JSON.stringify(raw));
    assert.equal(restored.active.piano, undefined);
    assert.equal(restored.records.unknown, undefined);
    assert.equal(restored.records[id].step, 2);
    assert.equal(restored.records[id].completedOn, undefined);
  });

  it("saves only learning data and reports failed persistence without touching practice data", () => {
    const descriptor = Object.getOwnPropertyDescriptor(globalThis, "localStorage");
    const practice = '{"version":4,"apps":{"guitar":{"xp":500}}}';
    const values = new Map([["sparksuite.v2", practice]]);
    try {
      Object.defineProperty(globalThis, "localStorage", {
        configurable: true,
        value: {
          getItem: (key: string) => values.get(key) ?? null,
          setItem: (key: string, value: string) => values.set(key, value),
        },
      });
      const data = complete(emptyLearning());
      assert.equal(saveLearning(data), true);
      assert.equal(values.get("sparksuite.v2"), practice);
      assert.ok(values.has(LEARNING_KEY));
      assert.deepEqual(loadLearning(), { data, storageOk: true });
      Object.defineProperty(globalThis, "localStorage", {
        configurable: true,
        get() {
          throw Error("blocked");
        },
      });
      assert.equal(saveLearning(data), false);
      assert.equal(loadLearning().storageOk, false);
      assert.equal(data.records[id].completedOn, TODAY);
    } finally {
      if (descriptor) Object.defineProperty(globalThis, "localStorage", descriptor);
      else Reflect.deleteProperty(globalThis, "localStorage");
    }
  });
});

it("keeps corrected reviews due soon without removing completion", () => {
  let data = complete(emptyLearning());
  data = beginLearning(data, id);
  data = advanceLearning(advanceLearning(data, id), id);
  data = answerLearning(data, id, 1);
  data = answerLearning(data, id, 0);
  data = finishLearning(data, id, "2026-09-06");
  assert.equal(data.records[id].firstAnswer, 1);
  assert.equal(data.records[id].reviews, 0);
  assert.equal(data.records[id].reviewOn, "2026-09-07");
  assert.equal(data.records[id].completedOn, TODAY);
});

it("changes authored recall questions without changing saved answer IDs", () => {
  const lesson = CURRICULUM.find((l) => l.id === "guitar-first-sound")!;
  const check = lessonCheck(lesson, true, 0);
  assert.notEqual(check.question, lesson.question);
  assert.equal(check.options[lesson.answer], "The pitch rises from E to F");
  assert.equal(lessonCheck(lesson, false, 0).question, lesson.question);
});

it("preserves legacy first responses when restoring an unfinished check", () => {
  const lesson = CURRICULUM[0]!;
  for (const answer of [lesson.answer, (lesson.answer + 1) % lesson.options.length]) {
    const data = parseLearning(
      JSON.stringify({ version: 1, records: { [lesson.id]: { step: 2, answer } } }),
    );
    assert.equal(data.records[lesson.id]!.firstAnswer, answer);
    const corrected = answerLearning(data, lesson.id, lesson.answer);
    assert.equal(corrected.records[lesson.id]!.firstAnswer, answer);
    assert.equal(corrected.records[lesson.id]!.assisted, answer !== lesson.answer);
  }
});
