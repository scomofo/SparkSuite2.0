import { useEffect, useRef, useState } from "react";
import { pluck, pianoTone, drumHit, unlockAudio } from "@/lib/spark/audio";
import { instrumentById } from "@/lib/spark/instruments";
import { analyserSizeFor, nearestString, startMicAnalyser, yinPitchFast } from "@/lib/spark/tuner";
import { Button } from "@/components/ui/button";
import { MicrophoneLevelMeter } from "@/components/microphone-level-meter";
import { rmsLevel } from "@/lib/spark/strum-detection";
import { DrumPads } from "@/components/drum-pads";
import { useSpark } from "@/store/spark";
import { cn } from "@/lib/utils";

function refsFor(id: ReturnType<typeof instrumentById>["id"]) {
  const inst = instrumentById(id);
  if (id === "piano" || id === "vocals") {
    return {
      names: ["C3", "C4", "C5"],
      freqs: [130.81, 261.63, 523.25],
    };
  }
  return { names: inst.stringNames, freqs: inst.openFreq };
}

export function TunerPanel() {
  const instrument = useSpark((s) => s.instrument);
  const inst = instrumentById(instrument);
  const refs = refsFor(instrument);
  // Bass low E is 41.2 Hz; a 2048-sample window cannot resolve it (floor ≈ 47 Hz
  // at 48 kHz). Size the window from the lowest reference; a very long window
  // decimates harder so the per-tick cost stays bounded.
  const lowestRef = Math.min(...refs.freqs);
  const fftSize = analyserSizeFor(lowestRef);
  const decimate = fftSize >= 8192 ? 4 : 2;
  const [cents, setCents] = useState(0);
  const [name, setName] = useState("-");
  const [freqHz, setFreqHz] = useState<number | null>(null);
  const [targetHz, setTargetHz] = useState<number | null>(null);
  const [live, setLive] = useState(false);
  const [micLevel, setMicLevel] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const stopRef = useRef<(() => void) | null>(null);
  const raf = useRef(0);

  useEffect(() => {
    const id = raf;
    return () => {
      stopRef.current?.();
      cancelAnimationFrame(id.current);
    };
  }, []);

  async function listen() {
    // Stop any previous mic before opening a new one — otherwise tracks leak.
    stopRef.current?.();
    unlockAudio();
    const mic = await startMicAnalyser(fftSize);
    if (!mic) {
      setError("Microphone blocked. Use the reference pitches below.");
      return;
    }
    setError(null);
    setLive(true);
    stopRef.current = () => {
      cancelAnimationFrame(raf.current);
      mic.stop();
      setLive(false);
      setMicLevel(0);
    };
    const buf = new Float32Array(mic.analyser.fftSize);
    let last = 0;
    const loop = (ts: number) => {
      if (ts - last >= 80) {
        last = ts;
        mic.analyser.getFloatTimeDomainData(buf);
        setMicLevel(rmsLevel(buf));
        const hz = yinPitchFast(buf, mic.ctx.sampleRate, 0.12, decimate);
        if (hz > lowestRef * 0.7 && hz < 1200) {
          const n = nearestString(hz, refs.freqs, refs.names);
          if (n.index >= 0 && Number.isFinite(n.cents)) {
            setName(n.name);
            setCents(Math.max(-50, Math.min(50, n.cents)));
            setFreqHz(hz);
            setTargetHz(refs.freqs[n.index] ?? null);
          }
        }
      }
      raf.current = requestAnimationFrame(loop);
    };
    raf.current = requestAnimationFrame(loop);
  }

  const inTune = Math.abs(cents) < 8;
  const cols = Math.min(6, Math.max(2, refs.names.length));

  if (inst.surface === "pads") {
    return (
      <div className="flex flex-col items-center gap-6">
        <p className="text-center text-sm text-muted">Tap a pad for a reference hit. No mic needed.</p>
        <DrumPads active={null} onHit={(i) => drumHit(i)} />
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-6">
      <div className="relative h-36 w-full max-w-sm rounded-xl border border-border bg-surface p-4 shadow-sm">
        <div className="absolute inset-x-6 top-1/2 h-px bg-border" />
        <div className="absolute left-1/2 top-6 h-16 w-0.5 bg-accent/60" />
        <div
          className={cn(
            "absolute top-8 size-5 -translate-x-1/2 rounded-full transition-all duration-100 shadow-md",
            inTune && live ? "bg-good ring-4 ring-good/20 scale-110" : "bg-accent",
          )}
          style={{ left: `${50 + cents * 0.8}%` }}
        />
        <div className="absolute inset-x-0 bottom-3 text-center">
          <p className="font-display text-4xl font-semibold tracking-tight">{name}</p>
          {inTune && live && name !== "-" ? (
            <span className="mt-1 inline-block rounded-full bg-good/15 px-2 py-0.5 text-xs font-medium text-good">
              In Tune
            </span>
          ) : null}
        </div>
      </div>
      <div className="flex items-center gap-4 text-sm text-muted tabular">
        <p>{cents > 0 ? `+${cents.toFixed(0)}` : cents.toFixed(0)} cents</p>
        {freqHz != null ? (
          <>
            <span className="text-border">·</span>
            <p>{freqHz.toFixed(1)} Hz</p>
          </>
        ) : null}
        {targetHz != null ? (
          <>
            <span className="text-border">·</span>
            <p className="text-dim">target {targetHz.toFixed(1)} Hz</p>
          </>
        ) : null}
      </div>
      {error ? <p className="text-center text-sm text-warn">{error}</p> : null}
      <Button variant={live ? "secondary" : "primary"} onClick={() => (live ? stopRef.current?.() : void listen())}>
        {live ? "Stop mic" : "Listen with mic"}
      </Button>
      {live ? <MicrophoneLevelMeter level={micLevel} /> : null}
      <div
        className="grid w-full gap-2"
        style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` }}
        role="group"
        aria-label="Reference pitches"
      >
        {refs.names.map((n, i) => {
          const isSelected = name === n;
          return (
            <button
              key={`${n}-${i}`}
              type="button"
              aria-pressed={isSelected}
              aria-label={`Play reference pitch ${n}`}
              onClick={() => {
                unlockAudio();
                const f = refs.freqs[i] ?? 261.63;
                if (instrument === "piano" || instrument === "vocals") pianoTone(f, undefined, 0.4);
                else pluck(f, undefined, 0.55);
                setName(n);
                setCents(0);
                setFreqHz(f);
                setTargetHz(f);
              }}
              className={cn(
                "flex h-12 flex-col items-center justify-center rounded-lg border text-sm font-medium transition-colors",
                isSelected
                  ? "border-ember bg-raised text-ember shadow-xs"
                  : "border-border bg-surface text-fg hover:border-ember/50 hover:bg-raised",
              )}
            >
              <span>{n}</span>
              <span className="text-[10px] text-dim">{refs.freqs[i]?.toFixed(1)} Hz</span>
            </button>
          );
        })}
      </div>
      <p className="text-center text-xs text-dim">
        {instrument === "vocals"
          ? "Hum the reference, then listen. Mic is optional."
          : "Reference pitches play even without the instrument. Mic is optional."}
      </p>
    </div>
  );
}

/** Compact live cents vs a target pitch — used in the vocal session. */
export function PitchMatch({ targetFreq, targetName }: { targetFreq: number; targetName: string }) {
  const [cents, setCents] = useState<number | null>(null);
  const [live, setLive] = useState(false);
  const [micLevel, setMicLevel] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const stopRef = useRef<(() => void) | null>(null);
  const raf = useRef(0);

  useEffect(() => {
    const id = raf;
    return () => {
      stopRef.current?.();
      cancelAnimationFrame(id.current);
    };
  }, []);

  async function listen() {
    stopRef.current?.();
    setError(null);
    setMicLevel(0);
    unlockAudio();
    const mic = await startMicAnalyser();
    if (!mic) {
      setError("Microphone blocked or unavailable. Check browser permission and input selection.");
      return;
    }
    setLive(true);
    stopRef.current = () => {
      cancelAnimationFrame(raf.current);
      mic.stop();
      setLive(false);
      setCents(null);
      setMicLevel(0);
    };
    const buf = new Float32Array(mic.analyser.fftSize);
    let last = 0;
    const loop = (ts: number) => {
      if (ts - last >= 80) {
        last = ts;
        mic.analyser.getFloatTimeDomainData(buf);
        setMicLevel(rmsLevel(buf));
        const hz = yinPitchFast(buf, mic.ctx.sampleRate);
        if (hz > 80 && hz < 900 && Number.isFinite(targetFreq) && targetFreq > 0) {
          setCents(Math.max(-50, Math.min(50, 1200 * Math.log2(hz / targetFreq))));
        }
      }
      raf.current = requestAnimationFrame(loop);
    };
    raf.current = requestAnimationFrame(loop);
  }

  const inTune = cents != null && Math.abs(cents) < 20;

  return (
    <div className="flex flex-col items-center gap-2">
      <p className="text-[11px] uppercase tracking-[0.18em] text-dim">
        Target {targetName} · {inTune ? "in tune" : live ? "listen" : "mic off"}
      </p>
      <div className="relative h-10 w-full max-w-xs">
        <div className="absolute inset-x-4 top-1/2 h-px bg-border" />
        <div className="absolute left-1/2 top-1 h-8 w-px bg-accent" />
        {cents != null ? (
          <div
            className={cn("absolute top-2 size-3 -translate-x-1/2 rounded-full", inTune ? "bg-good" : "bg-ember")}
            style={{ left: `${50 + cents * 0.8}%` }}
          />
        ) : null}
      </div>
      {error ? <p className="text-center text-xs text-warn">{error}</p> : null}
      <Button
        size="sm"
        variant={live ? "secondary" : "ghost"}
        onClick={() => (live ? stopRef.current?.() : void listen())}
      >
        {live ? "Stop mic" : "Match with mic"}
      </Button>
      {live ? <MicrophoneLevelMeter level={micLevel} /> : null}
      <button
        type="button"
        onClick={() => pianoTone(targetFreq, undefined, 0.35)}
        className="text-xs text-muted underline-offset-2 hover:text-fg hover:underline"
      >
        Hear the drone
      </button>
    </div>
  );
}
