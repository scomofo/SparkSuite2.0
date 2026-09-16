import { useNavigate, useSearch } from "@tanstack/react-router";
import { AppShell } from "@/components/app-shell";
import {
  BeatStrip,
  LabCopy,
  PlayBar,
  TabRow,
  usePlayhead,
  type LineHit,
} from "@/components/labs/shared";
import { pianoHold, unlockAudio } from "@/lib/spark/audio";
import { instrumentById, midiToFreq } from "@/lib/spark/instruments";
import { instrumentLabPattern } from "@/lib/spark/instrument-patterns";

export type ViolinTab = "open" | "bow" | "finger" | "slur" | "cross";

const TABS: { id: ViolinTab; label: string }[] = [
  { id: "open", label: "Open" },
  { id: "bow", label: "Bow" },
  { id: "finger", label: "Finger" },
  { id: "slur", label: "Slur" },
  { id: "cross", label: "Cross" },
];

const COPY: Record<ViolinTab, { kicker: string; title: string; body: string; hear: string }> = {
  open: {
    kicker: "G D A E",
    title: "One string, one straight bow",
    body: "Start G at the frog, then alternate: G down, D up, A down, E up. Each stroke starts where the last ended. Change the bow level for each string; keep the arm relaxed.",
    hear: "G, D, A, E. Two beats each.",
  },
  bow: {
    kicker: "⊓ and ∨",
    title: "Down on one, up on three",
    body: "Down-bow from the frog on 1, stop. Up-bow from the tip on 3, stop. The bow rests on the string through 2 and 4 while the count goes on.",
    hear: "Down, rest, up, rest, on open D.",
  },
  finger: {
    kicker: "Whole step",
    title: "First finger, same step every time",
    body: "E is one whole step above open D. Thumb opposite the finger, wrist soft. Check the step by ear before you trust the hand.",
    hear: "D, E, D, rest. Then A, B, A, rest.",
  },
  slur: {
    kicker: "Two in one",
    title: "Change the finger, not the bow",
    body: "D–E in one down-bow, F♯–G in one up-bow. The bow never stops; the finger moves halfway through. Divide the bow evenly.",
    hear: "D–E, F♯–G, G–F♯, E–D.",
  },
  cross: {
    kicker: "Elbow, not wrist",
    title: "Roll to the next string",
    body: "D to A and back on the pulse. The whole arm rolls to the new level. Grow the sound over the line with bow speed, not pressure.",
    hear: "D, A, D, A. Soft to full.",
  },
};

function parseTab(raw: string): ViolinTab {
  if (raw === "open" || raw === "bow" || raw === "finger" || raw === "slur" || raw === "cross")
    return raw;
  return "open";
}

const OPEN = instrumentById("violin").openFreq;
const hold =
  (freq: number, seconds: number, gain = 0.22) =>
  (when: number) =>
    pianoHold(freq, seconds, when, gain);

export function ViolinLab() {
  const search = useSearch({ from: "/techniques" });
  const navigate = useNavigate({ from: "/techniques" });
  const tab = parseTab(search.tab);
  const copy = COPY[tab];
  const head = usePlayhead();

  const patch = (next: Partial<{ tab: string }>) => {
    void navigate({ search: { tab: next.tab ?? tab, chord: "" }, replace: true });
    head.clear();
  };

  const beatSec = 60 / 84;
  const play = () => {
    unlockAudio();
    let hits: LineHit[] = [];
    if (tab === "open") {
      hits = [0, 1, 2, 3].map((string) => ({
        beat: string * 2,
        mark: string,
        sound: hold(OPEN[string], beatSec * 1.8),
      }));
    } else if (tab === "bow") {
      hits = [0, 2, 4, 6].map((beat) => ({ beat, sound: hold(OPEN[1], beatSec * 0.9) }));
    } else if (tab === "finger") {
      hits = [62, 64, 62, null, 69, 71, 69, null].flatMap((midi, beat) =>
        midi === null ? [] : [{ beat, sound: hold(midiToFreq(midi), beatSec * 0.9) }],
      );
    } else if (tab === "slur") {
      hits = instrumentLabPattern("violin-slurs").cues.map((cue) => ({
        beat: cue.beat,
        sound: hold(midiToFreq(cue.notes![0]), beatSec * (cue.duration ?? 0.45)),
      }));
    } else {
      hits = [62, 69, 62, 69, 62, 69, 62, 69].map((midi, beat) => ({
        beat,
        sound: hold(midiToFreq(midi), beatSec * 0.9, 0.12 + beat * 0.02),
      }));
    }
    head.play(hits, 84, true, 8);
  };

  const cells = Array.from({ length: 8 }, (_, beat) => {
    if (tab === "open")
      return {
        beat,
        top: beat % 2 === 0 ? (beat % 4 === 0 ? "⊓" : "∨") : "·",
        bot: ["G", "G", "D", "D", "A", "A", "E", "E"][beat] ?? "G",
      };
    if (tab === "bow")
      return {
        beat,
        top: beat % 4 === 0 ? "⊓" : beat % 4 === 2 ? "∨" : "·",
        bot: beat % 2 === 0 ? "D" : "rest",
      };
    if (tab === "finger")
      return {
        beat,
        top: ["⊓", "∨", "⊓", "·", "∨", "⊓", "∨", "·"][beat],
        bot: ["D", "E", "D", "rest", "A", "B", "A", "rest"][beat] ?? "D",
      };
    if (tab === "slur")
      return {
        beat,
        top: beat % 2 === 0 ? "⊓" : "∨",
        bot: ["D E", "F♯ G", "G F♯", "E D", "D E", "F♯ G", "G F♯", "E D"][beat] ?? "D",
      };
    return { beat, top: beat % 2 === 0 ? "⊓" : "∨", bot: beat % 2 === 0 ? "D" : "A" };
  });

  return (
    <AppShell>
      <header className="px-5 pb-2 pt-8">
        <p className="text-[11px] uppercase tracking-[0.22em] text-dim">Violin lab · GDAE</p>
        <h1 className="mt-2 font-display text-4xl font-semibold tracking-tight">Bow</h1>
        <p className="mt-3 max-w-sm text-pretty text-muted">
          Four strings, no frets. The bow is the voice.
        </p>
      </header>
      <div className="sticky top-0 z-10 mx-4 mt-4 rounded-lg border border-border bg-surface/95 p-2 backdrop-blur-sm">
        <TabRow tabs={TABS} active={tab} onPick={(id) => patch({ tab: id })} />
      </div>
      <div className="px-5 pb-8 pt-5">
        <LabCopy {...copy}>
          <PlayBar
            onPlay={play}
            lockKick={head.lockKick}
            onToggleKick={() => head.setLockKick((v) => !v)}
            beatN={head.beatN}
          />
        </LabCopy>
        <BeatStrip cells={cells} cursorBeat={head.cursorBeat} />
        <p className="mt-6 text-xs leading-relaxed text-muted">
          ⊓ = down-bow · ∨ = up-bow. The references are sustained synthesized tones, not a violin,
          and nothing here listens to your playing.
        </p>
      </div>
    </AppShell>
  );
}
