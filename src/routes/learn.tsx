import { useEffect, useRef, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, ArrowRight, BookOpen, Check, CheckCircle2, Clock, Coffee } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { LessonDemo } from "@/components/lesson-demo";
import { Button } from "@/components/ui/button";
import { LEARNING_LEVELS, learningLesson } from "@/lib/spark/curriculum";
import { INSTRUMENTS, instrumentById, type InstrumentId } from "@/lib/spark/instruments";
import { learningSummary } from "@/lib/spark/learning";
import { labSearchFor } from "@/lib/spark/labs";
import { useLearning } from "@/store/learning";
import { useSpark } from "@/store/spark";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/learn")({ component: LearnPage });
const STEPS = ["Understand", "Try it", "Check"];

function LearnPage() {
  const instrument = useSpark((s) => s.instrument);
  const selectInstrument = useSpark((s) => s.selectInstrument);
  const sparkReady = useSpark((s) => s.hydrated);
  const day = useSpark((s) => s.plan.date);
  const { data, hydrated, storageOk, begin, advance, answer, finish, setPace } = useLearning();
  const [selected, setSelected] = useState<string | null>(null);
  const [paused, setPaused] = useState(false);
  const initializedFor = useRef<InstrumentId | null>(null);
  const heading = useRef<HTMLHeadingElement>(null);
  const inst = instrumentById(instrument);
  const summary = learningSummary(data, instrument, day);
  const candidate = selected ? learningLesson(selected) : undefined;
  const lesson = candidate?.instrument === instrument ? candidate : undefined;
  const record = lesson ? data.records[lesson.id] : undefined;
  const step = record?.step ?? 0;
  const ready = hydrated && sparkReady;

  useEffect(() => {
    if (!ready || initializedFor.current === instrument) return;
    initializedFor.current = instrument;
    const id = data.active[instrument];
    setSelected(id && data.records[id]?.step < 3 ? id : null);
    setPaused(false);
  }, [ready, instrument, data]);
  useEffect(() => {
    if (lesson) heading.current?.focus();
  }, [lesson?.id, step, paused]);

  function open(id: string) {
    begin(id);
    setSelected(id);
    setPaused(false);
  }
  function nextStep() {
    if (!lesson) return;
    advance(lesson.id);
    if (data.pace === "step") setPaused(true);
  }
  function showPath() {
    setSelected(null);
    setPaused(false);
  }
  const prerequisite = lesson?.prerequisite ? learningLesson(lesson.prerequisite) : undefined;

  return (
    <AppShell wide>
      <div className="mx-auto max-w-3xl px-5 pt-8 md:px-8">
        <header className="flex flex-wrap items-start justify-between gap-5">
          <div className="min-w-0 max-w-full">
            <p className="studio-label">Learn / Make music at your pace</p>
            <h1 className="mt-2 font-display text-3xl font-semibold tracking-tight sm:text-4xl">
              {inst.name} learning
            </h1>
          </div>
          <label className="flex flex-col gap-2 text-xs text-muted">
            Instrument
            <select
              aria-label="Learning instrument"
              value={instrument}
              disabled={!ready}
              onChange={(event) => selectInstrument(event.target.value as InstrumentId)}
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

        {!ready ? (
          <p role="status" className="mt-8 text-muted">
            Finding your place…
          </p>
        ) : (
          <>
            {!storageOk ? (
              <p
                role="status"
                className="mt-5 rounded-md border border-warn p-4 text-sm text-muted"
              >
                This browser could not save your learning. You can keep going here, but your place
                may be lost when you leave or reload.
              </p>
            ) : null}

            {lesson && record ? (
              <>
                <Button variant="ghost" className="mt-5" onClick={showPath}>
                  <ArrowLeft className="size-4" aria-hidden="true" /> Learning path
                </Button>
                <section
                  aria-label="Current lesson"
                  className="mt-4 rounded-xl border border-border bg-surface p-5 sm:p-8"
                >
                  {step < 3 ? (
                    <ol aria-label="Lesson steps" className="mb-6 flex gap-3 text-xs sm:gap-6">
                      {STEPS.map((name, index) => (
                        <li
                          key={name}
                          aria-current={index === step ? "step" : undefined}
                          className={cn(
                            "flex items-center gap-2",
                            index === step ? "font-semibold text-ember" : "text-muted",
                          )}
                        >
                          {index < step ? (
                            <Check className="size-4" aria-hidden="true" />
                          ) : (
                            <span className="tabular">{index + 1}</span>
                          )}
                          {name}
                        </li>
                      ))}
                    </ol>
                  ) : null}

                  {step === 3 ? (
                    <>
                      <CheckCircle2 className="size-8 text-good" aria-hidden="true" />
                      <h2
                        ref={heading}
                        tabIndex={-1}
                        className="mt-4 font-display text-2xl font-semibold"
                      >
                        A useful step forward.
                      </h2>
                      <p className="mt-3 text-muted">You worked on: {lesson.outcome}</p>
                      <p className="mt-3 text-sm leading-relaxed text-muted">
                        {summary.completed} of {summary.lessons.length} milestones explored. This
                        records your practice attempt and understanding check; keep developing the
                        skill at your own pace.
                      </p>
                      <p className="mt-3 text-sm text-muted">
                        This idea will be offered for another look from {record.reviewOn}. No
                        progress disappears if you take a break.
                      </p>
                      <Button asChild className="mt-6 w-full" size="lg">
                        <Link to="/">Done for now</Link>
                      </Button>
                      {summary.next ? (
                        <Button
                          variant="ghost"
                          className="mt-3 min-h-11 h-auto w-full py-3"
                          onClick={() => open(summary.next!.id)}
                        >
                          Next when ready: {summary.next.title}
                          <ArrowRight className="size-4 shrink-0" aria-hidden="true" />
                        </Button>
                      ) : (
                        <p className="mt-4 text-sm text-muted">
                          You have explored the whole path. Revisit a project, try another
                          instrument, or bring these ideas into a longer piece.
                        </p>
                      )}
                    </>
                  ) : paused ? (
                    <>
                      <Coffee className="size-8 text-ember" aria-hidden="true" />
                      <h2
                        ref={heading}
                        tabIndex={-1}
                        className="mt-4 font-display text-2xl font-semibold"
                      >
                        That step counts.
                      </h2>
                      <p className="mt-3 text-muted">{lesson.title}</p>
                      <p className="mt-3 text-sm leading-relaxed text-muted">
                        {storageOk
                          ? `Your place is saved at “${STEPS[step]}”. Come back when you have room for it.`
                          : `Your next step is “${STEPS[step]}”. Keep this tab open to keep your place.`}
                      </p>
                      <Button asChild className="mt-6 w-full" size="lg">
                        <Link to="/">Done for now</Link>
                      </Button>
                      <Button
                        variant="ghost"
                        className="mt-3 w-full"
                        onClick={() => setPaused(false)}
                      >
                        Continue this lesson
                      </Button>
                    </>
                  ) : (
                    <>
                      <p className="studio-label">
                        Step {step + 1} of 3 · {STEPS[step]}
                      </p>
                      <h2
                        ref={heading}
                        tabIndex={-1}
                        className="mt-2 font-display text-2xl font-semibold sm:text-3xl"
                      >
                        {lesson.title}
                      </h2>
                      <p className="mt-3 font-medium text-ember">{lesson.outcome}</p>
                      {step === 0 ? (
                        <>
                          <p className="mt-5 leading-relaxed text-fg">{lesson.explanation}</p>
                          <div className="mt-5 rounded-lg bg-raised p-4">
                            <p className="studio-label">A concrete example</p>
                            <p className="mt-2 text-sm leading-relaxed">{lesson.example}</p>
                            {lesson.demo ? <LessonDemo key={lesson.id} demo={lesson.demo} /> : null}
                          </div>
                          {prerequisite && !data.records[prerequisite.id]?.completedOn ? (
                            <p className="mt-4 text-sm leading-relaxed text-muted">
                              Builds on{" "}
                              <button
                                className="min-h-11 text-left text-ember underline underline-offset-4"
                                onClick={() => open(prerequisite.id)}
                              >
                                {prerequisite.title}
                              </button>
                              . You can explore this level now or revisit that first.
                            </p>
                          ) : null}
                          <Button className="mt-6 w-full" size="lg" onClick={nextStep}>
                            Got the idea
                            <ArrowRight className="size-4" aria-hidden="true" />
                          </Button>
                        </>
                      ) : step === 1 ? (
                        <>
                          <p className="mt-4 text-sm text-muted">
                            Try one slow pass. A rough attempt is enough to move on; you can repeat
                            it later.
                          </p>
                          <ol className="mt-5 space-y-4">
                            {lesson.practice.map((instruction, index) => (
                              <li key={instruction} className="flex gap-3 leading-relaxed">
                                <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-raised text-sm text-ember">
                                  {index + 1}
                                </span>
                                <span>{instruction}</span>
                              </li>
                            ))}
                          </ol>
                          <details className="mt-5 rounded-lg border border-border p-4">
                            <summary className="min-h-11 cursor-pointer text-sm text-muted">
                              Show the example again
                            </summary>
                            <p className="mt-2 text-sm leading-relaxed">{lesson.example}</p>
                          </details>
                          <Button className="mt-6 w-full" size="lg" onClick={nextStep}>
                            I tried it
                            <ArrowRight className="size-4" aria-hidden="true" />
                          </Button>
                          <p className="mt-2 text-xs leading-relaxed text-muted">
                            Your own practice check-in. The app does not listen to or grade your
                            instrument here.
                          </p>
                        </>
                      ) : (
                        <>
                          <fieldset className="mt-6 min-w-0">
                            <legend className="text-lg font-medium">{lesson.question}</legend>
                            <div className="mt-4 space-y-3">
                              {lesson.options.map((option, index) => (
                                <label
                                  key={option}
                                  className={cn(
                                    "flex min-h-12 cursor-pointer items-center gap-3 rounded-lg border p-4 text-sm leading-relaxed",
                                    record.answer === index
                                      ? "border-ember bg-raised"
                                      : "border-border",
                                  )}
                                >
                                  <input
                                    type="radio"
                                    name={`answer-${lesson.id}`}
                                    value={index}
                                    checked={record.answer === index}
                                    onChange={() => answer(lesson.id, index)}
                                    className="size-4 shrink-0 accent-accent"
                                  />
                                  <span>{option}</span>
                                </label>
                              ))}
                            </div>
                          </fieldset>
                          {record.answer !== undefined ? (
                            <div
                              role="status"
                              className="mt-4 rounded-lg bg-raised p-4 text-sm leading-relaxed"
                            >
                              <p className="font-semibold text-ember">
                                {record.answer === lesson.answer
                                  ? "That's the idea."
                                  : "Take another look. You can try again."}
                              </p>
                              <p className="mt-2">{lesson.feedback}</p>
                            </div>
                          ) : (
                            <p className="mt-4 text-sm text-muted">
                              Take your time. You can change your answer; there is no penalty.
                            </p>
                          )}
                          <details className="mt-4 text-sm text-muted">
                            <summary className="min-h-11 cursor-pointer">
                              Look back at the explanation
                            </summary>
                            <p className="leading-relaxed">{lesson.explanation}</p>
                          </details>
                          <Button
                            className="mt-6 w-full"
                            size="lg"
                            disabled={record.answer !== lesson.answer}
                            onClick={() => finish(lesson.id)}
                          >
                            Finish this lesson
                            <Check className="size-4" aria-hidden="true" />
                          </Button>
                        </>
                      )}
                      <Button
                        variant="ghost"
                        className="mt-3 w-full"
                        onClick={() => setPaused(true)}
                      >
                        {storageOk ? "Save and stop" : "Pause here"}
                      </Button>
                    </>
                  )}
                </section>
              </>
            ) : (
              <>
                <p className="mt-4 leading-relaxed text-muted">
                  One idea, one attempt, one check. Start from zero or explore a later level. Every
                  level is open.
                </p>
                <section
                  aria-label="Your next learning step"
                  className="mt-6 rounded-xl border border-border bg-surface p-5 sm:p-7"
                >
                  <p className="studio-label">
                    {summary.reason === "resume"
                      ? "Your place is waiting"
                      : summary.reason === "review"
                        ? "Bring one idea back"
                        : summary.reason === "explore"
                          ? "Your path, revisited"
                          : "Your next small step"}
                  </p>
                  <h2 className="mt-3 font-display text-2xl font-semibold">
                    {summary.recommended.title}
                  </h2>
                  <p className="mt-3 text-muted">{summary.recommended.outcome}</p>
                  <fieldset className="mt-6 min-w-0">
                    <legend className="text-sm font-medium">How much room do you have?</legend>
                    <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
                      {(
                        [
                          ["step", "One step", "Start with about 2 minutes"],
                          ["lesson", "A whole lesson", "About 5–10 minutes, at your pace"],
                        ] as const
                      ).map(([pace, title, detail]) => (
                        <label
                          key={pace}
                          className={cn(
                            "flex min-h-16 cursor-pointer items-center gap-3 rounded-lg border p-4",
                            data.pace === pace ? "border-ember bg-raised" : "border-border",
                          )}
                        >
                          <input
                            type="radio"
                            name="learning-pace"
                            value={pace}
                            checked={data.pace === pace}
                            onChange={() => setPace(pace)}
                            className="size-4 shrink-0 accent-accent"
                          />
                          <span>
                            <span className="block text-sm font-medium">{title}</span>
                            <span className="mt-1 block text-xs leading-relaxed text-muted">
                              {detail}
                            </span>
                          </span>
                        </label>
                      ))}
                    </div>
                  </fieldset>
                  <Button
                    className="mt-5 w-full"
                    size="lg"
                    onClick={() => open(summary.recommended.id)}
                  >
                    <BookOpen className="size-4" aria-hidden="true" />
                    {summary.reason === "resume"
                      ? "Continue where I left off"
                      : summary.reason === "review"
                        ? "Review this idea"
                        : "Start learning"}
                  </Button>
                  {summary.reason === "review" && summary.next ? (
                    <Button
                      variant="ghost"
                      className="mt-2 w-full"
                      onClick={() => open(summary.next!.id)}
                    >
                      Learn something new instead
                    </Button>
                  ) : null}
                  <p className="mt-3 text-xs leading-relaxed text-muted">
                    {storageOk
                      ? "Your place saves in this browser, even across days. Stop whenever you need."
                      : "Saving is unavailable. Keep this tab open if you take a break."}
                  </p>
                </section>

                <section aria-label="Curriculum roadmap" className="mt-8">
                  <div className="flex flex-wrap items-baseline justify-between gap-3">
                    <h2 className="font-display text-2xl font-semibold">Your learning path</h2>
                    <p className="text-sm text-muted">
                      {summary.completed} / {summary.lessons.length} milestones explored
                    </p>
                  </div>
                  <progress
                    className="studio-progress mt-4"
                    max={summary.lessons.length}
                    value={summary.completed}
                    aria-label="Learning milestones explored"
                  />
                  <div className="mt-5 space-y-3">
                    {LEARNING_LEVELS.map((level, levelIndex) => {
                      const lessons = summary.lessons.filter((item) => item.level === level.id);
                      const count = lessons.filter(
                        (item) => data.records[item.id]?.completedOn,
                      ).length;
                      return (
                        <details
                          key={`${instrument}-${level.id}`}
                          open={level.id === summary.recommended.level ? true : undefined}
                          className="rounded-lg border border-border bg-surface p-4 sm:p-5"
                        >
                          <summary className="min-h-11 cursor-pointer font-medium">
                            <span className="ml-2">
                              {levelIndex + 1}. {level.title}
                            </span>
                            <span className="ml-3 text-xs text-muted">
                              {count}/{lessons.length}
                            </span>
                          </summary>
                          <p className="mt-2 text-sm text-muted">{level.outcome}</p>
                          <ul className="mt-4 divide-y divide-border">
                            {lessons.map((item) => {
                              const saved = data.records[item.id];
                              const status = saved?.completedOn
                                ? "Explored"
                                : saved
                                  ? "In progress"
                                  : "Ready to explore";
                              return (
                                <li key={item.id}>
                                  <button
                                    onClick={() => open(item.id)}
                                    className="flex min-h-16 w-full items-center gap-3 py-4 text-left"
                                  >
                                    {saved?.completedOn ? (
                                      <CheckCircle2
                                        className="size-5 shrink-0 text-good"
                                        aria-hidden="true"
                                      />
                                    ) : (
                                      <BookOpen
                                        className="size-5 shrink-0 text-muted"
                                        aria-hidden="true"
                                      />
                                    )}
                                    <span className="min-w-0 flex-1">
                                      <span className="block font-medium">{item.title}</span>
                                      <span className="mt-1 block text-xs text-muted">
                                        {status}
                                      </span>
                                    </span>
                                    <ArrowRight
                                      className="size-4 shrink-0 text-muted"
                                      aria-hidden="true"
                                    />
                                  </button>
                                </li>
                              );
                            })}
                          </ul>
                        </details>
                      );
                    })}
                  </div>
                </section>
                <section
                  aria-label="Keep making music"
                  className="mt-6 mb-5 rounded-lg border border-border p-5"
                >
                  <p className="flex items-center gap-2 font-medium">
                    <Clock className="size-4" aria-hidden="true" /> Put an idea into practice
                  </p>
                  <p className="mt-2 text-sm leading-relaxed text-muted">
                    Use the technique lab or today's timed loop alongside these lessons. Learning
                    milestones and on-screen timing scores track different kinds of practice.
                  </p>
                  <div className="mt-3 flex flex-wrap gap-x-6 gap-y-2">
                    <Link
                      to="/techniques"
                      search={labSearchFor(instrument)}
                      className="inline-flex min-h-11 items-center text-sm text-ember"
                    >
                      Open technique lab
                    </Link>
                    <Link
                      to="/today"
                      className="inline-flex min-h-11 items-center text-sm text-ember"
                    >
                      Open today's loop
                    </Link>
                  </div>
                </section>
              </>
            )}
          </>
        )}
      </div>
    </AppShell>
  );
}
