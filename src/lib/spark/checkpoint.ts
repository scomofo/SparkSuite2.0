import { z } from "zod";
import { localDayKey } from "../utils.ts";
import { generateDailyPlan } from "./daily-plan.ts";
import type { InstrumentId } from "./instruments.ts";
import { summarizeItem } from "./practice.ts";
import { startSession, type LiveSession } from "./session.ts";
import type { ProgressState } from "./types.ts";

const count = z.number().int().min(0).max(100_000);
const schema = z.object({
  version: z.literal(1),
  date: z.string(),
  fingerprint: z.string(),
  progressFingerprint: z.string(),
  index: count,
  results: z
    .array(z.object({ itemId: z.string(), lessonId: z.string(), hits: count, misses: count }))
    .max(10),
  peakCombo: count,
});

const keyFor = (instrument: InstrumentId) => `sparksuite.loop.${instrument}`;

/** Checkpoints contain completed exercises only. The current exercise restarts at its intro. */
export function checkpointText(session: LiveSession, progress: ProgressState) {
  return JSON.stringify({
    version: 1,
    date: session.plan.date,
    fingerprint: JSON.stringify(session.plan),
    progressFingerprint: JSON.stringify(progress),
    index: session.index,
    results: session.results,
    peakCombo: Math.min(
      session.peakCombo,
      session.results.reduce((total, result) => total + result.hits, 0),
    ),
  });
}

export function restoreCheckpoint(
  text: string,
  progress: ProgressState,
  instrument: InstrumentId,
  today = localDayKey(),
): LiveSession | null {
  try {
    if (text.length > 100_000) return null;
    const saved = schema.parse(JSON.parse(text));
    const plan = generateDailyPlan(progress, today, instrument);
    // Never replay an already-awarded loop or pair results with a changed curriculum.
    if (
      saved.date !== today ||
      saved.progressFingerprint !== JSON.stringify(progress) ||
      saved.fingerprint !== JSON.stringify(plan)
    )
      return null;
    if (saved.index > plan.items.length || saved.results.length > saved.index) return null;
    const seen = new Set<string>();
    const completed = plan.items.slice(0, saved.index);
    let lastIndex = -1;
    const results = saved.results.map((result) => {
      const index = completed.findIndex(
        (item) => item.id === result.itemId && item.lessonId === result.lessonId,
      );
      if (index < 0 || index <= lastIndex || seen.has(result.itemId))
        throw new Error("Invalid exercise order");
      seen.add(result.itemId);
      lastIndex = index;
      // Derive scores again; stored XP/accuracy is not trusted.
      return summarizeItem(completed[index], result.hits, result.misses);
    });
    return {
      ...startSession(progress, plan),
      index: saved.index,
      results,
      peakCombo: saved.peakCombo,
    };
  } catch {
    return null;
  }
}

export function loadCheckpoint(progress: ProgressState, instrument: InstrumentId) {
  try {
    const text = localStorage.getItem(keyFor(instrument));
    return text ? restoreCheckpoint(text, progress, instrument) : null;
  } catch {
    return null;
  }
}

export function saveCheckpoint(
  session: LiveSession,
  progress: ProgressState,
  instrument: InstrumentId,
): boolean {
  try {
    localStorage.setItem(keyFor(instrument), checkpointText(session, progress));
    return true;
  } catch {
    return false;
  }
}

export function clearCheckpoint(instrument: InstrumentId) {
  try {
    localStorage.removeItem(keyFor(instrument));
  } catch {
    /* Storage can be unavailable. */
  }
}
