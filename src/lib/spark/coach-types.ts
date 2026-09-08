import type { InstrumentId } from "./instruments.ts";
import type { LearningState } from "./learning.ts";

export const COACH_INTENTS = [
  { id: "next", label: "What next?" },
  { id: "stuck", label: "I'm stuck" },
  { id: "explain", label: "Explain an idea" },
  { id: "return", label: "I'm coming back" },
] as const;
export type CoachIntent = (typeof COACH_INTENTS)[number]["id"];
export type CoachEnergy = "low" | "steady" | "ready";
export type CoachRequest = {
  instrument: InstrumentId;
  intent: CoachIntent;
  energy: CoachEnergy;
  minutes: 2 | 5 | 10;
  question: string;
  today: string;
  learning: LearningState;
};
export type CoachTarget = {
  kind: "lesson" | "practice" | "milestone";
  id: string;
  title: string;
  outcome: string;
  reason: string;
};
export type CoachAdvice = {
  message: string;
  why: string;
  tryThis: string;
  stopAfter: string;
  checkIn: string;
};
export type CoachReply = { advice: CoachAdvice; target: CoachTarget };
export type CoachContext = {
  instrument: string;
  experience: string;
  intent: CoachIntent;
  energy: CoachEnergy;
  minutes: 2 | 5 | 10;
  question: string;
  explored: number;
  total: number;
  target: CoachTarget;
  lesson: Record<string, unknown> | null;
  practice: Record<string, unknown> | null;
  milestone: Record<string, unknown> | null;
};
