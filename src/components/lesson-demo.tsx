import { useEffect, useRef, useState } from "react";
import { Play, Square } from "lucide-react";
import { Button } from "@/components/ui/button";
import { drumHit, pianoTone, scheduleRun, unlockAudio, type AudioRun } from "@/lib/spark/audio";
import type { LearningLesson } from "@/lib/spark/curriculum";
import type { InstrumentId } from "@/lib/spark/instruments";
import { gmNoteToPad } from "@/lib/spark/midi-drums";

const PAD_LETTERS = ["K", "S", "H", "T"] as const;

function stepLabel(step: number[]): string {
  const letters = step
    .map((note) => gmNoteToPad(note))
    .filter((pad): pad is 0 | 1 | 2 | 3 => pad !== null)
    .map((pad) => PAD_LETTERS[pad]);
  return letters.length ? [...new Set(letters)].join("+") : "–";
}

export function LessonDemo({
  demo,
  instrument,
}: {
  demo: NonNullable<LearningLesson["demo"]>;
  instrument?: InstrumentId;
}) {
  const run = useRef<AudioRun | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [playing, setPlaying] = useState(false);
  const [unavailable, setUnavailable] = useState(false);
  const isDrums = instrument === "drums";
  function stop() {
    run.current?.stop();
    run.current = null;
    if (timer.current) clearTimeout(timer.current);
    timer.current = null;
    setPlaying(false);
  }
  useEffect(() => {
    const hide = () => {
      if (document.hidden) stop();
    };
    document.addEventListener("visibilitychange", hide);
    return () => {
      stop();
      document.removeEventListener("visibilitychange", hide);
    };
  }, []);
  function play() {
    if (playing) {
      stop();
      return;
    }
    const audio = unlockAudio();
    if (!audio) {
      setUnavailable(true);
      return;
    }
    setUnavailable(false);
    const start = audio.currentTime + 0.1;
    run.current = scheduleRun(() =>
      demo.notes.forEach((chord, beat) => {
        if (isDrums) {
          chord.forEach((note) => {
            const pad = gmNoteToPad(note);
            if (pad !== null) drumHit(pad, start + beat * 0.6);
          });
          return;
        }
        chord.forEach((midi) =>
          pianoTone(
            440 * 2 ** ((midi - 69) / 12),
            start + beat * 0.6,
            0.18 / Math.sqrt(chord.length),
          ),
        );
      }),
    );
    setPlaying(true);
    timer.current = setTimeout(stop, (demo.notes.length * 0.6 + 1.5) * 1000);
  }
  return (
    <div className="mt-4">
      <Button
        variant="secondary"
        onClick={play}
        aria-label={playing ? "Stop reference" : "Play reference"}
      >
        {playing ? (
          <Square className="size-4" aria-hidden="true" />
        ) : (
          <Play className="size-4" aria-hidden="true" />
        )}
        {playing ? "Stop reference" : "Hear the example"}
      </Button>
      {isDrums ? (
        <>
          <div className="mt-3 flex flex-wrap gap-1" aria-label="Drum pattern, one cell per step">
            {demo.notes.map((step, i) => (
              <span
                key={i}
                className="flex h-7 min-w-7 items-center justify-center rounded-sm border border-border bg-raised px-1 text-[11px] font-semibold tabular text-fg"
              >
                {stepLabel(step)}
              </span>
            ))}
          </div>
          <p className="mt-2 text-xs leading-relaxed text-muted">
            {demo.label} · Drum pattern, one cell per step. K kick · S snare · H hat · T tom.
            Listening is optional.
          </p>
        </>
      ) : (
        <p className="mt-2 text-xs leading-relaxed text-muted">
          {demo.label} · Synthesized pitch reference. Listening is optional.
        </p>
      )}
      {unavailable ? (
        <p role="status" className="mt-2 text-sm text-muted">
          Audio is unavailable here. The written example has the same notes.
        </p>
      ) : null}
    </div>
  );
}
