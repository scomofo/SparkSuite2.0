import { generateDailyPlan } from "./daily-plan.ts";
import type { InstrumentId } from "./instruments.ts";
import { defaultProgress, saveActiveProgress } from "./storage.ts";
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
      const suite = saveActiveProgress(active, next);
      plan = generateDailyPlan(progress, undefined, active);
      return { progress, plan, suite };
    },
    setInstrument(next: InstrumentId, nextProgress: ProgressState) {
      active = next;
      progress = nextProgress;
      const suite = saveActiveProgress(next, nextProgress);
      plan = generateDailyPlan(progress, undefined, active);
      return { progress, plan, instrument: active, suite };
    },
  };
}

export type SparkCore = ReturnType<typeof createSpark>;
