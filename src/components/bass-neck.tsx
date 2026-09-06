import { BASS_STRINGS, bassNoteName, type BassPos, type BassRole } from "@/lib/spark/bass";
import { cn } from "@/lib/utils";

const FRETS = 7;

const ROLE_CLASS: Record<BassRole, string> = {
  R: "bg-accent text-accent-fg",
  "5": "bg-ember text-accent-fg",
  "8": "bg-good text-bg",
  ap: "bg-raised text-fg ring-1 ring-ember/70",
  gh: "bg-border text-muted",
  hm: "bg-warn text-bg",
};

export function BassNeck({
  marks,
  active,
  onPlay,
  disabled,
}: {
  marks: BassPos[];
  active?: BassPos | null;
  onPlay: (pos: BassPos) => void;
  disabled?: boolean;
}) {
  const key = (s: number, f: number) => `${s}-${f}`;
  const byKey = new Map(marks.map((m) => [key(m.string, m.fret), m]));
  const activeKey = active ? key(active.string, active.fret) : null;

  return (
    <div className="overflow-x-auto" role="grid" aria-label="Bass neck, five frets">
      <div className="min-w-[18rem]">
        <div
          className="grid gap-px"
          style={{ gridTemplateColumns: `1.6rem repeat(${FRETS + 1}, minmax(0, 1fr))` }}
        >
          <div />
          {Array.from({ length: FRETS + 1 }, (_, f) => (
            <div key={`n${f}`} className="pb-1 text-center text-[10px] tabular text-dim">
              {f === 0 ? "open" : f}
            </div>
          ))}
          {[...BASS_STRINGS].map((_, rev) => {
            const s = BASS_STRINGS.length - 1 - rev;
            return (
              <Row
                key={BASS_STRINGS[s]}
                stringIndex={s}
                byKey={byKey}
                activeKey={activeKey}
                onPlay={onPlay}
                disabled={disabled}
              />
            );
          })}
        </div>
        <div
          className="mt-1 grid gap-px"
          style={{ gridTemplateColumns: `1.6rem repeat(${FRETS + 1}, minmax(0, 1fr))` }}
        >
          <div />
          {Array.from({ length: FRETS + 1 }, (_, f) => (
            <div key={`d${f}`} className="flex h-3 items-center justify-center">
              {f === 3 || f === 5 || f === 7 ? <span className="size-1 rounded-full bg-dim/70" /> : null}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function Row({
  stringIndex,
  byKey,
  activeKey,
  onPlay,
  disabled,
}: {
  stringIndex: number;
  byKey: Map<string, BassPos>;
  activeKey: string | null;
  onPlay: (pos: BassPos) => void;
  disabled?: boolean;
}) {
  return (
    <>
      <div className="flex h-11 items-center justify-center text-[10px] font-medium text-muted">
        {BASS_STRINGS[stringIndex]}
      </div>
      {Array.from({ length: FRETS + 1 }, (_, fret) => {
        const mark = byKey.get(`${stringIndex}-${fret}`);
        const on = activeKey === `${stringIndex}-${fret}`;
        return (
          <button
            key={fret}
            type="button"
            disabled={disabled}
            onPointerDown={(e) => {
              e.preventDefault();
              onPlay(mark ?? { string: stringIndex, fret, name: bassNoteName(stringIndex, fret), role: "R" });
            }}
            onClick={(e) => {
              if (e.detail === 0) onPlay(mark ?? { string: stringIndex, fret, name: bassNoteName(stringIndex, fret), role: "R" });
            }}
            className={cn(
              "relative flex h-11 items-center justify-center rounded-[3px] border border-border/80",
              fret === 0 ? "bg-surface" : "bg-raised/60",
              on && "ring-1 ring-fg",
            )}
            aria-label={`${BASS_STRINGS[stringIndex]} string fret ${fret}${mark ? ` ${mark.name}` : ""}`}
          >
            {mark ? (
              <span
                className={cn(
                  "flex size-7 items-center justify-center rounded-full text-[10px] font-semibold leading-none",
                  ROLE_CLASS[mark.role],
                )}
              >
                {mark.role === "gh" ? "x" : mark.role === "hm" ? "h" : mark.name}
              </span>
            ) : null}
          </button>
        );
      })}
    </>
  );
}

export function RoleLegend({ className, roles }: { className?: string; roles?: BassRole[] }) {
  const items: { role: BassRole; label: string }[] = [
    { role: "R", label: "Root" },
    { role: "5", label: "5th" },
    { role: "8", label: "Octave" },
    { role: "ap", label: "Approach" },
    { role: "hm", label: "Hammer" },
    { role: "gh", label: "Ghost" },
  ];
  const shown = roles ? items.filter((it) => roles.includes(it.role)) : items.slice(0, 4);
  return (
    <ul className={cn("flex flex-wrap gap-3 text-[11px] text-muted", className)}>
      {shown.map((it) => (
        <li key={it.role} className="flex items-center gap-1.5">
          <span className={cn("size-2.5 rounded-full", ROLE_CLASS[it.role])} />
          {it.label}
        </li>
      ))}
    </ul>
  );
}
