export type ExerciseType =
  | "warmup"
  | "chord"
  | "transition"
  | "rhythm"
  | "song"
  | "skill";

export type ItemRole = "warmup" | "new" | "review" | "challenge";

export type NafmeProcess = "create" | "perform" | "respond";

export type ListenPrompt = {
  a: string;
  b: string;
  ask: string;
  answer: "same" | "different";
};

export type Lesson = {
  id: string;
  title: string;
  skill: string;
  trackId: string;
  order: number;
  type: ExerciseType;
  objectives: string[];
  chords: string[];
  pattern: string;
  bars: number;
  bpm: number;
  prerequisites: string[];
  masteryRequired: number;
  /** Named piece — NAfME Novice repertoire, not a drill title. */
  repertoire?: string;
  /** Teacher-provided criteria (MU:Pr5.1.H.5a). */
  criteria?: string[];
  process?: NafmeProcess;
  /** Two harmonic ideas. Create is a pick, not a blank page. */
  createOptions?: string[];
  listenPrompt?: ListenPrompt;
  /** Select/Connect — one everyday sentence. They don't pick the day. */
  why?: string;
  /** Pr4.3 / Pr6 — play-as, not a lecture. */
  interpret?: string;
  /** Pr4.2 harmonic picture (I–V–vi–IV). Second picture, not a gate. */
  analysis?: string[];
};

export type ChordShape = {
  id: string;
  name: string;
  /** Low E → high e, fret or null if muted. 0 = open. */
  frets: (number | null)[];
  fingers: (number | null)[];
  notes: string[];
};

export type PlanItem = {
  id: string;
  type: ExerciseType;
  title: string;
  subtitle: string;
  durationSec: number;
  lessonId: string;
  chords: string[];
  pattern: string;
  bars: number;
  bpm: number;
  surface?: "strings" | "keys" | "pads" | "voice";
  stringCount?: number;
  /** Hit window from psychology.feelFor. Wider on rough days. */
  windowMs?: number;
  /** Full lesson objectives — UDL: show the goal, not just the first line. */
  objectives?: string[];
  /** Place in today's loop. Warmup / new / review / groove. */
  role?: ItemRole;
  repertoire?: string;
  criteria?: string[];
  process?: NafmeProcess;
  createOptions?: string[];
  listenPrompt?: ListenPrompt;
  /** Set for the play pass after a create pick. */
  createPick?: string;
  why?: string;
  interpret?: string;
  analysis?: string[];
};

export type DailyPlan = {
  date: string;
  minutes: number;
  promise: string;
  items: PlanItem[];
};

export type HitJudge = "perfect" | "good" | "ok" | "miss";

export type HitEvent = {
  t: number;
  judge: HitJudge;
  deltaMs: number;
};

export type ItemResult = {
  itemId: string;
  lessonId: string;
  hits: number;
  misses: number;
  accuracy: number;
  stars: number;
  xp: number;
};

export type SessionResult = {
  date: string;
  accuracy: number;
  stars: number;
  xp: number;
  items: ItemResult[];
  peakCombo?: number;
  leveledUp?: boolean;
  newMarks?: string[];
  prevLevel?: number;
};

export type DayCheckin = "locked" | "through" | "enough";

export type ProgressState = {
  version: number;
  xp: number;
  level: number;
  streak: number;
  lastPlayedDay: string | null;
  mastery: Record<string, number>;
  lastAccuracy: number;
  history: { date: string; accuracy: number; xp: number }[];
  dailyComplete: Record<string, boolean>;
  bestCombo: number;
  marks: string[];
  /** Yesterday's one-tap feel. Consumed after the next finished day. */
  lastCheckin: DayCheckin | null;
};

export const SAVE_VERSION = 4;

export const JUDGE_WINDOWS: Record<Exclude<HitJudge, "miss">, number> = {
  perfect: 70,
  good: 140,
  ok: 220,
};
