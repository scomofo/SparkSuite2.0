import { create } from "zustand";
import { clearCheckpoint, loadCheckpoint, saveCheckpoint } from "@/lib/spark/checkpoint";
import { localDayKey } from "@/lib/utils";
import { createSpark } from "@/lib/spark/core";
import { generateDailyPlan } from "@/lib/spark/daily-plan";
import { type InstrumentId } from "@/lib/spark/instruments";
import {
  closeSession,
  completeItem,
  isSessionDone,
  recordHit,
  recordMiss,
  resumeOrStartSession,
  skipItem,
  type LiveSession,
} from "@/lib/spark/session";
import {
  defaultProgress,
  loadSuite,
  progressFor,
  suiteTotals,
  type SuiteState,
} from "@/lib/spark/storage";
import type { DailyPlan, DayCheckin, ProgressState, SessionResult } from "@/lib/spark/types";

const spark = createSpark(defaultProgress(), "guitar");

// The results page is a per-tab view: survive a refresh there (a reflexive
// F5 right after a level-up used to land on "No session yet."), but never
// leak across tabs or sessions.
const RESULT_KEY = "sparksuite.result.v1";

function readLastResult(): SessionResult | null {
  try {
    const text = sessionStorage.getItem(RESULT_KEY);
    if (!text) return null;
    const raw: unknown = JSON.parse(text);
    if (!raw || typeof raw !== "object") return null;
    const candidate = raw as Partial<SessionResult>;
    if (typeof candidate.date !== "string" || !Array.isArray(candidate.items)) return null;
    return candidate as SessionResult;
  } catch {
    return null;
  }
}

function writeLastResult(result: SessionResult | null) {
  try {
    if (result) sessionStorage.setItem(RESULT_KEY, JSON.stringify(result));
    else sessionStorage.removeItem(RESULT_KEY);
  } catch {
    /* sessionStorage unavailable (private mode) */
  }
}

function fromSuite(suite: SuiteState) {
  const totals = suiteTotals(suite);
  return {
    apps: suite.apps,
    suiteXp: totals.xp,
    bestStreak: totals.streak,
  };
}

type SparkStore = {
  instrument: InstrumentId;
  progress: ProgressState;
  plan: DailyPlan;
  session: LiveSession | null;
  lastResult: SessionResult | null;
  apps: SuiteState["apps"];
  suiteXp: number;
  bestStreak: number;
  hydrated: boolean;
  checkpointSaved: boolean;
  hydrate: () => void;
  reloadFromStorage: () => void;
  selectInstrument: (id: InstrumentId) => void;
  beginDay: () => void;
  pauseSession: () => void;
  refreshDay: () => void;
  hit: () => void;
  miss: () => void;
  finishItem: () => void;
  skipCurrent: () => void;
  finishDay: () => SessionResult | null;
  abortSession: () => void;
  noteCheckin: (id: DayCheckin) => void;
};

export const useSpark = create<SparkStore>((set, get) => ({
  instrument: "guitar",
  progress: spark.getProgress(),
  plan: spark.getPlan(),
  session: null,
  lastResult: null,
  apps: { guitar: defaultProgress() },
  suiteXp: 0,
  bestStreak: 0,
  hydrated: false,
  checkpointSaved: true,
  hydrate: () => {
    if (get().hydrated) return;
    const suite = loadSuite();
    const progress = progressFor(suite, suite.active);
    spark.setInstrument(suite.active, progress);
    set({
      instrument: suite.active,
      progress,
      plan: spark.getPlan(),
      session: loadCheckpoint(progress, suite.active),
      lastResult: readLastResult(),
      hydrated: true,
      ...fromSuite(suite),
    });
  },
  reloadFromStorage: () => {
    const suite = loadSuite();
    const progress = progressFor(suite, suite.active);
    spark.setInstrument(suite.active, progress);
    set({
      instrument: suite.active,
      progress,
      plan: spark.getPlan(),
      session: loadCheckpoint(progress, suite.active),
      lastResult: readLastResult(),
      hydrated: true,
      ...fromSuite(suite),
    });
  },
  selectInstrument: (id) => {
    if (id === get().instrument) return;
    const suite = loadSuite();
    const progress = progressFor(suite, id);
    const next = spark.setInstrument(id, progress);
    set({
      instrument: id,
      progress: next.progress,
      plan: next.plan,
      session: loadCheckpoint(progress, id),
      lastResult: null,
      checkpointSaved: true,
      ...fromSuite(next.suite),
    });
  },
  beginDay: () => {
    const { progress, instrument, session } = get();
    const plan = generateDailyPlan(progress, undefined, instrument);
    const next = resumeOrStartSession(progress, plan, session);
    writeLastResult(null);
    set({
      session: next,
      plan: next.plan,
      lastResult: null,
      checkpointSaved: saveCheckpoint(next, progress, instrument),
    });
  },
  pauseSession: () => {
    const { session, progress, instrument } = get();
    if (!session) return;
    const next = { ...session, itemHits: 0, itemMisses: 0, currentCombo: 0 };
    set({ session: next, checkpointSaved: saveCheckpoint(next, progress, instrument) });
  },
  refreshDay: () => {
    const { plan, session } = get();
    if (plan.date === localDayKey()) return;
    // A mounted player owns its original plan until it is finished or left.
    if (typeof window !== "undefined" && window.location.pathname === "/practice" && session)
      return;
    set({ plan: spark.refreshPlan(), session: null });
  },
  hit: () => {
    const s = get().session;
    if (s) set({ session: recordHit(s) });
  },
  miss: () => {
    const s = get().session;
    if (s) set({ session: recordMiss(s) });
  },
  finishItem: () => {
    const s = get().session;
    if (!s) return;
    const next = completeItem(s);
    set({ session: next, checkpointSaved: saveCheckpoint(next, get().progress, get().instrument) });
  },
  skipCurrent: () => {
    const s = get().session;
    if (!s) return;
    const next = skipItem(s);
    set({ session: next, checkpointSaved: saveCheckpoint(next, get().progress, get().instrument) });
  },
  finishDay: () => {
    const { session, progress, instrument } = get();
    if (!session || !isSessionDone(session)) return null;
    const { progress: next, result } = closeSession(progress, session, instrument);
    const { plan, suite } = spark.setProgress(next);
    clearCheckpoint(instrument);
    writeLastResult(result);
    set({
      progress: next,
      session: null,
      lastResult: result,
      plan,
      ...fromSuite(suite),
    });
    return result;
  },
  abortSession: () => {
    const { session } = get();
    if (!session) return;
    // Leaving mid-session discards partial progress. Previously this
    // finalized partial hits as a full day (streak + dailyComplete),
    // letting a single hit farm a completed day.
    clearCheckpoint(get().instrument);
    set({ session: null });
  },
  noteCheckin: (id) => {
    const { progress } = get();
    const next = { ...progress, lastCheckin: id };
    const { plan, suite } = spark.setProgress(next);
    set({ progress: next, plan, ...fromSuite(suite) });
  },
}));
