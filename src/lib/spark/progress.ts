import { FOUNDATION_LESSONS } from "./guitar.ts";
import { evaluateMarks, levelForXp } from "./game.ts";
import { foundationsFor, type InstrumentId } from "./instruments.ts";
import { applyStreak, saveProgress } from "./storage.ts";
import type { ItemResult, ProgressState, SessionResult } from "./types.ts";
import { localDayKey } from "../utils.ts";

export { levelForXp, XP_PER_LEVEL } from "./game.ts";

/** dailyComplete grows one key per day; keep only the last 60 days on finalize. */
const DAILY_COMPLETE_KEEP_DAYS = 60;

function pruneDailyComplete(dailyComplete: Record<string, boolean>): Record<string, boolean> {
  // Keys are local YYYY-MM-DD, so a lexicographic comparison is chronological.
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - DAILY_COMPLETE_KEEP_DAYS);
  const cutoffKey = localDayKey(cutoff);
  const pruned: Record<string, boolean> = {};
  for (const [key, value] of Object.entries(dailyComplete)) {
    if (key >= cutoffKey) pruned[key] = value;
  }
  return pruned;
}

export function grantFoundations(
  state: ProgressState,
  instrument: InstrumentId = "guitar",
): ProgressState {
  const ids = instrument === "guitar" ? FOUNDATION_LESSONS : foundationsFor(instrument);
  const mastery = { ...state.mastery };
  for (const id of ids) {
    mastery[id] = Math.max(mastery[id] ?? 0, 0.85);
  }
  return { ...state, mastery };
}

export function applyItemMastery(state: ProgressState, result: ItemResult): ProgressState {
  const prev = state.mastery[result.lessonId] ?? 0;
  const next = Math.min(1, prev * 0.55 + result.accuracy * 0.45 + (result.stars >= 2 ? 0.08 : 0));
  return {
    ...state,
    mastery: { ...state.mastery, [result.lessonId]: next },
  };
}

export function finalizeSession(
  state: ProgressState,
  result: SessionResult,
  instrument: InstrumentId = "guitar",
): ProgressState {
  // Skipping everything is not a day. Don't grant foundations, streak,
  // history, or dailyComplete for empty results — prevents streak farming.
  if (result.items.length === 0) return state;
  let next = grantFoundations(applyStreak(state, result.date), instrument);
  for (const item of result.items) next = applyItemMastery(next, item);
  const xp = next.xp + result.xp;
  const history = [
    ...next.history,
    { date: result.date, accuracy: result.accuracy, xp: result.xp },
  ].slice(-24);
  const peakCombo = Math.max(next.bestCombo, result.peakCombo ?? 0);
  next = {
    ...next,
    xp,
    level: levelForXp(xp),
    lastAccuracy: result.accuracy,
    history,
    dailyComplete: pruneDailyComplete({ ...next.dailyComplete, [result.date]: true }),
    bestCombo: peakCombo,
    lastCheckin: state.lastPlayedDay === result.date ? state.lastCheckin : null,
  };
  next = { ...next, marks: evaluateMarks(next, result, peakCombo) };
  saveProgress(next, instrument);
  return next;
}

export function trackMastery(state: ProgressState, _trackId: string, lessonIds: string[]) {
  const ids = lessonIds.filter(Boolean);
  if (!ids.length) return 0;
  const sum = ids.reduce((s, id) => s + (state.mastery[id] ?? 0), 0);
  return sum / ids.length;
}
