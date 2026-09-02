import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Flame } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { InstrumentMark } from "@/components/instrument-mark";
import { rankFor, sparksFor, weekPulse } from "@/lib/spark/game";
import { INSTRUMENTS, instrumentById, type InstrumentId } from "@/lib/spark/instruments";
import { defaultProgress } from "@/lib/spark/storage";
import { useSpark } from "@/store/spark";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/")({ component: SuiteHome });

function SuiteHome() {
  const navigate = useNavigate();
  const active = useSpark((s) => s.instrument);
  const selectInstrument = useSpark((s) => s.selectInstrument);
  const apps = useSpark((s) => s.apps);
  const totalXp = useSpark((s) => s.suiteXp);
  const maxStreak = useSpark((s) => s.bestStreak);
  const featured = instrumentById(active);
  const featuredProgress = apps[featured.id] ?? defaultProgress();
  const featuredRank = rankFor(featuredProgress.level);
  const featuredWeek = weekPulse(featuredProgress);

  function open(id: InstrumentId) {
    selectInstrument(id);
    void navigate({ to: "/today" });
  }

  return (
    <AppShell>
      <header className="px-5 pb-2 pt-8">
        <p className="text-[11px] uppercase tracking-[0.22em] text-dim">Practice console</p>
        <h1 className="mt-2 font-display text-4xl font-semibold tracking-tight">SparkSuite</h1>
        <p className="mt-3 max-w-sm text-pretty text-muted">One loop a day. Pick the instrument in your hands.</p>
        <div className="mt-5 flex gap-3">
          <div className="rounded-lg border border-border bg-surface px-4 py-3">
            <p className="text-[11px] uppercase tracking-[0.16em] text-dim">Suite XP</p>
            <p className="tabular font-display text-xl font-semibold">{totalXp}</p>
          </div>
          <div className="flex items-center gap-2 rounded-lg border border-border bg-surface px-4 py-3">
            <Flame className="size-4 text-ember" />
            <div>
              <p className="text-[11px] uppercase tracking-[0.16em] text-dim">Best streak</p>
              <p className="tabular font-display text-xl font-semibold">{maxStreak}</p>
            </div>
          </div>
        </div>
      </header>

      <section className="mx-4 mt-6">
        <p className="text-[11px] uppercase tracking-[0.18em] text-dim">Continue</p>
        <button
          type="button"
          onClick={() => open(featured.id)}
          className="mt-2 flex w-full items-center gap-4 rounded-xl border border-accent bg-surface p-4 text-left"
        >
          <InstrumentMark id={featured.id} className="size-20" />
          <div className="min-w-0 flex-1">
            <p className="font-display text-xl font-semibold">{featured.name}</p>
            <p className="mt-1 text-pretty text-sm text-muted">
              {featuredRank.title}
              {featuredWeek.held ? " · week held" : ` · ${featuredWeek.count} / 3 this week`}
            </p>
          </div>
        </button>
      </section>

      <section className="px-5 pt-8 pb-4">
        <h2 className="font-display text-lg font-semibold">Collection</h2>
        <ul className="mt-3 space-y-2">
          {INSTRUMENTS.map((inst) => {
            const p = apps[inst.id];
            const played = (p?.history.length ?? 0) > 0;
            const rank = rankFor(p?.level ?? 1);
            const sparks = p ? sparksFor(p) : 0;
            return (
              <li key={inst.id}>
                <button
                  type="button"
                  onClick={() => open(inst.id)}
                  className={cn(
                    "flex w-full items-center gap-3 rounded-lg border px-3 py-3 text-left transition-colors duration-(--motion-quick)",
                    inst.id === active ? "border-accent bg-raised" : "border-border bg-surface hover:border-ember/40",
                  )}
                >
                  <InstrumentMark id={inst.id} />
                  <div className="min-w-0 flex-1">
                    <p className="font-display font-semibold">{inst.name}</p>
                    <p className="truncate text-sm text-muted">{played ? rank.title : inst.kicker}</p>
                  </div>
                  <span className="shrink-0 tabular text-xs text-dim">
                    {played ? `${sparks} spark${sparks === 1 ? "" : "s"}` : "New"}
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      </section>
    </AppShell>
  );
}
