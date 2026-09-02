import { useEffect, useRef, useState } from "react";
import { Play } from "lucide-react";
import { Button } from "@/components/ui/button";
import { click, kick, unlockAudio } from "@/lib/spark/audio";
import { cn } from "@/lib/utils";

export type BeatCell = {
  beat: number;
  top: string;
  bot: string;
};

export function TabRow<T extends string>({
  tabs,
  active,
  onPick,
  cols = 5,
}: {
  tabs: { id: T; label: string }[];
  active: T;
  onPick: (id: T) => void;
  cols?: 4 | 5;
}) {
  return (
    <div className={cn("grid gap-0.5", cols === 4 ? "grid-cols-4" : "grid-cols-5")}>
      {tabs.map((t) => (
        <button
          key={t.id}
          type="button"
          onClick={() => onPick(t.id)}
          className={cn(
            "h-11 rounded-md text-sm font-medium transition-colors duration-(--motion-quick)",
            active === t.id ? "bg-accent text-accent-fg" : "text-muted hover:text-fg",
          )}
        >
          {t.label}
        </button>
      ))}
    </div>
  );
}

export function Chip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "h-11 min-w-11 rounded-md px-3 text-sm font-medium transition-colors duration-(--motion-quick)",
        active ? "bg-accent text-accent-fg" : "border border-border bg-raised text-fg hover:border-ember/50",
      )}
    >
      {children}
    </button>
  );
}

export function BeatStrip({ cells, cursorBeat }: { cells: BeatCell[]; cursorBeat: number | null }) {
  return (
    <section className="mt-5" aria-label="Eight-beat line">
      <p className="mb-2 text-[11px] uppercase tracking-[0.18em] text-dim">Line</p>
      <ol className="grid grid-cols-8 gap-1">
        {cells.slice(0, 8).map((c, i) => {
          const on = cursorBeat != null && Math.floor(cursorBeat) === c.beat;
          return (
            <li
              key={`${c.beat}-${i}`}
              className={cn(
                "flex h-16 flex-col items-center justify-center rounded-md border",
                on ? "border-accent bg-accent text-accent-fg" : "border-border bg-raised text-muted",
              )}
            >
              <span className="font-display text-sm font-semibold leading-none">{c.top}</span>
              <span className="mt-1 text-[11px] tabular leading-none">{c.bot}</span>
            </li>
          );
        })}
      </ol>
    </section>
  );
}

export type LineHit = {
  beat: number;
  mark?: number;
  sound: (when: number) => void;
};

export function usePlayhead() {
  const [beatN, setBeatN] = useState<number | null>(null);
  const [cursorBeat, setCursorBeat] = useState<number | null>(null);
  const [mark, setMark] = useState<number | null>(null);
  const [lockKick, setLockKick] = useState(true);
  const timers = useRef<number[]>([]);

  useEffect(() => {
    return () => {
      timers.current.forEach((id) => window.clearTimeout(id));
      timers.current = [];
    };
  }, []);

  const clear = () => {
    timers.current.forEach((id) => window.clearTimeout(id));
    timers.current = [];
    setBeatN(null);
    setCursorBeat(null);
    setMark(null);
  };

  const play = (hits: LineHit[], bpm: number, extraKick: boolean) => {
    clear();
    const ac = unlockAudio();
    const beat = 60 / bpm;
    const origin = ac.currentTime;
    const kicked = new Set<number>();
    const clicked = new Set<number>();
    hits.forEach((ev) => {
      const when = origin + ev.beat * beat;
      ev.sound(when);
      const isInt = ev.beat === Math.floor(ev.beat);
      if (extraKick && lockKick && isInt && ev.beat % 2 === 0 && !kicked.has(ev.beat)) {
        kicked.add(ev.beat);
        kick(when);
      }
      if (lockKick && isInt && !clicked.has(ev.beat)) {
        clicked.add(ev.beat);
        click(ev.beat % 4 === 0, when);
      }
      const delay = Math.max(0, (when - ac.currentTime) * 1000);
      const id = window.setTimeout(() => {
        setCursorBeat(ev.beat);
        setBeatN((Math.floor(ev.beat) % 4) + 1);
        setMark(ev.mark ?? null);
      }, delay);
      timers.current.push(id);
    });
    const last = hits[hits.length - 1]?.beat ?? 8;
    timers.current.push(
      window.setTimeout(() => {
        setBeatN(null);
        setCursorBeat(null);
        setMark(null);
      }, (last + 1) * beat * 1000 + 200),
    );
  };

  return { beatN, cursorBeat, mark, setMark, lockKick, setLockKick, play, clear };
}

export function PlayBar({
  onPlay,
  lockKick,
  onToggleKick,
  kickLabel = "Kick",
  beatN,
}: {
  onPlay: () => void;
  lockKick: boolean;
  onToggleKick: () => void;
  kickLabel?: string;
  beatN: number | null;
}) {
  return (
    <div className="mt-5">
      {beatN ? <p className="mb-3 font-display text-sm tabular text-dim">beat {beatN}</p> : null}
      <div className="flex gap-2">
        <Button onClick={onPlay} className="flex-1">
          <Play className="size-4" />
          Play the line
        </Button>
        <Button
          variant="secondary"
          onClick={onToggleKick}
          className={cn("px-4", lockKick && "border-accent text-accent")}
          aria-pressed={lockKick}
        >
          {kickLabel}
        </Button>
      </div>
    </div>
  );
}

export function LabCopy({
  kicker,
  title,
  body,
  hear,
  children,
}: {
  kicker: string;
  title: string;
  body: string;
  hear: string;
  children?: React.ReactNode;
}) {
  return (
    <section className="mt-5 rounded-xl border border-border bg-surface p-5">
      <p className="text-[11px] uppercase tracking-[0.18em] text-dim">{kicker}</p>
      <h2 className="mt-1 font-display text-3xl font-semibold tracking-tight">{title}</h2>
      <p className="mt-3 text-pretty text-sm leading-relaxed text-muted">{body}</p>
      <p className="mt-2 text-sm text-fg">{hear}</p>
      {children}
    </section>
  );
}
