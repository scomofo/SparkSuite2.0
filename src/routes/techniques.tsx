import { useEffect, useMemo, useRef, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Play, Repeat } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { BassNeck, RoleLegend } from "@/components/bass-neck";
import { DrumsLab } from "@/components/labs/drums-lab";
import { GuitarLab } from "@/components/labs/guitar-lab";
import { PianoLab } from "@/components/labs/piano-lab";
import { UkeLab } from "@/components/labs/uke-lab";
import { VoiceLab } from "@/components/labs/voice-lab";
import { Chip, TabRow } from "@/components/labs/shared";
import { Button } from "@/components/ui/button";
import { LessonPractice } from "@/components/lesson-practice";
import { bassLegato, bassTone, click, ghostNote, kick, scheduleRun, unlockAudio, type AudioRun } from "@/lib/spark/audio";
import {
  BASS_CHORDS,
  BASS_ROOTS,
  FINGER_LABEL,
  HAND_TABS,
  LINE_TABS,
  TECH_COPY,
  bassFreq,
  fifthOf,
  hammerOf,
  lineFor,
  octaveOf,
  parseBassChord,
  parseTechTab,
  posOf,
  type BassChord,
  type BassPos,
  type Finger,
  type LineEvent,
  type TechTab,
} from "@/lib/spark/bass";
import type { LabSearch } from "@/lib/spark/labs";
import { useSpark } from "@/store/spark";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/techniques")({
  validateSearch: (raw: Record<string, unknown>): LabSearch => ({
    tab: typeof raw.tab === "string" ? raw.tab : "",
    chord: typeof raw.chord === "string" ? raw.chord : "",
    ...(typeof raw.lesson === "string" ? { lesson: raw.lesson.slice(0, 100) } : {}),
  }),
  component: TechniquesPage,
});

function TechniquesPage() {
  const instrument = useSpark((s) => s.instrument);
  const search = Route.useSearch();
  if (search.lesson !== undefined) return <LessonPractice key={search.lesson} id={search.lesson} />;
  if (instrument === "drums") return <DrumsLab />;
  if (instrument === "piano") return <PianoLab />;
  if (instrument === "ukulele") return <UkeLab />;
  if (instrument === "vocals") return <VoiceLab />;
  if (instrument === "guitar") return <GuitarLab />;
  return <BassLab />;
}

type Search = { tab: TechTab; chord: BassChord };

function BassLab() {
  const search = Route.useSearch();
  const navigate = Route.useNavigate();
  const tab = parseTechTab(search.tab);
  const chord = parseBassChord(search.chord);

  const patch = (next: Partial<Search>) => {
    void navigate({
      search: { tab: next.tab ?? tab, chord: next.chord ?? chord },
      replace: true,
    });
  };

  return (
    <AppShell>
      <header className="px-5 pb-2 pt-8">
        <p className="text-[11px] uppercase tracking-[0.22em] text-dim">Bass lab · EADG</p>
        <h1 className="mt-2 font-display text-4xl font-semibold tracking-tight">Fingerstyle</h1>
        <p className="mt-3 max-w-sm text-pretty text-muted">
          The right hand is the groove. The left hand only names the note.
        </p>
      </header>

      <div className="sticky top-0 z-10 mx-4 mt-4 space-y-2 rounded-lg border border-border bg-surface/95 p-2 backdrop-blur-sm">
        <div>
          <p className="px-1 pb-1 text-[11px] uppercase tracking-[0.16em] text-dim">Right hand</p>
          <TabRow tabs={HAND_TABS} active={tab} onPick={(id) => patch({ tab: id })} />
        </div>
        <div>
          <p className="px-1 pb-1 text-[11px] uppercase tracking-[0.16em] text-dim">The line</p>
          <TabRow tabs={LINE_TABS} active={tab} onPick={(id) => patch({ tab: id })} />
        </div>
      </div>

      <Lab search={{ tab, chord }} patch={patch} />
    </AppShell>
  );
}

function Lab({ search, patch }: { search: Search; patch: (n: Partial<Search>) => void }) {
  const copy = TECH_COPY[search.tab];
  const root = BASS_ROOTS[search.chord];
  const line = useMemo(() => lineFor(search.tab, search.chord), [search.tab, search.chord]);
  const marks = useMemo(() => uniqueMarks(line.flatMap((e) => (e.together ? [e.pos, e.together] : [e.pos]))), [line]);
  const [active, setActive] = useState<BassPos | null>(null);
  const [beatN, setBeatN] = useState<number | null>(null);
  const [cursorBeat, setCursorBeat] = useState<number | null>(null);
  const [finger, setFinger] = useState<Finger | null>(null);
  const [lockKick, setLockKick] = useState(true);
  const timers = useRef<number[]>([]);
  const run = useRef<AudioRun | null>(null);

  /** Stop the line: visual timers AND every note already scheduled on the audio clock. */
  const stopLine = () => {
    timers.current.forEach((id) => window.clearTimeout(id));
    timers.current = [];
    run.current?.stop();
    run.current = null;
    setActive(null);
    setBeatN(null);
    setCursorBeat(null);
    setFinger(null);
  };

  useEffect(() => stopLine, []);

  // A new tab or chord means a new line; the old one must not keep driving the neck.
  useEffect(stopLine, [search.tab, search.chord]);

  const playPos = (pos: BassPos, ghost = pos.role === "gh") => {
    unlockAudio();
    if (ghost) ghostNote();
    else if (pos.role === "hm") bassLegato(bassFreq(pos.string, pos.fret));
    else bassTone(bassFreq(pos.string, pos.fret));
    setActive(pos);
  };

  const playLine = async () => {
    stopLine();
    const ac = unlockAudio();
    if (!ac) return;
    if (ac.state !== "running") {
      await Promise.race([ac.resume().catch(() => undefined), new Promise((r) => setTimeout(r, 300))]);
    }
    const beat = 60 / 88;
    const origin = ac.currentTime;
    const lastBeat = line[line.length - 1]?.beat ?? 8;
    run.current = scheduleRun(() => {
      line.forEach((ev) => soundEvent(ev, origin + ev.beat * beat));
      if (lockKick) {
        for (let b = 0; b <= Math.floor(lastBeat); b++) {
          const when = origin + b * beat;
          click(b % 4 === 0, when);
          if (b % 2 === 0) kick(when);
        }
      }
    });
    const at = (beatIndex: number, fn: () => void) => {
      const delay = Math.max(0, (origin + beatIndex * beat - ac.currentTime) * 1000);
      timers.current.push(window.setTimeout(fn, delay));
    };
    for (let b = 0; b <= Math.floor(lastBeat); b++) at(b, () => setBeatN((b % 4) + 1));
    line.forEach((ev) => {
      at(ev.beat, () => {
        setActive(ev.pos);
        setCursorBeat(ev.beat);
        setFinger(ev.finger ?? null);
      });
    });
    timers.current.push(
      window.setTimeout(
        () => {
          setActive(null);
          setBeatN(null);
          setCursorBeat(null);
          setFinger(null);
          run.current = null;
        },
        (lastBeat + 1) * beat * 1000 + 200,
      ),
    );
  };

  const extraMarks = marksFor(search.tab, root, marks);
  const legendRoles = Array.from(new Set(extraMarks.map((m) => m.role)));

  return (
    <div className="px-5 pb-8 pt-5">
      {search.tab !== "alt" && search.tab !== "ghost" ? (
        <>
          <p className="text-[11px] uppercase tracking-[0.18em] text-dim">Chord</p>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {BASS_CHORDS.map((c) => (
              <Chip key={c} active={search.chord === c} onClick={() => patch({ chord: c })}>
                {c}
              </Chip>
            ))}
          </div>
        </>
      ) : null}

      <section className="mt-5 rounded-xl border border-border bg-surface p-5">
        <p className="text-[11px] uppercase tracking-[0.18em] text-dim">{copy.kicker}</p>
        <h2 className="mt-1 font-display text-3xl font-semibold tracking-tight">{copy.title}</h2>
        <p className="mt-3 text-pretty text-sm leading-relaxed text-muted">{copy.body}</p>
        <p className="mt-2 text-sm text-fg">{copy.hear}</p>
        <div className="mt-5 flex items-center gap-3">
          <RightHandPads finger={finger} />
          {beatN ? <p className="font-display text-sm tabular text-dim">beat {beatN}</p> : null}
        </div>
        <div className="mt-5 flex gap-2">
          <Button onClick={() => void playLine()} className="flex-1">
            <Play className="size-4" />
            Play the line
          </Button>
          <Button
            variant="secondary"
            onClick={() => setLockKick((v) => !v)}
            className={cn("px-4", lockKick && "border-accent text-accent")}
            aria-pressed={lockKick}
          >
            Kick
          </Button>
        </div>
      </section>

      <LineStrip line={line} cursorBeat={cursorBeat} />

      <section className="mt-6">
        <div className="mb-2 flex items-baseline justify-between gap-3">
          <p className="text-[11px] uppercase tracking-[0.18em] text-dim">Neck</p>
          <RoleLegend roles={legendRoles} />
        </div>
        <BassNeck marks={extraMarks} active={active} onPlay={(pos) => playPos(pos)} />
      </section>

      {search.tab === "alt" ? (
        <p className="mt-5 text-pretty text-sm text-muted">
          Tap open E. Alternate even if you only hear one pitch. Slow is correct.
        </p>
      ) : null}

      {search.tab === "ghost" ? (
        <p className="mt-5 text-pretty text-sm text-muted">
          Left hand stays on the string. The muted stroke should be as loud as the open one — just empty.
        </p>
      ) : null}

      {search.tab === "walk" ? (
        <p className="mt-5 flex items-start gap-2 text-sm text-muted">
          <Repeat className="mt-0.5 size-4 shrink-0 text-dim" />
          Em walks up to G. Switch the chord chip to G and the line walks into C.
        </p>
      ) : null}

      {search.tab === "hammer" ? (
        <p className="mt-5 text-pretty text-sm text-muted">
          Pluck, then drop a left-hand finger two frets higher. If the second note has a click, you plucked it.
        </p>
      ) : null}

      {search.tab === "rake" ? (
        <p className="mt-5 text-pretty text-sm text-muted">
          One finger. Start on the muted string above and fall onto the root. Two clicks is two plucks.
        </p>
      ) : null}
    </div>
  );
}

function soundEvent(ev: LineEvent, when: number) {
  if (ev.ghost) {
    ghostNote(when);
    return;
  }
  if (ev.hammer) {
    bassLegato(bassFreq(ev.pos.string, ev.pos.fret), when);
    return;
  }
  if (ev.rake && ev.together) {
    ghostNote(when);
    bassTone(bassFreq(ev.pos.string, ev.pos.fret), when + 0.045);
    return;
  }
  bassTone(bassFreq(ev.pos.string, ev.pos.fret), when);
  if (ev.together && ev.together.role !== "gh") {
    bassTone(bassFreq(ev.together.string, ev.together.fret), when, 0.32);
  }
}

function RightHandPads({ finger }: { finger: Finger | null }) {
  const keys: Finger[] = ["p", "i", "m"];
  return (
    <ul className="flex gap-1.5" aria-label="Right-hand fingers">
      {keys.map((f) => (
        <li key={f}>
          <span
            className={cn(
              "flex size-11 flex-col items-center justify-center rounded-md border text-center",
              finger === f ? "border-accent bg-accent text-accent-fg" : "border-border bg-raised text-muted",
            )}
            aria-label={FINGER_LABEL[f]}
            aria-current={finger === f || undefined}
          >
            <span className="font-display text-base font-semibold leading-none">{f}</span>
          </span>
        </li>
      ))}
    </ul>
  );
}

function LineStrip({ line, cursorBeat }: { line: LineEvent[]; cursorBeat: number | null }) {
  const beats = line.filter((e) => e.beat === Math.floor(e.beat)).slice(0, 8);
  return (
    <section className="mt-5" aria-label="Eight-beat line">
      <p className="mb-2 text-[11px] uppercase tracking-[0.18em] text-dim">Line</p>
      <ol className="grid grid-cols-8 gap-1">
        {beats.map((ev, i) => {
          const on = cursorBeat != null && Math.floor(cursorBeat) === ev.beat;
          return (
            <li
              key={`${ev.beat}-${i}`}
              className={cn(
                "flex h-16 flex-col items-center justify-center rounded-md border",
                on ? "border-accent bg-accent text-accent-fg" : "border-border bg-raised text-muted",
              )}
            >
              <span className="font-display text-sm font-semibold leading-none">{ev.finger ?? "·"}</span>
              <span className="mt-1 text-[11px] tabular leading-none">
                {ev.ghost ? "x" : ev.hammer ? "h" : ev.rake ? `x${ev.pos.name}` : ev.together ? `${ev.pos.name}+` : ev.pos.name}
              </span>
            </li>
          );
        })}
      </ol>
    </section>
  );
}

function marksFor(tab: TechTab, root: BassPos, marks: BassPos[]): BassPos[] {
  if (tab === "fifth" || tab === "double") return [root, fifthOf(root)];
  if (tab === "octave") return [root, octaveOf(root)];
  if (tab === "thumb") return [root, fifthOf(root), octaveOf(root)];
  if (tab === "hammer") return [root, hammerOf(root)];
  if (tab === "rake") return [root, posOf(root.string + 1, root.fret, "gh")];
  if (tab === "roots" || tab === "alt" || tab === "ghost") return [root];
  return marks;
}

function uniqueMarks(list: BassPos[]) {
  const seen = new Set<string>();
  const out: BassPos[] = [];
  for (const p of list) {
    const k = `${p.string}-${p.fret}-${p.role}`;
    if (seen.has(k)) continue;
    seen.add(k);
    out.push(p);
  }
  return out;
}
