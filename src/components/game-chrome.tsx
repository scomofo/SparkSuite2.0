import { markById, type WeekPulse } from "@/lib/spark/game";
import { cn } from "@/lib/utils";

export function WeekPulseRow({ pulse, className }: { pulse: WeekPulse; className?: string }) {
  return (
    <div className={cn("flex items-center gap-3", className)}>
      <div className="flex gap-1" aria-label={`${pulse.count} of 7 days this week`}>
        {pulse.days.map((d) => (
          <span
            key={d.key}
            className={cn("size-2.5 rounded-full", d.on ? "bg-ember" : "border border-border")}
          />
        ))}
      </div>
      <p className="text-[11px] uppercase tracking-[0.16em] text-dim">
        {pulse.held ? "Week held" : `${pulse.count} / 3 this week`}
      </p>
    </div>
  );
}

export function XpBar({ into, need, label }: { into: number; need: number; label?: string }) {
  const pct = Math.max(0, Math.min(100, Math.round((into / need) * 100)));
  return (
    <div>
      {label ? (
        <div className="mb-1 flex justify-between text-[11px] uppercase tracking-[0.16em] text-dim">
          <span>{label}</span>
          <span className="tabular">
            {into} / {need}
          </span>
        </div>
      ) : null}
      <div className="h-1.5 overflow-hidden rounded-full bg-raised">
        <div className="h-full bg-accent" style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

export function MarkList({ ids }: { ids: string[] }) {
  if (!ids.length) return null;
  return (
    <ul className="space-y-3">
      {ids.map((id) => {
        const mark = markById(id);
        if (!mark) return null;
        return (
          <li key={id}>
            <p className="font-medium">{mark.title}</p>
            <p className="text-sm text-muted">{mark.body}</p>
          </li>
        );
      })}
    </ul>
  );
}
