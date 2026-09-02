import { CHORDS } from "@/lib/spark/guitar";
import type { ChordShape } from "@/lib/spark/types";
import { cn } from "@/lib/utils";

export function ChordDiagram({
  chordId,
  shape,
  className,
  compact = false,
  selected = false,
  onSelect,
}: {
  chordId?: string;
  shape?: ChordShape;
  className?: string;
  compact?: boolean;
  selected?: boolean;
  onSelect?: () => void;
}) {
  const chord = shape ?? (chordId ? CHORDS[chordId] : undefined);
  if (!chord) return null;
  const frets = chord.frets;
  const fingered = frets.filter((f): f is number => f != null && f > 0);
  const minFinger = fingered.length ? Math.min(...fingered) : 1;
  const maxFinger = fingered.length ? Math.max(...fingered) : 4;
  const hasOpen = frets.some((f) => f === 0);
  const start = hasOpen || minFinger <= 1 ? 1 : minFinger;
  const nut = start === 1;
  const shown = Math.max(4, maxFinger - start + 1);
  const w = compact ? 112 : 156;
  const h = compact ? 148 : 208;
  const padX = compact ? 18 : 24;
  const padY = compact ? 28 : 36;
  const n = Math.max(2, frets.length);
  const innerW = w - padX * 2;
  const innerH = h - padY - 18;
  const stringX = (i: number) => padX + (n === 1 ? innerW / 2 : (innerW * i) / (n - 1));
  const fretY = (f: number) => padY + (innerH * f) / shown;

  const barreFret = (() => {
    const counts = new Map<number, number[]>();
    frets.forEach((f, i) => {
      if (f == null || f < start) return;
      const arr = counts.get(f) ?? [];
      arr.push(i);
      counts.set(f, arr);
    });
    for (const [f, idxs] of counts) {
      if (idxs.length >= 3 && f === start) return { fret: f, from: idxs[0], to: idxs[idxs.length - 1] };
    }
    return null;
  })();

  const body = (
    <div className={cn("flex flex-col items-center gap-1.5", className)}>
      <svg viewBox={`0 0 ${w} ${h}`} width={w} height={h} aria-hidden={Boolean(onSelect)} aria-label={onSelect ? undefined : `${chord.name} chord`} className="text-fg">
        {frets.map((fret, i) => {
          const x = stringX(i);
          if (fret === null) {
            return (
              <text key={`x${i}`} x={x} y={padY - 12} textAnchor="middle" fill="currentColor" opacity={0.5} fontSize={compact ? 11 : 13}>
                ×
              </text>
            );
          }
          if (fret === 0) {
            return (
              <circle key={`o${i}`} cx={x} cy={padY - 12} r={compact ? 4 : 5} fill="none" stroke="currentColor" strokeWidth={1.5} />
            );
          }
          return null;
        })}
        {!nut ? (
          <text x={4} y={padY + innerH / shown / 2 + 4} fill="currentColor" opacity={0.55} fontSize={10} fontFamily="var(--font-sans)">
            {start}fr
          </text>
        ) : null}
        {Array.from({ length: shown + 1 }, (_, f) => (
          <line
            key={`f${f}`}
            x1={padX}
            x2={padX + innerW}
            y1={fretY(f)}
            y2={fretY(f)}
            stroke="currentColor"
            strokeWidth={f === 0 && nut ? 4 : 1}
            opacity={f === 0 && nut ? 0.9 : 0.35}
          />
        ))}
        {frets.map((_, i) => (
          <line
            key={`s${i}`}
            x1={stringX(i)}
            x2={stringX(i)}
            y1={padY}
            y2={padY + innerH}
            stroke="currentColor"
            strokeWidth={1.2 + i * 0.15}
            opacity={0.55}
          />
        ))}
        {barreFret ? (
          <rect
            x={stringX(barreFret.from) - (compact ? 8 : 11)}
            y={(fretY(barreFret.fret - start) + fretY(barreFret.fret - start + 1)) / 2 - (compact ? 8 : 11)}
            width={stringX(barreFret.to) - stringX(barreFret.from) + (compact ? 16 : 22)}
            height={compact ? 16 : 22}
            rx={compact ? 8 : 11}
            fill="var(--color-accent)"
            opacity={0.95}
          />
        ) : null}
        {frets.map((fret, i) => {
          if (fret === null || fret === 0) return null;
          const slot = fret - start;
          if (slot < 0 || slot >= shown) return null;
          const finger = chord.fingers[i];
          const inBarre = barreFret && fret === barreFret.fret && i >= barreFret.from && i <= barreFret.to;
          const cy = (fretY(slot) + fretY(slot + 1)) / 2;
          return (
            <g key={`d${i}`}>
              {!inBarre ? <circle cx={stringX(i)} cy={cy} r={compact ? 8 : 11} fill="var(--color-accent)" /> : null}
              {finger ? (
                <text
                  x={stringX(i)}
                  y={cy + 4}
                  textAnchor="middle"
                  fill="var(--color-accent-fg)"
                  fontSize={compact ? 9 : 11}
                  fontWeight={600}
                >
                  {finger}
                </text>
              ) : null}
            </g>
          );
        })}
      </svg>
      <p className="max-w-[11rem] text-center font-display text-sm font-semibold leading-tight tracking-tight">{chord.name}</p>
    </div>
  );

  if (!onSelect) return body;
  return (
    <button
      type="button"
      onClick={onSelect}
      aria-label={chord.name}
      aria-pressed={selected}
      className={cn(
        "rounded-lg border px-1.5 pb-2 pt-1 text-left transition-colors duration-(--motion-quick)",
        selected ? "border-accent bg-raised" : "border-border bg-surface hover:border-ember/50",
      )}
    >
      {body}
    </button>
  );
}
