import { localDayKey } from "../utils.ts";
import type { ProgressState, SessionResult } from "./types.ts";

/** Adult ADHD gamification: felt progress, no extra homework, no shame loop. */
export const WEEK_GOAL = 3;
export const XP_PER_LEVEL = 500;

export function levelForXp(xp: number) {
  return 1 + Math.floor(xp / XP_PER_LEVEL);
}

export type Rank = {
  min: number;
  id: string;
  title: string;
  line: string;
};

export const RANKS: Rank[] = [
  { min: 1, id: "pulse", title: "Pulse", line: "The click is the whole song." },
  { min: 2, id: "groove", title: "Groove", line: "You can sit on a pulse now." },
  { min: 3, id: "pocket", title: "Pocket", line: "Late, fat, unhurried." },
  { min: 5, id: "sideman", title: "Sideman", line: "You make the other parts sit." },
  { min: 8, id: "player", title: "Player", line: "The instrument is a habit." },
];

export type MarkDef = { id: string; title: string; body: string };

export const MARKS: MarkDef[] = [
  { id: "opened", title: "Opened", body: "You picked it up." },
  { id: "groove", title: "Groove", body: "A loop, all the way through." },
  { id: "pocket", title: "Pocket", body: "Eight in a row. That's the pocket." },
  { id: "week", title: "Week held", body: "Three days this week. The unit that matters." },
  { id: "clean", title: "Clean", body: "A three-star pass. Keep that feel." },
  { id: "heat", title: "Heat", body: "Seven days of showing up. It can still pause." },
];

export function rankFor(level: number): Rank {
  let found = RANKS[0];
  for (const r of RANKS) if (level >= r.min) found = r;
  return found;
}

export function xpProgress(xp: number) {
  const level = levelForXp(xp);
  const into = xp % XP_PER_LEVEL;
  return { level, into, need: XP_PER_LEVEL, pct: Math.round((into / XP_PER_LEVEL) * 100) };
}

export function sparksFor(progress: ProgressState) {
  return Object.values(progress.dailyComplete).filter(Boolean).length;
}

export function recentDays(today = localDayKey(), n = 7) {
  const end = new Date(`${today}T12:00:00`);
  const days: string[] = [];
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date(end);
    d.setDate(end.getDate() - i);
    days.push(localDayKey(d));
  }
  return days;
}

export type WeekPulse = {
  days: { key: string; on: boolean }[];
  count: number;
  held: boolean;
};

export function weekPulse(progress: ProgressState, today = localDayKey()): WeekPulse {
  const days = recentDays(today).map((key) => ({ key, on: Boolean(progress.dailyComplete[key]) }));
  const count = days.filter((d) => d.on).length;
  return { days, count, held: count >= WEEK_GOAL };
}

export function comboCue(combo: number) {
  if (combo >= 12) return "locked in";
  if (combo >= 8) return "pocket";
  if (combo >= 4) return "heat";
  return "combo";
}

export function isComboGate(combo: number) {
  return combo === 4 || combo === 8 || combo === 12;
}

export function evaluateMarks(progress: ProgressState, result: SessionResult, peakCombo: number) {
  const have = new Set(progress.marks);
  const add = (id: string) => have.add(id);
  add("opened");
  if (result.items.some((i) => i.lessonId.includes("_song_") || i.itemId.includes("groove"))) add("groove");
  if (peakCombo >= 8) add("pocket");
  if (weekPulse(progress).held) add("week");
  if (result.items.some((i) => i.stars >= 3)) add("clean");
  if (progress.streak >= 7) add("heat");
  return MARKS.map((m) => m.id).filter((id) => have.has(id));
}

export function markById(id: string) {
  return MARKS.find((m) => m.id === id);
}
