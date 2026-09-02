import { CHECKINS, patternInWords, roleLabel, type DayCheckin } from "@/lib/spark/udl";
import { PROCESS_LABEL, rhythmRead } from "@/lib/spark/nafme";
import type { ItemRole, NafmeProcess } from "@/lib/spark/types";
import { cn } from "@/lib/utils";

export function RoleTag({ role, process }: { role?: ItemRole; process?: NafmeProcess }) {
  const label =
    process && process !== "perform" ? PROCESS_LABEL[process] : roleLabel(role);
  if (!label) return null;
  return (
    <span
      className={cn(
        "shrink-0 text-[11px] uppercase tracking-[0.18em]",
        role === "new" || process === "create" || process === "respond" ? "text-ember" : "text-dim",
      )}
    >
      {label}
    </span>
  );
}

export function PatternWords({ pattern, className }: { pattern: string; className?: string }) {
  return <p className={cn("text-center text-sm text-muted", className)}>{patternInWords(pattern)}</p>;
}

export function RhythmRead({ pattern }: { pattern: string }) {
  const cells = rhythmRead(pattern);
  return (
    <div className="w-full" aria-label="Rhythm notation">
      <p className="mb-1 text-center text-[11px] uppercase tracking-[0.18em] text-dim">Read</p>
      <ol className="grid grid-cols-4 gap-1 sm:grid-cols-8">
        {cells.slice(0, 8).map((c, i) => (
          <li
            key={`${c}-${i}`}
            className="flex h-11 items-center justify-center rounded-md border border-border bg-raised font-display text-lg text-fg"
          >
            {c}
          </li>
        ))}
      </ol>
    </div>
  );
}

export function HarmonyRead({ symbols }: { symbols?: string[] }) {
  if (!symbols?.length) return null;
  return (
    <p className="text-center font-display text-sm tabular text-muted">
      <span className="mr-2 text-[11px] uppercase tracking-[0.18em] text-dim">Harmony</span>{" "}
      {symbols.join(" → ")}
    </p>
  );
}

export function CriteriaList({ items }: { items: string[] }) {
  if (!items.length) return null;
  return (
    <ul className="w-full space-y-1 text-center">
      {items.map((line) => (
        <li key={line} className="text-pretty text-muted">
          {line}
        </li>
      ))}
    </ul>
  );
}

export function CheckinRow({
  value,
  onPick,
}: {
  value: DayCheckin | null;
  onPick: (id: DayCheckin) => void;
}) {
  const picked = CHECKINS.find((c) => c.id === value);
  return (
    <div>
      <p className="text-[11px] uppercase tracking-[0.18em] text-dim">How did today sit?</p>
      <div className="mt-3 grid grid-cols-3 gap-2">
        {CHECKINS.map((c) => {
          const on = value === c.id;
          return (
            <button
              key={c.id}
              type="button"
              aria-pressed={on}
              onClick={() => onPick(c.id)}
              className={cn(
                "min-h-11 rounded-md px-2 py-2 text-center text-sm font-medium transition-colors duration-(--motion-quick)",
                on ? "bg-accent text-accent-fg" : "border border-border bg-raised text-fg hover:border-ember/50",
              )}
            >
              {c.title}
            </button>
          );
        })}
      </div>
      <p className="mt-2 text-sm text-muted">{picked ? picked.body : "Optional. Skip it."}</p>
    </div>
  );
}
