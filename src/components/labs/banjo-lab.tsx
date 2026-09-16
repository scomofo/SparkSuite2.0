import { useNavigate, useSearch } from "@tanstack/react-router";
import { AppShell } from "@/components/app-shell";
import { ChordDiagram } from "@/components/chord-diagram";
import {
  BeatStrip,
  Chip,
  LabCopy,
  PlayBar,
  TabRow,
  usePlayhead,
  type LineHit,
} from "@/components/labs/shared";
import { ghostNote, pianoHold, pluck, strum, unlockAudio } from "@/lib/spark/audio";
import { BANJO_CHORDS, banjoChordFrequencies, instrumentById } from "@/lib/spark/instruments";
import { instrumentLabPattern } from "@/lib/spark/instrument-patterns";

export type BanjoTab = "roll" | "pinch" | "hammer" | "slide" | "vamp";
const CHORDS = ["G", "C", "D7", "D"] as const;
type BanjoChord = (typeof CHORDS)[number];

const TABS: { id: BanjoTab; label: string }[] = [
  { id: "roll", label: "Roll" },
  { id: "pinch", label: "Pinch" },
  { id: "hammer", label: "Hammer" },
  { id: "slide", label: "Slide" },
  { id: "vamp", label: "Vamp" },
];

const COPY: Record<BanjoTab, { kicker: string; title: string; body: string; hear: string }> = {
  roll: {
    kicker: "T I M",
    title: "Eight notes, three fingers",
    body: "Thumb, index, middle on strings 3–2–1–5–2–1–3–1. The order never changes; the chord shape underneath does. For D/D7, the diagram’s x applies to brushes; rolls still pick the open fifth string. Even notes first, speed later.",
    hear: "3 2 1 5 2 1 3 1, one note per syllable.",
  },
  pinch: {
    kicker: "Thumb and middle",
    title: "Two strings at once",
    body: "Thumb on the fourth or third string, middle on the first, together. A pinch marks the beat the way a brush does, but cleaner. Let the strings ring between pinches.",
    hear: "Pinch on 1 and 3. Ring through 2 and 4.",
  },
  hammer: {
    kicker: "No second pick",
    title: "Land the finger, hear the note",
    body: "Pick the open third string, then land a finger firmly at fret 2. The landing makes the note. Firm and quick beats hard and slow.",
    hear: "Open G, hammer to A. Four times.",
  },
  slide: {
    kicker: "Keep the pressure",
    title: "Move the finger, keep the note",
    body: "Pick fret 2 on the third string and slide the same finger to fret 4 without letting go. The pressure carries the sound to the new fret.",
    hear: "A slides to B. Four times.",
  },
  vamp: {
    kicker: "Backup",
    title: "Brush, chop, brush, chop",
    body: "Brush the chord on 1 and 3, skipping the short fifth string for D/D7. On 2 and 4, touch all five strings lightly with your fretting hand, then strike a click. Restore the chord for the next brush. This is an unpitched backbeat; releasing open G cannot mute it.",
    hear: "Chord, chop, chord, chop.",
  },
};

function parseTab(raw: string): BanjoTab {
  if (raw === "roll" || raw === "pinch" || raw === "hammer" || raw === "slide" || raw === "vamp")
    return raw;
  return "roll";
}
function parseChord(raw: string): BanjoChord {
  if ((CHORDS as readonly string[]).includes(raw)) return raw as BanjoChord;
  return "G";
}

const OPEN = instrumentById("banjo").openFreq;
function stringFreq(chord: string, string: number) {
  const fret = BANJO_CHORDS[chord]?.frets[string] ?? 0;
  return OPEN[string] * Math.pow(2, fret / 12);
}
function chordFreqs(chord: string) {
  return banjoChordFrequencies(chord);
}
function shape(id: string) {
  const c = BANJO_CHORDS[id];
  if (!c) return undefined;
  return { id, name: id, ...c };
}

const ROLL_STRINGS = [2, 3, 4, 0, 3, 4, 2, 4];
const ROLL_FINGERS = ["T", "I", "M", "T", "I", "M", "T", "M"];

export function BanjoLab() {
  const search = useSearch({ from: "/techniques" });
  const navigate = useNavigate({ from: "/techniques" });
  const tab = parseTab(search.tab);
  const chord = parseChord(search.chord);
  const copy = COPY[tab];
  const head = usePlayhead();

  const patch = (next: Partial<{ tab: string; chord: string }>) => {
    void navigate({ search: { tab: next.tab ?? tab, chord: next.chord ?? chord }, replace: true });
    head.clear();
  };

  const play = () => {
    unlockAudio();
    let hits: LineHit[] = [];
    if (tab === "roll") {
      hits = ROLL_STRINGS.map((string, i) => ({
        beat: instrumentLabPattern("banjo-forward-roll").cues[i].beat,
        mark: string,
        sound: (w) => pluck(stringFreq(chord, string), w, 0.4),
      }));
    } else if (tab === "pinch") {
      hits = Array.from({ length: 8 }, (_, i) => ({
        beat: i,
        sound: (w) => {
          if (i % 2 === 0) strum([stringFreq(chord, 1), stringFreq(chord, 4)], w);
        },
      }));
    } else if (tab === "hammer") {
      hits = Array.from({ length: 8 }, (_, i) => ({
        beat: i,
        sound: (w) => pluck(OPEN[2] * Math.pow(2, (i % 2 ? 2 : 0) / 12), w, i % 2 ? 0.3 : 0.4),
      }));
    } else if (tab === "slide") {
      hits = Array.from({ length: 8 }, (_, i) => ({
        beat: i,
        sound: (w) => pluck(OPEN[2] * Math.pow(2, (i % 2 ? 4 : 2) / 12), w, i % 2 ? 0.3 : 0.4),
      }));
    } else {
      const f = chordFreqs(chord);
      hits = Array.from({ length: 8 }, (_, i) => ({
        beat: i,
        sound: (w) => {
          if (i % 2) ghostNote(w);
          else f.forEach((freq) => pianoHold(freq, (60 / 84) * 0.85, w, 0.2 / Math.sqrt(f.length)));
        },
      }));
    }
    head.play(hits, 84, true, tab === "roll" ? 4 : 8);
  };

  const cells = Array.from({ length: 8 }, (_, beat) => {
    if (tab === "roll")
      return {
        beat: beat / 2,
        top: ROLL_FINGERS[beat] ?? "T",
        bot: String(["5", "4", "3", "2", "1"][ROLL_STRINGS[beat] ?? 2]),
      };
    if (tab === "pinch")
      return { beat, top: beat % 2 === 0 ? "P" : "·", bot: beat % 2 === 0 ? chord : "ring" };
    if (tab === "hammer")
      return { beat, top: beat % 2 === 0 ? "pick" : "H", bot: beat % 2 === 0 ? "G" : "A" };
    if (tab === "slide")
      return { beat, top: beat % 2 === 0 ? "pick" : "S", bot: beat % 2 === 0 ? "A" : "B" };
    return { beat, top: beat % 2 === 0 ? "D" : "x", bot: chord };
  });
  const showsChord = tab === "roll" || tab === "pinch" || tab === "vamp";

  return (
    <AppShell>
      <header className="px-5 pb-2 pt-8">
        <p className="text-[11px] uppercase tracking-[0.22em] text-dim">Banjo lab · gDGBD</p>
        <h1 className="mt-2 font-display text-4xl font-semibold tracking-tight">Roll</h1>
        <p className="mt-3 max-w-sm text-pretty text-muted">
          Five strings. The right hand is the engine.
        </p>
      </header>
      <div className="sticky top-0 z-10 mx-4 mt-4 rounded-lg border border-border bg-surface/95 p-2 backdrop-blur-sm">
        <TabRow tabs={TABS} active={tab} onPick={(id) => patch({ tab: id })} />
      </div>
      <div className="px-5 pb-8 pt-5">
        {showsChord ? (
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
          Synthesized pitch and rhythm references. Practise the written hand movements on your instrument; these sounds do not demonstrate physical articulation.
        </p>
        {showsChord ? (
          <section className="mt-6 flex flex-col items-center">
            <p className="mb-2 self-start text-[11px] uppercase tracking-[0.18em] text-dim">
              Shape
            </p>
            <ChordDiagram shape={shape(chord)} />
          </section>
        ) : null}
      </div>
    </AppShell>
  );
}
