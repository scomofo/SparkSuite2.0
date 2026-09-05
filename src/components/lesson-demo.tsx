import { useEffect, useRef, useState } from "react";
import { Play, Square } from "lucide-react";
import { Button } from "@/components/ui/button";
import { pianoTone, scheduleRun, unlockAudio, type AudioRun } from "@/lib/spark/audio";
import type { LearningLesson } from "@/lib/spark/curriculum";

export function LessonDemo({ demo }: { demo: NonNullable<LearningLesson["demo"]> }) {
  const run = useRef<AudioRun | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [playing, setPlaying] = useState(false);
  const [unavailable, setUnavailable] = useState(false);
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
      <p className="mt-2 text-xs leading-relaxed text-muted">
        {demo.label} · Synthesized pitch reference. Listening is optional.
      </p>
      {unavailable ? (
        <p role="status" className="mt-2 text-sm text-muted">
          Audio is unavailable here. The written example has the same notes.
        </p>
      ) : null}
    </div>
  );
}
