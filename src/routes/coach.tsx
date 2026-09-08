import { useEffect, useMemo, useRef, useState, type FormEvent } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, ArrowRight, BookOpen, LoaderCircle, MessageCircle } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { Button } from "@/components/ui/button";
import { buildCoachContext, scopeCoachLearning } from "@/lib/spark/coach";
import {
  COACH_INTENTS,
  type CoachAdvice,
  type CoachEnergy,
  type CoachIntent,
  type CoachReply,
  type CoachRequest,
  type CoachTarget,
} from "@/lib/spark/coach-types";
import { INSTRUMENTS, instrumentById, type InstrumentId } from "@/lib/spark/instruments";
import { labSearchFor } from "@/lib/spark/labs";
import { TIME_OPTIONS } from "@/lib/spark/learning-profile";
import { cn, localDayKey } from "@/lib/utils";
import { useLearning } from "@/store/learning";
import { useSpark } from "@/store/spark";

export const Route = createFileRoute("/coach")({ component: CoachPage });

const ENERGY_OPTIONS = [
  { id: "low", label: "Low energy" },
  { id: "steady", label: "Steady" },
  { id: "ready", label: "Ready for more" },
] as const;
type Availability = "checking" | "available" | "unavailable" | "offline";
type SavedReply = { reply: CoachReply; snapshot: string };

/** Treat the reply as text and only allow the current curriculum destination. */
function readReply(value: unknown, target: CoachTarget): CoachReply | null {
  if (!value || typeof value !== "object") return null;
  const reply = value as Partial<CoachReply>;
  if (reply.target?.kind !== target.kind || reply.target?.id !== target.id) return null;
  const advice = reply.advice;
  const fields: (keyof CoachAdvice)[] = ["message", "why", "tryThis", "stopAfter", "checkIn"];
  if (
    !advice ||
    fields.some(
      (field) =>
        typeof advice[field] !== "string" || !advice[field].trim() || advice[field].length > 2000,
    )
  )
    return null;
  return { advice, target };
}

function CoachPage() {
  const instrument = useSpark((s) => s.instrument);
  const selectInstrument = useSpark((s) => s.selectInstrument);
  const sparkReady = useSpark((s) => s.hydrated);
  const learningReady = useLearning((s) => s.hydrated);
  const ready = sparkReady && learningReady;

  return (
    <AppShell wide>
      <div className="mx-auto max-w-2xl px-5 pt-6 md:px-8 md:pt-8">
        <Link to="/learn" className="inline-flex min-h-11 items-center gap-2 text-sm text-muted">
          <ArrowLeft className="size-4" aria-hidden="true" /> Your learning
        </Link>
        <header className="mt-5 flex flex-wrap items-start justify-between gap-5">
          <div className="min-w-0">
            <p className="studio-label flex items-center gap-2">
              <MessageCircle className="size-4 text-ember" aria-hidden="true" /> Your AI music coach
            </p>
            <h1 className="mt-3 font-display text-3xl font-semibold tracking-tight sm:text-4xl">
              Find your next small step.
            </h1>
            <p className="mt-3 max-w-md text-sm leading-relaxed text-muted">
              A little guidance for where you are today. Choose what would help, then take it at
              your pace.
            </p>
          </div>
          <label className="flex flex-col gap-2 text-xs text-muted">
            Instrument
            <select
              aria-label="Coach instrument"
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
        {ready ? (
          <CoachSession key={instrument} instrument={instrument} />
        ) : (
          <p role="status" className="mt-8 text-sm text-muted">
            Finding your place…
          </p>
        )}
      </div>
    </AppShell>
  );
}

function CoachSession({ instrument }: { instrument: InstrumentId }) {
  const data = useLearning((s) => s.data);
  const storageOk = useLearning((s) => s.storageOk);
  const [intent, setIntent] = useState<CoachIntent>("next");
  const [minutes, setMinutes] = useState<CoachRequest["minutes"]>(
    data.profiles[instrument]?.minutes ?? 2,
  );
  const [energy, setEnergy] = useState<CoachEnergy>("steady");
  const [question, setQuestion] = useState("");
  const [accessCode, setAccessCode] = useState("");
  const [availability, setAvailability] = useState<Availability>("checking");
  const [availabilityAttempt, setAvailabilityAttempt] = useState(0);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [savedReply, setSavedReply] = useState<SavedReply | null>(null);
  const request = useRef<AbortController | null>(null);
  const responseHeading = useRef<HTMLHeadingElement>(null);
  const errorHeading = useRef<HTMLParagraphElement>(null);
  const formHeading = useRef<HTMLHeadingElement>(null);
  const snapshot = useMemo(
    () => JSON.stringify(scopeCoachLearning(data, instrument)),
    [data, instrument],
  );
  const today = localDayKey();
  const context = useMemo(
    () =>
      buildCoachContext({
        instrument,
        intent,
        minutes,
        energy,
        question: "",
        today,
        learning: scopeCoachLearning(data, instrument),
      }),
    [data, instrument, intent, minutes, energy, today],
  );
  const reply = savedReply?.snapshot === snapshot ? savedReply.reply : null;

  useEffect(() => {
    const controller = new AbortController();
    setAvailability("checking");
    fetch("/api/coach", { signal: controller.signal, cache: "no-store" })
      .then(async (response) => {
        if (!response.ok) throw new Error("availability");
        const result: unknown = await response.json();
        if (controller.signal.aborted) return;
        if (
          !result ||
          typeof result !== "object" ||
          !("available" in result) ||
          typeof result.available !== "boolean"
        )
          throw new Error("availability");
        setAvailability(result.available ? "available" : "unavailable");
      })
      .catch(() => {
        if (!controller.signal.aborted) setAvailability("offline");
      });
    return () => controller.abort();
  }, [availabilityAttempt]);

  useEffect(() => {
    request.current?.abort();
    request.current = null;
    setPending(false);
    setSavedReply(null);
    setError("");
    setNotice("");
    return () => {
      request.current?.abort();
      request.current = null;
    };
  }, [snapshot]);

  useEffect(() => {
    if (reply) responseHeading.current?.focus();
  }, [reply]);
  useEffect(() => {
    if (error) errorHeading.current?.focus();
  }, [error]);

  function cancel() {
    request.current?.abort();
    request.current = null;
    setPending(false);
    setNotice("Stopped waiting. You can ask again when you’re ready.");
    formHeading.current?.focus();
  }

  async function ask(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (request.current || availability !== "available") return;
    const live = useLearning.getState();
    if (!live.hydrated || useSpark.getState().instrument !== instrument) return;
    const learning = scopeCoachLearning(live.data, instrument);
    const payload: CoachRequest = {
      instrument,
      intent,
      minutes,
      energy,
      question: question.trim(),
      today: localDayKey(),
      learning,
    };
    const expected = buildCoachContext(payload).target;
    const requestedSnapshot = JSON.stringify(learning);
    const controller = new AbortController();
    request.current = controller;
    setPending(true);
    setError("");
    setNotice("");
    setSavedReply(null);
    try {
      const response = await fetch("/api/coach", {
        method: "POST",
        headers: { "Content-Type": "application/json", "X-Spark-Coach-Code": accessCode.trim() },
        body: JSON.stringify(payload),
        signal: controller.signal,
      });
      const body: unknown = await response.json();
      if (controller.signal.aborted || request.current !== controller) return;
      if (!response.ok) {
        const message =
          body && typeof body === "object" && "error" in body && typeof body.error === "string"
            ? body.error.slice(0, 500)
            : "Your coach could not respond this time. Try again when you’re ready.";
        throw new Error(message);
      }
      const result = readReply(body, expected);
      if (!result)
        throw new Error("Your coach could not return a clear next step. Please try again.");
      if (
        useSpark.getState().instrument !== instrument ||
        JSON.stringify(scopeCoachLearning(useLearning.getState().data, instrument)) !==
          requestedSnapshot
      )
        return;
      setSavedReply({ reply: result, snapshot: requestedSnapshot });
    } catch (cause) {
      if (!controller.signal.aborted && request.current === controller) {
        setError(
          cause instanceof Error &&
            !(cause instanceof SyntaxError) &&
            cause.message !== "Failed to fetch"
            ? cause.message
            : "Your coach could not connect. Your guided learning is still available.",
        );
      }
    } finally {
      if (request.current === controller) {
        request.current = null;
        setPending(false);
      }
    }
  }

  return (
    <div className="mt-7">
      <p className="border-y border-border py-4 text-sm text-muted">
        <span className="font-medium text-fg">{instrumentById(instrument).name}</span>
        <span aria-hidden="true"> · </span>
        {context.explored} of {context.total} lessons explored
      </p>
      {!storageOk ? (
        <p role="status" className="mt-4 text-sm leading-relaxed text-warn">
          This browser could not save your learning. Keep this tab open to keep your place.
        </p>
      ) : null}

      {availability === "checking" ? (
        <p role="status" className="mt-7 text-sm text-muted">
          Checking your coach…
        </p>
      ) : availability !== "available" ? (
        <>
          <p role="status" className="mt-7 text-sm leading-relaxed text-muted">
            {availability === "unavailable"
              ? "The AI coach is not available yet. Your guided learning is ready below."
              : "We couldn’t check your coach’s availability. Your guided learning is ready below."}
          </p>
          {availability === "offline" ? (
            <Button
              variant="ghost"
              className="mt-2"
              onClick={() => setAvailabilityAttempt((value) => value + 1)}
            >
              Check again
            </Button>
          ) : null}
          <section
            aria-label="Your guided learning"
            className="mt-5 rounded-xl border border-border bg-surface p-5 sm:p-6"
          >
            <p className="studio-label flex items-center gap-2">
              <BookOpen className="size-4 text-ember" aria-hidden="true" /> Your guided learning
            </p>
            <h2 className="mt-3 font-display text-xl font-semibold">{context.target.title}</h2>
            <p className="mt-2 text-sm leading-relaxed text-muted">{context.target.outcome}</p>
            <p className="mt-3 text-xs leading-relaxed text-muted">
              This next step comes from your saved learning path.
            </p>
            <TargetLink target={context.target} instrument={instrument} snapshot={snapshot} />
          </section>
        </>
      ) : reply ? (
        <section
          aria-label="Your coach’s suggestion"
          className="mt-6 rounded-xl border border-ember/40 bg-surface p-5 sm:p-7"
        >
          <p className="studio-label text-ember">One step for today</p>
          <h2
            ref={responseHeading}
            tabIndex={-1}
            className="mt-3 font-display text-2xl font-semibold"
          >
            {reply.target.title}
          </h2>
          <p className="mt-4 break-words leading-relaxed">{reply.advice.message}</p>
          <p className="mt-3 break-words text-sm leading-relaxed text-muted">{reply.advice.why}</p>
          <div className="mt-6 rounded-lg bg-raised p-4">
            <h3 className="text-sm font-semibold text-ember">Try this</h3>
            <p className="mt-2 break-words text-sm leading-relaxed">{reply.advice.tryThis}</p>
            <h3 className="mt-4 text-sm font-semibold text-ember">A place to stop</h3>
            <p className="mt-2 break-words text-sm leading-relaxed">{reply.advice.stopAfter}</p>
          </div>
          <h3 className="mt-5 text-sm font-semibold">Notice after you try</h3>
          <p className="mt-2 break-words text-sm leading-relaxed text-muted">
            {reply.advice.checkIn}
          </p>
          <TargetLink target={reply.target} instrument={instrument} snapshot={snapshot} />
          <Button
            variant="ghost"
            className="mt-2 h-auto min-h-11 w-full whitespace-normal py-3"
            onClick={() => {
              setSavedReply(null);
              setTimeout(() => formHeading.current?.focus(), 0);
            }}
          >
            Ask another question
          </Button>
          <p className="mt-4 text-xs leading-relaxed text-muted">
            Nothing starts until you choose. This suggestion does not change your progress.
          </p>
        </section>
      ) : (
        <form onSubmit={ask} className="mt-6 rounded-xl border border-border bg-surface p-5 sm:p-7">
          <h2 ref={formHeading} tabIndex={-1} className="font-display text-xl font-semibold">
            What would help right now?
          </h2>
          <fieldset disabled={pending} className="mt-5">
            <legend className="sr-only">What would help right now?</legend>
            <div className="grid grid-cols-2 gap-2">
              {COACH_INTENTS.map((option) => (
                <Choice
                  key={option.id}
                  name="coach-intent"
                  value={option.id}
                  checked={intent === option.id}
                  onChange={() => setIntent(option.id)}
                >
                  {option.label}
                </Choice>
              ))}
            </div>
          </fieldset>
          <details className="mt-5 rounded-lg border border-border bg-bg px-4 py-3">
            <summary className="min-h-11 cursor-pointer text-sm font-medium leading-relaxed">
              Adjust today’s support
              <span className="mt-1 block text-xs font-normal text-muted">
                {minutes} minutes · {ENERGY_OPTIONS.find((option) => option.id === energy)?.label}
              </span>
            </summary>
            <fieldset disabled={pending} className="mt-4">
              <legend className="mb-3 text-sm font-medium">How much room do you have?</legend>
              <div className="grid grid-cols-3 gap-2">
                {TIME_OPTIONS.map((value) => (
                  <Choice
                    key={value}
                    name="coach-minutes"
                    value={String(value)}
                    checked={minutes === value}
                    onChange={() => setMinutes(value)}
                  >
                    {value} min
                  </Choice>
                ))}
              </div>
            </fieldset>
            <fieldset disabled={pending} className="mt-6">
              <legend className="mb-3 text-sm font-medium">How is your energy?</legend>
              <div className="flex flex-wrap gap-2">
                {ENERGY_OPTIONS.map((option) => (
                  <Choice
                    key={option.id}
                    name="coach-energy"
                    value={option.id}
                    checked={energy === option.id}
                    onChange={() => setEnergy(option.id)}
                  >
                    {option.label}
                  </Choice>
                ))}
              </div>
            </fieldset>
          </details>
          <label htmlFor="coach-question" className="mt-6 block text-sm font-medium">
            Anything you want help with? <span className="font-normal text-muted">Optional</span>
          </label>
          <textarea
            id="coach-question"
            value={question}
            maxLength={600}
            disabled={pending}
            rows={3}
            onChange={(event) => setQuestion(event.target.value)}
            placeholder="For example: I keep losing my place when the rhythm changes."
            aria-describedby="coach-question-hint"
            className="mt-3 block w-full resize-y rounded-md border border-border bg-bg p-3 text-sm leading-relaxed placeholder:text-dim disabled:opacity-60"
          />
          <p id="coach-question-hint" className="mt-2 text-xs text-muted">
            Keep it about your music. {question.length}/600 characters
          </p>
          <label htmlFor="coach-access" className="mt-6 block text-sm font-medium">
            Coach access code
          </label>
          <input
            id="coach-access"
            type="password"
            autoComplete="off"
            value={accessCode}
            required
            maxLength={256}
            disabled={pending}
            onChange={(event) => setAccessCode(event.target.value)}
            aria-describedby="coach-access-hint"
            className="mt-3 block min-h-11 w-full rounded-md border border-border bg-bg px-3 text-sm disabled:opacity-60"
          />
          <p id="coach-access-hint" className="mt-2 text-xs leading-relaxed text-muted">
            Use the code provided for the coach pilot. It stays in memory only while this page is
            open.
          </p>
          <p className="mt-6 text-xs leading-relaxed text-muted">
            When you ask, your selected {instrumentById(instrument).name.toLowerCase()} learning
            progress, choices above, and question are sent to OpenAI. No microphone or audio is
            sent. SparkSuite does not save your questions or replies.
          </p>
          {error ? (
            <p
              ref={errorHeading}
              tabIndex={-1}
              role="alert"
              className="mt-4 break-words rounded-md border border-warn p-3 text-sm leading-relaxed text-fg"
            >
              {error}
            </p>
          ) : null}
          {notice ? (
            <p role="status" className="mt-4 text-sm text-muted">
              {notice}
            </p>
          ) : null}
          <Button
            type="submit"
            size="lg"
            disabled={pending}
            className="mt-5 h-auto min-h-12 w-full whitespace-normal py-3"
          >
            {pending ? (
              <>
                <LoaderCircle className="size-4 motion-safe:animate-spin" aria-hidden="true" />{" "}
                Finding one useful step…
              </>
            ) : (
              <>
                <MessageCircle className="size-4" aria-hidden="true" /> Ask my coach
              </>
            )}
          </Button>
          {pending ? (
            <>
              <p role="status" className="sr-only">
                Your coach is preparing a suggestion.
              </p>
              <Button type="button" variant="ghost" onClick={cancel} className="mt-2 w-full">
                Cancel
              </Button>
            </>
          ) : null}
        </form>
      )}
    </div>
  );
}

function Choice({
  name,
  value,
  checked,
  onChange,
  children,
}: {
  name: string;
  value: string;
  checked: boolean;
  onChange: () => void;
  children: React.ReactNode;
}) {
  return (
    <label className="relative flex min-w-0 cursor-pointer">
      <input
        type="radio"
        name={name}
        value={value}
        checked={checked}
        onChange={onChange}
        className="peer sr-only"
      />
      <span
        className={cn(
          "flex min-h-11 w-full items-center justify-center rounded-md border px-3 py-2 text-center text-sm leading-snug peer-focus-visible:outline-2 peer-focus-visible:outline-offset-4 peer-focus-visible:outline-accent peer-disabled:opacity-60",
          checked
            ? "border-ember bg-ember/10 text-ember"
            : "border-border bg-bg text-muted hover:border-ember/50",
        )}
      >
        {children}
      </span>
    </label>
  );
}

function TargetLink({
  target,
  instrument,
  snapshot,
}: {
  target: CoachTarget;
  instrument: InstrumentId;
  snapshot: string;
}) {
  function beforeLaunch(event: React.MouseEvent<HTMLAnchorElement>) {
    if (
      useSpark.getState().instrument !== instrument ||
      JSON.stringify(scopeCoachLearning(useLearning.getState().data, instrument)) !== snapshot
    ) {
      event.preventDefault();
      return;
    }
    if (target.kind === "lesson") useLearning.getState().begin(target.id);
  }
  const className = "mt-6 h-auto min-h-12 w-full whitespace-normal py-3";
  return (
    <Button asChild size="lg" className={className}>
      {target.kind === "milestone" ? (
        <Link to="/milestone" search={{ instrument }} onClick={beforeLaunch}>
          Open my piece <ArrowRight className="size-4 shrink-0" aria-hidden="true" />
        </Link>
      ) : target.kind === "practice" ? (
        <Link
          to="/techniques"
          search={{ ...labSearchFor(instrument), lesson: target.id }}
          onClick={beforeLaunch}
        >
          Open guided practice <ArrowRight className="size-4 shrink-0" aria-hidden="true" />
        </Link>
      ) : (
        <Link to="/learn" onClick={beforeLaunch}>
          Open my lesson <ArrowRight className="size-4 shrink-0" aria-hidden="true" />
        </Link>
      )}
    </Button>
  );
}
