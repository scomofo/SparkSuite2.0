import { useNavigate, useSearch } from "@tanstack/react-router";
import { AppShell } from "@/components/app-shell";
import { PianoKeyboard } from "@/components/piano-keyboard";
import { PitchMatch } from "@/components/tuner-panel";
import { BeatStrip, LabCopy, PlayBar, TabRow, usePlayhead, type LineHit } from "@/components/labs/shared";
import { pianoHold, pianoTone, unlockAudio } from "@/lib/spark/audio";
import { midiToFreq } from "@/lib/spark/instruments";

export type VoiceTab = "drone" | "match" | "hold" | "neighbor" | "octave";

const TABS: { id: VoiceTab; label: string }[] = [
  { id: "drone", label: "Drone" },
  { id: "match", label: "Match" },
  { id: "hold", label: "Hold" },
  { id: "neighbor", label: "Step" },
  { id: "octave", label: "8ve" },
];

const COPY: Record<VoiceTab, { kicker: string; title: string; body: string; hear: string }> = {
  drone: {
    kicker: "The floor",
    title: "Hum until it disappears",
    body: "A drone is a pitch you stop hearing as a pitch — it becomes the room. Match the C, then forget it. Breath is even. Jaw is nothing.",
    hear: "One C. Let it ring. You ring with it.",
  },
  match: {
    kicker: "Twenty cents",
    title: "Land inside the note, not next to it",
    body: "Slide from below. The last millimetre is the work. If you attack from above you will be sharp forever. Use the mic. Watch the needle.",
    hear: "Reference, then you. Closer. Closer.",
  },
  hold: {
    kicker: "One breath",
    title: "Four beats. Don’t dump the air.",
    body: "Start quieter than you think. The note should be as loud on four as on one. If it thins out, you spent the breath in the first second.",
    hear: "C, held across four counts. Then another.",
  },
  neighbor: {
    kicker: "Stepwise",
    title: "The next note is one tooth over",
    body: "C to D is a whole step. Don’t jump at it — release C and arrive. The space between is a door, not a gap. Come back the same way.",
    hear: "C, D, E, D, C.",
  },
  octave: {
    kicker: "Same letter, new floor",
    title: "C4 to C5 without grabbing",
    body: "The octave is the same name, twice as fast. Don’t reach with your chin. Think of placing the high note on a shelf, not throwing it at the ceiling.",
    hear: "Low C, high C, low C.",
  },
};

function parseTab(raw: string): VoiceTab {
  if (raw === "drone" || raw === "match" || raw === "hold" || raw === "neighbor" || raw === "octave") return raw;
  return "drone";
}

function target(tab: VoiceTab) {
  if (tab === "octave") return { midi: 60, name: "C4" };
  if (tab === "neighbor") return { midi: 62, name: "D4" };
  return { midi: 60, name: "C4" };
}

export function VoiceLab() {
  const search = useSearch({ from: "/techniques" });
  const navigate = useNavigate({ from: "/techniques" });
  const tab = parseTab(search.tab);
  const copy = COPY[tab];
  const head = usePlayhead();
  const t = target(tab);

  const patch = (next: VoiceTab) => {
    void navigate({ search: { tab: next, chord: "C" }, replace: true });
    head.clear();
  };

  const play = () => {
    unlockAudio();
    let hits: LineHit[] = [];
    if (tab === "drone" || tab === "match") {
      hits = Array.from({ length: 8 }, (_, i) => ({
        beat: i,
        mark: 60,
        sound: (w) => pianoTone(midiToFreq(60), w, 0.22),
      }));
    } else if (tab === "hold") {
      hits = [
        { beat: 0, mark: 60, sound: (w) => pianoHold(midiToFreq(60), 3.6, w) },
        { beat: 4, mark: 60, sound: (w) => pianoHold(midiToFreq(60), 3.6, w) },
      ];
    } else if (tab === "neighbor") {
      const notes = [60, 62, 64, 62, 60, 62, 64, 60];
      const names = ["C", "D", "E", "D", "C", "D", "E", "C"];
      hits = notes.map((m, i) => ({
        beat: i,
        mark: m,
        sound: (w) => pianoTone(midiToFreq(m), w, 0.26),
      }));
      void names;
    } else {
      hits = [
        { beat: 0, mark: 60, sound: (w) => pianoTone(midiToFreq(60), w, 0.26) },
        { beat: 2, mark: 72, sound: (w) => pianoTone(midiToFreq(72), w, 0.24) },
        { beat: 4, mark: 60, sound: (w) => pianoTone(midiToFreq(60), w, 0.26) },
        { beat: 6, mark: 72, sound: (w) => pianoTone(midiToFreq(72), w, 0.24) },
      ];
    }
    head.play(hits, 60, false);
  };

  const cells =
    tab === "neighbor"
      ? ["C", "D", "E", "D", "C", "D", "E", "C"].map((n, beat) => ({ beat, top: "·", bot: n }))
      : tab === "octave"
        ? ["C4", "·", "C5", "·", "C4", "·", "C5", "·"].map((n, beat) => ({ beat, top: n === "·" ? "·" : "C", bot: n }))
        : tab === "hold"
          ? Array.from({ length: 8 }, (_, beat) => ({ beat, top: beat % 4 === 0 ? "hold" : "→", bot: "C" }))
          : Array.from({ length: 8 }, (_, beat) => ({ beat, top: "C", bot: "drone" }));

  return (
    <AppShell>
      <header className="px-5 pb-2 pt-8">
        <p className="text-[11px] uppercase tracking-[0.22em] text-dim">Voice lab · Pitch</p>
        <h1 className="mt-2 font-display text-4xl font-semibold tracking-tight">Breath</h1>
        <p className="mt-3 max-w-sm text-pretty text-muted">Match a C. Hold it. The air is the instrument.</p>
      </header>
      <div className="sticky top-0 z-10 mx-4 mt-4 rounded-lg border border-border bg-surface/95 p-2 backdrop-blur-sm">
        <TabRow tabs={TABS} active={tab} onPick={patch} />
      </div>
      <div className="px-5 pb-8 pt-5">
        <LabCopy {...copy}>
          <PlayBar
            onPlay={play}
            lockKick={head.lockKick}
            onToggleKick={() => head.setLockKick((v) => !v)}
            kickLabel="Click"
            beatN={head.beatN}
          />
        </LabCopy>
        <BeatStrip cells={cells} cursorBeat={head.cursorBeat} />
        <section className="mt-6">
          <PitchMatch targetFreq={midiToFreq(t.midi)} targetName={t.name} />
        </section>
        <section className="mt-6">
          <p className="mb-2 text-[11px] uppercase tracking-[0.18em] text-dim">Reference</p>
          <PianoKeyboard
            activeMidi={head.mark}
            expectedMidi={t.midi}
            chordPcs={[t.midi % 12]}
            onPlay={(midi) => {
              pianoTone(midiToFreq(midi));
              head.setMark(midi);
            }}
          />
        </section>
      </div>
    </AppShell>
  );
}
