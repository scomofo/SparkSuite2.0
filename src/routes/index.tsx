import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { ArrowUpRight, Check, Flame, Play } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { InstrumentMark } from "@/components/instrument-mark";
import { Button } from "@/components/ui/button";
import { dayLabel, recentSessions, suiteActivity } from "@/lib/spark/activity";
import { rankFor, sparksFor, WEEK_GOAL, xpProgress } from "@/lib/spark/game";
import { INSTRUMENTS, instrumentById, type InstrumentId } from "@/lib/spark/instruments";
import { defaultProgress } from "@/lib/spark/storage";
import { useSpark } from "@/store/spark";
import { cn, localDayKey } from "@/lib/utils";

export const Route = createFileRoute("/")({ component: SuiteHome });

function SuiteHome() {
  const navigate = useNavigate();
  const active = useSpark((s) => s.instrument);
  const selectInstrument = useSpark((s) => s.selectInstrument);
  const apps = useSpark((s) => s.apps);
  const totalXp = useSpark((s) => s.suiteXp);
  const session = useSpark((s) => s.session);
  const hydrated = useSpark((s) => s.hydrated);
  const featured = instrumentById(active);
  const progress = apps[active] ?? defaultProgress();
  const rank = rankFor(progress.level);
  const xp = xpProgress(progress.xp);
  const week = suiteActivity(apps);
  const recent = recentSessions(apps, 3);
  const resume = session?.plan.date === localDayKey();
  const played = Object.values(apps).some((p) => p && p.history.length > 0);
  function open(id: InstrumentId) {
    selectInstrument(id);
    void navigate({ to: "/today" });
  }
  if (!hydrated)
    return (
      <AppShell wide>
        <p role="status" className="p-8 text-muted">
          Opening your studio…
        </p>
      </AppShell>
    );
  return (
    <AppShell wide>
      <div className="px-5 pt-8 md:px-8 lg:pt-10">
        <header className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="studio-label">SparkSuite / Practice studio</p>
            <h1 className="mt-2 font-display text-4xl font-semibold tracking-tight md:text-5xl">
              Make room for music.
            </h1>
            <p className="mt-3 text-muted">
              {played
                ? "Your next good session starts here."
                : "Pick an instrument. Find your pulse. Build from there."}
            </p>
          </div>
          <div className="flex items-center gap-2 text-sm text-ember">
            <Flame className="size-4" aria-hidden="true" />
            <span className="tabular">{totalXp.toLocaleString("en")} suite XP</span>
          </div>
        </header>
        <div className="mt-8 grid gap-5 xl:grid-cols-3">
          <section
            aria-labelledby="continue-heading"
            className="overflow-hidden rounded-xl border border-border bg-surface xl:col-span-2"
          >
            <div className="flex items-center gap-5 p-5 sm:gap-6 sm:p-6">
              <InstrumentMark id={active} className="size-24 sm:size-36" />
              <div className="min-w-0">
                <p className="studio-label">
                  {resume ? "Ready when you are" : played ? "On your stand" : "Your first session"}
                </p>
                <h2
                  id="continue-heading"
                  className="mt-2 font-display text-3xl font-semibold sm:text-4xl"
                >
                  {featured.name}
                </h2>
                <p className="mt-2 text-sm text-muted">
                  Level {progress.level} · {rank.title}
                </p>
                {resume ? (
                  <p className="mt-2 text-sm text-ember">
                    {session.results.length} exercises finished · place saved
                  </p>
                ) : (
                  <p className="mt-2 text-sm text-muted">{featured.kicker}</p>
                )}
              </div>
            </div>
            <div className="border-t border-border p-5 sm:p-6">
              <div className="mb-3 flex justify-between gap-3 text-xs text-muted">
                <span>{rank.line}</span>
                <span className="shrink-0 tabular">
                  {xp.into} / {xp.need} XP
                </span>
              </div>
              <progress
                className="studio-progress"
                max={xp.need}
                value={xp.into}
                aria-label="Progress to next level"
              />
              <Button
                className="mt-5 w-full"
                size="lg"
                disabled={!hydrated}
                onClick={() => open(active)}
              >
                <Play className="size-4" aria-hidden="true" />
                {resume ? "Continue your loop" : "Open today's loop"}
              </Button>
            </div>
          </section>
          <section
            aria-labelledby="week-heading"
            className="rounded-xl border border-border bg-surface p-5 sm:p-6"
          >
            <p className="studio-label">A rhythm you can keep</p>
            <h2 id="week-heading" className="mt-2 font-display text-xl font-semibold">
              Your last seven days
            </h2>
            <p className="mt-5 font-display text-4xl font-semibold tabular">
              {week.count}
              <span className="ml-2 text-base font-normal text-muted">/ {WEEK_GOAL} day goal</span>
            </p>
            <ol
              className="mt-5 grid grid-cols-7 gap-2"
              aria-label="Practice in the last seven days"
            >
              {week.days.map((day) => (
                <li
                  key={day.key}
                  className="text-center"
                  title={`${dayLabel(day.key)}: ${day.on ? "Practised" : "Rest day"}`}
                >
                  <span
                    className={cn(
                      "flex aspect-square items-center justify-center rounded-sm",
                      day.on ? "bg-accent text-accent-fg" : "bg-raised text-muted",
                    )}
                    aria-hidden="true"
                  >
                    {day.on ? (
                      <Check className="size-4" />
                    ) : (
                      <span className="size-1 rounded-full bg-muted" />
                    )}
                  </span>
                  <span className="mt-2 block text-xs text-muted" aria-hidden="true">
                    {dayLabel(day.key, { weekday: "narrow" })}
                  </span>
                  <span className="sr-only">
                    {dayLabel(day.key)}: {day.on ? "Practised" : "Rest day"}
                  </span>
                </li>
              ))}
            </ol>
            <p className="mt-5 text-sm leading-relaxed text-muted">
              {week.held
                ? "Your week is held. Let the next session be for the joy of it."
                : "Any instrument counts. Three days of showing up is a week well played."}
            </p>
            <Link
              to="/progress"
              className="mt-3 inline-flex min-h-11 items-center gap-2 text-sm text-ember"
            >
              Explore your progress <ArrowUpRight className="size-4" aria-hidden="true" />
            </Link>
          </section>
        </div>
        <section className="mt-10" aria-labelledby="instruments-heading">
          <div className="flex items-baseline justify-between gap-3">
            <h2 id="instruments-heading" className="font-display text-2xl font-semibold">
              Your instruments
            </h2>
            <span className="text-sm text-muted">Six ways in</span>
          </div>
          <ul className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {INSTRUMENTS.map((inst) => {
              const p = apps[inst.id];
              const played = (p?.history.length ?? 0) > 0;
              const sparks = p ? sparksFor(p) : 0;
              return (
                <li key={inst.id}>
                  <button
                    type="button"
                    disabled={!hydrated}
                    onClick={() => open(inst.id)}
                    aria-label={`Practise ${inst.name}`}
                    className={cn(
                      "flex min-h-24 w-full items-center gap-4 rounded-lg border bg-surface p-4 text-left transition-colors hover:border-ember",
                      inst.id === active ? "border-accent/60" : "border-border",
                    )}
                  >
                    <InstrumentMark id={inst.id} className="size-14" />
                    <div className="min-w-0 flex-1">
                      <p className="font-display text-lg font-semibold">{inst.name}</p>
                      <p className="mt-1 text-sm text-muted">
                        {played
                          ? `${rankFor(p?.level ?? 1).title} · ${sparks} practice ${sparks === 1 ? "day" : "days"}`
                          : "Start your first loop"}
                      </p>
                    </div>
                  </button>
                </li>
              );
            })}
          </ul>
        </section>
        <section className="mt-10 pb-4" aria-labelledby="recent-heading">
          <h2 id="recent-heading" className="font-display text-2xl font-semibold">
            Recently played
          </h2>
          {recent.length ? (
            <ul className="mt-3 divide-y divide-border">
              {recent.map((entry) => (
                <li
                  key={`${entry.instrument.id}-${entry.index}`}
                  className="flex flex-wrap items-center gap-4 py-4"
                >
                  <InstrumentMark id={entry.instrument.id} className="size-11" />
                  <div className="flex-1">
                    <p className="font-medium">{entry.instrument.name}</p>
                    <p className="mt-1 text-sm text-muted">{dayLabel(entry.date)}</p>
                  </div>
                  <p className="text-sm text-muted tabular">
                    {Math.round(entry.accuracy * 100)}% timing
                  </p>
                  <p className="text-sm text-ember tabular">+{entry.xp} XP</p>
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-3 rounded-lg border border-dashed border-border p-5 text-sm leading-relaxed text-muted">
              Your first finished loop starts the story. Your sessions will appear here as you play.
            </p>
          )}
        </section>
      </div>
    </AppShell>
  );
}
