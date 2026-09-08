import type { CoachContext } from "./coach-types.ts";

/** Task-level design mapping, not a claim that one activity meets a full NAfME standard. */
export function coachPedagogy(context: CoachContext) {
  const project = context.practice?.project as { stage?: string } | null;
  const reflecting =
    context.target.kind === "milestone"
      ? context.milestone?.phase === "reflect"
      : context.target.kind === "practice"
        ? context.practice?.phase === "reflect"
        : context.lesson?.checkpoint !== "Try it";
  const creating = !reflecting && context.target.kind === "practice" && project?.stage === "Choose";
  const process = reflecting ? "responding" : creating ? "creating" : "performing";
  return {
    musicalGoal: context.target.outcome,
    artisticProcess: process,
    processInstruction:
      process === "creating"
        ? "Help the learner choose one of the supplied musical variations and notice its effect. Keep their musical choice theirs."
        : process === "responding"
          ? "Help the learner understand or notice one musical feature and put it in their own words. At a Check step explain the concept without giving an answer."
          : "Support one bounded musical attempt, then one observation to guide refinement. Use the supplied goal as the criterion; do not assign a grade.",
    connecting:
      "When the learner supplies a musical interest or intention, connect this goal to it in one sentence. Do not invent interests or add another assignment.",
    supports: [
      "Externalize the next action and its stopping point. Keep the learner's saved place.",
      "Give one specific, actionable adjustment, using plain words and the lesson's existing example or visual/audio reference when helpful.",
      "Audio is optional; following the diagram, reading or tapping is a valid way into the same idea. Never require microphone access.",
      "Let the learner choose whether to continue. No deadlines, streak threats, pressure to disclose a diagnosis, or penalty for a pause.",
      context.energy === "low" || context.minutes === 2
        ? "Reduce task size to one note, one bar, one choice, or one observation. Preserve the musical level and goal."
        : "Offer a small complete attempt within the selected time; more time is permission for refinement, not extra required tasks.",
    ],
  };
}
