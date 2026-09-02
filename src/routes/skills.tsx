import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/app-shell";
import { ChordDiagram } from "@/components/chord-diagram";
import { instrumentById, isUnlockedFor, lessonsFor, tracksFor, UKE_CHORDS } from "@/lib/spark/instruments";
import { useSpark } from "@/store/spark";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/skills")({ component: SkillsPage });

function SkillsPage() {
  const instrument = useSpark((s) => s.instrument);
  const mastery = useSpark((s) => s.progress.mastery);
  const inst = instrumentById(instrument);
  const tracks = tracksFor(instrument);
  const lessons = lessonsFor(instrument);
  const guitarIds = ["Em", "G", "C", "D", "Am"];
  const ukeIds = ["C", "G", "Am", "F"];

  return (
    <AppShell>
      <header className="px-5 pb-2 pt-8">
        <p className="text-[11px] uppercase tracking-[0.22em] text-dim">{inst.name} path</p>
        <h1 className="mt-2 font-display text-4xl font-semibold tracking-tight">Skills</h1>
        <p className="mt-3 text-muted">Play, make, listen. Mastery on the work — not songs collected.</p>
      </header>
      {instrument === "guitar" ? (
        <div className="flex gap-3 overflow-x-auto px-5 py-2">
          {guitarIds.map((c) => (
            <div key={c} className="shrink-0 rounded-lg border border-border bg-surface px-2 pt-2">
              <ChordDiagram chordId={c} compact />
            </div>
          ))}
        </div>
      ) : null}
      {instrument === "ukulele" ? (
        <div className="flex gap-3 overflow-x-auto px-5 py-2">
          {ukeIds.map((c) => {
            const shape = UKE_CHORDS[c];
            if (!shape) return null;
            return (
              <div key={c} className="shrink-0 rounded-lg border border-border bg-surface px-2 pt-2">
                <ChordDiagram shape={{ id: c, name: c, ...shape }} compact />
              </div>
            );
          })}
        </div>
      ) : null}
      {tracks.map((track) => (
        <section key={track.id} className="px-5 pt-6">
          <h2 className="font-display text-lg font-semibold">{track.name}</h2>
          <ul className="mt-3 space-y-2">
            {lessons.filter((l) => l.trackId === track.id).map((lesson) => {
              const m = mastery[lesson.id] ?? 0;
              const open = isUnlockedFor(instrument, lesson.id, mastery);
              return (
                <li
                  key={lesson.id}
                  className={cn(
                    "rounded-lg border border-border bg-surface px-4 py-3",
                    !open && "opacity-50",
                  )}
                >
                  <div className="flex items-baseline justify-between gap-3">
                    <p className="font-medium">{lesson.title}</p>
                    <p className="tabular text-xs text-muted">{open ? `${Math.round(m * 100)}%` : "locked"}</p>
                  </div>
                  {lesson.repertoire || lesson.process ? (
                    <p className="mt-1 text-xs text-dim">
                      {[
                        lesson.process === "create" ? "Make" : lesson.process === "respond" ? "Listen" : lesson.process === "perform" ? "Play" : null,
                        lesson.repertoire,
                      ]
                        .filter(Boolean)
                        .join(" · ")}
                    </p>
                  ) : null}
                  <div className="mt-2 h-1 overflow-hidden rounded-full bg-raised">
                    <div className="h-full bg-accent" style={{ width: `${Math.round(m * 100)}%` }} />
                  </div>
                </li>
              );
            })}
          </ul>
        </section>
      ))}
    </AppShell>
  );
}
