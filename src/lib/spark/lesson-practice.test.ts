import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { CURRICULUM, learningLesson, learningPath } from "./curriculum.ts";
import { INSTRUMENTS } from "./instruments.ts";
import { BANJO_CHORDS, banjoChordFrequencies, lessonsFor, type InstrumentId } from "./instruments.ts";
import { buildTimeline, isPluckDrill } from "./practice.ts";
import { dailyInstrumentCues, instrumentLabPattern } from "./instrument-patterns.ts";
import { musicalMilestone } from "./milestones.ts";
import type { PlanItem } from "./types.ts";
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
  practiceSequence,
  practiceShape,
  PRACTICE_TEMPOS,
  retryCoaching,
} from "./lesson-practice.ts";

describe("lesson-specific practice content", () => {
  it("covers every lesson with bounded, playable patterns", () => {
    assert.equal(LESSON_EXERCISES.length, 80);
    assert.equal(new Set(LESSON_EXERCISES.map((exercise) => exercise.lessonId)).size, 80);
    assert.deepEqual(
      LESSON_EXERCISES.map((exercise) => exercise.lessonId).sort(),
      CURRICULUM.map((lesson) => lesson.id).sort(),
    );
    for (const inst of INSTRUMENTS) {
      for (const lesson of learningPath(inst.id)) assert.ok(lessonExercise(lesson.id), lesson.id);
    }
    for (const exercise of LESSON_EXERCISES) {
      const lesson = learningLesson(exercise.lessonId)!;
      assert.ok(lesson);
      assert.ok((PRACTICE_TEMPOS as readonly number[]).includes(exercise.bpm));
      const hasTerminalLanding =
        exercise.beats === 17 && exercise.cues.some((cue) => cue.beat === 16);
      assert.ok(
        exercise.beats >= 4 && (exercise.beats <= 16 || hasTerminalLanding),
        `${exercise.lessonId} stays within four bars plus an optional landing`,
      );
      for (const text of [exercise.goal, exercise.setup, exercise.hint, exercise.takeaway])
        assert.ok(text.length > 30);
      const subdivision = exercise.subdivision ?? 2;
      assert.ok([1, 2, 3, 4].includes(subdivision), exercise.lessonId);
      for (const cue of exercise.cues) {
        assert.ok(cue.beat >= 0 && cue.beat < exercise.beats, exercise.lessonId);
        assert.ok(
          Math.abs(cue.beat * subdivision - Math.round(cue.beat * subdivision)) < 1e-8,
          `${exercise.lessonId} cue ${cue.beat} fits its subdivision`,
        );
        assert.ok(cue.detail);
        if (cue.duration)
          assert.ok(
            cue.duration > 0 && cue.beat + cue.duration <= exercise.beats + 1e-8,
            `${exercise.lessonId} cue ${cue.beat} ends inside the exercise`,
          );
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
    assert.ok(lessonExercise("guitar-arrangement"));
    assert.equal(CURRICULUM.length, 80);
  });

  it("turns exactly the final two lessons for each instrument into three-stage projects", () => {
    const expected = INSTRUMENTS.flatMap((instrument) =>
      learningPath(instrument.id)
        .slice(-2)
        .map((lesson) => lesson.id),
    ).sort();
    const projects = LESSON_EXERCISES.filter((exercise) => exercise.project);
    assert.deepEqual(projects.map((exercise) => exercise.lessonId).sort(), expected);
    assert.equal(projects.length, 20);
    for (const exercise of projects) {
      const project = exercise.project!;
      assert.ok(project.buildBeats >= 4 && project.buildBeats <= exercise.beats);
      assert.equal(
        practiceSequence(exercise, {
          bpm: exercise.bpm,
          guide: "notes",
          phase: "ready",
          projectStage: 0,
        }).beats,
        project.buildBeats,
      );
      assert.equal(
        practiceSequence(exercise, {
          bpm: exercise.bpm,
          guide: "notes",
          phase: "ready",
          projectStage: 1,
        }).beats,
        exercise.beats,
      );
      assert.equal(project.stages.length, 3);
      assert.deepEqual(
        project.stages.map((stage) => stage.label),
        ["Build", "Choose", "Refine"],
      );
      for (const stage of project.stages) {
        assert.ok(stage.title.trim().length >= 3, exercise.lessonId);
        assert.ok(stage.instruction.trim().length > 30, exercise.lessonId);
        assert.ok(stage.button.trim().length >= 3, exercise.lessonId);
      }
      assert.equal(project.choices.length, 2);
      assert.equal(new Set(project.choices.map((choice) => choice.label)).size, 2);
      for (const choice of project.choices) {
        assert.ok(choice.label.trim().length >= 3, exercise.lessonId);
        assert.ok(choice.detail.trim().length > 20, exercise.lessonId);
      }
    }
  });

  it("offers two concrete retry paths for every guided exercise", () => {
    for (const exercise of LESSON_EXERCISES) {
      const retries = retryCoaching(exercise);
      assert.deepEqual(
        retries.map((retry) => retry.id),
        ["pulse", "technique"],
      );
      assert.equal(new Set(retries.map((retry) => retry.label)).size, 2);
      for (const retry of retries) {
        assert.ok(retry.label.trim().length > 10, exercise.lessonId);
        assert.ok(retry.adjustment.trim().length > 30, exercise.lessonId);
      }
      assert.equal(retries[1].adjustment, exercise.hint);
    }
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

  it("keeps sixteenth notes and the six-slot polyrhythm on their declared grids", () => {
    const sixteenths = lessonExercise("drums-sixteenths")!;
    assert.equal(sixteenths.subdivision, 4);
    assert.deepEqual(
      sixteenths.cues.filter((cue) => cue.beat < 1).map((cue) => cue.beat),
      [0, 0.25, 0.5, 0.75],
    );
    const threeOverTwo = lessonExercise("drums-three-over-two")!;
    assert.equal(threeOverTwo.subdivision, 3);
    assert.deepEqual(
      threeOverTwo.cues.filter((cue) => cue.beat < 2).map((cue) => cue.beat),
      [0, 1 / 3, 2 / 3, 1, 4 / 3, 5 / 3],
    );
  });

  it("preserves a held left hand while the right moves, and includes the minor third", () => {
    const hands = lessonExercise("piano-hands-together")!;
    assert.deepEqual(
      hands.cues.filter((cue) => cue.beat === 0).map((cue) => cue.notes),
      [[48], [60]],
    );
    assert.equal(hands.cues[0].duration, 3.8);
    const voiceLeading = lessonExercise("piano-voice-leading")!;
    for (const beat of [0, 4, 8, 12]) {
      const barCues = voiceLeading.cues.filter((cue) => cue.beat === beat);
      assert.deepEqual(barCues[0].notes, [60]);
      assert.equal(barCues[0].duration, 3.8);
      assert.equal(barCues[1].notes?.includes(60), false);
      assert.equal(barCues[1].duration, 1.95);
    }
    assert.deepEqual(lessonExercise("piano-major-minor")!.cues[2].notes, [60, 63, 67]);
    assert.deepEqual(lessonExercise("vocals-thirds")!.cues[5].notes, [63]);
  });
});

describe("recoverable guided practice", () => {
  const id = "guitar-em-to-g";
  const projectId = "guitar-secondary-dominant";
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
    data = updateLessonPractice(data, id, { type: "retry-focus", focus: "technique" });
    data = beginLessonPractice(data, "piano-find-c");
    const restored = parseLearning(JSON.stringify(data));
    assert.deepEqual(restored, data);
    assert.deepEqual(restored.records[id].practice, {
      bpm: 40,
      guide: "silent",
      phase: "reflect",
      reflection: "again",
      retryFocus: "technique",
    });
    assert.equal(restored.active.guitar, id);
    assert.equal(restored.active.piano, "piano-find-c");
    data = updateLessonPractice(restored, id, { type: "retry" });
    assert.deepEqual(data.records[id].practice, {
      bpm: 40,
      guide: "silent",
      phase: "ready",
      retryFocus: "technique",
    });
    assert.deepEqual(parseLearning(JSON.stringify(data)), data);
  });

  it("turns a pulse retry into one saved first-bar attempt at 40 BPM", () => {
    const exercise = lessonExercise(id)!;
    let data = beginLessonPractice(emptyLearning(), id);
    data = updateLessonPractice(data, id, { type: "attempt" });
    data = updateLessonPractice(data, id, { type: "reflect", reflection: "again" });
    assert.equal(
      updateLessonPractice(data, id, { type: "retry" }),
      data,
      "A retry needs one selected adjustment",
    );
    data = updateLessonPractice(data, id, { type: "retry-focus", focus: "pulse" });
    data = updateLessonPractice(data, id, { type: "retry" });
    assert.deepEqual(data.records[id].practice, {
      bpm: 40,
      guide: "pulse",
      phase: "ready",
      retryFocus: "pulse",
    });
    const sequence = practiceSequence(exercise, data.records[id].practice);
    assert.equal(sequence.beats, 4);
    assert.deepEqual(
      sequence.cues,
      exercise.cues.filter((cue) => cue.beat < 4),
    );
    assert.deepEqual(parseLearning(JSON.stringify(data)), data, "The adjustment survives a pause");
    data = updateLessonPractice(data, id, { type: "attempt" });
    assert.equal(
      data.records[id].practice?.retryFocus,
      undefined,
      "A new check-in asks what happened this time",
    );
    data = updateLessonPractice(data, id, { type: "reflect", reflection: "again" });
    assert.equal(
      updateLessonPractice(data, id, { type: "retry" }),
      data,
      "A new retry needs a new focused adjustment",
    );
  });

  it("gates and resumes each project stage without completing the lesson", () => {
    let data = beginLessonPractice(emptyLearning(), projectId);
    assert.deepEqual(data.records[projectId].practice, {
      bpm: lessonExercise(projectId)!.bpm,
      guide: "notes",
      phase: "ready",
      projectStage: 0,
    });
    assert.equal(updateLessonPractice(data, projectId, { type: "attempt" }), data);
    assert.equal(
      updateLessonPractice(data, projectId, { type: "project-choice", choice: 0 }),
      data,
    );

    data = updateLessonPractice(data, projectId, { type: "project-next" });
    assert.equal(data.records[projectId].practice?.projectStage, 1);
    assert.equal(data.records[projectId].completedOn, undefined);
    assert.equal(updateLessonPractice(data, projectId, { type: "attempt" }), data);
    assert.equal(updateLessonPractice(data, projectId, { type: "project-next" }), data);

    data = updateLessonPractice(data, projectId, { type: "project-choice", choice: 1 });
    data = beginLessonPractice(data, "piano-secondary-dominant");
    const restored = parseLearning(JSON.stringify(data));
    assert.equal(restored.records[projectId].practice?.projectStage, 1);
    assert.equal(restored.records[projectId].practice?.projectChoice, 1);
    assert.equal(restored.active.guitar, projectId);
    assert.equal(restored.active.piano, "piano-secondary-dominant");

    data = updateLessonPractice(restored, projectId, { type: "project-next" });
    assert.equal(data.records[projectId].practice?.projectStage, 2);
    assert.equal(data.records[projectId].step, 1);
    assert.equal(data.records[projectId].completedOn, undefined);
    assert.equal(finishLearning(data, projectId), data);
    data = updateLessonPractice(data, projectId, { type: "attempt" });
    assert.equal(data.records[projectId].practice?.phase, "reflect");
    assert.equal(updateLessonPractice(data, projectId, { type: "return" }), data);
    data = updateLessonPractice(data, projectId, { type: "reflect", reflection: "ready" });
    data = updateLessonPractice(data, projectId, { type: "return" });
    assert.equal(data.records[projectId].step, 2);
    assert.equal(data.records[projectId].completedOn, undefined);
    assert.equal(
      finishLearning(data, projectId),
      data,
      "The normal lesson check is still required",
    );
  });

  it("allows entry into a project but prevents the generic lesson action from bypassing it", () => {
    let data = beginLearning(emptyLearning(), projectId);
    assert.equal(data.records[projectId].step, 0);
    data = advanceLearning(data, projectId);
    assert.equal(data.records[projectId].step, 1);
    assert.equal(
      advanceLearning(data, projectId),
      data,
      "A project must return through its final guided reflection",
    );
  });

  it("repairs impossible project reflections before the final stage", () => {
    const data = beginLessonPractice(emptyLearning(), projectId);
    for (const malformed of [
      { projectStage: 0, projectChoice: 1 },
      { projectStage: 1, projectChoice: 0 },
      { projectStage: 2 },
    ]) {
      const raw = JSON.parse(JSON.stringify(data));
      raw.records[projectId].practice = {
        ...raw.records[projectId].practice,
        ...malformed,
        phase: "reflect",
        reflection: "again",
        retryFocus: "pulse",
      };
      const practice = parseLearning(JSON.stringify(raw)).records[projectId].practice!;
      assert.equal(
        practice.projectStage,
        malformed.projectStage === 2 ? 1 : malformed.projectStage,
      );
      assert.equal(practice.phase, "ready");
      assert.equal(practice.reflection, undefined);
      assert.equal(practice.retryFocus, undefined);
      assert.equal(
        practice.projectChoice,
        malformed.projectStage === 1 ? 0 : undefined,
        "Only a choice-stage selection survives repair",
      );
    }
  });

  it("returns from a project only after a valid final-stage reflection", () => {
    const data = beginLessonPractice(emptyLearning(), projectId);
    const saved = data.records[projectId].practice!;
    const withPractice = (practice: Partial<typeof saved>) => ({
      ...data,
      records: {
        ...data.records,
        [projectId]: {
          ...data.records[projectId],
          practice: { ...saved, ...practice },
        },
      },
    });
    for (const invalid of [
      withPractice({ projectStage: 0, phase: "reflect", reflection: "ready" }),
      withPractice({
        projectStage: 1,
        projectChoice: 0,
        phase: "reflect",
        reflection: "ready",
      }),
      withPractice({
        projectStage: 2,
        projectChoice: undefined,
        phase: "reflect",
        reflection: "ready",
      }),
      withPractice({
        projectStage: 2,
        projectChoice: 0,
        phase: "reflect",
        reflection: undefined,
      }),
      withPractice({
        projectStage: 2,
        projectChoice: 0,
        phase: "ready",
        reflection: "ready",
      }),
    ])
      assert.equal(updateLessonPractice(invalid, projectId, { type: "return" }), invalid);

    const valid = withPractice({
      projectStage: 2,
      projectChoice: 0,
      phase: "reflect",
      reflection: "ready",
    });
    const returned = updateLessonPractice(valid, projectId, { type: "return" });
    assert.equal(returned.records[projectId].step, 2);
    assert.equal(returned.records[projectId].completedOn, undefined);
  });

  it("accepts an attempt only from ready and clears stale reflection coaching", () => {
    let data = beginLessonPractice(emptyLearning(), projectId);
    data = updateLessonPractice(data, projectId, { type: "project-next" });
    data = updateLessonPractice(data, projectId, { type: "project-choice", choice: 0 });
    data = updateLessonPractice(data, projectId, { type: "project-next" });
    const record = data.records[projectId];
    data = {
      ...data,
      records: {
        ...data.records,
        [projectId]: {
          ...record,
          practice: {
            ...record.practice!,
            phase: "ready",
            reflection: "again",
            retryFocus: "technique",
          },
        },
      },
    };
    data = updateLessonPractice(data, projectId, { type: "attempt" });
    assert.deepEqual(data.records[projectId].practice, {
      bpm: lessonExercise(projectId)!.bpm,
      guide: "notes",
      phase: "reflect",
      projectStage: 2,
      projectChoice: 0,
    });
    assert.equal(
      updateLessonPractice(data, projectId, { type: "attempt" }),
      data,
      "An attempt cannot restart while the reflection is open",
    );
  });

  it("repairs malformed project progress and never attaches it to a standard exercise", () => {
    const legacyRaw = JSON.parse(
      JSON.stringify(advanceLearning(beginLearning(emptyLearning(), projectId), projectId)),
    );
    legacyRaw.records[projectId].step = 2;
    const legacy = parseLearning(JSON.stringify(legacyRaw));
    assert.equal(legacy.records[projectId].step, 2);
    assert.equal(legacy.records[projectId].practice, undefined);
    assert.deepEqual(parseLearning(JSON.stringify(legacy)), legacy);

    let data = beginLessonPractice(emptyLearning(), projectId);
    data = updateLessonPractice(data, projectId, { type: "project-next" });
    const raw = JSON.parse(JSON.stringify(data));
    raw.records[projectId].practice.projectStage = 2;
    delete raw.records[projectId].practice.projectChoice;
    assert.equal(parseLearning(JSON.stringify(raw)).records[projectId].practice?.projectStage, 1);
    raw.records[projectId].practice.projectStage = 99;
    raw.records[projectId].practice.projectChoice = 9;
    assert.deepEqual(parseLearning(JSON.stringify(raw)).records[projectId].practice, {
      bpm: lessonExercise(projectId)!.bpm,
      guide: "notes",
      phase: "ready",
      projectStage: 0,
    });

    const normal = beginLessonPractice(emptyLearning(), id);
    const normalRaw = JSON.parse(JSON.stringify(normal));
    normalRaw.records[id].practice.projectStage = 2;
    normalRaw.records[id].practice.projectChoice = 1;
    assert.deepEqual(parseLearning(JSON.stringify(normalRaw)).records[id].practice, {
      bpm: lessonExercise(id)!.bpm,
      guide: "notes",
      phase: "ready",
    });
  });

  it("loads existing learning saves and ignores malformed or unrelated practice records", () => {
    const old = advanceLearning(beginLearning(emptyLearning(), id), id);
    assert.deepEqual(parseLearning(JSON.stringify(old)), old);
    assert.equal(beginLessonPractice(old, "not-a-lesson"), old);
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

describe("instrument musical accuracy regressions", () => {
  function item(instrument: InstrumentId, id: string): PlanItem {
    const lesson = lessonsFor(instrument).find((l) => l.id === id)!;
    return { ...lesson, lessonId: id, subtitle: "", durationSec: 1, surface: "strings" };
  }

  it("teaches a two-finger D7 with the first string open in shapes, demos and rolls", () => {
    assert.deepEqual(BANJO_CHORDS.D7.frets, [null, 0, 2, 1, 0]);
    assert.deepEqual(BANJO_CHORDS.D7.fingers, [null, 0, 2, 1, 0]);
    assert.deepEqual(BANJO_CHORDS.D.frets, [null, 0, 2, 3, 4]);
    for (const [chord, midi] of [["D7", [50, 57, 60, 62]], ["D", [50, 57, 62, 66]]] as const) {
      const frequencies = banjoChordFrequencies(chord);
      assert.equal(frequencies.length, 4);
      frequencies.forEach((hz, index) => assert.ok(Math.abs(hz - 440 * 2 ** ((midi[index] - 69) / 12)) < 0.1));
    }
    const d7 = learningLesson("banjo-g-to-d7")!;
    assert.equal(d7.options[d7.answer], "The third and second strings");
    assert.deepEqual(d7.demo!.notes[2], [50, 57, 60, 62]);
    for (const cue of lessonExercise("banjo-g-to-d7")!.cues.filter((c) => c.chord === "D7"))
      assert.deepEqual(cue.notes, [50, 57, 60, 62]);
    const roll = lessonExercise("banjo-three-chord-loop")!.cues.filter((c) => c.chord === "D7");
    assert.deepEqual(roll.map((c) => c.notes![0]), [57, 60, 62, 67, 60, 62, 57, 62]);
    const piece = musicalMilestone("banjo");
    assert.deepEqual(piece.cues.filter((c) => c.chord === "D7").map((c) => c.notes![0]), roll.map((c) => c.notes![0]));
  });

  it("puts eight roll attacks inside each four-beat bar in Today and the lab", () => {
    const timeline = buildTimeline(item("banjo", "lesson_banjo_roll_01"));
    const first = timeline.filter((n) => n.bar === 0);
    assert.deepEqual(first.map((n) => n.beat), [0, 0.5, 1, 1.5, 2, 2.5, 3, 3.5]);
    assert.deepEqual(first.map((n) => n.notes), [[55], [59], [62], [67], [59], [62], [55], [62]]);
    assert.ok(timeline.every((n) => n.notes?.length === 1 && n.string === undefined));
    assert.deepEqual(timeline.filter((n) => n.bar === 4).map((n) => n.notes![0]), [57, 60, 62, 67, 60, 62, 57, 62]);
    const lab = instrumentLabPattern("banjo-forward-roll");
    assert.equal(lab.beats, 4);
    assert.deepEqual(lab.cues.map((c) => c.beat), first.map((n) => n.beat));
  });

  it("sounds mandolin chords on 1/3 and only muted clicks on 2/4, including C bars", () => {
    const timeline = buildTimeline(item("mandolin", "lesson_mandolin_chop_01"));
    for (const note of timeline) {
      assert.equal(!!note.muted, note.beat === 1 || note.beat === 3);
      if (note.muted) assert.equal(note.notes, undefined);
    }
    assert.equal(timeline.length, 32);
    assert.deepEqual(timeline.find((n) => n.bar === 4 && n.beat === 0)!.notes, [55, 64, 72, 76]);
    const alt = instrumentLabPattern("mandolin-down-up");
    assert.equal(alt.beats, 4);
    assert.deepEqual(alt.cues.map((c) => c.notes?.[0] ?? null), [62, 64, 66, 67, 66, 64, 62, null]);
    assert.deepEqual(alt.cues.map((c) => c.beat), [0, 0.5, 1, 1.5, 2, 2.5, 3, 3.5]);
  });

  it("uses fingered violin pitches, complete rests and continuous bow alternation in Today", () => {
    const first = item("violin", "lesson_violin_first_finger_01");
    assert.equal(isPluckDrill(first), false);
    const notes = buildTimeline(first).filter((n) => n.bar < 2);
    assert.deepEqual(notes.map((n) => n.notes![0]), [62, 64, 62, 69, 71, 69]);
    assert.deepEqual(notes.map((n) => n.kind), ["down", "up", "down", "up", "down", "up"]);
    assert.ok(notes.every((n) => n.beat < 3 && n.string === undefined));
    const walk = buildTimeline(item("violin", "lesson_violin_walk_01"));
    assert.deepEqual(walk.filter((n) => n.bar === 0).map((n) => n.notes![0]), [62, 64, 66]);
    assert.equal(walk.filter((n) => n.bar === 1)[0].kind, "up");
  });

  it("places two pitches in each violin slur group without changing bow on the second note", () => {
    const notes = buildTimeline(item("violin", "lesson_violin_slur_01")).filter((n) => n.bar === 0);
    assert.deepEqual(notes.map((n) => n.notes![0]), [62, 64, 66, 67, 67, 66, 64, 62]);
    assert.deepEqual(notes.map((n) => n.kind), ["down", "down", "up", "up", "down", "down", "up", "up"]);
    const lab = instrumentLabPattern("violin-slurs");
    assert.equal(lab.beats, 8);
    for (let beat = 0; beat < lab.beats; beat++) {
      const pair = lab.cues.filter((c) => c.beat >= beat && c.beat < beat + 1);
      assert.equal(pair.length, 2);
      assert.equal(pair[1].beat - pair[0].beat, 0.5);
    }
  });

  it("alternates whole bows and milestone bows without an untaught retake", () => {
    const open = lessonExercise("violin-open-strings-and-bow")!.cues.filter((c) => c.notes);
    assert.deepEqual(open.map((c) => c.label), ["G ⊓", "D ∨", "A ⊓", "E ∨"]);
    assert.ok(open.every((c) => c.duration === 3.8));
    const piece = musicalMilestone("violin");
    const notes = piece.cues.filter((c) => c.notes);
    assert.ok(notes.every((c, i) => c.label.includes(i % 2 ? "∨" : "⊓")));
    assert.equal(piece.alternate.find((c) => c.beat === 12)!.label, "D ⊓");
    const daily = dailyInstrumentCues(item("violin", "lesson_violin_open_01"))!;
    assert.deepEqual(daily.filter((c) => c.notes).slice(0, 4).map((c) => c.label), open.map((c) => c.label));
  });
});
