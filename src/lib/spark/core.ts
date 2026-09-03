import { generateDailyPlan } from "./daily-plan.ts";
import type { InstrumentId } from "./instruments.ts";
import { defaultProgress, loadSuite, saveSuite } from "./storage.ts";
import type { DailyPlan, ProgressState } from "./types.ts";

/** Thin composition root. Engines stay pure; this is the only app-facing barrel. */
export function createSpark(initial: ProgressState = defaultProgress(), instrument: InstrumentId = "guitar") {
  let progress: ProgressState = initial;
  let active: InstrumentId = instrument;
  let plan: DailyPlan = generateDailyPlan(progress, undefined, active);

  return {
    getProgress: () => progress,
    getPlan: () => plan,
    getInstrument: () => active,
    refreshPlan() {
      plan = generateDailyPlan(progress, undefined, active);
      return plan;
    },
    setProgress(next: ProgressState) {
      progress = next;
      const suite = loadSuite();
      suite.active = active;
      suite.apps[active] = next;
      saveSuite(suite);
      plan = generateDailyPlan(progress, undefined, active);
      return progress;
    },
    setInstrument(next: InstrumentId, nextProgress: ProgressState) {
      active = next;
      progress = nextProgress;
      const suite = loadSuite();
      suite.active = next;
      suite.apps[next] = nextProgress;
      saveSuite(suite);
      plan = generateDailyPlan(progress, undefined, active);
      return { progress, plan, instrument: active };
    },
  };
}

export type SparkCore = ReturnType<typeof createSpark>;
