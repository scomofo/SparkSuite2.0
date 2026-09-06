import { useEffect, useRef, useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { Button } from "@/components/ui/button";
import { INSTRUMENTS, type InstrumentId } from "@/lib/spark/instruments";
import {
  EXPERIENCE_OPTIONS,
  TIME_OPTIONS,
  startingLesson,
  timePlan,
  type LearningProfile,
} from "@/lib/spark/learning-profile";
import { useLearning } from "@/store/learning";
import { useSpark } from "@/store/spark";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/start")({ component: StartPage });

function StartPage() {
  const navigate = useNavigate();
  const { data, hydrated, configure, skipSetup } = useLearning();
  const active = useSpark((s) => s.instrument);
  const sparkReady = useSpark((s) => s.hydrated);
  const selectInstrument = useSpark((s) => s.selectInstrument);
  const [instrument, setInstrument] = useState<InstrumentId>(active);
  const [profile, setProfile] = useState<LearningProfile>({ experience: "new", minutes: 2 });
  const initialized = useRef(false);
  const ready = hydrated && sparkReady;
  useEffect(() => {
    if (!ready || initialized.current) return;
    initialized.current = true;
    setInstrument(active);
    setProfile(data.profiles[active] ?? { experience: "new", minutes: 2 });
  }, [ready, active, data.profiles]);
  const suggested = startingLesson(instrument, profile);
  const activeId = data.active[instrument];
  const hasUnfinished =
    (activeId && data.records[activeId]?.step < 3) ||
    (data.milestones[instrument] && data.milestones[instrument]?.phase !== "saved");

  return (
    <AppShell wide>
      <div className="mx-auto max-w-2xl px-5 pt-6 pb-5 md:px-8">
        <Link to="/" className="inline-flex min-h-11 items-center gap-2 text-sm text-muted">
          <ArrowLeft className="size-4" aria-hidden="true" /> Back to studio
        </Link>
        <p className="studio-label mt-5">Your starting point</p>
        <h1 className="mt-3 font-display text-3xl font-semibold tracking-tight sm:text-4xl">
          Make room for your kind of practice.
        </h1>
        <p className="mt-4 leading-relaxed text-muted">
          Three choices to find a first step. Change them whenever you like; every lesson stays
          open.
        </p>
        {!ready ? (
          <p role="status" className="mt-8 text-muted">
            Finding your place…
          </p>
        ) : (
          <form
            className="mt-7 space-y-7"
            onSubmit={(event) => {
              event.preventDefault();
              configure(instrument, profile);
              selectInstrument(instrument);
              void navigate({ to: "/" });
            }}
          >
            <label className="flex flex-col gap-3 font-medium">
              1. What would you like to play?
              <select
                aria-label="Setup instrument"
                value={instrument}
                onChange={(event) => {
                  const id = event.target.value as InstrumentId;
                  setInstrument(id);
                  setProfile(data.profiles[id] ?? { experience: "new", minutes: 2 });
                }}
                className="min-h-12 w-full rounded-lg border border-border bg-surface px-4 text-sm text-fg"
              >
                {INSTRUMENTS.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.name}
                  </option>
                ))}
              </select>
            </label>
            <fieldset className="min-w-0">
              <legend className="font-medium">2. What feels familiar on this instrument?</legend>
              <div className="mt-3 grid gap-3 sm:grid-cols-2">
                {EXPERIENCE_OPTIONS.map((option) => (
                  <label
                    key={option.id}
                    className={cn(
                      "flex min-h-16 cursor-pointer items-center gap-3 rounded-lg border p-4 text-sm",
                      profile.experience === option.id
                        ? "border-ember bg-raised"
                        : "border-border bg-surface",
                    )}
                  >
                    <input
                      type="radio"
                      name="experience"
                      value={option.id}
                      checked={profile.experience === option.id}
                      onChange={() => setProfile({ ...profile, experience: option.id })}
                      className="size-4 shrink-0 accent-accent"
                    />
                    <span>{option.label}</span>
                  </label>
                ))}
              </div>
            </fieldset>
            <fieldset className="min-w-0">
              <legend className="font-medium">3. How much room do you have today?</legend>
              <div className="mt-3 grid grid-cols-3 gap-2 sm:gap-3">
                {TIME_OPTIONS.map((minutes) => (
                  <label
                    key={minutes}
                    className={cn(
                      "flex min-h-16 cursor-pointer flex-wrap items-center justify-center gap-2 rounded-lg border p-3 text-sm",
                      profile.minutes === minutes
                        ? "border-ember bg-raised"
                        : "border-border bg-surface",
                    )}
                  >
                    <input
                      type="radio"
                      name="minutes"
                      value={minutes}
                      checked={profile.minutes === minutes}
                      onChange={() => setProfile({ ...profile, minutes })}
                      className="size-4 shrink-0 accent-accent"
                    />
                    <span>{minutes} min</span>
                  </label>
                ))}
              </div>
              <p className="mt-3 text-sm text-muted">
                {timePlan(profile.minutes)} This is a guide, with no countdown.
              </p>
            </fieldset>
            <section
              aria-label="Suggested starting lesson"
              aria-live="polite"
              className="rounded-xl border border-ember/40 bg-surface p-5"
            >
              <p className="studio-label">A place to start</p>
              <h2 className="mt-3 font-display text-xl font-semibold">{suggested.title}</h2>
              <p className="mt-2 text-sm leading-relaxed text-muted">{suggested.outcome}</p>
              {hasUnfinished ? (
                <p className="mt-3 text-sm text-ember">
                  Your unfinished work stays first. This choice guides new lessons after that.
                </p>
              ) : null}
            </section>
            <div>
              <Button type="submit" size="lg" className="w-full">
                Show my next step <ArrowRight className="size-4" aria-hidden="true" />
              </Button>
              <Button
                type="button"
                variant="ghost"
                className="mt-2 w-full"
                onClick={() => {
                  skipSetup(active);
                  void navigate({ to: "/" });
                }}
              >
                Skip setup
              </Button>
            </div>
          </form>
        )}
      </div>
    </AppShell>
  );
}
