import { useNavigate, useSearch } from "@tanstack/react-router";
import { AppShell } from "@/components/app-shell";
import { ChordDiagram } from "@/components/chord-diagram";
import { BeatStrip, Chip, LabCopy, PlayBar, TabRow } from "@/components/labs/shared";
import { usePlayhead, type LineHit } from "@/components/labs/use-playhead";
import { ghostNote, pianoHold, pluck, strum, strumUp, unlockAudio } from "@/lib/spark/audio";
import { instrumentById, MANDOLIN_CHORDS } from "@/lib/spark/instruments";
import { instrumentLabPattern } from "@/lib/spark/instrument-patterns";

export type MandolinTab = "down" | "alt" | "chop" | "tremolo" | "switch";
const CHORDS = ["G", "C", "D", "Am"] as const;
type MandolinChord = (typeof CHORDS)[number];

const TABS: { id: MandolinTab; label: string }[] = [
  { id: "down", label: "Down" },
  { id: "alt", label: "Alt" },
  { id: "chop", label: "Chop" },
  { id: "tremolo", label: "Tremolo" },
  { id: "switch", label: "Switch" },
];

const COPY: Record<MandolinTab, { kicker: string; title: string; body: string; hear: string }> = {
  down: {
    kicker: "The stroke",
    title: "Through both strings, one direction",
    body: "Each course is a pair. The pick passes through both strings in one small wrist motion. Land on the beat, not ahead of it.",
    hear: "Eight downs. Same chord. Same volume.",
  },
  alt: {
    kicker: "Down, up",
    title: "Numbers down, ands up",
    body: "Alternate picking on the D course: D, E, F♯, G and back. The upstroke is as even as the downstroke — that evenness is the whole technique.",
    hear: "D E F♯ G, F♯ E D, silent upstroke. One bar of eighths.",
  },
  chop: {
    kicker: "The mute",
    title: "Touch every course, strike the click",
    body: "For this unpitched backbeat, touch all four courses lightly on 2 and 4, then strike a click. Releasing only fretted notes leaves open courses ringing. Restore the shape for 1 and 3.",
    hear: "Chord, chop, chord, chop.",
  },
  tremolo: {
    kicker: "1-e-and-a",
    title: "Sustain from motion",
    body: "Four small strokes per beat on one note. Loose wrist, tiny strokes. Two beats on, two beats off, so the sound stays even.",
    hear: "A, sustained. Then rest.",
  },
  switch: {
    kicker: "The hard part",
    title: "Change on one. Not on three.",
    body: "Four downs on the first chord, four on G. The switch happens in the gap before beat one. If you land late, you didn’t leave early.",
    hear: "C C C C, G G G G.",
  },
};

function parseTab(raw: string): MandolinTab {
  if (raw === "down" || raw === "alt" || raw === "chop" || raw === "tremolo" || raw === "switch")
    return raw;
  return "down";
}
function parseChord(raw: string): MandolinChord {
  if ((CHORDS as readonly string[]).includes(raw)) return raw as MandolinChord;
  return "G";
}

function freqs(id: string) {
  const inst = instrumentById("mandolin");
  const c = MANDOLIN_CHORDS[id];
  if (!c) return [...inst.openFreq];
  return c.frets
    .map((f, i) => (f == null ? null : inst.openFreq[i] * Math.pow(2, f / 12)))
    .filter((f): f is number => f != null);
}

function shape(id: string) {
  const c = MANDOLIN_CHORDS[id];
  if (!c) return undefined;
  return { id, name: id, ...c };
}

const ALT_LINE = instrumentLabPattern("mandolin-down-up");

export function MandolinLab() {
  const search = useSearch({ from: "/techniques" });
  const navigate = useNavigate({ from: "/techniques" });
  const tab = parseTab(search.tab);
  const chord = parseChord(search.chord);
  const copy = COPY[tab];
  const head = usePlayhead();
  const f = freqs(chord);
  const open = instrumentById("mandolin").openFreq;

  const patch = (next: Partial<{ tab: string; chord: string }>) => {
    void navigate({ search: { tab: next.tab ?? tab, chord: next.chord ?? chord }, replace: true });
    head.clear();
  };

  const play = () => {
    unlockAudio();
    let hits: LineHit[] = [];
    if (tab === "down") {
      hits = Array.from({ length: 8 }, (_, i) => ({ beat: i, sound: (w) => strum(f, w) }));
    } else if (tab === "alt") {
      hits = ALT_LINE.cues.map((cue) => ({
        beat: cue.beat,
        sound: (w) => cue.notes?.forEach((midi) => pluck(440 * 2 ** ((midi - 69) / 12), w, 0.4)),
      }));
    } else if (tab === "chop") {
      hits = Array.from({ length: 8 }, (_, i) => ({
        beat: i,
        sound: (w) => {
          if (i % 2) ghostNote(w);
          else f.forEach((freq) => pianoHold(freq, (60 / 84) * 0.85, w, 0.2 / Math.sqrt(f.length)));
        },
      }));
    } else if (tab === "tremolo") {
      hits = Array.from({ length: 8 }, (_, i) => ({
        beat: i,
        sound: (w) => {
          if (i % 4 >= 2) return;
          const beatSec = 60 / 84;
          for (let k = 0; k < 4; k++) {
            const t = w + (k * beatSec) / 4;
            if (k % 2 === 0) strum([open[2]], t);
            else strumUp([open[2]], t);
          }
        },
      }));
    } else {
      const g = freqs("G");
      hits = Array.from({ length: 8 }, (_, i) => ({
        beat: i,
        sound: (w) => strum(i < 4 ? f : g, w),
      }));
    }
    head.play(hits, 84, true, tab === "alt" ? ALT_LINE.beats : 8);
  };

  const liveChord = tab === "switch" && (head.cursorBeat ?? 0) >= 4 ? "G" : chord;
  const cells = Array.from({ length: 8 }, (_, beat) => {
    if (tab === "alt")
      return {
        beat: beat / 2,
        top: beat % 2 === 0 ? "D" : "U",
        bot: ALT_LINE.cues[beat].notes ? ALT_LINE.cues[beat].label.split(" ")[0] : "rest",
      };
    if (tab === "chop") return { beat, top: beat % 2 === 0 ? "D" : "x", bot: chord };
    if (tab === "tremolo")
      return { beat, top: beat % 4 < 2 ? "≈" : "·", bot: beat % 4 < 2 ? "A" : "rest" };
    if (tab === "switch") return { beat, top: "D", bot: beat < 4 ? chord : "G" };
    return { beat, top: "D", bot: chord };
  });

  return (
    <AppShell>
      <header className="px-5 pb-2 pt-8">
        <p className="text-[11px] uppercase tracking-[0.22em] text-dim">Mandolin lab · GDAE</p>
        <h1 className="mt-2 font-display text-4xl font-semibold tracking-tight">Pick</h1>
        <p className="mt-3 max-w-sm text-pretty text-muted">
          Four courses. The wrist is the pulse.
        </p>
      </header>
      <div className="sticky top-0 z-10 mx-4 mt-4 rounded-lg border border-border bg-surface/95 p-2 backdrop-blur-sm">
        <TabRow tabs={TABS} active={tab} onPick={(id) => patch({ tab: id })} />
      </div>
      <div className="px-5 pb-8 pt-5">
        {tab !== "alt" && tab !== "tremolo" ? (
          <>
            <p className="text-[11px] uppercase tracking-[0.18em] text-dim">Chord</p>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {CHORDS.map((c) => (
                <Chip key={c} active={chord === c} onClick={() => patch({ chord: c })}>
                  {c}
                </Chip>
              ))}
            </div>
          </>
        ) : null}
        <LabCopy {...copy}>
          <PlayBar
            onPlay={play}
            lockKick={head.lockKick}
            onToggleKick={() => head.setLockKick((v) => !v)}
            beatN={head.beatN}
          />
        </LabCopy>
        <BeatStrip cells={cells} cursorBeat={head.cursorBeat} />
        <p className="mt-4 text-xs leading-relaxed text-muted">
          Synthesized pitch and rhythm references. Practise the written hand movements on your
          instrument; these sounds do not demonstrate physical articulation.
        </p>
        {tab !== "alt" && tab !== "tremolo" ? (
          <section className="mt-6 flex flex-col items-center">
            <p className="mb-2 self-start text-[11px] uppercase tracking-[0.18em] text-dim">
              Shape
            </p>
            <ChordDiagram shape={shape(liveChord)} />
          </section>
        ) : null}
      </div>
    </AppShell>
  );
}
