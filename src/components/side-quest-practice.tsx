import { useMemo, useState } from "react";
import { Link } from "@tanstack/react-router";
import { ArrowLeft, Play, Square } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { Button } from "@/components/ui/button";
import { usePracticePlayback } from "@/components/lesson-practice-player";
import { instrumentById } from "@/lib/spark/instruments";
import { PRACTICE_TEMPOS, type PracticeGuide } from "@/lib/spark/lesson-practice";
import { sideQuestById, sideQuestExercise } from "@/lib/spark/side-quest-practice";
import { cn } from "@/lib/utils";

export function SideQuestPractice({ id }: { id: string }) {
  const quest = sideQuestById(id);
  const exercise = sideQuestExercise(id);
  const [bpm, setBpm] = useState(exercise?.bpm ?? 60);
  const [guide, setGuide] = useState<PracticeGuide>("notes");
  const sequence = useMemo(() => exercise ?? { beats: 8, cues: [] }, [exercise]);
  const playback = usePracticePlayback(sequence);

  if (!quest || !exercise)
    return (
      <AppShell wide focusTimer={false}>
        <div className="mx-auto max-w-3xl px-5 py-8">
          <h1 className="font-display text-3xl font-semibold">This side quest is unavailable.</h1>
          <Button asChild className="mt-6">
            <Link to="/learn">Back to learning</Link>
          </Button>
        </div>
      </AppShell>
    );

  const inst = instrumentById(quest.instrument);
  const cue =
    playback.cursor === null
      ? undefined
      : exercise.cues.find(
          (item) => item.beat <= playback.cursor! && item.beat > playback.cursor! - 1,
        );
  const status =
    playback.phase === "count"
      ? "Count in · " + playback.count
      : playback.phase === "play"
        ? "Beat " + (Math.floor((playback.cursor ?? 0) % 4) + 1)
        : playback.phase === "done"
          ? "One pass complete"
          : "Ready when you are";

  return (
    <AppShell wide focusTimer={false}>
      <div className="mx-auto max-w-3xl px-5 pb-10 pt-6 md:px-8">
        <Link to="/learn" className="inline-flex min-h-11 items-center gap-2 text-sm text-muted">
          <ArrowLeft className="size-4" aria-hidden="true" />
          Back to learning
        </Link>

        <header className="mt-5">
          <p className="studio-label">{inst.name} / Optional side quest</p>
          <h1 className="mt-2 font-display text-3xl font-semibold tracking-tight sm:text-4xl">
            {quest.title}
          </h1>
          <p className="mt-3 leading-relaxed text-muted">{quest.purpose}</p>
        </header>

        <section className="mt-6 rounded-xl border border-border bg-surface p-5 sm:p-7">
          <p className="studio-label">Your experiment</p>
          <p className="mt-3 leading-relaxed">{quest.challenge}</p>
          <p className="mt-3 text-sm leading-relaxed text-muted">
            <span className="font-medium text-fg">Listen for: </span>
            {quest.listenFor}
          </p>

          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            <label className="text-sm">
              <span className="block font-medium">Tempo</span>
              <select
                className="mt-2 min-h-11 w-full rounded-md border border-border bg-raised px-3"
                value={bpm}
                onChange={(event) => setBpm(Number(event.target.value))}
              >
                {PRACTICE_TEMPOS.map((tempo) => (
                  <option key={tempo} value={tempo}>
                    {tempo} BPM
                  </option>
                ))}
              </select>
            </label>
            <fieldset>
              <legend className="text-sm font-medium">Guide</legend>
              <div className="mt-2 grid grid-cols-3 gap-2">
                {([
                  ["notes", "Notes"],
                  ["pulse", "Click"],
                  ["silent", "Visual"],
                ] as const).map(([value, label]) => (
                  <button
                    key={value}
                    type="button"
                    aria-pressed={guide === value}
                    onClick={() => setGuide(value)}
                    className={cn(
                      "min-h-11 rounded-md border px-3 text-sm",
                      guide === value ? "border-ember bg-raised text-ember" : "border-border",
                    )}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </fieldset>
          </div>

          <div className="mt-6 rounded-lg bg-raised p-5 text-center">
            <p className="studio-label">{status}</p>
            <p className="mt-3 min-h-12 text-lg font-medium">
              {cue?.label ??
                (playback.phase === "done" ? "What did you notice?" : quest.listenFor)}
            </p>
            {cue?.detail ? <p className="mt-2 text-sm text-muted">{cue.detail}</p> : null}
          </div>

          {playback.audioUnavailable ? (
            <p className="mt-3 text-sm text-muted">
              Audio is unavailable in this browser right now; the visual guide still works.
            </p>
          ) : null}

          <div className="mt-5 flex gap-3">
            <Button
              className="flex-1"
              size="lg"
              onClick={() => void playback.play(bpm, guide)}
              disabled={playback.running}
            >
              <Play className="size-4" aria-hidden="true" />
              {playback.phase === "done" ? "Play another pass" : "Start side quest"}
            </Button>
            {playback.running ? (
              <Button variant="secondary" size="lg" onClick={playback.stop}>
                <Square className="size-4" aria-hidden="true" />
                Stop
              </Button>
            ) : null}
          </div>

          <p className="mt-5 text-sm leading-relaxed text-muted">
            No score and nothing to submit. If you noticed one useful thing, the quest did its job.
          </p>
        </section>
      </div>
    </AppShell>
  );
}