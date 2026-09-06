import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { ArrowLeft, ArrowRight, Check, Play, RotateCcw, Square } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { BassNeck } from "@/components/bass-neck";
import { ChordDiagram } from "@/components/chord-diagram";
import { DrumPads } from "@/components/drum-pads";
import { PianoKeyboard } from "@/components/piano-keyboard";
import { Button } from "@/components/ui/button";
import { soundPracticeCue, usePracticePlayback } from "@/components/lesson-practice-player";
import { drumHit, pianoTone, scheduleRun, unlockAudio, type AudioRun } from "@/lib/spark/audio";
import { bassFreq, type BassPos } from "@/lib/spark/bass";
import { learningLesson, type LearningLesson } from "@/lib/spark/curriculum";
import { instrumentById, midiToFreq } from "@/lib/spark/instruments";
import {
  lessonExercise,
  practiceBar,
  practiceSequence,
  practiceShape,
  PRACTICE_TEMPOS,
  retryCoaching,
  type LessonExercise,
  type PracticeGuide,
} from "@/lib/spark/lesson-practice";
import { useLearning } from "@/store/learning";
import { useSpark } from "@/store/spark";
import { cn } from "@/lib/utils";

function cueSubdivisionLabel(beat: number, subdivision = 2) {
  const slot = Math.round((beat - Math.floor(beat)) * subdivision);
  if (subdivision === 4) return ["", "e", "and", "a"][slot] ?? "between";
  if (subdivision === 3) return ["", "slot 2", "slot 3"][slot] ?? "between";
  return "and";
}

export function LessonPractice({ id }: { id: string }) {
  const lesson = learningLesson(id);
  const exercise = lessonExercise(id);
  if (!lesson || !exercise)
    return (
      <AppShell wide focusTimer={false}>
        <div className="mx-auto max-w-3xl px-5 py-8">
          <h1 className="font-display text-3xl font-semibold">
            This guided exercise is unavailable.
          </h1>
          <p className="mt-4 text-muted">
            Open your learning path to choose a lesson. Your saved learning is still there.
          </p>
          <Button asChild className="mt-6">
            <Link to="/learn">Back to learning</Link>
          </Button>
        </div>
      </AppShell>
    );
  return <GuidedPractice lesson={lesson} exercise={exercise} />;
}

function GuidedPractice({
  lesson,
  exercise,
}: {
  lesson: LearningLesson;
  exercise: LessonExercise;
}) {
  const { data, hydrated, storageOk, beginPractice, practiceAction } = useLearning();
  const sparkReady = useSpark((state) => state.hydrated);
  const selectInstrument = useSpark((state) => state.selectInstrument);
  const navigate = useNavigate();
  const saved = data.records[lesson.id]?.practice;
  const hasSavedPractice = !!saved;
  const ready = hydrated && sparkReady;
  const sequence = useMemo(() => practiceSequence(exercise, saved), [exercise, saved]);
  const playback = usePracticePlayback(sequence);
  const heading = useRef<HTMLHeadingElement>(null);
  const [chosenBar, setChosenBar] = useState(0);
  const [paused, setPaused] = useState(false);
  const [stageBreak, setStageBreak] = useState(false);
  const bpm = saved?.bpm ?? exercise.bpm;
  const guide = saved?.guide ?? "notes";
  const reflecting = saved?.phase === "reflect";
  const bar = playback.cursor === null ? chosenBar : Math.floor(playback.cursor / 4);
  const bars = Math.ceil(sequence.beats / 4);
  const inst = instrumentById(lesson.instrument);
  const projectStage = exercise.project?.stages[saved?.projectStage ?? 0];
  const coaching = retryCoaching(exercise);
  const adjustment = coaching.find((item) => item.id === saved?.retryFocus)?.adjustment;

  useEffect(() => {
    if (!ready) return;
    selectInstrument(lesson.instrument);
    if (!exercise.project || hasSavedPractice) beginPractice(lesson.id);
  }, [
    ready,
    exercise.project,
    hasSavedPractice,
    lesson.id,
    lesson.instrument,
    selectInstrument,
    beginPractice,
  ]);
  useEffect(() => {
    heading.current?.focus();
  }, [ready, hasSavedPractice, reflecting, paused, stageBreak, saved?.projectStage]);

  function checkIn() {
    playback.stop();
    practiceAction(lesson.id, { type: "attempt" });
  }
  function retry() {
    playback.stop();
    setChosenBar(0);
    practiceAction(lesson.id, { type: "retry" });
  }
  function nextProjectStage() {
    playback.stop();
    setChosenBar(0);
    practiceAction(lesson.id, { type: "project-next" });
    setStageBreak(true);
  }
  function pause() {
    playback.stop();
    setPaused(true);
  }

  return (
    <AppShell wide focusTimer={false}>
      <div className="mx-auto max-w-3xl px-5 pt-6 md:px-8">
        <Link to="/learn" className="inline-flex min-h-11 items-center gap-2 text-sm text-muted">
          <ArrowLeft className="size-4" aria-hidden="true" />
          {!saved && exercise.project ? "Back to learning" : "Back to lesson"}
        </Link>
        <header className="mt-5">
          <p className="studio-label">{inst.name} / Lesson practice</p>
          <h1 className="mt-2 font-display text-3xl font-semibold tracking-tight sm:text-4xl">
            {exercise.title}
          </h1>
          <p className="mt-3 text-sm text-muted">From “{lesson.title}”</p>
        </header>
        {!ready ? (
          <p role="status" className="mt-8 text-muted">
            Finding your practice…
          </p>
        ) : !saved && exercise.project ? (
          <section
            aria-label="Guided project preview"
            className="my-6 rounded-xl border border-border bg-surface p-5 sm:p-7"
          >
            <p className="studio-label">Advanced project · 3 short stages</p>
            <h2
              ref={heading}
              tabIndex={-1}
              className="mt-3 font-display text-2xl font-semibold focus:outline-none"
            >
              Build, choose, then refine.
            </h2>
            <p className="mt-4 leading-relaxed text-muted">{exercise.goal}</p>
            <ol className="mt-5 space-y-3" aria-label="Project preview stages">
              {exercise.project.stages.map((stage, index) => (
                <li key={stage.label} className="flex gap-3 text-sm">
                  <span className="tabular text-ember">{index + 1}</span>
                  <span>
                    <span className="font-medium">{stage.label}</span>
                    <span className="mt-1 block text-muted">{stage.title}</span>
                  </span>
                </li>
              ))}
            </ol>
            <Button className="mt-6 w-full" size="lg" onClick={() => beginPractice(lesson.id)}>
              Start guided project
            </Button>
            <p className="mt-3 text-xs leading-relaxed text-muted">
              Starting opens Stage 1. When browser storage is available, each checkpoint becomes a
              saved stopping point.
            </p>
          </section>
        ) : !saved ? (
          <p role="status" className="mt-8 text-muted">
            Finding your practice…
          </p>
        ) : (
          <>
            {!storageOk ? (
              <p
                role="status"
                className="mt-5 rounded-lg border border-warn p-4 text-sm leading-relaxed text-muted"
              >
                This browser could not save your practice. You can continue here, but your place may
                be lost when you leave or reload.
              </p>
            ) : null}
            <section
              aria-label="Guided exercise"
              className="my-6 rounded-xl border border-border bg-surface p-5 sm:p-7"
            >
              {stageBreak && exercise.project && saved.projectStage !== undefined ? (
                <>
                  <p className="studio-label">{saved.projectStage} of 3 stages saved</p>
                  <h2
                    ref={heading}
                    tabIndex={-1}
                    className="mt-3 font-display text-2xl font-semibold focus:outline-none"
                  >
                    That stage counts.
                  </h2>
                  <p className="mt-4 leading-relaxed text-muted">
                    Next: {exercise.project.stages[saved.projectStage].title}.{" "}
                    {storageOk
                      ? "Your project, tempo, and choices are saved in this browser. The guide will wait for you."
                      : "Keep this tab open to keep your place. The guide is stopped."}
                  </p>
                  <Button asChild className="mt-6 w-full" size="lg">
                    <Link to="/">Done for now</Link>
                  </Button>
                  <Button
                    variant="ghost"
                    className="mt-3 h-auto min-h-11 w-full whitespace-normal py-3"
                    onClick={() => setStageBreak(false)}
                  >
                    Continue to {exercise.project.stages[saved.projectStage].label.toLowerCase()}
                  </Button>
                </>
              ) : paused ? (
                <>
                  <h2
                    ref={heading}
                    tabIndex={-1}
                    className="font-display text-2xl font-semibold focus:outline-none"
                  >
                    A good place to pause.
                  </h2>
                  <p className="mt-4 leading-relaxed text-muted">
                    {storageOk
                      ? `Your ${bpm} BPM tempo and ${reflecting ? "practice check-in" : "exercise"} are saved in this browser. The guide will wait for you.`
                      : "Keep this tab open to keep your place. The guide is stopped."}
                  </p>
                  <Button asChild className="mt-6 w-full" size="lg">
                    <Link to="/">Done for now</Link>
                  </Button>
                  <Button variant="ghost" className="mt-3 w-full" onClick={() => setPaused(false)}>
                    Continue this exercise
                  </Button>
                </>
              ) : reflecting ? (
                <>
                  <p className="studio-label">Your practice check-in</p>
                  <h2
                    ref={heading}
                    tabIndex={-1}
                    className="mt-3 font-display text-2xl font-semibold focus:outline-none"
                  >
                    What did you notice?
                  </h2>
                  <p className="mt-3 text-sm leading-relaxed text-muted">
                    An attempt is enough. Choose what fits today; either choice lets you continue.
                  </p>
                  <fieldset className="mt-5 min-w-0">
                    <legend className="sr-only">How did this attempt feel?</legend>
                    <div className="space-y-3">
                      {(
                        [
                          ["again", "I'd like another try"],
                          ["ready", "I'm ready to move on"],
                        ] as const
                      ).map(([value, label]) => (
                        <label
                          key={value}
                          className={cn(
                            "flex min-h-12 cursor-pointer items-center gap-3 rounded-lg border p-4 text-sm",
                            saved.reflection === value ? "border-ember bg-raised" : "border-border",
                          )}
                        >
                          <input
                            type="radio"
                            name="practice-reflection"
                            value={value}
                            checked={saved.reflection === value}
                            onChange={() =>
                              practiceAction(lesson.id, { type: "reflect", reflection: value })
                            }
                            className="size-4 shrink-0 accent-accent"
                          />
                          <span>{label}</span>
                        </label>
                      ))}
                    </div>
                  </fieldset>
                  {saved.reflection === "again" ? (
                    <fieldset className="mt-5 min-w-0">
                      <legend className="font-medium">What got in the way?</legend>
                      <p className="mt-2 text-xs leading-relaxed text-muted">
                        Choose one thing. You will get one adjustment for the next attempt.
                      </p>
                      <div className="mt-3 space-y-3">
                        {coaching.map((item) => (
                          <label
                            key={item.id}
                            className={cn(
                              "flex min-h-12 cursor-pointer items-center gap-3 rounded-lg border p-4 text-sm",
                              saved.retryFocus === item.id
                                ? "border-ember bg-raised"
                                : "border-border",
                            )}
                          >
                            <input
                              type="radio"
                              name="practice-retry-focus"
                              value={item.id}
                              checked={saved.retryFocus === item.id}
                              onChange={() =>
                                practiceAction(lesson.id, {
                                  type: "retry-focus",
                                  focus: item.id,
                                })
                              }
                              className="size-4 shrink-0 accent-accent"
                            />
                            <span>{item.label}</span>
                          </label>
                        ))}
                      </div>
                    </fieldset>
                  ) : null}
                  {saved.reflection === "ready" || adjustment ? (
                    <p
                      role="status"
                      className="mt-4 rounded-lg bg-raised p-4 text-sm leading-relaxed"
                    >
                      {saved.reflection === "ready" ? exercise.takeaway : adjustment}
                    </p>
                  ) : null}
                  <Button
                    variant={saved.reflection === "again" ? "ghost" : "primary"}
                    className="mt-6 h-auto min-h-12 w-full whitespace-normal py-3"
                    disabled={!saved.reflection}
                    onClick={() => {
                      practiceAction(lesson.id, { type: "return" });
                      void navigate({ to: "/learn" });
                    }}
                  >
                    {saved.reflection === "again"
                      ? "Continue to lesson check anyway"
                      : "Continue to lesson check"}{" "}
                    <ArrowRight className="size-4 shrink-0" aria-hidden="true" />
                  </Button>
                  {saved.reflection === "again" ? (
                    <Button
                      variant="primary"
                      className="mt-3 w-full"
                      disabled={!saved.retryFocus}
                      onClick={retry}
                    >
                      <RotateCcw className="size-4" aria-hidden="true" />
                      Try this adjustment
                    </Button>
                  ) : null}
                  <Button variant="ghost" className="mt-3 w-full" onClick={pause}>
                    {storageOk ? "Save and stop" : "Pause here"}
                  </Button>
                </>
              ) : (
                <>
                  {exercise.project && projectStage ? (
                    <ol aria-label="Project stages" className="mb-6 flex gap-3 text-xs sm:gap-6">
                      {exercise.project.stages.map((stage, index) => (
                        <li
                          key={stage.label}
                          aria-current={index === saved.projectStage ? "step" : undefined}
                          className={cn(
                            "flex items-center gap-2",
                            index === saved.projectStage
                              ? "font-semibold text-ember"
                              : index < (saved.projectStage ?? 0)
                                ? "text-fg"
                                : "text-muted",
                          )}
                        >
                          {index < (saved.projectStage ?? 0) ? (
                            <Check className="size-4" aria-hidden="true" />
                          ) : (
                            <span className="tabular">{index + 1}</span>
                          )}
                          {stage.label}
                        </li>
                      ))}
                    </ol>
                  ) : null}
                  <p className="studio-label">
                    {projectStage
                      ? `Project stage ${(saved.projectStage ?? 0) + 1} of 3`
                      : "Your one goal"}
                  </p>
                  <h2
                    ref={heading}
                    tabIndex={-1}
                    className="mt-3 text-xl font-medium leading-relaxed focus:outline-none"
                  >
                    {projectStage?.title ?? exercise.goal}
                  </h2>
                  <p className="mt-3 text-sm leading-relaxed text-muted">
                    {projectStage?.instruction ?? exercise.setup}
                  </p>
                  {exercise.project &&
                  saved.projectStage === 2 &&
                  saved.projectChoice !== undefined ? (
                    <p className="mt-4 rounded-lg bg-raised p-4 text-sm leading-relaxed">
                      <span className="studio-label mb-2 block">Your saved direction</span>
                      <span className="font-medium">
                        {exercise.project.choices[saved.projectChoice].label}
                      </span>
                      <span className="mt-1 block text-muted">
                        {exercise.project.choices[saved.projectChoice].detail}
                      </span>
                    </p>
                  ) : null}
                  {saved.retryFocus && adjustment ? (
                    <p
                      role="status"
                      className="mt-4 rounded-lg bg-raised p-4 text-sm leading-relaxed"
                    >
                      <span className="studio-label mb-2 block">Your adjustment</span>
                      {adjustment}
                    </p>
                  ) : null}
                  {exercise.project && saved.projectStage === 1 ? (
                    <fieldset className="mt-5 min-w-0">
                      <legend className="font-medium">Choose one musical direction</legend>
                      <div className="mt-3 space-y-3">
                        {exercise.project.choices.map((choice, index) => (
                          <label
                            key={choice.label}
                            className={cn(
                              "flex min-h-14 cursor-pointer items-start gap-3 rounded-lg border p-4 text-sm",
                              saved.projectChoice === index
                                ? "border-ember bg-raised"
                                : "border-border",
                            )}
                          >
                            <input
                              type="radio"
                              name="project-choice"
                              value={index}
                              checked={saved.projectChoice === index}
                              onChange={() =>
                                practiceAction(lesson.id, {
                                  type: "project-choice",
                                  choice: index as 0 | 1,
                                })
                              }
                              className="mt-0.5 size-4 shrink-0 accent-accent"
                            />
                            <span>
                              <span className="block font-medium">{choice.label}</span>
                              <span className="mt-1 block leading-relaxed text-muted">
                                {choice.detail}
                              </span>
                            </span>
                          </label>
                        ))}
                      </div>
                    </fieldset>
                  ) : null}
                  <div className="mt-5 grid grid-cols-2 gap-3">
                    <label className="flex min-w-0 flex-col gap-2 text-sm">
                      Tempo
                      <select
                        aria-label="Practice tempo"
                        value={bpm}
                        onChange={(event) => {
                          playback.stop();
                          practiceAction(lesson.id, {
                            type: "tempo",
                            bpm: Number(event.target.value),
                          });
                        }}
                        className="min-h-11 w-full min-w-0 rounded-md border border-border bg-raised px-2 text-fg"
                      >
                        {PRACTICE_TEMPOS.map((tempo) => (
                          <option key={tempo} value={tempo}>
                            {tempo} BPM
                          </option>
                        ))}
                      </select>
                    </label>
                    <label className="flex min-w-0 flex-col gap-2 text-sm">
                      Guide
                      <select
                        aria-label="Practice guide"
                        value={guide}
                        onChange={(event) => {
                          playback.stop();
                          practiceAction(lesson.id, {
                            type: "guide",
                            guide: event.target.value as PracticeGuide,
                          });
                        }}
                        className="min-h-11 w-full min-w-0 rounded-md border border-border bg-raised px-2 text-fg"
                      >
                        <option value="notes">Notes + click</option>
                        <option value="pulse">Click only</option>
                        <option value="silent">Visual only</option>
                      </select>
                    </label>
                  </div>
                  <p className="mt-3 text-xs leading-relaxed text-muted">
                    Four counts to get ready, then one pass · about{" "}
                    {Math.ceil(((sequence.beats + 4) * 60) / bpm)} seconds. Playback stops at the
                    end.
                  </p>
                  <div className="mt-6 border-t border-border pt-5">
                    <div className="flex flex-wrap items-baseline justify-between gap-3">
                      <h3 className="font-medium">
                        {playback.phase === "count"
                          ? `Count in · ${playback.count} of 4`
                          : `Bar ${bar + 1}${sequence.beats % 4 && bar === bars - 1 ? " · landing" : ` of ${bars}`}`}
                      </h3>
                      <span className="text-xs text-muted">
                        {lesson.instrument === "guitar" || lesson.instrument === "ukulele"
                          ? "↓ down · ↑ up"
                          : "Numbers are beats"}
                        {sequence.subdivision === 4
                          ? " · e, and, a = four equal parts"
                          : sequence.subdivision === 3
                            ? " · slots = three equal parts per beat"
                            : sequence.cues.some((cue) => cue.beat % 1)
                              ? " · and = halfway"
                              : ""}
                      </span>
                    </div>
                    <ol
                      aria-label="Practice pattern"
                      className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4"
                    >
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
                                playback.cursor !== null &&
                                  Math.abs(playback.cursor - cue.beat) < 0.001
                                  ? "font-semibold text-fg"
                                  : "text-muted",
                              )}
                            >
                              {cue.beat % 1 ? (
                                <span className="block text-dim">
                                  {cueSubdivisionLabel(cue.beat, sequence.subdivision)}
                                </span>
                              ) : null}
                              <span>{cue.label}</span>
                              <span className="mt-1 block text-[0.68rem] leading-snug text-dim">
                                {cue.detail}
                              </span>
                            </div>
                          ))}
                        </li>
                      ))}
                    </ol>
                    <div aria-label="Browse pattern bars" className="mt-3 flex flex-wrap gap-2">
                      {Array.from({ length: bars }, (_, index) => (
                        <Button
                          key={index}
                          variant="ghost"
                          aria-pressed={bar === index}
                          disabled={playback.running}
                          onClick={() => setChosenBar(index)}
                          className={cn("min-h-11", bar === index && "bg-raised text-ember")}
                        >
                          Bar {index + 1}
                        </Button>
                      ))}
                    </div>
                    {lesson.instrument === "drums" ? (
                      <p className="mt-2 text-xs leading-relaxed text-muted">
                        K = kick · S = snare · H = hi-hat · + = together
                      </p>
                    ) : null}
                    <Button
                      className="mt-5 w-full"
                      size="lg"
                      onClick={() => {
                        if (playback.running) playback.stop();
                        else {
                          setChosenBar(0);
                          void playback.play(bpm, guide);
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
                        ? "One pass finished. You can try it again or check in below."
                        : playback.running
                          ? "The guide is playing. Stop whenever you need."
                          : "Start when ready. You can also practice with the written pattern."}
                    </p>
                    {playback.audioUnavailable ? (
                      <p
                        role="status"
                        className="mt-3 rounded-lg border border-border p-3 text-sm text-muted"
                      >
                        Audio is unavailable here. You can follow the visual guide; the written
                        pattern has the same notes and rests.
                      </p>
                    ) : null}
                    {exercise.shapes ? (
                      <div
                        className="mt-4 flex flex-wrap justify-center gap-3"
                        aria-label="Exercise chord shapes"
                      >
                        {exercise.shapes.map((chord) => (
                          <ChordDiagram
                            key={chord}
                            shape={practiceShape(lesson.instrument, chord)}
                            compact
                          />
                        ))}
                      </div>
                    ) : null}
                  </div>
                  <PracticeSounds
                    key={`${bpm}-${guide}`}
                    lesson={lesson}
                    exercise={sequence}
                    disabled={playback.running}
                    bpm={bpm}
                  />
                  <details className="mt-4 rounded-lg border border-border p-4">
                    <summary className="min-h-11 cursor-pointer text-sm">
                      See the lesson's practice steps
                    </summary>
                    <ol className="list-decimal space-y-3 pl-5 text-sm leading-relaxed text-muted">
                      {lesson.practice.map((instruction) => (
                        <li key={instruction}>{instruction}</li>
                      ))}
                    </ol>
                  </details>
                  <Button
                    variant="secondary"
                    className="mt-6 h-auto min-h-12 w-full whitespace-normal py-3"
                    size="lg"
                    disabled={
                      !!exercise.project &&
                      saved.projectStage === 1 &&
                      saved.projectChoice === undefined
                    }
                    onClick={
                      exercise.project && saved.projectStage !== 2 ? nextProjectStage : checkIn
                    }
                  >
                    <Check className="size-4 shrink-0" aria-hidden="true" />
                    {projectStage?.button ?? "I tried the exercise"}
                  </Button>
                  <p className="mt-3 text-xs leading-relaxed text-muted">
                    Your own check-in. The app does not listen to or grade your playing here. A
                    short attempt{lesson.instrument === "vocals" ? ", including listening," : ""} is
                    enough.
                  </p>
                  <Button variant="ghost" className="mt-3 w-full" onClick={pause}>
                    {storageOk ? "Save and stop" : "Pause here"}
                  </Button>
                </>
              )}
            </section>
          </>
        )}
      </div>
    </AppShell>
  );
}

export function PracticeSounds({
  lesson,
  exercise,
  disabled,
  bpm,
}: {
  lesson: Pick<LearningLesson, "instrument">;
  exercise: Pick<LessonExercise, "cues" | "positions">;
  disabled: boolean;
  bpm: number;
}) {
  const [active, setActive] = useState<number | null>(null);
  const [position, setPosition] = useState<BassPos | null>(null);
  const [unavailable, setUnavailable] = useState(false);
  const run = useRef<AudioRun | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  function clear() {
    run.current?.stop();
    run.current = null;
    if (timer.current) clearTimeout(timer.current);
    timer.current = null;
    setActive(null);
    setPosition(null);
  }
  useEffect(() => {
    const hide = () => {
      if (document.hidden) clear();
    };
    document.addEventListener("visibilitychange", hide);
    return () => {
      clear();
      document.removeEventListener("visibilitychange", hide);
    };
  }, []);
  useEffect(() => {
    if (disabled) clear();
  }, [disabled]);
  function sound(play: (when: number) => void, mark?: number, pos?: BassPos) {
    clear();
    const audio = unlockAudio();
    if (!audio || audio.state !== "running") {
      setUnavailable(true);
      return;
    }
    setUnavailable(false);
    run.current = scheduleRun(() => play(audio.currentTime + 0.05));
    setActive(mark ?? null);
    setPosition(pos ?? null);
    timer.current = setTimeout(clear, 2200);
  }
  const unique = exercise.cues.filter(
    (cue, index, cues) =>
      cue.notes?.length && cues.findIndex((other) => other.label === cue.label) === index,
  );
  return (
    <details
      className="mt-4 rounded-lg border border-border p-4"
      onToggle={(event) => {
        if (!event.currentTarget.open) clear();
      }}
    >
      <summary className="min-h-11 cursor-pointer text-sm">Explore the sounds</summary>
      <p className="mb-4 text-xs leading-relaxed text-muted">
        Optional synthesized pitch and rhythm references. These controls do not assess your
        instrument.
      </p>
      {lesson.instrument === "drums" ? (
        <DrumPads
          active={active}
          disabled={disabled}
          onHit={(pad) => sound((when) => drumHit(pad, when), pad)}
        />
      ) : lesson.instrument === "bass" && exercise.positions ? (
        <>
          <BassNeck
            marks={exercise.positions}
            active={position}
            disabled={disabled}
            onPlay={(pos) =>
              sound((when) => pianoTone(bassFreq(pos.string, pos.fret), when), undefined, pos)
            }
          />
          {unique.length ? (
            <div className="mt-4 flex flex-wrap gap-2" aria-label="Bass cue sounds">
              {unique.map((cue, index) => (
                <Button
                  key={index}
                  variant="secondary"
                  disabled={disabled}
                  onClick={() => sound((when) => soundPracticeCue(cue, when, bpm), cue.notes?.[0])}
                >
                  {cue.label}
                </Button>
              ))}
            </div>
          ) : null}
        </>
      ) : (
        <>
          <div className="mb-4 flex flex-wrap gap-2">
            {unique.map((cue, index) => (
              <Button
                key={index}
                variant="secondary"
                disabled={disabled}
                title={cue.detail}
                onClick={() => sound((when) => soundPracticeCue(cue, when, bpm), cue.notes?.[0])}
              >
                {cue.label}
              </Button>
            ))}
          </div>
          {lesson.instrument === "piano" || lesson.instrument === "vocals" ? (
            <PianoKeyboard
              activeMidi={active}
              chordPcs={exercise.cues.flatMap((cue) => cue.notes ?? []).map((midi) => midi % 12)}
              disabled={disabled}
              onPlay={(midi) => sound((when) => pianoTone(midiToFreq(midi), when), midi)}
            />
          ) : null}
          {!unique.length ? (
            <Button
              variant="secondary"
              disabled={disabled}
              onClick={() => sound((when) => soundPracticeCue(exercise.cues[0], when, bpm))}
            >
              {lesson.instrument === "vocals"
                ? "Hear the timing reference"
                : "Hear the muted stroke"}
            </Button>
          ) : null}
        </>
      )}
      {unavailable ? (
        <p role="status" className="mt-3 text-sm text-muted">
          Audio is unavailable. You can use the written pattern or try again.
        </p>
      ) : null}
    </details>
  );
}
