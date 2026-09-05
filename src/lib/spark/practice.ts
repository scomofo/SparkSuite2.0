import { JUDGE_WINDOWS, type HitJudge, type ItemResult, type PlanItem } from "./types.ts";

export type NoteEvent = {
  t: number;
  kind: "down" | "up" | "pluck";
  string?: number;
  chord?: string;
  bar: number;
  beat: number;
};

export function patternBeats(pattern: string): ("down" | "up" | "rest")[] {
  const raw = pattern.replace(/-/g, ".");
  const out: ("down" | "up" | "rest")[] = [];
  for (const ch of raw) {
    if (ch === "D") out.push("down");
    else if (ch === "U") out.push("up");
    else out.push("rest");
  }
  return out.length ? out : ["down"];
}

/**
 * True when the item drills a specific string / pad / key on each beat, so the
 * timeline carries an expected `string` and the UI shows the picker for it.
 * Listen (respond) and Make (create) passes are played with the generic
 * strum / play control, so they must never expect a specific string — the
 * generic control cannot satisfy one and every tap would be a miss.
 */
export function isPluckDrill(item: Pick<PlanItem, "type" | "process">) {
  return (item.type === "warmup" || item.type === "skill") && item.process !== "respond" && item.process !== "create";
}

/** Build an abstract exercise timeline in seconds from bar 0. */
export function buildTimeline(item: PlanItem): NoteEvent[] {
  if (item.surface === "pads") return drumTimeline(item);
  const drill = isPluckDrill(item);
  if ((item.surface === "keys" || item.surface === "voice") && drill) {
    return keyWarmup(item);
  }

  const steps = patternBeats(item.pattern);
  const beatSec = 60 / item.bpm;
  const events: NoteEvent[] = [];
  const chordEveryBars =
    item.type === "transition"
      ? 2
      : item.chords.length
        ? Math.max(1, Math.floor(item.bars / item.chords.length) || 2)
        : 2;

  if (drill) {
    const n = Math.max(1, item.stringCount ?? 6);
    for (let bar = 0; bar < item.bars; bar++) {
      for (let beat = 0; beat < 4; beat++) {
        const string = n - 1 - ((bar * 4 + beat) % n);
        events.push({
          t: (bar * 4 + beat) * beatSec,
          kind: "pluck",
          string,
          bar,
          beat,
        });
      }
    }
    return events;
  }

  const subdiv = steps.length;
  for (let bar = 0; bar < item.bars; bar++) {
    const chord = item.chords.length ? item.chords[Math.floor(bar / chordEveryBars) % item.chords.length] : undefined;
    for (let i = 0; i < subdiv; i++) {
      const step = steps[i];
      if (step === "rest") continue;
      const beat = (i / subdiv) * 4;
      events.push({
        t: bar * 4 * beatSec + i * ((4 * beatSec) / subdiv),
        kind: step === "up" ? "up" : "down",
        chord,
        bar,
        beat,
      });
    }
  }
  return events;
}

function drumTimeline(item: PlanItem): NoteEvent[] {
  const beatSec = 60 / item.bpm;
  const events: NoteEvent[] = [];
  const id = item.lessonId;
  const createPick = item.createPick ?? "";
  const kickOnly =
    (id.includes("kick") && !id.includes("backbeat") && !id.includes("four")) ||
    createPick.toLowerCase().includes("kick on one");
  const four =
    id.includes("four") ||
    item.type === "song" ||
    createPick.toLowerCase().includes("four");
  for (let bar = 0; bar < item.bars; bar++) {
    for (let beat = 0; beat < 4; beat++) {
      let pad: number | null = 0;
      if (kickOnly) {
        pad = beat === 0 ? 0 : null;
      } else if (id.includes("backbeat") && !four) {
        pad = beat % 2 === 0 ? 0 : 1;
      } else if (four) {
        pad = beat === 1 || beat === 3 ? 1 : 0;
      }
      if (pad == null) continue;
      events.push({
        t: (bar * 4 + beat) * beatSec,
        kind: "pluck",
        string: pad,
        bar,
        beat,
      });
    }
  }
  return events;
}

function keyWarmup(item: PlanItem): NoteEvent[] {
  const beatSec = 60 / item.bpm;
  const events: NoteEvent[] = [];
  const holdC =
    item.surface === "voice" ||
    item.lessonId.includes("middle_c") ||
    item.lessonId.includes("drone") ||
    item.lessonId.includes("match") ||
    item.lessonId.includes("hold");
  const whites = [60, 62, 64, 65, 67, 69, 71];
  for (let bar = 0; bar < item.bars; bar++) {
    for (let beat = 0; beat < 4; beat++) {
      const midi = holdC ? 60 : whites[(bar * 4 + beat) % whites.length];
      events.push({
        t: (bar * 4 + beat) * beatSec,
        kind: "pluck",
        string: midi,
        bar,
        beat,
      });
    }
  }
  return events;
}

export function judgeHit(deltaMs: number, windowMs = 220): HitJudge {
  const abs = Math.abs(deltaMs);
  if (abs <= JUDGE_WINDOWS.perfect) return "perfect";
  if (abs <= JUDGE_WINDOWS.good) return "good";
  if (abs <= Math.min(JUDGE_WINDOWS.ok, windowMs)) return "ok";
  return "miss";
}

export function consumeHit(notes: NoteEvent[], now: number, windowMs = 220) {
  let best = -1;
  let bestAbs = Infinity;
  for (let i = 0; i < notes.length; i++) {
    const d = Math.abs((notes[i].t - now) * 1000);
    if (d < bestAbs) {
      bestAbs = d;
      best = i;
    }
  }
  if (best < 0 || bestAbs > windowMs) return { hit: false as const, judge: "miss" as HitJudge, deltaMs: bestAbs, note: null };
  const note = notes[best];
  const deltaMs = (now - note.t) * 1000;
  return { hit: true as const, judge: judgeHit(deltaMs, windowMs), deltaMs, note, index: best };
}

export function starsFor(accuracy: number) {
  if (accuracy >= 0.9) return 3;
  if (accuracy >= 0.7) return 2;
  if (accuracy >= 0.4) return 1;
  return 0;
}

export function xpFor(accuracy: number, hits: number) {
  return Math.round(hits * 8 + accuracy * 40);
}

export function summarizeItem(item: PlanItem, hits: number, misses: number): ItemResult {
  const total = hits + misses;
  const accuracy = total === 0 ? 0 : hits / total;
  return {
    itemId: item.id,
    lessonId: item.lessonId,
    hits,
    misses,
    accuracy,
    stars: starsFor(accuracy),
    xp: xpFor(accuracy, hits),
  };
}

export function countInBeats() {
  return 4;
}
