import { createFileRoute, Link } from "@tanstack/react-router";
import { Check, Music2 } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { MarkList } from "@/components/game-chrome";
import { Button } from "@/components/ui/button";
import { dayLabel } from "@/lib/spark/activity";
import { rankFor, recentDays, sparksFor } from "@/lib/spark/game";
import {
  INSTRUMENTS,
  instrumentById,
  isInstrumentId,
  lessonsFor,
  tracksFor,
} from "@/lib/spark/instruments";
import { useSpark } from "@/store/spark";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/progress")({ component: ProgressPage });

function ProgressPage() {
  const instrument = useSpark((s) => s.instrument);
  const progress = useSpark((s) => s.progress);
  const selectInstrument = useSpark((s) => s.selectInstrument);
  const hydrated = useSpark((s) => s.hydrated);
  const inst = instrumentById(instrument);
  const days = recentDays(undefined, 28);
  const lessons = lessonsFor(instrument);
  const rank = rankFor(progress.level);
  const played = progress.history.length > 0;
  const history = progress.history.slice(-8).reverse();

  if (!hydrated)
    return (
      <AppShell wide>
        <p role="status" className="p-8 text-muted">
          Loading your progress…
        </p>
      </AppShell>
    );

  return (
    <AppShell wide>
      <div className="px-5 pt-8 md:px-8 lg:pt-10">
        <header className="flex flex-wrap items-end justify-between gap-5">
          <div>
            <p className="studio-label">The practice adds up</p>
            <h1 className="mt-2 font-display text-4xl font-semibold tracking-tight">
              Your progress
            </h1>
            <p className="mt-3 text-muted">
              {inst.name} · Level {progress.level} · {rank.title}
            </p>
          </div>
          <div className="flex flex-col gap-2 text-sm text-muted">
            <label htmlFor="progress-instrument">Instrument</label>
            <select
              id="progress-instrument"
              value={instrument}
              onChange={(e) => {
                if (isInstrumentId(e.target.value)) selectInstrument(e.target.value);
              }}
              className="min-h-11 rounded-md border border-border bg-surface px-4 py-2 text-fg"
            >
              {INSTRUMENTS.map((i) => (
                <option key={i.id} value={i.id}>
                  {i.name}
                </option>
              ))}
            </select>
          </div>
        </header>
        <dl className="mt-8 grid grid-cols-3 gap-3">
          {[
            { label: "Practice days", value: sparksFor(progress) },
            { label: "Total XP", value: progress.xp },
            { label: "Best combo", value: progress.bestCombo },
          ].map((stat) => (
            <div key={stat.label} className="rounded-lg border border-border bg-surface p-4 sm:p-5">
              <dt className="text-xs text-muted sm:text-sm">{stat.label}</dt>
              <dd className="mt-2 font-display text-2xl font-semibold tabular sm:text-3xl">
                {stat.value.toLocaleString("en")}
              </dd>
            </div>
          ))}
        </dl>
        <div className="mt-5 grid gap-5 xl:grid-cols-2">
          <section
            className="rounded-xl border border-border bg-surface p-5 sm:p-6"
            aria-labelledby="activity-heading"
          >
            <h2 id="activity-heading" className="font-display text-xl font-semibold">
              The last 28 days
            </h2>
            <p className="mt-2 text-sm text-muted">Every lit square is a day you practised.</p>
            <div
              className="mt-5 grid grid-cols-7 gap-2 text-center text-xs text-muted"
              aria-hidden="true"
            >
              {days.slice(0, 7).map((day) => (
                <span key={day}>{dayLabel(day, { weekday: "short" })}</span>
              ))}
            </div>
            <ol className="mt-2 grid grid-cols-7 gap-2" aria-label="Practice days">
              {days.map((day) => (
                <li
                  key={day}
                  title={`${dayLabel(day)}: ${progress.dailyComplete[day] ? "Practised" : "Rest day"}`}
                  className={cn(
                    "flex min-h-11 items-center justify-center gap-1 rounded-sm text-sm tabular",
                    progress.dailyComplete[day]
                      ? "bg-accent text-accent-fg"
                      : "bg-raised text-muted",
                  )}
                >
                  <span aria-hidden="true">{Number(day.slice(-2))}</span>
                  {progress.dailyComplete[day] ? (
                    <Check className="size-3" aria-hidden="true" />
                  ) : null}
                  <span className="sr-only">
                    {dayLabel(day)}: {progress.dailyComplete[day] ? "Practised" : "Rest day"}
                  </span>
                </li>
              ))}
            </ol>
            <p className="mt-5 text-sm text-muted">
              Rest days leave room for the next good session.
            </p>
          </section>
          <section
            className="rounded-xl border border-border bg-surface p-5 sm:p-6"
            aria-labelledby="path-heading"
          >
            <h2 id="path-heading" className="font-display text-xl font-semibold">
              Your learning path
            </h2>
            <ul className="mt-5 space-y-5">
              {tracksFor(instrument).map((track) => {
                const trackLessons = lessons.filter((lesson) => lesson.trackId === track.id);
                const mastery = trackLessons.length
                  ? Math.round(
                      (trackLessons.reduce(
                        (sum, lesson) => sum + (progress.mastery[lesson.id] ?? 0),
                        0,
                      ) /
                        trackLessons.length) *
                        100,
                    )
                  : 0;
                return (
                  <li key={track.id}>
                    <div className="mb-2 flex justify-between gap-3 text-sm">
                      <span>{track.name}</span>
                      <span className="tabular text-muted">{mastery}%</span>
                    </div>
                    <progress
                      className="studio-progress"
                      value={mastery}
                      max={100}
                      aria-label={`${track.name} mastery`}
                    />
                  </li>
                );
              })}
            </ul>
            <Button asChild variant="ghost" className="mt-5">
              <Link to="/skills">Explore all lessons</Link>
            </Button>
          </section>
        </div>
        {progress.marks.length ? (
          <section className="mt-8" aria-labelledby="marks-heading">
            <h2 id="marks-heading" className="mb-4 font-display text-2xl font-semibold">
              Marks earned
            </h2>
            <MarkList ids={progress.marks} />
          </section>
        ) : null}
        <section className="mt-8 pb-5" aria-labelledby="history-heading">
          <h2 id="history-heading" className="font-display text-2xl font-semibold">
            Session history
          </h2>
          {played ? (
            <div className="mt-4 overflow-hidden rounded-lg border border-border">
              <table className="w-full text-left text-sm">
                <caption className="sr-only">Recent {inst.name} sessions</caption>
                <thead className="bg-surface text-muted">
                  <tr>
                    <th scope="col" className="p-4 font-medium">
                      Date
                    </th>
                    <th scope="col" className="p-4 font-medium">
                      Timing
                    </th>
                    <th scope="col" className="p-4 font-medium">
                      XP
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {history.map((entry, index) => (
                    <tr key={`${entry.date}-${index}`}>
                      <th scope="row" className="p-4 font-normal">
                        {dayLabel(entry.date, { month: "short", day: "numeric", year: "numeric" })}
                      </th>
                      <td className="p-4 tabular text-muted">
                        {Math.round(entry.accuracy * 100)}%
                      </td>
                      <td className="p-4 tabular text-ember">+{entry.xp}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="mt-4 rounded-xl border border-dashed border-border p-6">
              <Music2 className="size-6 text-ember" aria-hidden="true" />
              <h3 className="mt-3 font-display text-xl font-semibold">
                A fresh page for {inst.name.toLowerCase()}.
              </h3>
              <p className="mt-2 max-w-lg text-sm text-muted">
                Finish a loop to see your timing, XP, and practice history. No scores to chase
                before you begin.
              </p>
              <Button asChild className="mt-5">
                <Link to="/today">Open today's loop</Link>
              </Button>
            </div>
          )}
          <p className="mt-5 text-xs text-muted">
            Progress stays in this browser. Timing scores reflect the on-screen exercises.
          </p>
        </section>
      </div>
    </AppShell>
  );
}
