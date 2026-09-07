import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { learningLesson, learningPath } from "./curriculum.ts";
import { INSTRUMENTS, type InstrumentId } from "./instruments.ts";
import {
  advanceLearning,
  answerLearning,
  beginLearning,
  beginLessonPractice,
  configureLearning,
  emptyLearning,
  finishLearning,
  learningPace,
  learningSummary,
  parseLearning,
  updateLessonPractice,
  type LearningState,
} from "./learning.ts";
import { EXPERIENCE_OPTIONS, parseProfile, startingLesson } from "./learning-profile.ts";
import { lessonExercise } from "./lesson-practice.ts";
import {
  beginMilestone,
  milestoneReady,
  milestoneSequence,
  musicalMilestone,
  MUSICAL_MILESTONES,
  updateMilestone,
} from "./milestones.ts";
import { nextLearningAction } from "./next-learning-action.ts";

const DAY = "2026-09-06";
const roundTrip = (data: LearningState) => parseLearning(JSON.stringify(data));
function complete(data: LearningState, id: string) {
  let next = beginLearning(data, id);
  if (lessonExercise(id)?.project) {
    next = beginLessonPractice(next, id);
    next = updateLessonPractice(next, id, { type: "project-next" });
    next = updateLessonPractice(next, id, { type: "project-choice", choice: 0 });
    next = updateLessonPractice(next, id, { type: "project-next" });
    next = updateLessonPractice(next, id, { type: "attempt" });
    next = updateLessonPractice(next, id, { type: "reflect", reflection: "ready" });
    next = updateLessonPractice(next, id, { type: "return" });
  } else next = advanceLearning(advanceLearning(next, id), id);
  return finishLearning(answerLearning(next, id, learningLesson(id)!.answer), id, DAY);
}
function savePiece(data: LearningState, instrument: InstrumentId = "guitar") {
  let next = beginMilestone(data, instrument);
  next = updateMilestone(next, instrument, {
    type: "settings",
    scope: "whole",
    bpm: 40,
    guide: "silent",
    variation: true,
  });
  next = updateMilestone(next, instrument, { type: "attempt" });
  next = updateMilestone(next, instrument, { type: "reflect", reflection: "exploring" });
  next = updateMilestone(next, instrument, { type: "note", note: "Let the ending breathe." });
  return updateMilestone(next, instrument, { type: "save" }, DAY);
}

describe("personal starting points", () => {
  it("reads existing v1 saves without replacing lessons, guided attempts, or review dates", () => {
    const old = complete(emptyLearning(), "guitar-first-sound");
    const {
      profiles: _profiles,
      skippedSetup: _skipped,
      milestones: _milestones,
      focus: _focus,
      ...legacy
    } = old;
    const data = parseLearning(JSON.stringify(legacy));
    assert.deepEqual(data.records, old.records);
    assert.deepEqual(data.active, old.active);
    assert.deepEqual(data.profiles, {});
    assert.deepEqual(data.milestones, {});
    assert.equal(learningSummary(data, "guitar", "2026-09-07").reason, "review");
  });
  it("chooses all four levels on all six instruments without awarding earlier lessons", () => {
    for (const { id } of INSTRUMENTS)
      for (const [index, option] of EXPERIENCE_OPTIONS.entries()) {
        const data = configureLearning(emptyLearning(), id, { experience: option.id, minutes: 5 });
        const next = nextLearningAction(data, id, DAY);
        assert.equal(next.kind, "lesson");
        assert.equal(next.summary.recommended.id, learningPath(id)[index * 2].id);
        assert.equal(next.summary.completed, 0);
        assert.deepEqual(data.records, {});
        assert.deepEqual(roundTrip(data), data);
      }
  });
  it("keeps experience, time, and existing work separate for each instrument", () => {
    let data = configureLearning(emptyLearning(), "guitar", { experience: "new", minutes: 2 });
    data = configureLearning(data, "piano", { experience: "advanced", minutes: 10 });
    data = advanceLearning(beginLearning(data, "guitar-first-sound"), "guitar-first-sound");
    data = configureLearning(data, "guitar", { experience: "advanced", minutes: 5 });
    assert.equal(
      nextLearningAction(data, "guitar", DAY).summary.recommended.id,
      "guitar-first-sound",
    );
    assert.equal(data.records["guitar-first-sound"].step, 1);
    assert.equal(data.profiles.piano?.minutes, 10);
    assert.equal(learningPace(data, "guitar"), "lesson");
    assert.equal(
      learningPace(configureLearning(data, "guitar", { experience: "new", minutes: 2 }), "guitar"),
      "step",
    );
    assert.equal(startingLesson("piano", data.profiles.piano).level, "advanced");
  });
  it("sanitizes setup choices and persists a skipped setup without inventing a profile", () => {
    assert.equal(parseProfile({ experience: "expert", minutes: 5 }), undefined);
    assert.deepEqual(parseProfile({ experience: "new", minutes: -1 }), {
      experience: "new",
      minutes: 2,
    });
    const data = parseLearning(
      JSON.stringify({
        version: 1,
        profiles: {
          guitar: { experience: "new", minutes: 99 },
          violin: { experience: "new", minutes: 2 },
        },
        skippedSetup: { piano: true, bass: "yes", violin: true },
      }),
    );
    assert.deepEqual(data.profiles, { guitar: { experience: "new", minutes: 2 } });
    assert.deepEqual(data.skippedSetup, { piano: true });
  });
  it("does not claim the whole path is finished when an advanced starting section is done", () => {
    let data = configureLearning(emptyLearning(), "piano", { experience: "advanced", minutes: 10 });
    for (const lesson of learningPath("piano").slice(6)) data = complete(data, lesson.id);
    const summary = learningSummary(data, "piano", DAY);
    assert.equal(summary.next, undefined);
    assert.equal(summary.completed, 2);
    assert.equal(summary.lessons.length, 8);
    assert.equal(data.records["piano-find-c"], undefined);
  });
});

describe("one useful next action", () => {
  it("suggests a first piece after its preparation, then moves on after saving it", () => {
    let data = emptyLearning();
    for (const id of musicalMilestone("guitar").lessons) data = complete(data, id);
    assert.equal(milestoneReady(data, "guitar"), true);
    assert.equal(nextLearningAction(data, "guitar", DAY).kind, "milestone");
    data = savePiece(data);
    const next = nextLearningAction(data, "guitar", DAY);
    assert.equal(next.kind, "lesson");
    assert.equal(next.summary.recommended.id, "guitar-eighths");
  });
  it("resumes the most recently chosen kind of work, preserving both places", () => {
    let data = beginLearning(emptyLearning(), "guitar-first-sound");
    data = beginMilestone(data, "guitar");
    assert.equal(nextLearningAction(data, "guitar", DAY).kind, "milestone");
    data = beginLearning(data, "guitar-first-sound");
    assert.equal(nextLearningAction(data, "guitar", DAY).kind, "lesson");
    data = updateMilestone(data, "guitar", { type: "attempt" });
    data = roundTrip(configureLearning(data, "guitar", { experience: "advanced", minutes: 10 }));
    assert.equal(nextLearningAction(data, "guitar", DAY).kind, "milestone");
    assert.equal(data.records["guitar-first-sound"].step, 0);
    assert.equal(data.milestones.guitar?.phase, "reflect");
  });
  it("resumes an unfinished piece before a review, but offers a due review before a new piece", () => {
    let data = emptyLearning();
    for (const id of musicalMilestone("guitar").lessons) data = complete(data, id);
    assert.equal(nextLearningAction(data, "guitar", "2026-10-06").reason, "review");
    data = beginMilestone(data, "guitar");
    assert.equal(nextLearningAction(data, "guitar", "2026-10-06").reason, "resume");
    assert.equal(nextLearningAction(data, "guitar", "2026-10-06").kind, "milestone");
  });
});

describe("musical milestone attempts and saved versions", () => {
  it("offers one bar for two minutes and a whole piece for five or ten, without completing anything", () => {
    for (const minutes of [2, 5, 10] as const) {
      const data = beginMilestone(
        configureLearning(emptyLearning(), "piano", { experience: "new", minutes }),
        "piano",
      );
      assert.equal(data.milestones.piano?.scope, minutes === 2 ? "first" : "whole");
      assert.equal(data.milestones.piano?.saved, undefined);
      assert.deepEqual(data.records, {});
      assert.deepEqual(roundTrip(data), data);
    }
  });
  it("a first-bar check-in cannot save a whole piece or create lesson credit", () => {
    let data = beginMilestone(
      configureLearning(emptyLearning(), "guitar", { experience: "new", minutes: 2 }),
      "guitar",
    );
    data = updateMilestone(data, "guitar", { type: "attempt" });
    assert.equal(data.milestones.guitar?.firstBarTried, true);
    assert.equal(data.milestones.guitar?.phase, "play");
    assert.equal(data.milestones.guitar?.scope, "whole");
    assert.equal(updateMilestone(data, "guitar", { type: "save" }, DAY), data);
    assert.equal(
      updateMilestone(data, "guitar", { type: "reflect", reflection: "comfortable" }),
      data,
    );
    assert.equal(learningSummary(data, "guitar", DAY).completed, 0);
    assert.deepEqual(roundTrip(data), data);
  });
  it("requires an explicit attempt and reflection before saving, and saving is idempotent", () => {
    let data = beginMilestone(emptyLearning(), "piano");
    assert.equal(updateMilestone(data, "piano", { type: "save" }, DAY), data);
    data = updateMilestone(data, "piano", { type: "attempt" });
    assert.equal(updateMilestone(data, "piano", { type: "save" }, DAY), data);
    data = updateMilestone(data, "piano", { type: "reflect", reflection: "comfortable" });
    assert.equal(updateMilestone(data, "piano", { type: "save" }, "2026-02-30"), data);
    data = updateMilestone(data, "piano", { type: "save" }, DAY);
    assert.equal(data.milestones.piano?.saved?.savedOn, DAY);
    assert.equal(updateMilestone(data, "piano", { type: "save" }, "2026-10-06"), data);
  });
  it("keeps saved tempo, variation, note, and reflection while a new attempt is unfinished", () => {
    let data = savePiece(emptyLearning());
    const snapshot = data.milestones.guitar!.saved!;
    data = updateMilestone(data, "guitar", { type: "replay" });
    data = updateMilestone(data, "guitar", { type: "settings", bpm: 90, variation: false });
    data = updateMilestone(data, "guitar", { type: "attempt" });
    data = updateMilestone(data, "guitar", { type: "note", note: "A different ending." });
    data = roundTrip(data);
    assert.deepEqual(data.milestones.guitar?.saved, snapshot);
    data = updateMilestone(data, "guitar", { type: "replay" });
    assert.equal(data.milestones.guitar?.bpm, 40);
    assert.equal(data.milestones.guitar?.variation, true);
    assert.equal(data.milestones.guitar?.note, snapshot.note);
    assert.equal(data.milestones.guitar?.reflection, undefined);
    assert.equal(data.milestones.guitar?.phase, "play");
    assert.deepEqual(roundTrip(data), data);
  });
  it("preserves six independent pieces across reloads and long breaks", () => {
    let data = emptyLearning();
    for (const { id } of INSTRUMENTS) data = savePiece(data, id);
    const restored = roundTrip(data);
    assert.equal(Object.keys(restored.milestones).length, 6);
    assert.deepEqual(restored, data);
    for (const { id } of INSTRUMENTS) {
      assert.equal(restored.milestones[id]?.saved?.savedOn, DAY);
      assert.equal(nextLearningAction(restored, id, "2028-01-01").kind, "lesson");
    }
  });
  it("sanitizes damaged milestone saves without losing valid lessons", () => {
    const raw = JSON.parse(JSON.stringify(complete(emptyLearning(), "piano-find-c")));
    raw.milestones = {
      guitar: {
        phase: "saved",
        scope: "first",
        bpm: 500,
        guide: "unsafe",
        note: "x".repeat(300),
        saved: { savedOn: "2026-02-30", reflection: "comfortable" },
      },
      violin: {},
    };
    raw.focus = { violin: "milestone", bass: "milestone" };
    const data = parseLearning(JSON.stringify(raw));
    assert.deepEqual(Object.keys(data.milestones), ["guitar"]);
    assert.equal(data.milestones.guitar?.phase, "play");
    assert.equal(data.milestones.guitar?.bpm, 100);
    assert.equal(data.milestones.guitar?.guide, "notes");
    assert.equal(data.milestones.guitar?.note.length, 240);
    assert.equal(data.milestones.guitar?.saved, undefined);
    assert.deepEqual(data.focus, {});
    assert.equal(data.records["piano-find-c"].completedOn, DAY);
  });
});

describe("six original pieces and their musical variations", () => {
  it("uses playable notes, real preparation lessons, complete bars, and bounded durations", () => {
    assert.equal(new Set(MUSICAL_MILESTONES.map((piece) => piece.instrument)).size, 6);
    for (const piece of MUSICAL_MILESTONES) {
      assert.ok(piece.lessons.every((id) => learningLesson(id)?.instrument === piece.instrument));
      for (const variation of [false, true]) {
        const whole = milestoneSequence(piece, variation);
        const first = milestoneSequence(piece, variation, "first");
        assert.equal(first.beats, 4);
        assert.ok(first.cues.every((cue) => cue.beat < 4));
        assert.equal(whole.beats, piece.instrument === "drums" ? 17 : 16);
        for (let beat = 0; beat < whole.beats; beat++)
          assert.ok(
            whole.cues.some((cue) => cue.beat === beat),
            `${piece.instrument} beat ${beat}`,
          );
        for (const cue of whole.cues) {
          assert.ok(cue.beat >= 0 && cue.beat < whole.beats);
          assert.ok(cue.beat + (cue.duration ?? 0.85) <= whole.beats);
          assert.ok(
            cue.notes?.every((midi) => Number.isInteger(midi) && midi >= 21 && midi <= 108) ?? true,
          );
          assert.ok(
            cue.pads?.every((pad) => Number.isInteger(pad) && pad >= 0 && pad <= 3) ?? true,
          );
        }
      }
      assert.notDeepEqual(piece.cues, piece.alternate, piece.instrument);
    }
  });
  it("gives the harmony, melody, bass, fill, and voice a deliberate ending", () => {
    assert.equal(musicalMilestone("guitar").cues.find((cue) => cue.beat === 12)?.chord, "Em");
    assert.equal(musicalMilestone("ukulele").cues.find((cue) => cue.beat === 12)?.chord, "C");
    assert.deepEqual(
      musicalMilestone("piano")
        .cues.filter((cue) => cue.notes)
        .slice(-3)
        .map((cue) => cue.notes![0]),
      [64, 62, 60],
    );
    assert.deepEqual(
      musicalMilestone("bass")
        .cues.filter((cue) => cue.beat % 4 === 0)
        .map((cue) => cue.notes![0]),
      [28, 31, 31, 28],
    );
    assert.deepEqual(
      musicalMilestone("drums").alternate.find((cue) => cue.beat === 15.5)?.pads,
      [3],
    );
    assert.deepEqual(musicalMilestone("drums").cues.at(-1)?.pads, [0]);
    assert.deepEqual(
      musicalMilestone("vocals")
        .cues.slice(-4, -1)
        .map((cue) => cue.label),
      ["Back", "At", "Home"],
    );
  });
});
