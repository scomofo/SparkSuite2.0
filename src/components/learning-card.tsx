import { Link } from "@tanstack/react-router";
import { BookOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { nextLearningAction } from "@/lib/spark/next-learning-action";
import { timePlan } from "@/lib/spark/learning-profile";
import { labSearchFor } from "@/lib/spark/labs";
import { useLearning } from "@/store/learning";
import { useSpark } from "@/store/spark";

/** One recommendation follows the selected instrument from the studio into Today. */
export function LearningCard() {
  const instrument = useSpark((s) => s.instrument);
  const day = useSpark((s) => s.plan.date);
  const sparkReady = useSpark((s) => s.hydrated);
  const { data, hydrated, storageOk, begin, skipSetup } = useLearning();
  if (!hydrated || !sparkReady) return null;
  const next = nextLearningAction(data, instrument, day);
  const profile = data.profiles[instrument];
  const hasWork =
    next.summary.lessons.some((lesson) => data.records[lesson.id]) || data.milestones[instrument];
  const showSetup = !profile && !data.skippedSetup[instrument] && !hasWork;
  const record = next.kind === "lesson" ? data.records[next.lesson.id] : undefined;
  const resumePractice = next.reason === "resume" && record?.step === 1 && record.practice;
  return (
    <section
      aria-label="Guided learning"
      className="rounded-xl border border-border bg-surface p-5 sm:p-6"
    >
      <div className="flex items-center gap-2 text-ember">
        <BookOpen className="size-5" aria-hidden="true" />
        <p className="studio-label">
          {showSetup
            ? "Your starting point"
            : profile
              ? `Room for ${profile.minutes} minutes`
              : "One small step"}
        </p>
      </div>
      <h2 className="mt-3 font-display text-xl font-semibold">
        {showSetup
          ? "Start where you are."
          : next.kind === "milestone"
            ? next.piece.title
            : next.lesson.title}
      </h2>
      <p className="mt-2 text-sm leading-relaxed text-muted">
        {showSetup
          ? "Choose your instrument, experience, and time for one clear next step."
          : next.kind === "milestone"
            ? next.piece.goal
            : next.lesson.outcome}
      </p>
      {showSetup ? (
        <div className="mt-4 flex flex-wrap items-center gap-2">
          <Button asChild className="h-auto min-h-11 whitespace-normal py-3">
            <Link to="/start">Choose my starting point</Link>
          </Button>
          <Button variant="ghost" onClick={() => skipSetup(instrument)}>
            Skip setup
          </Button>
        </div>
      ) : (
        <>
          <p className="mt-3 text-xs text-muted">
            {profile
              ? timePlan(profile.minutes)
              : `${next.summary.completed} / ${next.summary.lessons.length} learning milestones · Start with about 2 minutes`}
          </p>
          {next.kind === "milestone" ? (
            <Link
              to="/milestone"
              search={{ instrument }}
              className="mt-3 inline-flex min-h-11 items-center gap-2 font-medium text-ember"
            >
              {next.reason === "resume" ? "Resume my piece" : "Try my first piece"}
              <span aria-hidden="true">→</span>
            </Link>
          ) : resumePractice ? (
            <Link
              to="/techniques"
              search={{ ...labSearchFor(instrument), lesson: next.lesson.id }}
              className="mt-3 inline-flex min-h-11 items-center gap-2 font-medium text-ember"
            >
              Resume guided exercise <span aria-hidden="true">→</span>
            </Link>
          ) : (
            <Link
              to="/learn"
              onClick={() => {
                if (profile) begin(next.lesson.id);
              }}
              className="mt-3 inline-flex min-h-11 items-center gap-2 font-medium text-ember"
            >
              {next.reason === "resume"
                ? "Resume learning"
                : next.reason === "review"
                  ? "Revisit one idea"
                  : profile
                    ? "Start my next lesson"
                    : "Open learning path"}
              <span aria-hidden="true">→</span>
            </Link>
          )}
          <div>
            <Link
              to="/start"
              className="inline-flex min-h-11 items-center text-xs text-muted underline underline-offset-4"
            >
              {profile ? "Adjust my starting point or time" : "Choose a starting point"}
            </Link>
          </div>
        </>
      )}
      {!storageOk ? (
        <p role="status" className="mt-3 text-sm text-warn">
          This browser could not save your learning. Keep this tab open to keep your place.
        </p>
      ) : null}
    </section>
  );
}
