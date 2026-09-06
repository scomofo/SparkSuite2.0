import type { InstrumentId } from "./instruments.ts";
import { learningSummary, type LearningState } from "./learning.ts";
import { milestoneReady, musicalMilestone } from "./milestones.ts";

export function nextLearningAction(data: LearningState, instrument: InstrumentId, today?: string) {
  const summary = learningSummary(data, instrument, today);
  const piece = musicalMilestone(instrument);
  const saved = data.milestones[instrument];
  const unfinishedPiece = saved && saved.phase !== "saved";
  if (unfinishedPiece && (data.focus[instrument] === "milestone" || !summary.active))
    return { kind: "milestone" as const, reason: "resume" as const, piece, summary };
  if (!summary.active && !summary.due.length && !saved?.saved && milestoneReady(data, instrument))
    return { kind: "milestone" as const, reason: "new" as const, piece, summary };
  return { kind: "lesson" as const, reason: summary.reason, lesson: summary.recommended, summary };
}
