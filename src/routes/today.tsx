import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Check, Flame, Play } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { MarkList, WeekPulseRow, XpBar } from "@/components/game-chrome";
import { Button } from "@/components/ui/button";
import { ChordDiagram } from "@/components/chord-diagram";
import { DrumPads } from "@/components/drum-pads";
import { InstrumentMark } from "@/components/instrument-mark";
import { PianoKeyboard } from "@/components/piano-keyboard";
import { unlockAudio } from "@/lib/spark/audio";
import { rankFor, sparksFor, weekPulse, xpProgress } from "@/lib/spark/game";
import { instrumentById, lessonsFor, PIANO_VOICINGS, tracksFor, UKE_CHORDS } from "@/lib/spark/instruments";
import { labCardFor, labSearchFor } from "@/lib/spark/labs";
import { dayCue, streakTone } from "@/lib/spark/psychology";
import { feelCue, newThingLine } from "@/lib/spark/udl";
import { DEFAULT_THEORY_SEARCH } from "@/lib/spark/theory";
import { useSpark } from "@/store/spark";
import { localDayKey } from "@/lib/utils";
import { RoleTag } from "@/components/udl-chrome";

export const Route = createFileRoute("/today")({ component: TodayPage });

function TodayPage() {
  const navigate = useNavigate();
  const instrument = useSpark((s) => s.instrument);
  const generatedPlan = useSpark((s) => s.plan);
  const session = useSpark((s) => s.session);
  const hydrated = useSpark((s) => s.hydrated);
  const progress = useSpark((s) => s.progress);
  const beginDay = useSpark((s) => s.beginDay);
  const inst = instrumentById(instrument);
  const today = localDayKey();
  const resume = session?.plan.date === today ? session : null;
  const plan = resume?.plan ?? generatedPlan;
  const done = Boolean(progress.dailyComplete[today]);
  const firstChord = plan.items.find((i) => i.chords[0])?.chords[0] ?? inst.firstChords[0];
  const tracks = tracksFor(instrument);
  const lessons = lessonsFor(instrument);
  const lab = labCardFor(instrument);
  const tone = streakTone(progress, today);
  const rank = rankFor(progress.level);
  const xp = xpProgress(progress.xp);
  const week = weekPulse(progress, today);
  const sparks = sparksFor(progress);
  const newThing = !done ? newThingLine(plan) : null;
  const slower = !done ? feelCue(progress) : null;
  const uke = instrument === "ukulele" && firstChord && UKE_CHORDS[firstChord]
    ? { id: firstChord, name: firstChord, ...UKE_CHORDS[firstChord] }
    : null;
  const pianoPcs = firstChord && PIANO_VOICINGS[firstChord] ? PIANO_VOICINGS[firstChord].map((m) => m % 12) : [0];

  return (
    <AppShell>
      <header className="px-5 pb-2 pt-8">
        <div className="flex items-center gap-3">
          <InstrumentMark id={instrument} className="size-16" />
          <div>
            <p className="text-[11px] uppercase tracking-[0.22em] text-dim">
              {inst.kicker} · {rank.title}
            </p>
            <h1 className="mt-1 font-display text-4xl font-semibold tracking-tight text-balance">Today</h1>
          </div>
        </div>
        <p className="mt-3 max-w-sm text-pretty text-muted">{plan.promise}</p>
        <p className="mt-1 text-sm text-dim">{dayCue(plan, done)}</p>
        {!done && newThing ? <p className="mt-1 text-sm text-muted">{newThing}</p> : null}
        {!done && slower ? <p className="mt-1 text-sm text-ember">{slower}</p> : null}
      </header>

      <section className="mx-4 mt-4 rounded-xl border border-border bg-surface p-5">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-[11px] uppercase tracking-[0.18em] text-dim">{plan.minutes} min plan</p>
            <p className="mt-1 font-display text-xl font-semibold">{resume ? "Pick up your loop" : done ? "Done for today" : "Your loop"}</p>
          </div>
          <div className="flex items-center gap-1 text-ember">
            <Flame className="size-4" />
            <span className="tabular font-medium">{progress.streak}</span>
            {tone === "held" ? <span className="text-xs text-dim">held</span> : null}
          </div>
        </div>
        <WeekPulseRow pulse={week} className="mt-4" />
        {resume ? <p role="status" className="mt-4 text-sm text-ember">{resume.results.length} of {plan.items.length} exercises finished. Your current exercise starts fresh when you resume.</p> : null}
        <ol className="mt-5 space-y-3">
          {plan.items.map((item, i) => (
            <li key={item.id} className="flex items-center gap-3">
              <span className="flex size-8 items-center justify-center rounded-sm bg-raised tabular text-sm text-muted">
                {resume?.results.some((r) => r.itemId === item.id) ? <Check className="size-4 text-good" aria-label="Finished" /> : i + 1}
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex items-baseline gap-2">
                  <p className="truncate font-medium">{item.title}</p>
                  <RoleTag role={item.role} process={item.process} />
                </div>
                <p className="truncate text-sm text-muted">{item.why ?? item.repertoire ?? item.subtitle}</p>
              </div>
              <span className="tabular text-xs text-dim">
                {item.durationSec < 60 ? `${item.durationSec}s` : `${Math.round(item.durationSec / 60)}m`}
              </span>
            </li>
          ))}
        </ol>
        <div className="mt-6 flex flex-col items-center gap-4">
          {instrument === "guitar" && firstChord ? <ChordDiagram chordId={firstChord} compact /> : null}
          {uke ? <ChordDiagram shape={uke} compact /> : null}
          {instrument === "piano" || instrument === "vocals" ? (
            <PianoKeyboard activeMidi={null} chordPcs={pianoPcs} onPlay={() => undefined} disabled />
          ) : null}
          {instrument === "drums" ? <DrumPads active={null} onHit={() => undefined} disabled /> : null}
          <Button
            size="xl"
            className="w-full"
            disabled={!hydrated}
            onClick={() => {
              unlockAudio();
              beginDay();
              void navigate({ to: "/practice" });
            }}
          >
            <Play className="size-4" />
            {resume ? "Resume your loop" : done ? "Play it again" : "Start today's loop"}
          </Button>
        </div>
      </section>

      {done ? (
        lab ? (
          <section className="mx-4 mt-4 rounded-xl border border-border bg-surface p-5">
            <p className="text-[11px] uppercase tracking-[0.18em] text-dim">{lab.kicker}</p>
            <h2 className="mt-1 font-display text-xl font-semibold">{lab.title}</h2>
            <p className="mt-2 text-pretty text-sm text-muted">{lab.body}</p>
            <Button
              variant="secondary"
              className="mt-4 w-full"
              onClick={() => void navigate({ to: "/techniques", search: labSearchFor(instrument) })}
            >
              {lab.cta}
            </Button>
          </section>
        ) : (
          <section className="mx-4 mt-4 rounded-xl border border-border bg-surface p-5">
            <p className="text-[11px] uppercase tracking-[0.18em] text-dim">Chord lab</p>
            <h2 className="mt-1 font-display text-xl font-semibold">Why a chord sounds like that</h2>
            <p className="mt-2 text-pretty text-sm text-muted">
              Harmony is shared. Four minutes. Then stop.
            </p>
            <Button
              variant="secondary"
              className="mt-4 w-full"
              onClick={() => void navigate({ to: "/theory", search: DEFAULT_THEORY_SEARCH })}
            >
              Four minutes
            </Button>
            <Button
              variant="ghost"
              className="mt-2 w-full"
              onClick={() => void navigate({ to: "/techniques", search: labSearchFor("guitar") })}
            >
              Right-hand lab
            </Button>
          </section>
        )
      ) : null}

      {done ? (
        <section className="px-5 pt-8 pb-4">
          <div className="flex items-baseline justify-between">
            <h2 className="font-display text-lg font-semibold">{rank.title}</h2>
            <p className="tabular text-sm text-muted">
              {sparks} spark{sparks === 1 ? "" : "s"}
            </p>
          </div>
          <p className="mt-1 text-sm text-muted">{rank.line}</p>
          <div className="mt-4">
            <XpBar into={xp.into} need={xp.need} label={`Level ${xp.level}`} />
          </div>
          {progress.marks.length ? (
            <div className="mt-6">
              <p className="mb-3 text-[11px] uppercase tracking-[0.18em] text-dim">Marks</p>
              <MarkList ids={progress.marks} />
            </div>
          ) : null}
          <div className="mt-8 flex items-baseline justify-between">
            <h2 className="font-display text-lg font-semibold">Path</h2>
            <p className="tabular text-sm text-muted">
              Lv {progress.level} · {progress.xp} xp
            </p>
          </div>
          <ul className="mt-3 space-y-3">
            {tracks.map((track) => {
              const ids = lessons.filter((l) => l.trackId === track.id).map((l) => l.id);
              const avg = ids.length ? ids.reduce((s, id) => s + (progress.mastery[id] ?? 0), 0) / ids.length : 0;
              return (
                <li key={track.id}>
                  <div className="mb-1 flex justify-between text-sm">
                    <span>{track.name}</span>
                    <span className="tabular text-muted">{Math.round(avg * 100)}%</span>
                  </div>
                  <div className="h-1.5 overflow-hidden rounded-full bg-raised">
                    <div className="h-full bg-accent" style={{ width: `${Math.round(avg * 100)}%` }} />
                  </div>
                </li>
              );
            })}
          </ul>
          <Button variant="ghost" className="mt-4 w-full" onClick={() => void navigate({ to: "/skills" })}>
            Full path
          </Button>
        </section>
      ) : (
        <p className="px-5 pt-6 pb-4 text-sm text-dim">Three days this week is a held week. Miss a day. The streak holds.</p>
      )}
    </AppShell>
  );
}
