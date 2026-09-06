import { useCallback, useEffect, useRef, useState } from "react";
import {
  click,
  drumHit,
  ghostNote,
  pianoHold,
  scheduleRun,
  unlockAudio,
  type AudioRun,
} from "@/lib/spark/audio";
import { midiToFreq } from "@/lib/spark/instruments";
import type { LessonExercise, PracticeCue, PracticeGuide } from "@/lib/spark/lesson-practice";

/** Duration-aware pitch guide: rests and sustained notes keep their actual beat lengths. */
export function soundPracticeCue(cue: PracticeCue, when: number, bpm: number) {
  cue.pads?.forEach((pad) => drumHit(pad, when));
  if (cue.muted) ghostNote(when);
  cue.notes?.forEach((midi) =>
    pianoHold(
      midiToFreq(midi),
      ((cue.duration ?? 0.85) * 60) / bpm,
      when,
      0.2 / Math.sqrt(cue.notes!.length),
    ),
  );
}

/** One finite pass. Playback is never persisted and never records an attempt. */
export function usePracticePlayback(exercise: Pick<LessonExercise, "beats" | "cues">) {
  const [phase, setPhase] = useState<"idle" | "count" | "play" | "done">("idle");
  const [cursor, setCursor] = useState<number | null>(null);
  const [count, setCount] = useState(1);
  const [audioUnavailable, setAudioUnavailable] = useState(false);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);
  const run = useRef<AudioRun | null>(null);
  const generation = useRef(0);

  const cancel = useCallback(() => {
    generation.current++;
    timers.current.forEach(clearTimeout);
    timers.current = [];
    run.current?.stop();
    run.current = null;
  }, []);
  const stop = useCallback(() => {
    cancel();
    setPhase("idle");
    setCursor(null);
  }, [cancel]);
  useEffect(() => {
    const hide = () => {
      if (document.hidden) stop();
    };
    const escape = (event: KeyboardEvent) => {
      if (event.key === "Escape") stop();
    };
    document.addEventListener("visibilitychange", hide);
    document.addEventListener("keydown", escape);
    window.addEventListener("pagehide", stop);
    return () => {
      cancel();
      document.removeEventListener("visibilitychange", hide);
      document.removeEventListener("keydown", escape);
      window.removeEventListener("pagehide", stop);
    };
  }, [cancel, stop]);

  async function play(bpm: number, guide: PracticeGuide) {
    stop();
    const ticket = generation.current;
    setPhase("count");
    setCount(1);
    let audio = guide === "silent" ? null : unlockAudio();
    if (audio && audio.state !== "running") {
      await Promise.race([
        audio.resume().catch(() => undefined),
        new Promise((resolve) => setTimeout(resolve, 300)),
      ]);
    }
    // A stop, navigation, or hidden tab while resume was pending cancels this start.
    if (ticket !== generation.current || document.hidden) return;
    if (audio?.state !== "running") audio = null;
    setAudioUnavailable(guide !== "silent" && !audio);
    const beatSeconds = 60 / bpm;
    const start = (audio?.currentTime ?? 0) + 0.1;
    const at = (beat: number, action: () => void) => {
      const delay = audio
        ? Math.max(0, (start + beat * beatSeconds - audio.currentTime) * 1000)
        : (0.1 + beat * beatSeconds) * 1000;
      timers.current.push(
        setTimeout(() => {
          if (generation.current === ticket) action();
        }, delay),
      );
    };
    if (audio) {
      run.current = scheduleRun(() => {
        for (let beat = 0; beat < exercise.beats + 4; beat++)
          click(beat % 4 === 0, start + beat * beatSeconds);
        if (guide === "notes")
          exercise.cues.forEach((cue) =>
            soundPracticeCue(cue, start + (4 + cue.beat) * beatSeconds, bpm),
          );
      });
    }
    for (let beat = 0; beat < 4; beat++) at(beat, () => setCount(beat + 1));
    for (let beat = 0; beat < exercise.beats; beat += 0.5) {
      at(4 + beat, () => {
        setPhase("play");
        setCursor(beat);
      });
    }
    at(4 + exercise.beats, () => {
      cancel();
      setPhase("done");
      setCursor(null);
    });
  }

  return {
    phase,
    cursor,
    count,
    audioUnavailable,
    running: phase === "count" || phase === "play",
    play,
    stop,
  };
}
