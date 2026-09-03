import { localDayKey } from "../utils.ts";
import type { DailyPlan, ProgressState, SessionResult } from "./types.ts";

export type PlanFeel = {
  bpmScale: number;
  itemCount: number;
  extraWarmup: boolean;
  challenge: boolean;
  windowMs: number;
};

export type StreakTone = "live" | "held" | "fresh";

/** Miss this many calendar days and the streak still holds. */
export const STREAK_GRACE_DAYS = 2;

/** Labs and theory. Hyperfocus protection. */
export const LAB_FOCUS_SEC = 240;

/** Don't stall on "what now" after an item. */
export const AUTO_ADVANCE_MS = 1800;

/**
 * HOW the day is delivered. Never owns curriculum.
 *
 * Adult ADHD methods this engine is supposed to keep:
 * 1. Externalize the plan — they don't choose what to practise.
 * 2. Closed loop — 3–4 items, ~10 minutes, then stop.
 * 3. Load follows yesterday — slower, wider window, extra warmup if it went badly.
 * 4. Immediate feedback, not lectures.
 * 5. Streak freeze — missing a day is expected, not a moral event.
 * 6. Skip without punishment.
 * 7. Time-box optional exploration so the lab can't eat the evening.
 */
export function feelFor(progress: ProgressState): PlanFeel {
  const acc = progress.lastAccuracy;
  if (progress.history.length === 0) {
    return { bpmScale: 0.95, itemCount: 3, extraWarmup: true, challenge: false, windowMs: 240 };
  }
  if (progress.lastCheckin === "enough" && progress.lastPlayedDay !== localDayKey()) {
    return { bpmScale: 0.88, itemCount: 3, extraWarmup: true, challenge: false, windowMs: 260 };
  }
  if (acc < 0.45) {
    return { bpmScale: 0.85, itemCount: 3, extraWarmup: true, challenge: false, windowMs: 260 };
  }
  if (acc > 0.85 && progress.streak >= 2) {
    return { bpmScale: 1.08, itemCount: 4, extraWarmup: false, challenge: true, windowMs: 180 };
  }
  return { bpmScale: 1, itemCount: 4, extraWarmup: false, challenge: true, windowMs: 210 };
}

export function scaledBpm(base: number, feel: PlanFeel) {
  return Math.round(Math.max(56, Math.min(110, base * feel.bpmScale)));
}

export function dayGap(from: string | null, to = localDayKey()) {
  if (!from) return Number.POSITIVE_INFINITY;
  const a = new Date(`${from}T12:00:00`);
  const b = new Date(`${to}T12:00:00`);
  return Math.round((b.getTime() - a.getTime()) / 86400000);
}

export function streakTone(progress: ProgressState, today = localDayKey()): StreakTone {
  if (!progress.lastPlayedDay || progress.streak <= 0) return "fresh";
  const gap = dayGap(progress.lastPlayedDay, today);
  if (gap <= 1) return "live";
  if (gap <= 1 + STREAK_GRACE_DAYS) return "held";
  return "fresh";
}

export function nextStreak(progress: ProgressState, today = localDayKey()) {
  if (progress.lastPlayedDay === today) return progress.streak;
  if (!progress.lastPlayedDay) return 1;
  const gap = dayGap(progress.lastPlayedDay, today);
  if (gap === 1) return progress.streak + 1;
  if (gap <= 1 + STREAK_GRACE_DAYS) return progress.streak;
  return 1;
}

export function dayCue(plan: DailyPlan, done: boolean) {
  if (done) return "The loop is done. Lab is optional.";
  return `${plan.items.length} things. Then you're done.`;
}

export function closingCopy(result: SessionResult) {
  if (result.items.length === 0) return "You opened the instrument. That counts.";
  if (result.accuracy >= 0.75) return "That's the day. Same time tomorrow.";
  if (result.accuracy >= 0.4) return "You showed up. The groove is in there.";
  return "Showing up counts. Tomorrow's loop is waiting.";
}

export function itemCloseCopy(stars: number, last: boolean) {
  if (last) return "That's the day.";
  if (stars >= 2) return "That's one.";
  return "That's one. Next.";
}

export function formatFocus(sec: number) {
  const m = Math.floor(Math.max(0, sec) / 60);
  const s = Math.max(0, sec) % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}
