import assert from "node:assert/strict";
import { test } from "node:test";
import { buildCoachContext } from "./coach.ts";
import { coachPedagogy } from "./coach-pedagogy.ts";
import type { CoachRequest } from "./coach-types.ts";
import { learningPath } from "./curriculum.ts";
import { INSTRUMENTS, type InstrumentId } from "./instruments.ts";
import { emptyLearning } from "./learning.ts";

function request(instrument: InstrumentId = "guitar"): CoachRequest {
  return {
    instrument,
    intent: "next",
    energy: "steady",
    minutes: 2,
    question: "",
    today: "2026-09-08",
    learning: emptyLearning(),
  };
}

test("the first concept has a musical goal and responding support for every instrument", () => {
  for (const { id } of INSTRUMENTS) {
    const context = buildCoachContext(request(id));
    const pedagogy = coachPedagogy(context);
    assert.equal(pedagogy.artisticProcess, "responding");
    assert.equal(pedagogy.musicalGoal, learningPath(id)[0].outcome);
    assert.ok(pedagogy.supports.some((support) => support.includes("same idea")));
  }
});

test("project creation and reflection support follow the saved stage, not the chosen experience label", () => {
  for (const { id } of INSTRUMENTS) {
    const input = request(id);
    const lesson = learningPath(id)[6];
    input.learning.active[id] = lesson.id;
    input.learning.records[lesson.id] = {
      step: 1,
      reviews: 0,
      practice: { bpm: 60, guide: "silent", phase: "ready", projectStage: 1 },
    };
    assert.equal(coachPedagogy(buildCoachContext(input)).artisticProcess, "creating");
    input.learning.records[lesson.id].practice!.projectStage = 2;
    input.learning.records[lesson.id].practice!.projectChoice = 0;
    assert.equal(coachPedagogy(buildCoachContext(input)).artisticProcess, "performing");
    input.learning.records[lesson.id].practice!.phase = "reflect";
    assert.equal(coachPedagogy(buildCoachContext(input)).artisticProcess, "responding");
  }
});

test("low energy shrinks an advanced task without changing its musical goal or destination", () => {
  const input = request("piano");
  input.learning.profiles.piano = { experience: "advanced", minutes: 10 };
  input.minutes = 10;
  input.energy = "ready";
  const full = buildCoachContext(input);
  input.energy = "low";
  const smaller = buildCoachContext(input);
  assert.deepEqual(smaller.target, full.target);
  assert.equal(coachPedagogy(smaller).musicalGoal, coachPedagogy(full).musicalGoal);
  assert.ok(
    coachPedagogy(smaller).supports.some((support) => support.includes("one note, one bar")),
  );
  assert.ok(coachPedagogy(full).supports.some((support) => support.includes("refinement")));
});

test("a concept check stays a responding activity even when old practice has a creative choice", () => {
  const input = request();
  const lesson = learningPath("guitar")[6];
  input.learning.active.guitar = lesson.id;
  input.learning.records[lesson.id] = {
    step: 2,
    reviews: 0,
    practice: { bpm: 60, guide: "notes", phase: "ready", projectStage: 1 },
  };
  assert.equal(coachPedagogy(buildCoachContext(input)).artisticProcess, "responding");
});
