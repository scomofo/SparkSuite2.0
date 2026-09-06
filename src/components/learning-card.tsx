import { Link } from "@tanstack/react-router";
import { BookOpen } from "lucide-react";
import { learningSummary } from "@/lib/spark/learning";
import { labSearchFor } from "@/lib/spark/labs";
import { useLearning } from "@/store/learning";
import { useSpark } from "@/store/spark";

/** The same next action follows the selected instrument from the studio into Today. */
export function LearningCard() {
  const instrument = useSpark((s) => s.instrument);
  const day = useSpark((s) => s.plan.date);
  const { data, hydrated } = useLearning();
  if (!hydrated) return null;
  const summary = learningSummary(data, instrument, day);
  const record = data.records[summary.recommended.id];
  const resumePractice = summary.reason === "resume" && record?.step === 1 && record.practice;
  return (
    <section
      aria-label="Guided learning"
      className="rounded-xl border border-border bg-surface p-5 sm:p-6"
    >
      <div className="flex items-center gap-2 text-ember">
        <BookOpen className="size-5" aria-hidden="true" />
        <p className="studio-label">One small step</p>
      </div>
      <h2 className="mt-3 font-display text-xl font-semibold">{summary.recommended.title}</h2>
      <p className="mt-2 text-sm leading-relaxed text-muted">{summary.recommended.outcome}</p>
      <p className="mt-3 text-xs text-muted">
        {summary.completed} / {summary.lessons.length} learning milestones · Start with about 2
        minutes
      </p>
      {resumePractice ? (
        <Link
          to="/techniques"
          search={{ ...labSearchFor(instrument), lesson: summary.recommended.id }}
          className="mt-3 inline-flex min-h-11 items-center gap-2 font-medium text-ember"
        >
          Resume guided exercise <span aria-hidden="true">→</span>
        </Link>
      ) : (
        <Link
          to="/learn"
          className="mt-3 inline-flex min-h-11 items-center gap-2 font-medium text-ember"
        >
          {summary.reason === "resume"
            ? "Resume learning"
            : summary.reason === "review"
              ? "Revisit one idea"
              : "Open learning path"}
          <span aria-hidden="true">→</span>
        </Link>
      )}
    </section>
  );
}
