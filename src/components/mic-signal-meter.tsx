import type { AcousticInputMode } from "@/lib/spark/acoustic-input";

function micSignalThreshold(mode: AcousticInputMode | undefined) {
  if (mode === "strum") return 0.008;
  if (mode === "percussion") return 0.006;
  return 0.003;
}

/**
 * Shows whether live audio is reaching the analyser, separately from scoring.
 * Shared by the session player and the tuner panel. The bar reads in dBFS:
 * −60 dBFS is the floor and −12 dBFS is full scale.
 */
export function MicSignalMeter({ level, mode }: { level: number; mode?: AcousticInputMode }) {
  const decibels = 20 * Math.log10(Math.max(level, 0.00001));
  const percent = Math.max(0, Math.min(100, Math.round(((decibels + 60) / 48) * 100)));
  const threshold = micSignalThreshold(mode);
  const message =
    level < 0.0015
      ? "The input is quiet right now. Play a note, chord, or drum hit to test the microphone."
      : level < threshold
        ? "Audio is reaching the app at a low level. If notes are missed, move the mic closer or raise the input level."
        : "Audio is reaching the app. Play in time with the cue; this meter confirms signal, not note accuracy.";

  return (
    <div className="mt-3 space-y-2">
      <div className="flex items-center justify-between gap-3 text-xs text-muted">
        <span>Live microphone level</span>
        <span className="tabular">{percent}%</span>
      </div>
      <div
        role="meter"
        aria-label="Microphone input level"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={percent}
        aria-valuetext={`${Math.round(decibels)} dB input level`}
        className="h-2 overflow-hidden rounded-full bg-raised"
      >
        <div
          className="h-full rounded-full bg-good transition-[width] duration-75"
          style={{ width: `${percent}%` }}
        />
      </div>
      <p role="status" aria-live="polite" className="text-xs leading-relaxed text-muted">
        {message}
      </p>
    </div>
  );
}
