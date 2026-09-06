import { learningPath } from "./curriculum.ts";
import type { InstrumentId } from "./instruments.ts";

export const EXPERIENCE_OPTIONS = [
  {
    id: "new",
    label: "Starting from zero",
    detail: "Find the instrument and a steady pulse.",
    start: 0,
  },
  {
    id: "basics",
    label: "I know a few basics",
    detail: "Connect notes, chords, and simple rhythms.",
    start: 2,
  },
  {
    id: "intermediate",
    label: "I play comfortably",
    detail: "Work on control and musical choices.",
    start: 4,
  },
  {
    id: "advanced",
    label: "Ready for advanced work",
    detail: "Explore arranging, expression, and harmony.",
    start: 6,
  },
] as const;
export const TIME_OPTIONS = [2, 5, 10] as const;
export type LearningProfile = {
  experience: (typeof EXPERIENCE_OPTIONS)[number]["id"];
  minutes: 2 | 5 | 10;
};

export function parseProfile(raw: unknown): LearningProfile | undefined {
  if (!raw || typeof raw !== "object") return undefined;
  const value = raw as Record<string, unknown>;
  const experience = EXPERIENCE_OPTIONS.find((option) => option.id === value.experience);
  if (!experience) return undefined;
  return {
    experience: experience.id,
    minutes: value.minutes === 5 || value.minutes === 10 ? value.minutes : 2,
  };
}
export function startingLesson(instrument: InstrumentId, profile?: LearningProfile) {
  const index = EXPERIENCE_OPTIONS.find((option) => option.id === profile?.experience)?.start ?? 0;
  return learningPath(instrument)[index];
}
export function timePlan(minutes = 2) {
  return minutes === 2
    ? "One small step, then a place to pause."
    : minutes === 5
      ? "One lesson or one short piece, at your pace."
      : "One lesson or piece, with room to revisit a tricky part.";
}
