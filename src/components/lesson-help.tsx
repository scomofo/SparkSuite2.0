import { useState } from "react";
import { LessonDemo } from "@/components/lesson-demo";
import type { LearningLesson } from "@/lib/spark/curriculum";

/** Keep help in the lesson so an answer and the learner's place survive a refresher. */
export function LessonHelp({
  lesson,
  checking = false,
  onReveal,
}: {
  lesson: LearningLesson;
  checking?: boolean;
  onReveal?: () => void;
}) {
  const [open, setOpen] = useState(false);
  return (
    <details
      className="mt-5 rounded-lg border border-border p-4 text-sm text-muted"
      onToggle={(event) => {
        const revealed = event.currentTarget.open;
        setOpen(revealed);
        if (revealed) onReveal?.();
      }}
    >
      <summary className="min-h-11 cursor-pointer font-medium text-fg">
        {checking ? "Look back at the explanation" : "Show the example again"}
      </summary>
      {open ? (
        <div className="space-y-3 leading-relaxed">
          {checking ? <p>{lesson.explanation}</p> : null}
          <p>{lesson.example}</p>
          {lesson.demo ? <LessonDemo demo={lesson.demo} instrument={lesson.instrument} /> : null}
          {checking ? (
            <p>
              Help is part of practice. Use the example, then choose again when you are ready. Using
              help still counts toward completing the lesson.
            </p>
          ) : null}
        </div>
      ) : null}
    </details>
  );
}
