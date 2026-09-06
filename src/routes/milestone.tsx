import { useEffect, useMemo, useRef, useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { ArrowLeft, Check, CheckCircle2, Coffee, Play, RotateCcw, Square } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { ChordDiagram } from "@/components/chord-diagram";
import { PracticeSounds } from "@/components/lesson-practice";
import { usePracticePlayback } from "@/components/lesson-practice-player";
import { Button } from "@/components/ui/button";
import { learningLesson } from "@/lib/spark/curriculum";
import {
  INSTRUMENTS,
  instrumentById,
  isInstrumentId,
  type InstrumentId,
} from "@/lib/spark/instruments";
import {
  PRACTICE_TEMPOS,
  practiceBar,
  practiceShape,
  type PracticeGuide,
} from "@/lib/spark/lesson-practice";
import {
  milestoneSequence,
  musicalMilestone,
  type MilestoneAction,
  type MilestoneVersion,
  type MusicalMilestone,
} from "@/lib/spark/milestones";
import { useLearning } from "@/store/learning";
import { useSpark } from "@/store/spark";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/milestone")({
  validateSearch: (search: Record<string, unknown>): { instrument?: InstrumentId } => ({
    instrument: isInstrumentId(search.instrument) ? search.instrument : undefined,
  }),
  component: MilestonePage,
});

function MilestonePage() {
  const { instrument: requested } = Route.useSearch();
  const navigate = useNavigate();
  const active = useSpark((s) => s.instrument);
  const selectInstrument = useSpark((s) => s.selectInstrument);
  const sparkReady = useSpark((s) => s.hydrated);
  const hydrated = useLearning((s) => s.hydrated);
  const instrument = requested ?? active;
  const ready = hydrated && sparkReady;
  useEffect(() => {
    if (ready && requested && active !== requested) selectInstrument(requested);
  }, [ready, requested, active, selectInstrument]);
  return (
    <AppShell wide focusTimer={false}>
      <div className="mx-auto max-w-3xl px-5 pt-6 pb-5 md:px-8">
        <Link to="/learn" className="inline-flex min-h-11 items-center gap-2 text-sm text-muted">
          <ArrowLeft className="size-4" aria-hidden="true" /> Back to learning
        </Link>
        <header className="mt-5 flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="studio-label">First musical milestone</p>
            <h1 className="mt-2 font-display text-3xl font-semibold tracking-tight">
              A little piece of your own.
            </h1>
          </div>
          <label className="flex flex-col gap-2 text-xs text-muted">
            Instrument
            <select
              aria-label="Milestone instrument"
              value={instrument}
              disabled={!ready}
              onChange={(event) => {
                void navigate({
                  to: "/milestone",
                  search: { instrument: event.target.value as InstrumentId },
                  replace: true,
                });
              }}
              className="min-h-11 rounded-md border border-border bg-surface px-3 text-sm text-fg"
            >
              {INSTRUMENTS.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name}
                </option>
              ))}
            </select>
          </label>
        </header>
        {ready ? (
          <MilestoneStudio key={instrument} instrument={instrument} />
        ) : (
          <p role="status" className="mt-8 text-muted">
            Finding your piece…
          </p>
        )}
      </div>
    </AppShell>
  );
}

function MilestoneStudio({ instrument }: { instrument: InstrumentId }) {
  const { data, storageOk, begin, beginMilestone, milestoneAction } = useLearning();
  const piece = musicalMilestone(instrument);
  const record = data.milestones[instrument];
  const [paused, setPaused] = useState(false);
  const [chosenBar, setChosenBar] = useState(0);
  const heading = useRef<HTMLHeadingElement>(null);
  const initialized = useRef(false);
  const sequence = useMemo(
    () => milestoneSequence(piece, record?.variation ?? false, record?.scope ?? "whole"),
    [piece, record?.variation, record?.scope],
  );
  const playback = usePracticePlayback(sequence);
  const bars = Math.ceil(sequence.beats / 4);
  const bar =
    playback.cursor === null ? Math.min(chosenBar, bars - 1) : Math.floor(playback.cursor / 4);
  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;
    if (record && record.phase !== "saved") beginMilestone(instrument);
  }, [record, beginMilestone, instrument]);
  useEffect(() => {
    heading.current?.focus();
  }, [record?.phase, paused]);
  function change(action: MilestoneAction) {
    playback.stop();
    setChosenBar(0);
    milestoneAction(instrument, action);
  }
  function pause() {
    playback.stop();
    setPaused(true);
  }
  const smallStart = data.profiles[instrument]?.minutes === 2;
  const selectClass =
    "min-h-11 w-full min-w-0 rounded-md border border-border bg-raised px-2 text-fg";
  return (
    <>
      {!storageOk ? (
        <p role="status" className="mt-5 rounded-md border border-warn p-4 text-sm text-muted">
          This browser could not save your piece. Keep this tab open; your changes may be lost when
          you leave or reload.
        </p>
      ) : null}
      <section
        aria-label="Milestone studio"
        className="mt-6 rounded-xl border border-border bg-surface p-5 sm:p-7"
      >
        <p className="studio-label text-ember">
          {instrumentById(instrument).name} /{" "}
          {record?.phase === "saved" ? "Your saved version" : "Make something musical"}
        </p>
        <h2
          ref={heading}
          tabIndex={-1}
          className="mt-3 font-display text-2xl font-semibold focus:outline-none"
        >
          {paused
            ? "That practice counts."
            : record?.phase === "reflect"
              ? "What would you like to remember?"
              : record?.phase === "saved"
                ? "A piece to come back to."
                : piece.title}
        </h2>
        <p className="mt-3 leading-relaxed text-muted">{piece.goal}</p>
        {!record ? (
          <>
            <p className="mt-4 text-sm leading-relaxed">{piece.setup}</p>
            <p className="mt-4 text-sm text-muted">
              {smallStart
                ? "Start with just the first bar. Then pause, or try the whole piece when you have room."
                : "A few bars, at a tempo you choose. Try the original, then change one musical detail if you like."}
            </p>
            <Button className="mt-6 w-full" size="lg" onClick={() => beginMilestone(instrument)}>
              {smallStart ? "Start with the first bar" : "Start this piece"}
            </Button>
            <details className="mt-5 rounded-lg border border-border p-4">
              <summary className="min-h-11 cursor-pointer text-sm">Useful preparation</summary>
              <p className="mb-2 text-sm text-muted">
                These lessons introduce the ideas. Explore the piece whenever you feel ready.
              </p>
              <ul>
                {piece.lessons.map((id) => (
                  <li key={id}>
                    <Link
                      to="/learn"
                      onClick={() => begin(id)}
                      className="inline-flex min-h-11 items-center text-sm text-ember"
                    >
                      {learningLesson(id)!.title}
                    </Link>
                  </li>
                ))}
              </ul>
            </details>
          </>
        ) : paused ? (
          <>
            <Coffee className="mt-5 size-7 text-ember" aria-hidden="true" />
            <p className="mt-3 text-sm leading-relaxed text-muted">
              {storageOk
                ? "Your place and settings are saved in this browser."
                : "Keep this tab open to keep your place."}{" "}
              {record.firstBarTried && record.phase === "play"
                ? "You tried the first bar. The whole piece is here when you are ready."
                : "Come back when you have room."}
            </p>
            <Button asChild className="mt-6 w-full" size="lg">
              <Link to="/">Done for now</Link>
            </Button>
            <Button variant="ghost" className="mt-3 w-full" onClick={() => setPaused(false)}>
              Continue my piece
            </Button>
          </>
        ) : record.phase === "saved" && record.saved ? (
          <>
            <CheckCircle2 className="mt-5 size-8 text-good" aria-hidden="true" />
            <SavedVersion piece={piece} version={record.saved} />
            <Button
              className="mt-6 h-auto min-h-12 w-full whitespace-normal py-3"
              onClick={() => change({ type: "replay" })}
            >
              <RotateCcw className="size-4 shrink-0" aria-hidden="true" /> Replay my saved version
            </Button>
            <Button asChild variant="ghost" className="mt-3 w-full">
              <Link to="/">Done for now</Link>
            </Button>
          </>
        ) : record.phase === "reflect" ? (
          <>
            <p className="mt-4 text-sm leading-relaxed text-muted">
              A rough attempt counts. Save your arrangement and check-in for another day; this does
              not record audio or grade your playing.
            </p>
            <fieldset className="mt-5 min-w-0">
              <legend className="font-medium">How does this piece feel?</legend>
              <div className="mt-3 space-y-3">
                {(
                  [
                    ["exploring", "Still exploring"],
                    ["comfortable", "Feeling more comfortable"],
                  ] as const
                ).map(([value, label]) => (
                  <label
                    key={value}
                    className={cn(
                      "flex min-h-14 cursor-pointer items-center gap-3 rounded-lg border p-4 text-sm",
                      record.reflection === value ? "border-ember bg-raised" : "border-border",
                    )}
                  >
                    <input
                      type="radio"
                      name="milestone-reflection"
                      value={value}
                      checked={record.reflection === value}
                      onChange={() => change({ type: "reflect", reflection: value })}
                      className="size-4 shrink-0 accent-accent"
                    />
                    <span>{label}</span>
                  </label>
                ))}
              </div>
            </fieldset>
            <label className="mt-5 flex flex-col gap-2 text-sm">
              One thing for next time{" "}
              <span className="text-xs text-muted">
                Optional · a small adjustment, a place to slow down, or something you liked.
              </span>
              <textarea
                value={record.note}
                maxLength={240}
                rows={3}
                onChange={(event) =>
                  milestoneAction(instrument, { type: "note", note: event.target.value })
                }
                className="w-full resize-y rounded-lg border border-border bg-raised p-3 text-fg"
              />
            </label>
            <Button
              className="mt-5 w-full"
              size="lg"
              disabled={!record.reflection}
              onClick={() => change({ type: "save" })}
            >
              <Check className="size-4" aria-hidden="true" /> Save this version
            </Button>
            <Button
              variant="secondary"
              className="mt-3 w-full"
              onClick={() => change({ type: "retry" })}
            >
              Try the piece again
            </Button>
            <Button variant="ghost" className="mt-3 w-full" onClick={pause}>
              {storageOk ? "Save and stop" : "Pause here"}
            </Button>
          </>
        ) : (
          <>
            <p className="mt-4 text-sm leading-relaxed text-muted">{piece.setup}</p>
            {record.firstBarTried ? (
              <p className="mt-3 text-sm text-ember">
                First bar tried. Build on it whenever you are ready.
              </p>
            ) : null}
            <div className="mt-5 grid grid-cols-2 gap-3">
              <label className="flex min-w-0 flex-col gap-2 text-sm">
                Tempo
                <select
                  aria-label="Piece tempo"
                  value={record.bpm}
                  onChange={(event) =>
                    change({ type: "settings", bpm: Number(event.target.value) })
                  }
                  className={selectClass}
                >
                  {PRACTICE_TEMPOS.map((bpm) => (
                    <option key={bpm} value={bpm}>
                      {bpm} BPM
                    </option>
                  ))}
                </select>
              </label>
              <label className="flex min-w-0 flex-col gap-2 text-sm">
                Guide
                <select
                  aria-label="Piece guide"
                  value={record.guide}
                  onChange={(event) =>
                    change({ type: "settings", guide: event.target.value as PracticeGuide })
                  }
                  className={selectClass}
                >
                  <option value="notes">Notes + click</option>
                  <option value="pulse">Click only</option>
                  <option value="silent">Visual only</option>
                </select>
              </label>
            </div>
            <label className="mt-4 flex min-w-0 flex-col gap-2 text-sm">
              Your version
              <select
                aria-label="Piece version"
                value={record.variation ? "variation" : "original"}
                onChange={(event) =>
                  change({ type: "settings", variation: event.target.value === "variation" })
                }
                className={selectClass}
              >
                <option value="original">Original</option>
                <option value="variation">{piece.variation}</option>
              </select>
            </label>
            {record.variation ? (
              <p className="mt-3 text-sm leading-relaxed text-muted">{piece.variationHint}</p>
            ) : null}
            <fieldset className="mt-5 min-w-0">
              <legend className="text-sm font-medium">How much of the piece?</legend>
              <div className="mt-3 flex flex-wrap gap-3">
                {(
                  [
                    ["first", "First bar"],
                    ["whole", "Whole piece"],
                  ] as const
                ).map(([scope, label]) => (
                  <label
                    key={scope}
                    className={cn(
                      "flex min-h-11 cursor-pointer items-center gap-2 rounded-md border px-3 text-sm",
                      record.scope === scope ? "border-ember bg-raised" : "border-border",
                    )}
                  >
                    <input
                      type="radio"
                      name="piece-scope"
                      value={scope}
                      checked={record.scope === scope}
                      onChange={() => change({ type: "settings", scope })}
                      className="size-4 accent-accent"
                    />
                    {label}
                  </label>
                ))}
              </div>
            </fieldset>
            <p className="mt-3 text-xs leading-relaxed text-muted">
              Four counts to get ready, then {record.scope === "first" ? "one bar" : "one pass"} ·
              about {Math.ceil(((sequence.beats + 4) * 60) / record.bpm)} seconds. Playback stops at
              the end.
            </p>
            <div className="mt-6 border-t border-border pt-5">
              <h3 className="font-medium">
                {playback.phase === "count"
                  ? `Count in · ${playback.count} of 4`
                  : `Bar ${bar + 1}${sequence.beats % 4 && bar === bars - 1 ? " · landing" : ` of ${bars}`}`}
              </h3>
              <ol aria-label="Piece pattern" className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
                {practiceBar(sequence, bar).map(({ beat, cues }) => (
                  <li
                    key={beat}
                    className={cn(
                      "min-w-0 rounded-lg border p-2",
                      playback.cursor !== null && Math.floor(playback.cursor) === beat
                        ? "border-ember bg-raised"
                        : "border-border",
                    )}
                  >
                    <p className="font-display text-lg font-semibold text-ember">
                      {(beat % 4) + 1}
                    </p>
                    {cues.map((cue, index) => (
                      <div
                        key={index}
                        title={cue.detail}
                        className={cn(
                          "mt-2 break-words text-xs leading-relaxed",
                          playback.cursor === cue.beat ? "font-semibold text-fg" : "text-muted",
                        )}
                      >
                        {cue.beat % 1 ? <span className="block text-dim">and</span> : null}
                        {cue.label}
                        <span className="sr-only">: {cue.detail}</span>
                      </div>
                    ))}
                  </li>
                ))}
              </ol>
              <div aria-label="Browse piece bars" className="mt-3 flex flex-wrap gap-2">
                {Array.from({ length: bars }, (_, index) => (
                  <Button
                    key={index}
                    variant="ghost"
                    disabled={playback.running}
                    aria-pressed={bar === index}
                    onClick={() => setChosenBar(index)}
                    className={cn(bar === index && "bg-raised text-ember")}
                  >
                    Bar {index + 1}
                  </Button>
                ))}
              </div>
              <p className="mt-2 text-xs text-muted">
                {instrument === "drums"
                  ? "K = kick · S = snare · T = tom · and = halfway between counts"
                  : instrument === "guitar" || instrument === "ukulele"
                    ? "↓ = downstroke · Numbers are beats"
                    : "Numbers are beats"}
              </p>
              <Button
                className="mt-5 w-full"
                size="lg"
                onClick={() => {
                  if (playback.running) playback.stop();
                  else {
                    setChosenBar(0);
                    void playback.play(record.bpm, record.guide);
                  }
                }}
              >
                {playback.running ? (
                  <Square className="size-4" aria-hidden="true" />
                ) : (
                  <Play className="size-4" aria-hidden="true" />
                )}
                {playback.running ? "Stop guide" : "Play one pass"}
              </Button>
              <p role="status" className="mt-3 text-sm leading-relaxed text-muted">
                {playback.phase === "done"
                  ? "One pass finished. Try it again or check in below."
                  : playback.running
                    ? "The guide is playing. Stop whenever you need."
                    : "Start when ready, or follow the written pattern."}
              </p>
              {playback.audioUnavailable ? (
                <p role="status" className="mt-3 text-sm text-muted">
                  Audio is unavailable here. The visual guide and written pattern show the same
                  notes and rests.
                </p>
              ) : null}
              {piece.shapes ? (
                <div
                  aria-label="Piece chord shapes"
                  className="mt-5 flex flex-wrap justify-center gap-3"
                >
                  {piece.shapes.map((chord) => (
                    <ChordDiagram key={chord} shape={practiceShape(instrument, chord)} compact />
                  ))}
                </div>
              ) : null}
            </div>
            <PracticeSounds
              key={`${record.bpm}-${record.guide}-${record.variation}`}
              lesson={{ instrument }}
              exercise={sequence}
              disabled={playback.running}
              bpm={record.bpm}
            />
            <Button
              variant="secondary"
              className="mt-6 h-auto min-h-12 w-full whitespace-normal py-3"
              onClick={() => {
                const first = record.scope === "first";
                change({ type: "attempt" });
                if (first) setPaused(true);
              }}
            >
              <Check className="size-4 shrink-0" aria-hidden="true" />
              {record.scope === "first" ? "I tried the first bar" : "I tried the whole piece"}
            </Button>
            <p className="mt-3 text-xs leading-relaxed text-muted">
              Your own check-in. The app does not listen to or grade your playing.{" "}
              {instrument === "vocals"
                ? "Speaking or listening is also a way to explore this piece."
                : "Try on your instrument or explore with the sounds above."}
            </p>
            <Button variant="ghost" className="mt-3 w-full" onClick={pause}>
              {storageOk ? "Save and stop" : "Pause here"}
            </Button>
          </>
        )}
        {record?.saved && record.phase !== "saved" && !paused ? (
          <details className="mt-5 rounded-lg border border-border p-4">
            <summary className="min-h-11 cursor-pointer text-sm">Your saved version</summary>
            <SavedVersion piece={piece} version={record.saved} />
            <Button
              variant="secondary"
              className="mt-3 h-auto min-h-11 whitespace-normal py-3"
              onClick={() => change({ type: "replay" })}
            >
              Restore saved settings
            </Button>
            <p className="mt-2 text-xs text-muted">
              Restores the tempo, guide, variation, and note from this version.
            </p>
          </details>
        ) : null}
      </section>
      <p className="mt-4 text-xs leading-relaxed text-muted">
        {storageOk ? "Your place saves in this browser. " : ""}No progress disappears when you take
        a break.{" "}
        <Link
          to="/progress"
          className="inline-flex min-h-11 items-center text-ember underline underline-offset-4"
        >
          Find your saved music in Progress
        </Link>
      </p>
    </>
  );
}

function SavedVersion({ piece, version }: { piece: MusicalMilestone; version: MilestoneVersion }) {
  return (
    <div className="mt-4 text-sm leading-relaxed">
      <p className="font-medium">{piece.title}</p>
      <p className="mt-2 text-muted">
        {version.bpm} BPM · {version.variation ? piece.variation : "Original"} ·{" "}
        {version.reflection === "exploring" ? "Still exploring" : "Feeling more comfortable"}
      </p>
      {version.note ? (
        <p className="mt-3 whitespace-pre-wrap break-words rounded-lg bg-raised p-4">
          <span className="block text-xs text-muted">For next time</span>
          {version.note}
        </p>
      ) : null}
      <p className="mt-3 text-xs text-muted">
        Saved {version.savedOn} · Arrangement settings and your check-in, with no audio recording.
      </p>
    </div>
  );
}
