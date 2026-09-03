import { localDayKey } from "../utils.ts";
import { generateDailyPlan } from "./daily-plan.ts";
import type { InstrumentId } from "./instruments.ts";
import { summarizeItem } from "./practice.ts";
import { finalizeSession } from "./progress.ts";
import type { DailyPlan, ItemResult, PlanItem, ProgressState, SessionResult } from "./types.ts";

export type LiveSession = {
  plan: DailyPlan;
  index: number;
  itemHits: number;
  itemMisses: number;
  results: ItemResult[];
  startedAt: number;
  currentCombo: number;
  peakCombo: number;
};

export function startSession(progress: ProgressState, plan?: DailyPlan): LiveSession {
  return {
    plan: plan ?? generateDailyPlan(progress),
    index: 0,
    itemHits: 0,
    itemMisses: 0,
    results: [],
    startedAt: performance.now(),
    currentCombo: 0,
    peakCombo: 0,
  };
}

export function currentItem(session: LiveSession): PlanItem | null {
  return session.plan.items[session.index] ?? null;
}

export function recordHit(session: LiveSession): LiveSession {
  const currentCombo = session.currentCombo + 1;
  return {
    ...session,
    itemHits: session.itemHits + 1,
    currentCombo,
    peakCombo: Math.max(session.peakCombo, currentCombo),
  };
}

export function recordMiss(session: LiveSession): LiveSession {
  return { ...session, itemMisses: session.itemMisses + 1, currentCombo: 0 };
}

export function completeItem(session: LiveSession): LiveSession {
  const item = currentItem(session);
  if (!item) return session;
  const result = summarizeItem(item, session.itemHits, session.itemMisses);
  return {
    ...session,
    results: [...session.results, result],
    index: session.index + 1,
    itemHits: 0,
    itemMisses: 0,
  };
}

/** Advance without a zero-accuracy result. Stuck is not failure. */
export function skipItem(session: LiveSession): LiveSession {
  const item = currentItem(session);
  if (!item) return session;
  return {
    ...session,
    index: session.index + 1,
    itemHits: 0,
    itemMisses: 0,
    currentCombo: 0,
  };
}

export function isSessionDone(session: LiveSession) {
  return session.index >= session.plan.items.length;
}

export function closeSession(
  progress: ProgressState,
  session: LiveSession,
  instrument: InstrumentId = "guitar",
): { progress: ProgressState; result: SessionResult } {
  let s = session;
  if (currentItem(s) && s.itemHits + s.itemMisses > 0) s = completeItem(s);
  const acc = s.results.length === 0 ? 0 : s.results.reduce((n, r) => n + r.accuracy, 0) / s.results.length;
  const prevLevel = progress.level;
  const prevMarks = progress.marks;
  const result: SessionResult = {
    date: localDayKey(),
    accuracy: acc,
    stars: Math.round(s.results.reduce((n, r) => n + r.stars, 0) / Math.max(1, s.results.length)),
    xp: s.results.reduce((n, r) => n + r.xp, 0) + (s.results.length > 0 && s.results.length === s.plan.items.length ? 80 : 0),
    items: s.results,
    peakCombo: s.peakCombo,
    prevLevel,
  };
  const next = finalizeSession(progress, result, instrument);
  result.leveledUp = next.level > prevLevel;
  result.newMarks = next.marks.filter((id) => !prevMarks.includes(id));
  return { progress: next, result };
}
