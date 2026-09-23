import { useEffect, useRef, useState } from "react";
import { click, kick, scheduleRun, unlockAudio, type AudioRun } from "@/lib/spark/audio";

export type LineHit = {
  beat: number;
  mark?: number;
  sound: (when: number) => void;
};

export function usePlayhead() {
  const [beatN, setBeatN] = useState<number | null>(null);
  const [cursorBeat, setCursorBeat] = useState<number | null>(null);
  const [mark, setMark] = useState<number | null>(null);
  const [lockKick, setLockKick] = useState(true);
  const timers = useRef<number[]>([]);
  const run = useRef<AudioRun | null>(null);

  useEffect(() => {
    return () => {
      timers.current.forEach((id) => window.clearTimeout(id));
      timers.current = [];
      run.current?.stop();
      run.current = null;
    };
  }, []);

  /** Stop the line: visual timers AND every note already scheduled on the audio clock. */
  const clear = () => {
    timers.current.forEach((id) => window.clearTimeout(id));
    timers.current = [];
    run.current?.stop();
    run.current = null;
    setBeatN(null);
    setCursorBeat(null);
    setMark(null);
  };

  const play = async (hits: LineHit[], bpm: number, extraKick: boolean, totalBeats?: number) => {
    clear();
    const ac = unlockAudio();
    if (!ac) return;
    // A suspended context freezes `currentTime`; the visual timers would then
    // run ahead of the sound. Give resume a moment before taking the origin.
    if (ac.state !== "running") {
      await Promise.race([
        ac.resume().catch(() => undefined),
        new Promise((r) => setTimeout(r, 300)),
      ]);
    }
    const beat = 60 / bpm;
    const origin = ac.currentTime;
    const last = hits[hits.length - 1]?.beat ?? 8;
    const end = totalBeats ?? Math.floor(last) + 1;
    run.current = scheduleRun(() => {
      hits.forEach((ev) => ev.sound(origin + ev.beat * beat));
      // The metronome is the clock, not an echo of the hits: every integer beat
      // clicks, even beats where the line rests.
      if (lockKick) {
        for (let b = 0; b < end; b++) {
          const when = origin + b * beat;
          click(b % 4 === 0, when);
          if (extraKick && b % 2 === 0) kick(when);
        }
      }
    });
    const at = (beatIndex: number, fn: () => void) => {
      const delay = Math.max(0, (origin + beatIndex * beat - ac.currentTime) * 1000);
      timers.current.push(window.setTimeout(fn, delay));
    };
    for (let b = 0; b < end; b++) at(b, () => setBeatN((b % 4) + 1));
    hits.forEach((ev) => {
      at(ev.beat, () => {
        setCursorBeat(ev.beat);
        setMark(ev.mark ?? null);
      });
    });
    timers.current.push(
      window.setTimeout(
        () => {
          setBeatN(null);
          setCursorBeat(null);
          setMark(null);
          run.current = null;
        },
        end * beat * 1000 + 200,
      ),
    );
  };

  return { beatN, cursorBeat, mark, setMark, lockKick, setLockKick, play, clear };
}
