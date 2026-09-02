import { STRING_NAMES } from "@/lib/spark/guitar";
import { cn } from "@/lib/utils";

export function StringRack({
  active,
  expected,
  onPluck,
  disabled,
  names = STRING_NAMES,
}: {
  active: number | null;
  expected?: number | null;
  onPluck: (stringIndex: number) => void;
  disabled?: boolean;
  names?: readonly string[];
}) {
  const last = names.length - 1;
  return (
    <div className="flex w-full max-w-sm flex-col gap-2" role="group" aria-label="Strings">
      {[...names].reverse().map((name, rev) => {
        const i = last - rev;
        const isOn = active === i;
        const isExpected = expected === i;
        return (
          <button
            key={`${name}-${i}`}
            type="button"
            disabled={disabled}
            onClick={() => onPluck(i)}
            className={cn(
              "flex h-12 items-center justify-between rounded-md border px-4 font-display text-lg tracking-wide transition-colors duration-(--motion-quick)",
              isOn
                ? "border-accent bg-accent text-accent-fg"
                : isExpected
                  ? "border-ember bg-raised text-ember"
                  : "border-border bg-raised text-fg hover:border-ember/60",
            )}
          >
            <span className="text-xs uppercase tracking-[0.18em] text-dim">{names.length - i}</span>
            <span>{name}</span>
            <span className="tabular text-xs text-muted">{i + 1}</span>
          </button>
        );
      })}
    </div>
  );
}
