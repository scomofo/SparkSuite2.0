import { useNavigate, useSearch } from "@tanstack/react-router";
import { AppShell } from "@/components/app-shell";
import { PianoKeyboard } from "@/components/piano-keyboard";
import { BeatStrip, Chip, LabCopy, PlayBar, TabRow, usePlayhead, type LineHit } from "@/components/labs/shared";
import { pianoChord, pianoTone, unlockAudio } from "@/lib/spark/audio";
import { midiToFreq, PIANO_VOICINGS } from "@/lib/spark/instruments";

export type PianoTab = "middlec" | "triad" | "invert" | "cadence" | "five";
const CHORDS = ["C", "G", "Am", "F"] as const;
type PianoChord = (typeof CHORDS)[number];

const TABS: { id: PianoTab; label: string }[] = [
  { id: "middlec", label: "C" },
  { id: "triad", label: "Triad" },
  { id: "invert", label: "Invert" },
  { id: "cadence", label: "V–I" },
  { id: "five", label: "5-finger" },
];

const COPY: Record<PianoTab, { kicker: string; title: string; body: string; hear: string }> = {
  middlec: {
    kicker: "Home key",
    title: "Two black keys. C is the left one.",
    body: "Find the pair of black keys. The white key immediately left is C. Middle C is the one near the middle of the keyboard. Everything else is measured from here.",
    hear: "Eight C’s. Same pitch. Same finger if you want.",
  },
  triad: {
    kicker: "The chord",
    title: "Skip a tooth, skip a tooth",
    body: "Root, skip, third, skip, fifth. C–E–G. Play them one at a time, then together. The skip is the shape. The names come later.",
    hear: "C, E, G, then all three.",
  },
  invert: {
    kicker: "Same notes, new bass",
    title: "The bottom note is the story",
    body: "Root position: C on the bottom. First inversion: E. Second: G. Same three pitches. The lowest one decides how heavy it feels.",
    hear: "C–E–G, then E–G–C, then G–C–E.",
  },
  cadence: {
    kicker: "Gravity",
    title: "G wants to fall into C",
    body: "The five chord is a step above the home chord’s fifth — that’s why it pulls. Play C, then G, then C. Don’t rush the return. The return is the point.",
    hear: "Home. Away. Home.",
  },
  five: {
    kicker: "The hand",
    title: "One finger per white key",
    body: "Thumb on C, pinky on G. Walk up, walk down. Don’t collapse the unused fingers. The five-finger position is how every beginner piece starts — because it’s true.",
    hear: "C D E F G, then back down.",
  },
};

function parseTab(raw: string): PianoTab {
  if (raw === "middlec" || raw === "triad" || raw === "invert" || raw === "cadence" || raw === "five") return raw;
  return "middlec";
}
function parseChord(raw: string): PianoChord {
  if ((CHORDS as readonly string[]).includes(raw)) return raw as PianoChord;
  return "C";
}

function invert(midis: number[], n: number) {
  const notes = [...midis];
  for (let i = 0; i < n; i++) {
    const x = notes.shift();
    if (x != null) notes.push(x + 12);
  }
  return notes;
}

function line(tab: PianoTab, chord: PianoChord): { beat: number; midis: number[]; label: string }[] {
  const voicing = PIANO_VOICINGS[chord] ?? [60, 64, 67];
  if (tab === "middlec") return Array.from({ length: 8 }, (_, i) => ({ beat: i, midis: [60], label: "C" }));
  if (tab === "triad") {
    const names = voicing.map((m) => ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"][m % 12] ?? "?");
    return [
      { beat: 0, midis: [voicing[0]], label: names[0] ?? "R" },
      { beat: 1, midis: [voicing[1]], label: names[1] ?? "3" },
      { beat: 2, midis: [voicing[2]], label: names[2] ?? "5" },
      { beat: 3, midis: voicing, label: chord },
      { beat: 4, midis: [voicing[0]], label: names[0] ?? "R" },
      { beat: 5, midis: [voicing[1]], label: names[1] ?? "3" },
      { beat: 6, midis: [voicing[2]], label: names[2] ?? "5" },
      { beat: 7, midis: voicing, label: chord },
    ];
  }
  if (tab === "invert") {
    const a = invert(voicing, 0);
    const b = invert(voicing, 1);
    const c = invert(voicing, 2);
    return [
      { beat: 0, midis: a, label: "R" },
      { beat: 1, midis: a, label: "R" },
      { beat: 2, midis: b, label: "1st" },
      { beat: 3, midis: b, label: "1st" },
      { beat: 4, midis: c, label: "2nd" },
      { beat: 5, midis: c, label: "2nd" },
      { beat: 6, midis: a, label: "R" },
      { beat: 7, midis: a, label: "R" },
    ];
  }
  if (tab === "cadence") {
    const g = PIANO_VOICINGS.G ?? [67, 71, 74];
    return [
      { beat: 0, midis: voicing, label: chord },
      { beat: 1, midis: voicing, label: chord },
      { beat: 2, midis: g, label: "G" },
      { beat: 3, midis: g, label: "G" },
      { beat: 4, midis: voicing, label: chord },
      { beat: 5, midis: voicing, label: chord },
      { beat: 6, midis: g, label: "G" },
      { beat: 7, midis: voicing, label: chord },
    ];
  }
  const scale = [60, 62, 64, 65, 67, 65, 64, 62];
  const names = ["C", "D", "E", "F", "G", "F", "E", "D"];
  return scale.map((m, i) => ({ beat: i, midis: [m], label: names[i] ?? "C" }));
}

export function PianoLab() {
  const search = useSearch({ from: "/techniques" });
  const navigate = useNavigate({ from: "/techniques" });
  const tab = parseTab(search.tab);
  const chord = parseChord(search.chord);
  const events = line(tab, chord);
  const copy = COPY[tab];
  const head = usePlayhead();
  const activeMidi = head.mark;

  const patch = (next: Partial<{ tab: string; chord: string }>) => {
    void navigate({ search: { tab: next.tab ?? tab, chord: next.chord ?? chord }, replace: true });
    head.clear();
  };

  const play = () => {
    unlockAudio();
    const hits: LineHit[] = events.map((e) => ({
      beat: e.beat,
      mark: e.midis[0] ?? 60,
      sound: (when) => {
        if (e.midis.length > 1) pianoChord(e.midis.map(midiToFreq), when);
        else pianoTone(midiToFreq(e.midis[0] ?? 60), when);
      },
    }));
    head.play(hits, 80, true);
  };

  const chordPcs = (() => {
    if (tab === "five") return [0, 2, 4, 5, 7];
    if (tab === "middlec") return [0];
    const v = events.find((e) => e.beat === Math.floor(head.cursorBeat ?? 0)) ?? events[0];
    return (v?.midis ?? [60]).map((m) => m % 12);
  })();

  return (
    <AppShell>
      <header className="px-5 pb-2 pt-8">
        <p className="text-[11px] uppercase tracking-[0.22em] text-dim">Piano lab · Keys</p>
        <h1 className="mt-2 font-display text-4xl font-semibold tracking-tight">Hands</h1>
        <p className="mt-3 max-w-sm text-pretty text-muted">Find C, build a triad, feel G pull you home.</p>
      </header>
      <div className="sticky top-0 z-10 mx-4 mt-4 rounded-lg border border-border bg-surface/95 p-2 backdrop-blur-sm">
        <TabRow tabs={TABS} active={tab} onPick={(id) => patch({ tab: id })} />
      </div>
      <div className="px-5 pb-8 pt-5">
        {tab !== "middlec" && tab !== "five" ? (
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
        <BeatStrip
          cells={events.map((e) => ({ beat: e.beat, top: e.label, bot: e.midis.length > 1 ? "chord" : "key" }))}
          cursorBeat={head.cursorBeat}
        />
        <section className="mt-6">
          <p className="mb-2 text-[11px] uppercase tracking-[0.18em] text-dim">Keyboard</p>
          <PianoKeyboard
            activeMidi={activeMidi}
            expectedMidi={activeMidi}
            chordPcs={chordPcs}
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
