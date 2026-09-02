import { useEffect } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { AppShell } from "@/components/app-shell";
import { MarkList, WeekPulseRow, XpBar } from "@/components/game-chrome";
import { Button } from "@/components/ui/button";
import { markSting } from "@/lib/spark/audio";
import { rankFor, sparksFor, weekPulse, xpProgress } from "@/lib/spark/game";
import { instrumentById } from "@/lib/spark/instruments";
import { closingCopy, streakTone } from "@/lib/spark/psychology";
import { useSpark } from "@/store/spark";
import { localDayKey } from "@/lib/utils";
import { CheckinRow } from "@/components/udl-chrome";

export const Route = createFileRoute("/results")({ component: ResultsPage });

function prettyLesson(id: string) {
  return id.replace(/^lesson_[a-z]+_/, "").replace(/_/g, " ").replace(/\s+\d+$/, "");
}

function ResultsPage() {
  const result = useSpark((s) => s.lastResult);
  const progress = useSpark((s) => s.progress);
  const instrument = useSpark((s) => s.instrument);
  const noteCheckin = useSpark((s) => s.noteCheckin);
  const inst = instrumentById(instrument);
  const tone = streakTone(progress, localDayKey());
  const rank = rankFor(progress.level);
  const xp = xpProgress(progress.xp);
  const week = weekPulse(progress);
  const sparks = sparksFor(progress);
  const newMarks = result?.newMarks ?? [];

  useEffect(() => {
    if (!result) return;
    if (result.leveledUp || newMarks.length) markSting();
  }, [result, newMarks.length]);

  if (!result) {
    return (
      <AppShell>
        <div className="px-5 pt-16 text-center">
          <p className="text-muted">No session yet.</p>
          <Button asChild className="mt-6">
            <Link to="/today">Back to today</Link>
          </Button>
        </div>
      </AppShell>
    );
  }
  return (
    <AppShell>
      <header className="px-5 pb-2 pt-8">
        <p className="text-[11px] uppercase tracking-[0.22em] text-dim">
          {inst.name} · {rank.title}
        </p>
        <h1 className="mt-2 font-display text-4xl font-semibold tracking-tight">
          {result.leveledUp ? `Level ${progress.level}` : "That's the day"}
        </h1>
        <p className="mt-3 max-w-sm text-pretty text-muted">
          {result.leveledUp ? rank.line : closingCopy(result)}
        </p>
      </header>
      <section className="mx-4 mt-4 rounded-xl border border-border bg-surface p-5">
        <div className="grid grid-cols-3 gap-3 text-center">
          <Stat label="stars" value={String(result.stars)} />
          <Stat label="xp" value={`+${result.xp}`} />
          <Stat label="combo" value={String(result.peakCombo ?? 0)} />
        </div>
        <div className="mt-5">
          <XpBar into={xp.into} need={xp.need} label={`Level ${xp.level} · ${rank.title}`} />
        </div>
        <div className="mt-4">
          <WeekPulseRow pulse={week} />
          <p className="mt-2 tabular text-xs text-dim">{sparks} spark{sparks === 1 ? "" : "s"}</p>
        </div>
        <p className="mt-3 text-center text-sm text-muted">
          Streak {progress.streak}
          {tone === "held" ? " held" : ""}
        </p>
        <div className="mt-5 border-t border-border pt-5">
          <CheckinRow value={progress.lastCheckin} onPick={noteCheckin} />
        </div>
        {newMarks.length ? (
          <div className="mt-6 border-t border-border pt-5">
            <p className="mb-3 text-[11px] uppercase tracking-[0.18em] text-dim">Marks</p>
            <MarkList ids={newMarks} />
          </div>
        ) : null}
        <ul className="mt-6 space-y-2">
          {result.items.map((item) => (
            <li key={item.itemId} className="flex justify-between text-sm">
              <span className="text-muted">{prettyLesson(item.lessonId)}</span>
              <span className="tabular">
                {item.stars}★ · {Math.round(item.accuracy * 100)}%
              </span>
            </li>
          ))}
        </ul>
      </section>
      <div className="px-5 pt-6">
        <Button asChild size="lg" className="w-full">
          <Link to="/today">Back to today</Link>
        </Button>
      </div>
    </AppShell>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="font-display text-2xl font-semibold tabular">{value}</p>
      <p className="text-[11px] uppercase tracking-[0.16em] text-dim">{label}</p>
    </div>
  );
}
