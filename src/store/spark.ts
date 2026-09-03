import { create } from "zustand";
import { createSpark } from "@/lib/spark/core";
import { generateDailyPlan } from "@/lib/spark/daily-plan";
import { type InstrumentId } from "@/lib/spark/instruments";
import {
  closeSession,
  completeItem,
  currentItem,
  isSessionDone,
  recordHit,
  recordMiss,
  skipItem,
  startSession,
  type LiveSession,
} from "@/lib/spark/session";
import { defaultProgress, loadSuite, progressFor, suiteTotals, type SuiteState } from "@/lib/spark/storage";
import type { DailyPlan, DayCheckin, ProgressState, SessionResult } from "@/lib/spark/types";

const spark = createSpark(defaultProgress(), "guitar");

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
  hydrate: () => void;
  selectInstrument: (id: InstrumentId) => void;
  beginDay: () => void;
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
  hydrate: () => {
    const suite = loadSuite();
    const progress = progressFor(suite, suite.active);
    spark.setInstrument(suite.active, progress);
    set({
      instrument: suite.active,
      progress,
      plan: spark.getPlan(),
      ...fromSuite(suite),
    });
  },
  selectInstrument: (id) => {
    const suite = loadSuite();
    const progress = progressFor(suite, id);
    const next = spark.setInstrument(id, progress);
    set({
      instrument: id,
      progress: next.progress,
      plan: next.plan,
      session: null,
      lastResult: null,
      ...fromSuite(next.suite),
    });
  },
  beginDay: () => {
    const { progress, instrument } = get();
    const plan = generateDailyPlan(progress, undefined, instrument);
    set({ session: startSession(progress, plan), plan, lastResult: null });
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
    set({ session: completeItem(s) });
  },
  skipCurrent: () => {
    const s = get().session;
    if (!s) return;
    set({ session: skipItem(s) });
  },
  finishDay: () => {
    const { session, progress, instrument } = get();
    if (!session) return null;
    const { progress: next, result } = closeSession(progress, session, instrument);
    const { plan, suite } = spark.setProgress(next);
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
    set({ session: null });
  },
  noteCheckin: (id) => {
    const { progress } = get();
    const next = { ...progress, lastCheckin: id };
    const { plan } = spark.setProgress(next);
    set({ progress: next, plan });
  },
}));

export function sessionItem() {
  const s = useSpark.getState().session;
  return s ? currentItem(s) : null;
}

export function sessionDone() {
  const s = useSpark.getState().session;
  return s ? isSessionDone(s) : false;
}
