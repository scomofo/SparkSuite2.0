import { useNavigate, useSearch } from "@tanstack/react-router";
import { AppShell } from "@/components/app-shell";
import { ChordDiagram } from "@/components/chord-diagram";
import { BeatStrip, Chip, LabCopy, PlayBar, TabRow } from "@/components/labs/shared";
import { usePlayhead, type LineHit } from "@/components/labs/use-playhead";
import { ghostNote, pianoHold, strum, unlockAudio } from "@/lib/spark/audio";
import { instrumentById, LAPSTEEL_CHORDS, midiToFreq } from "@/lib/spark/instruments";

export type LapSteelTab = "bar" | "slide" | "vibrato" | "block" | "positions";
const CHORDS = ["C", "F", "G", "D"] as const;
type LapSteelChord = (typeof CHORDS)[number];

const TABS: { id: LapSteelTab; label: string }[] = [
  { id: "bar", label: "Bar" },
  { id: "slide", label: "Slide" },
  { id: "vibrato", label: "Vibrato" },
  { id: "block", label: "Block" },
  { id: "positions", label: "Positions" },
];

const COPY: Record<LapSteelTab, { kicker: string; title: string; body: string; hear: string }> = {
  bar: {
    kicker: "Straight bar",
    title: "Over the marker, not behind it",
    body: "The bar is the stopping point, so it sits directly above the fret line. Light, even pressure across all six strings; the tone tells you when it is straight.",
    hear: "Eight brushes at one position.",
  },
  slide: {
    kicker: "Leave on the and",
    title: "Arrive on the beat",
    body: "F at fret 5, then slide to G at fret 7. Start moving on the and of 2 and land on 3. The arrival is the rhythm; the glide is the colour.",
    hear: "F, hold, slide, G. Then back.",
  },
  vibrato: {
    kicker: "After the attack",
    title: "A small wave around the pitch",
    body: "Let the note speak, then rock the bar gently along the string, returning to the marker each time. Small and even stays in tune.",
    hear: "A at fret 5, held. Then B at fret 7.",
  },
  block: {
    kicker: "Palm block",
    title: "Make the silence",
    body: "Lap steel strings ring for a long time. Rest the side of the picking hand on them for the silent beats. Brush on 1 and 3, block on 2 and 4.",
    hear: "Chord, block, chord, block.",
  },
  positions: {
    kicker: "I IV V I",
    title: "Same chord, three places",
    body: "Open C, fret 5 for F, fret 7 for G, then lift to open C. One straight bar moves the whole chord. Change on beat 1.",
    hear: "C C F F G G C C.",
  },
};

function parseTab(raw: string): LapSteelTab {
  if (
    raw === "bar" ||
    raw === "slide" ||
    raw === "vibrato" ||
    raw === "block" ||
    raw === "positions"
  )
    return raw;
  return "bar";
}
function parseChord(raw: string): LapSteelChord {
  if ((CHORDS as readonly string[]).includes(raw)) return raw as LapSteelChord;
  return "C";
}

const OPEN = instrumentById("lapsteel").openFreq;
function chordFreqs(chord: string) {
  const c = LAPSTEEL_CHORDS[chord];
  if (!c) return [...OPEN];
  return c.frets.flatMap((f, i) => (f == null ? [] : [OPEN[i] * Math.pow(2, f / 12)]));
}
function shape(id: string) {
  const c = LAPSTEEL_CHORDS[id];
  if (!c) return undefined;
  return { id, name: id, ...c };
}

export function LapSteelLab() {
  const search = useSearch({ from: "/techniques" });
  const navigate = useNavigate({ from: "/techniques" });
  const tab = parseTab(search.tab);
  const chord = parseChord(search.chord);
  const copy = COPY[tab];
  const head = usePlayhead();
  const beatSec = 60 / 72;

  const patch = (next: Partial<{ tab: string; chord: string }>) => {
    void navigate({ search: { tab: next.tab ?? tab, chord: next.chord ?? chord }, replace: true });
    head.clear();
  };

  const play = () => {
    unlockAudio();
    let hits: LineHit[] = [];
    if (tab === "bar") {
      const f = chordFreqs(chord);
      hits = Array.from({ length: 8 }, (_, i) => ({ beat: i, sound: (w) => strum(f, w) }));
    } else if (tab === "slide") {
      const f = chordFreqs("F");
      const g = chordFreqs("G");
      hits = [0, 4].flatMap((bar) => [
        { beat: bar, sound: (w: number) => strum(bar === 0 ? f : g, w) },
        { beat: bar + 2, sound: (w: number) => strum(bar === 0 ? g : f, w) },
      ]);
    } else if (tab === "vibrato") {
      hits = [0, 4].map((beat, i) => ({
        beat,
        sound: (w) => pianoHold(midiToFreq(i === 0 ? 69 : 71), beatSec * 3.6, w, 0.22),
      }));
    } else if (tab === "block") {
      const f = chordFreqs(chord);
      hits = Array.from({ length: 8 }, (_, i) => ({
        beat: i,
        sound: (w) => (i % 2 === 0 ? strum(f, w) : ghostNote(w)),
      }));
    } else {
      const order = ["C", "C", "F", "F", "G", "G", "C", "C"];
      hits = order.map((c, i) => ({ beat: i, sound: (w) => strum(chordFreqs(c), w) }));
    }
    head.play(hits, 72, true);
  };

  const cells = Array.from({ length: 8 }, (_, beat) => {
    if (tab === "slide")
      return {
        beat,
        top: beat % 4 === 0 || beat % 4 === 2 ? "↓" : beat % 4 === 1 ? "hold" : "⟋",
        bot: beat < 4 ? (beat < 2 ? "F" : "G") : beat < 6 ? "G" : "F",
      };
    if (tab === "vibrato")
      return { beat, top: beat % 4 === 0 ? "pick" : "~", bot: beat < 4 ? "A · 5" : "B · 7" };
    if (tab === "block") return { beat, top: beat % 2 === 0 ? "↓" : "x", bot: chord };
    if (tab === "positions")
      return { beat, top: "↓", bot: ["C", "C", "F", "F", "G", "G", "C", "C"][beat] ?? "C" };
    return { beat, top: "↓", bot: chord };
  });
  const showsChord = tab === "bar" || tab === "block";

  return (
    <AppShell>
      <header className="px-5 pb-2 pt-8">
        <p className="text-[11px] uppercase tracking-[0.22em] text-dim">Lap steel lab · C6</p>
        <h1 className="mt-2 font-display text-4xl font-semibold tracking-tight">Bar</h1>
        <p className="mt-3 max-w-sm text-pretty text-muted">
          Six strings, one straight bar. Position is the tuning.
        </p>
      </header>
      <div className="sticky top-0 z-10 mx-4 mt-4 rounded-lg border border-border bg-surface/95 p-2 backdrop-blur-sm">
        <TabRow tabs={TABS} active={tab} onPick={(id) => patch({ tab: id })} />
      </div>
      <div className="px-5 pb-8 pt-5">
        {showsChord ? (
          <>
            <p className="text-[11px] uppercase tracking-[0.18em] text-dim">Position</p>
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
        {showsChord ? (
          <section className="mt-6 flex flex-col items-center">
            <p className="mb-2 self-start text-[11px] uppercase tracking-[0.18em] text-dim">
              Bar position
            </p>
            <ChordDiagram shape={shape(chord)} />
          </section>
        ) : null}
        <p className="mt-6 text-xs leading-relaxed text-muted">
          References are synthesized tones, not a lap steel; slides are approximated by the arrival
          chord. Nothing here listens to your playing.
        </p>
      </div>
    </AppShell>
  );
}
