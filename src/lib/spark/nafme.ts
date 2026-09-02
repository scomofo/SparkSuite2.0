import type { ExerciseType, Lesson, NafmeProcess, PlanItem } from "./types";

/**
 * WHAT the artistic process asks — never owns the 10-minute loop.
 *
 * NAfME 2014 Harmonizing Instruments, Novice (H.5a), ADHD-sized:
 * 1. The unit of work is a piece, not a drill — repertoire has a name.
 * 2. Teacher-provided criteria (Pr5). They don't write the rubric.
 * 3. Create is two options, not a blank page (Cr1 Imagine).
 * 4. Respond is one listen + one name (Re7). No quiz shame.
 * 5. Notation is a second picture, not a gate (Pr4.2 "at least some").
 * 6. Select stays with the plan. They name why, they don't pick the day.
 * 7. Interpret is a play-as line during the piece (Pr4.3 / Pr6).
 * 8. Connecting is one everyday sentence, not a worksheet (Cn10 / Cn11).
 */

export const PROCESS_LABEL: Record<NafmeProcess, string> = {
  create: "Make",
  perform: "Play",
  respond: "Listen",
};

const HARMONY: Record<string, string[]> = {
  "G-D-Em-C": ["I", "V", "vi", "IV"],
  "C-G-Am-F": ["I", "V", "vi", "IV"],
  "Em-G": ["i", "III"],
  "C-G": ["I", "V"],
  "C-Am": ["I", "vi"],
  "Am-C": ["vi", "I"],
  "G-D": ["I", "V"],
  "C-F": ["I", "IV"],
  "F-C": ["IV", "I"],
  "G-C": ["V", "I"],
  "Em-C": ["i", "VI"],
};

export function processFor(type: ExerciseType, explicit?: NafmeProcess): NafmeProcess {
  if (explicit) return explicit;
  if (type === "song") return "perform";
  return "perform";
}

export function defaultCriteria(type: ExerciseType, process?: NafmeProcess): string[] {
  if (process === "create") return ["You picked it", "You played it through"];
  if (process === "respond") return ["You listened first", "You named one thing"];
  switch (type) {
    case "transition":
      return ["The pulse doesn't stop", "Prepare two beats early"];
    case "song":
      return ["The loop finishes", "The pulse holds through the change"];
    case "rhythm":
      return ["The hand keeps moving", "Land on one"];
    case "chord":
      return ["The shape is down before the strum"];
    default:
      return [];
  }
}

export function criteriaFor(item: Pick<Lesson | PlanItem, "type" | "process" | "criteria">) {
  if (item.criteria?.length) return item.criteria;
  return defaultCriteria(item.type, item.process);
}

export function processLabel(item: Pick<PlanItem, "process" | "type">) {
  if (item.process) return PROCESS_LABEL[item.process];
  return null;
}

export function rhythmRead(pattern: string) {
  const raw = pattern.replace(/-/g, ".");
  const cells = [...raw].map((ch) => {
    if (ch === "D") return "↓";
    if (ch === "U") return "↑";
    return "·";
  });
  if (cells.length <= 1) return ["↓", "↓", "↓", "↓"];
  return cells;
}

export function analysisFor(chords: string[], explicit?: string[]) {
  if (explicit?.length) return explicit;
  if (chords.length < 2) return undefined;
  return HARMONY[chords.join("-")];
}

export function whyThisPiece(item: PlanItem) {
  if (item.why) return item.why;
  if (item.repertoire) return `This one's called ${item.repertoire}.`;
  return null;
}

export function isProcessLesson(lesson: Lesson) {
  return lesson.process === "create" || lesson.process === "respond";
}

export function chordsFromCreatePick(pick: string, fallback: string[]) {
  if (pick.includes("–")) return pick.split("–").map((s) => s.trim()).filter(Boolean);
  if (/^[A-G]/.test(pick) && !pick.includes(" ")) return [pick];
  return fallback;
}

/** First Make/Listen that's unlocked and not yet done — skip locked ones. */
export function nextUnlockedProcess(lessons: Lesson[], mastery: Record<string, number>, exceptId?: string) {
  return (
    lessons.find((l) => {
      if (!isProcessLesson(l)) return false;
      if (l.id === exceptId) return false;
      if ((mastery[l.id] ?? 0) >= l.masteryRequired) return false;
      return l.prerequisites.every((p) => {
        const req = lessons.find((x) => x.id === p)?.masteryRequired ?? 0.7;
        return (mastery[p] ?? 0) >= req;
      });
    }) ?? null
  );
}

export function processPromise(title: string, process: NafmeProcess | undefined, minutes: number) {
  const verb = process === "create" ? "Make" : process === "respond" ? "Listen" : "Play";
  return `Today: ${title}. ${verb}. ${minutes} minutes.`;
}

/** Pr5 — teacher criteria after the pass. Never a quiz. */
export function refineLine(item: PlanItem, stars: number) {
  if (item.process === "respond") return "You listened. That counts.";
  if (item.process === "create") {
    return stars >= 2 ? "You played the one you picked." : "The idea is yours. Another pass still counts.";
  }
  if (stars >= 2 && item.criteria?.[0]) return item.criteria[0];
  if (stars >= 2) return "Ready enough for today.";
  return "Another pass still counts.";
}
