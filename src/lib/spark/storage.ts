import { localDayKey } from "../utils.ts";
import { isInstrumentId, type InstrumentId } from "./instruments.ts";
import { nextStreak } from "./psychology.ts";
import { isCheckin } from "./udl.ts";
import { SAVE_VERSION, type ProgressState } from "./types.ts";

const KEY = "sparksuite.v2";
const LEGACY = "sparksuite.v1";
const BACKUP = "sparksuite.v2.bak";

export type SuiteState = {
  version: number;
  active: InstrumentId;
  apps: Partial<Record<InstrumentId, ProgressState>>;
};

export const defaultProgress = (): ProgressState => ({
  version: SAVE_VERSION,
  xp: 0,
  level: 1,
  streak: 0,
  lastPlayedDay: null,
  mastery: {},
  lastAccuracy: 0,
  history: [],
  dailyComplete: {},
  bestCombo: 0,
  marks: [],
  lastCheckin: null,
});

export const defaultSuite = (): SuiteState => ({
  version: SAVE_VERSION,
  active: "guitar",
  apps: { guitar: defaultProgress() },
});

function canUseStorage() {
  return typeof localStorage !== "undefined";
}

function toFiniteNumber(value: unknown, fallback: number): number {
  return typeof value === "number" && Number.isFinite(value) ? value : fallback;
}

function sanitizeMastery(value: unknown): Record<string, number> {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};
  const out: Record<string, number> = {};
  for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
    if (typeof v === "number" && Number.isFinite(v)) out[k] = Math.max(0, Math.min(1, v));
  }
  return out;
}

function migrateProgress(raw: Partial<ProgressState> | null | undefined): ProgressState {
  const base = defaultProgress();
  if (!raw || typeof raw !== "object") return base;
  const history = Array.isArray(raw.history)
    ? raw.history
        .filter(
          (h): h is { date: string; accuracy: number; xp: number } =>
            !!h && typeof h === "object" && typeof (h as { date?: unknown }).date === "string",
        )
        .map((h) => ({
          date: h.date,
          accuracy: typeof h.accuracy === "number" && Number.isFinite(h.accuracy) ? Math.max(0, Math.min(1, h.accuracy)) : 0,
          xp: typeof h.xp === "number" && Number.isFinite(h.xp) ? Math.max(0, h.xp) : 0,
        }))
    : [];
  const dailyComplete: Record<string, boolean> =
    raw.dailyComplete && typeof raw.dailyComplete === "object" && !Array.isArray(raw.dailyComplete)
      ? Object.fromEntries(
          Object.entries(raw.dailyComplete as Record<string, unknown>)
            .filter(([k, v]) => typeof k === "string" && v === true)
            .map(([k]) => [k, true]),
        )
      : {};
  return {
    ...base,
    xp: toFiniteNumber(raw.xp, 0) < 0 ? 0 : toFiniteNumber(raw.xp, 0),
    level: Math.max(1, Math.floor(toFiniteNumber(raw.level, 1)) || 1),
    streak: Math.max(0, Math.floor(toFiniteNumber(raw.streak, 0)) || 0),
    lastPlayedDay: typeof raw.lastPlayedDay === "string" ? raw.lastPlayedDay : null,
    mastery: sanitizeMastery(raw.mastery),
    lastAccuracy:
      typeof raw.lastAccuracy === "number" && Number.isFinite(raw.lastAccuracy)
        ? Math.max(0, Math.min(1, raw.lastAccuracy))
        : 0,
    history,
    dailyComplete,
    bestCombo: Math.max(0, Math.floor(toFiniteNumber(raw.bestCombo, 0)) || 0),
    marks: Array.isArray(raw.marks) ? raw.marks.filter((id): id is string => typeof id === "string") : [],
    lastCheckin: isCheckin(raw.lastCheckin) ? raw.lastCheckin : null,
    version: SAVE_VERSION,
  };
}

function migrateSuite(raw: unknown): SuiteState {
  const base = defaultSuite();
  if (!raw || typeof raw !== "object") return base;
  const obj = raw as Record<string, unknown>;
  if (obj.apps && typeof obj.apps === "object") {
    const apps: SuiteState["apps"] = {};
    for (const [k, v] of Object.entries(obj.apps as Record<string, unknown>)) {
      if (isInstrumentId(k)) apps[k] = migrateProgress(v as ProgressState);
    }
    return {
      version: SAVE_VERSION,
      active: isInstrumentId(obj.active) ? obj.active : "guitar",
      apps: { ...base.apps, ...apps },
    };
  }
  return { version: SAVE_VERSION, active: "guitar", apps: { guitar: migrateProgress(obj as ProgressState) } };
}

export function loadSuite(): SuiteState {
  if (!canUseStorage()) return defaultSuite();
  try {
    const text = localStorage.getItem(KEY);
    if (text) return migrateSuite(JSON.parse(text));
    const legacy = localStorage.getItem(LEGACY);
    if (legacy) {
      const migrated = migrateSuite(JSON.parse(legacy));
      saveSuite(migrated);
      return migrated;
    }
    return defaultSuite();
  } catch {
    try {
      const bak = localStorage.getItem(BACKUP);
      if (bak) return migrateSuite(JSON.parse(bak));
    } catch {
      /* ignore */
    }
    return defaultSuite();
  }
}

export function saveSuite(state: SuiteState) {
  if (!canUseStorage()) return;
  try {
    const prev = localStorage.getItem(KEY);
    if (prev) localStorage.setItem(BACKUP, prev);
    localStorage.setItem(KEY, JSON.stringify(state));
  } catch {
    /* private mode / quota */
  }
}

export function suiteTotals(suite: SuiteState) {
  const apps = Object.values(suite.apps);
  return {
    xp: apps.reduce((s, p) => s + (p?.xp ?? 0), 0),
    streak: apps.reduce((s, p) => Math.max(s, p?.streak ?? 0), 0),
  };
}

export function progressFor(suite: SuiteState, id: InstrumentId): ProgressState {
  return suite.apps[id] ?? defaultProgress();
}


export function loadProgress(): ProgressState {
  const suite = loadSuite();
  return progressFor(suite, suite.active);
}

export function saveProgress(state: ProgressState) {
  const suite = loadSuite();
  suite.apps[suite.active] = state;
  suite.version = SAVE_VERSION;
  saveSuite(suite);
}

export function applyStreak(state: ProgressState, today = localDayKey()): ProgressState {
  if (state.lastPlayedDay === today) return state;
  return { ...state, streak: nextStreak(state, today), lastPlayedDay: today };
}
