export function MicrophoneLevelMeter({ level }: { level: number }) {
  const decibels = 20 * Math.log10(Math.max(level, 0.00001));
  const percent = Math.max(0, Math.min(100, ((decibels + 60) / 48) * 100));
  const hasSignal = level >= 0.002;

  return (
    <div className="mt-3 rounded-md bg-raised p-3">
      <div className="mb-2 flex items-center justify-between gap-3 text-xs">
        <span className="font-medium text-muted">Live microphone level</span>
        <span className={hasSignal ? "text-good" : "text-dim"}>
          {hasSignal ? "Audio reaching app" : "Very quiet — play a note"}
        </span>
      </div>
      <div
        role="meter"
        aria-label="Live microphone input level"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={Math.round(percent)}
        className="h-2 overflow-hidden rounded-full bg-border"
      >
        <div
          className={hasSignal ? "h-full rounded-full bg-good transition-[width] duration-100" : "h-full rounded-full bg-muted transition-[width] duration-100"}
          style={{ width: `${percent}%` }}
        />
      </div>
      <p className="mt-2 text-xs leading-relaxed text-dim">
        Play a few notes now. The meter confirms sound is reaching SparkSuite; it does not by itself mean a note has been recognized.
      </p>
    </div>
  );
}
