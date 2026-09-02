import { FOUNDATION_LESSONS } from "./guitar";
import { evaluateMarks, levelForXp } from "./game";
import { foundationsFor, type InstrumentId } from "./instruments";
import { applyStreak, saveProgress } from "./storage";
import type { ItemResult, ProgressState, SessionResult } from "./types";

export { levelForXp, XP_PER_LEVEL } from "./game";

export function grantFoundations(state: ProgressState, instrument: InstrumentId = "guitar"): ProgressState {
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

export function finalizeSession(state: ProgressState, result: SessionResult, instrument: InstrumentId = "guitar"): ProgressState {
  let next = grantFoundations(applyStreak(state, result.date), instrument);
  for (const item of result.items) next = applyItemMastery(next, item);
  const xp = next.xp + result.xp;
  const history = [...next.history, { date: result.date, accuracy: result.accuracy, xp: result.xp }].slice(-24);
  const peakCombo = Math.max(next.bestCombo, result.peakCombo ?? 0);
  next = {
    ...next,
    xp,
    level: levelForXp(xp),
    lastAccuracy: result.accuracy,
    history,
    dailyComplete: { ...next.dailyComplete, [result.date]: true },
    bestCombo: peakCombo,
    lastCheckin: state.lastPlayedDay === result.date ? state.lastCheckin : null,
  };
  next = { ...next, marks: evaluateMarks(next, result, peakCombo) };
  saveProgress(next);
  return next;
}

export function trackMastery(state: ProgressState, trackId: string, lessonIds: string[]) {
  const ids = lessonIds.filter(Boolean);
  if (!ids.length) return 0;
  const sum = ids.reduce((s, id) => s + (state.mastery[id] ?? 0), 0);
  return sum / ids.length;
}
