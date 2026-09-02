import { localDayKey } from "@/lib/utils";
import { isInstrumentId, type InstrumentId } from "./instruments";
import { nextStreak } from "./psychology";
import { isCheckin } from "./udl";
import { SAVE_VERSION, type ProgressState } from "./types";

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

function migrateProgress(raw: Partial<ProgressState> | null | undefined): ProgressState {
  const base = defaultProgress();
  if (!raw || typeof raw !== "object") return base;
  return {
    ...base,
    ...raw,
    version: SAVE_VERSION,
    mastery: raw.mastery ?? {},
    history: raw.history ?? [],
    dailyComplete: raw.dailyComplete ?? {},
    bestCombo: typeof raw.bestCombo === "number" ? raw.bestCombo : 0,
    marks: Array.isArray(raw.marks) ? raw.marks.filter((id): id is string => typeof id === "string") : [],
    lastCheckin: isCheckin(raw.lastCheckin) ? raw.lastCheckin : null,
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
