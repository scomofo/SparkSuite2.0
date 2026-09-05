import { isPluckDrill } from "./practice.ts";
import { feelFor } from "./psychology.ts";
import type { DailyPlan, DayCheckin, ItemRole, PlanItem, ProgressState } from "./types.ts";

export type { DayCheckin };

/**
 * HOW the same lesson is shown and answered.
 * Never owns curriculum. Never adds a menu.
 *
 * CAST UDL, baked in (not a settings page) so adult ADHD still gets a closed loop:
 * 1. Clarify the goal — both objectives, a success line, a role on the plan.
 * 2. Multiple representations — diagram + words + hear-it-once.
 * 3. Multiple ways in — tap, space, numbered keys, pad. Same hit.
 * 4. Graduated support — a model bar before play; pattern in words.
 * 5. Monitor — “the new thing is X”; what the score is not (a grade).
 * 6. Emotional capacity — one-tap check-in after the day. Optional. Auto-skip.
 * 7. No extra choice — supports are on. The day is still chosen for you.
 */

export const CHECKINS: { id: DayCheckin; title: string; body: string }[] = [
  { id: "locked", title: "Locked in", body: "The pulse sat." },
  { id: "through", title: "Got through", body: "Messy is still a day." },
  { id: "enough", title: "That was enough", body: "Tomorrow can be smaller." },
];

export const ROLE_LABEL: Record<ItemRole, string> = {
  warmup: "Warmup",
  new: "New",
  review: "Review",
  challenge: "Groove",
};

export function roleLabel(role: ItemRole | undefined) {
  return role ? ROLE_LABEL[role] : null;
}

export function patternInWords(pattern: string) {
  const raw = pattern.replace(/-/g, ".");
  const words = [...raw].map((ch) => {
    if (ch === "D") return "down";
    if (ch === "U") return "up";
    return "rest";
  });
  if (words.length <= 1) return "down on each beat";
  return words.join(" · ");
}

export function successLine(item: PlanItem) {
  switch (item.type) {
    case "warmup":
      return "You'll know it when each note is clean.";
    case "chord":
      return "You'll know it when the shape holds through the bar.";
    case "transition":
      return "You'll know it when the pulse doesn't stop.";
    case "rhythm":
      return "You'll know it when the hand keeps moving.";
    case "song":
      return "You'll know it when the loop finishes.";
    default:
      if (item.process === "create") return "You'll know it when you play the one you picked.";
      if (item.process === "respond") return "You'll know it when you name one thing.";
      return "You'll know it when the move lands on the click.";
  }
}

export function coachCue(item: PlanItem) {
  const second = item.objectives?.[1];
  if (second) return second;
  return item.subtitle;
}

export function howYouPlay(item: PlanItem) {
  const surface = item.surface;
  const isPluckItem = surface === "pads" || isPluckDrill(item);
  if (surface === "pads") return "Tap the flashing pad, or 1–4. Right pad + right time.";
  if (surface === "keys") return isPluckItem ? "Tap the highlighted key, or 1–7. Right key + right time." : "Tap a key, Play, or 1–7.";
  if (surface === "voice") return isPluckItem ? "Sing toward the highlighted key, or tap it. Pitch + timing." : "Sing toward C, or tap Match.";
  if (isPluckItem) return "Pluck the highlighted string. Right string + right time, or 1–6.";
  return "Strum, or space.";
}

export function newThingLine(plan: DailyPlan) {
  const next =
    plan.items.find((i) => i.role === "new") ??
    plan.items.find((i) => i.role !== "warmup" && i.type !== "warmup");
  if (!next) return null;
  return `The new thing is ${next.title}.`;
}

export function feelCue(progress: ProgressState) {
  if (progress.history.length === 0) return null;
  const feel = feelFor(progress);
  if (feel.extraWarmup) return "Today is slower. That's the point.";
  return null;
}

export function isCheckin(id: unknown): id is DayCheckin {
  return id === "locked" || id === "through" || id === "enough";
}
