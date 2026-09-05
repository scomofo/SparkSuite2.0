import { localDayKey } from "../utils.ts";
import { recentDays, WEEK_GOAL } from "./game.ts";
import { INSTRUMENTS } from "./instruments.ts";
import type { SuiteState } from "./storage.ts";

/** A day counts once across the suite, even when several instruments were played. */
export function suiteActivity(apps: SuiteState["apps"], today = localDayKey()) {
  const days = recentDays(today).map((key) => ({
    key,
    on: Object.values(apps).some((progress) => progress?.dailyComplete[key] === true),
  }));
  const count = days.filter((day) => day.on).length;
  return { days, count, held: count >= WEEK_GOAL };
}

export function recentSessions(apps: SuiteState["apps"], limit = 6) {
  return INSTRUMENTS.flatMap((instrument) =>
    (apps[instrument.id]?.history ?? []).map((session, index) => ({
      ...session,
      instrument,
      index,
    })),
  )
    .sort((a, b) => b.date.localeCompare(a.date) || b.index - a.index)
    .slice(0, limit);
}

export function dayLabel(
  day: string,
  options: Intl.DateTimeFormatOptions = { month: "short", day: "numeric" },
) {
  return new Intl.DateTimeFormat("en", options).format(new Date(`${day}T12:00:00`));
}
