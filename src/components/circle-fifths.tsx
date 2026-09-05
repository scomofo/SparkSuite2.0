import { FIFTHS, flatsForKey, noteName, PICKER_ROOTS, pcOf, type Mode } from "@/lib/spark/theory";
import { cn } from "@/lib/utils";

const r = (n: number) => Math.round(n * 10) / 10;

/** Spell a wedge the way the key page will spell it once picked. */
function wedgeName(pc: number, mode: Mode) {
  const picker = PICKER_ROOTS.find((n) => pcOf(n) === pc) ?? "C";
  return noteName(pc, flatsForKey(picker, mode));
}

export function CircleFifths({
  tonicPc,
  mode,
  onPick,
}: {
  tonicPc: number;
  mode: Mode;
  onPick: (pc: number, nextMode: Mode) => void;
}) {
  const size = 260;
  const cx = size / 2;
  const cy = size / 2;
  const outerR = 110;
  const innerR = 68;
  const holeR = 34;

  return (
    <svg
      viewBox={`0 0 ${size} ${size}`}
      width={size}
      height={size}
      className="mx-auto block text-fg"
      role="img"
      aria-label="Circle of fifths"
    >
      {FIFTHS.map((pc, i) => {
        const a0 = (i / 12) * Math.PI * 2 - Math.PI / 2 - Math.PI / 12;
        const a1 = ((i + 1) / 12) * Math.PI * 2 - Math.PI / 2 - Math.PI / 12;
        const mid = (a0 + a1) / 2;
        const active = pc === tonicPc;
        const rel = (pc + 9) % 12;
        const relActive = mode === "minor" && rel === tonicPc;
        const outerLabel = wedgeName(pc, "major");
        const innerLabel = `${wedgeName(rel, "minor")}m`;
        return (
          <g key={pc}>
            <path
              d={annulus(cx, cy, innerR, outerR, a0, a1)}
              fill={active && mode === "major" ? "var(--color-accent)" : "var(--color-raised)"}
              stroke="var(--color-border)"
              strokeWidth={1}
              className="cursor-pointer"
              onClick={() => onPick(pc, "major")}
              aria-label={`${outerLabel} major`}
            />
            <path
              d={annulus(cx, cy, holeR, innerR, a0, a1)}
              fill={relActive ? "var(--color-accent)" : "var(--color-surface)"}
              stroke="var(--color-border)"
              strokeWidth={1}
              className="cursor-pointer"
              onClick={() => onPick(rel, "minor")}
              aria-label={`${innerLabel} minor`}
            />
            <text
              x={r(cx + Math.cos(mid) * ((outerR + innerR) / 2))}
              y={r(cy + Math.sin(mid) * ((outerR + innerR) / 2))}
              textAnchor="middle"
              dominantBaseline="middle"
              fill={active && mode === "major" ? "var(--color-accent-fg)" : "var(--color-fg)"}
              fontSize={13}
              fontWeight={600}
              fontFamily="var(--font-display)"
              className="pointer-events-none"
            >
              {outerLabel}
            </text>
            <text
              x={r(cx + Math.cos(mid) * ((innerR + holeR) / 2))}
              y={r(cy + Math.sin(mid) * ((innerR + holeR) / 2))}
              textAnchor="middle"
              dominantBaseline="middle"
              fill={relActive ? "var(--color-accent-fg)" : "var(--color-muted)"}
              fontSize={10}
              fontFamily="var(--font-sans)"
              className="pointer-events-none"
            >
              {innerLabel}
            </text>
          </g>
        );
      })}
      <circle cx={cx} cy={cy} r={holeR - 1} fill="var(--color-bg)" />
      <text
        x={cx}
        y={cy - 6}
        textAnchor="middle"
        fill="var(--color-fg)"
        fontSize={16}
        fontWeight={600}
        fontFamily="var(--font-display)"
      >
        {wedgeName(tonicPc, mode)}
      </text>
      <text x={cx} y={cy + 12} textAnchor="middle" fill="var(--color-muted)" fontSize={10} fontFamily="var(--font-sans)">
        {mode}
      </text>
    </svg>
  );
}

function annulus(cx: number, cy: number, r0: number, r1: number, a0: number, a1: number) {
  const p = (rad: number, a: number) => [r(cx + Math.cos(a) * rad), r(cy + Math.sin(a) * rad)] as const;
  const large = a1 - a0 > Math.PI ? 1 : 0;
  const [x0, y0] = p(r1, a0);
  const [x1, y1] = p(r1, a1);
  const [x2, y2] = p(r0, a1);
  const [x3, y3] = p(r0, a0);
  return `M ${x0} ${y0} A ${r1} ${r1} 0 ${large} 1 ${x1} ${y1} L ${x2} ${y2} A ${r0} ${r0} 0 ${large} 0 ${x3} ${y3} Z`;
}

export function Legend({ className }: { className?: string }) {
  const items = [
    { cls: "bg-accent", label: "Root" },
    { cls: "bg-ember", label: "3rd" },
    { cls: "bg-good", label: "5th" },
    { cls: "bg-fg", label: "7th" },
  ];
  return (
    <ul className={cn("flex flex-wrap gap-3 text-[11px] text-muted", className)}>
      {items.map((it) => (
        <li key={it.label} className="flex items-center gap-1.5">
          <span className={cn("size-2.5 rounded-full", it.cls)} />
          {it.label}
        </li>
      ))}
    </ul>
  );
}
