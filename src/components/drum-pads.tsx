import { cn } from "@/lib/utils";

const PADS = [
  { i: 0, label: "Kick" },
  { i: 1, label: "Snare" },
  { i: 2, label: "Hat" },
  { i: 3, label: "Tom" },
] as const;

export function DrumPads({
  active,
  expected,
  onHit,
  disabled,
}: {
  active: number | null;
  expected?: number | null;
  onHit: (pad: number) => void;
  disabled?: boolean;
}) {
  return (
    <div className="grid grid-cols-2 gap-3" role="group" aria-label="Drum pads">
      {PADS.map((p) => (
        <button
          key={p.i}
          type="button"
          disabled={disabled}
          onPointerDown={(e) => {
            e.preventDefault();
            onHit(p.i);
          }}
          className={cn(
            "flex h-24 items-center justify-center rounded-lg border font-display text-lg font-semibold transition-colors duration-(--motion-quick)",
            active === p.i
              ? "border-accent bg-accent text-accent-fg"
              : expected === p.i
                ? "border-ember bg-raised text-ember"
                : "border-border bg-raised text-fg",
          )}
        >
          {p.label}
        </button>
      ))}
    </div>
  );
}
