import { useNavigate, useSearch } from "@tanstack/react-router";
import { AppShell } from "@/components/app-shell";
import { ChordDiagram } from "@/components/chord-diagram";
import { BeatStrip, Chip, LabCopy, PlayBar, TabRow, usePlayhead, type LineHit } from "@/components/labs/shared";
import { bassLegato, ghostNote, pluck, strum, strumUp, unlockAudio } from "@/lib/spark/audio";
import { CHORDS, OPEN_FREQ } from "@/lib/spark/guitar";

export type GuitarTab = "down" | "up" | "chuck" | "hammer" | "travis";
const GCHORDS = ["Em", "G", "C", "D"] as const;
type GChord = (typeof GCHORDS)[number];

const TABS: { id: GuitarTab; label: string }[] = [
  { id: "down", label: "Down" },
  { id: "up", label: "Down-up" },
  { id: "chuck", label: "Chuck" },
  { id: "hammer", label: "Hammer" },
  { id: "travis", label: "Travis" },
];

const COPY: Record<GuitarTab, { kicker: string; title: string; body: string; hear: string }> = {
  down: {
    kicker: "The stroke",
    title: "Wrist. Not the elbow.",
    body: "A downstroke is a small rotation. If your forearm is doing the work, you’re late and you’re loud. Six strings, one motion, on the beat.",
    hear: "Eight downs on one chord.",
  },
  up: {
    kicker: "The return",
    title: "The hand never stops",
    body: "Down, up, down, up. The missed strings on the way up are part of the sound. Keep the pendulum even when you skip a stroke.",
    hear: "D U D U. The up is lighter.",
  },
  chuck: {
    kicker: "Mute",
    title: "The left hand is a snare",
    body: "Strum, then flatten the fingers across the strings. Funk, reggae, every tight rhythm guitar part — the chuck is the drum inside the chord.",
    hear: "Chord, chuck, chord, chuck.",
  },
  hammer: {
    kicker: "Left hand finish",
    title: "Pluck once. The next note is free.",
    body: "Open G string, then hammer the second fret. No right hand on the second attack. If you hear a pick click, you cheated.",
    hear: "G, then A, no second pick.",
  },
  travis: {
    kicker: "Thumb drone",
    title: "Thumb on the bass. Fingers on the rest.",
    body: "Thumb alternates the two lowest strings. Index and middle fill the high strings between. The bass never stops. That’s the whole folk engine.",
    hear: "Bass, treble, bass, treble.",
  },
};

function parseTab(raw: string): GuitarTab {
  if (raw === "down" || raw === "up" || raw === "chuck" || raw === "hammer" || raw === "travis") return raw;
  return "down";
}
function parseChord(raw: string): GChord {
  if ((GCHORDS as readonly string[]).includes(raw)) return raw as GChord;
  return "Em";
}

function freqs(id: string) {
  const c = CHORDS[id];
  if (!c) return [...OPEN_FREQ];
  return c.frets
    .map((f, i) => (f == null ? null : OPEN_FREQ[i] * Math.pow(2, f / 12)))
    .filter((f): f is number => f != null);
}

export function GuitarLab() {
  const search = useSearch({ from: "/techniques" });
  const navigate = useNavigate({ from: "/techniques" });
  const tab = parseTab(search.tab);
  const chord = parseChord(search.chord);
  const copy = COPY[tab];
  const head = usePlayhead();
  const f = freqs(chord);

  const patch = (next: Partial<{ tab: string; chord: string }>) => {
    void navigate({ search: { tab: next.tab ?? tab, chord: next.chord ?? chord }, replace: true });
    head.clear();
  };

  const play = () => {
    unlockAudio();
    let hits: LineHit[] = [];
    if (tab === "down") hits = Array.from({ length: 8 }, (_, i) => ({ beat: i, sound: (w) => strum(f, w) }));
    else if (tab === "up")
      hits = Array.from({ length: 8 }, (_, i) => ({
        beat: i,
        sound: (w) => (i % 2 === 0 ? strum(f, w) : strumUp(f, w)),
      }));
    else if (tab === "chuck")
      hits = Array.from({ length: 8 }, (_, i) => ({
        beat: i,
        sound: (w) => (i % 2 === 0 ? strum(f, w) : ghostNote(w)),
      }));
    else if (tab === "hammer") {
      hits = Array.from({ length: 4 }, (_, i) => [
        { beat: i * 2, sound: (w: number) => pluck(OPEN_FREQ[3] ?? 196, w, 0.4) },
        { beat: i * 2 + 1, sound: (w: number) => bassLegato((OPEN_FREQ[3] ?? 196) * Math.pow(2, 2 / 12), w) },
      ]).flat();
    } else {
      hits = Array.from({ length: 8 }, (_, i) => ({
        beat: i,
        sound: (w) => {
          if (i % 2 === 0) pluck(OPEN_FREQ[i % 4 === 0 ? 0 : 1] ?? 82, w, 0.45);
          else pluck(OPEN_FREQ[5] ?? 330, w, 0.3);
        },
      }));
    }
    head.play(hits, 84, true);
  };

  const cells = Array.from({ length: 8 }, (_, beat) => {
    if (tab === "up") return { beat, top: beat % 2 === 0 ? "D" : "U", bot: chord };
    if (tab === "chuck") return { beat, top: beat % 2 === 0 ? "D" : "x", bot: chord };
    if (tab === "hammer") return { beat, top: beat % 2 === 0 ? "G" : "h", bot: beat % 2 === 0 ? "pick" : "A" };
    if (tab === "travis") return { beat, top: beat % 2 === 0 ? "p" : "i", bot: beat % 2 === 0 ? "bass" : "high" };
    return { beat, top: "D", bot: chord };
  });

  return (
    <AppShell>
      <header className="px-5 pb-2 pt-8">
        <p className="text-[11px] uppercase tracking-[0.22em] text-dim">Guitar lab · 6-string</p>
        <h1 className="mt-2 font-display text-4xl font-semibold tracking-tight">Right hand</h1>
        <p className="mt-3 max-w-sm text-pretty text-muted">The chord is a shape. The groove is the stroke.</p>
      </header>
      <div className="sticky top-0 z-10 mx-4 mt-4 rounded-lg border border-border bg-surface/95 p-2 backdrop-blur-sm">
        <TabRow tabs={TABS} active={tab} onPick={(id) => patch({ tab: id })} />
      </div>
      <div className="px-5 pb-8 pt-5">
        {tab !== "hammer" && tab !== "travis" ? (
          <>
            <p className="text-[11px] uppercase tracking-[0.18em] text-dim">Chord</p>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {GCHORDS.map((c) => (
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
        {tab !== "hammer" && tab !== "travis" ? (
          <section className="mt-6 flex flex-col items-center">
            <p className="mb-2 self-start text-[11px] uppercase tracking-[0.18em] text-dim">Shape</p>
            <ChordDiagram chordId={chord} />
          </section>
        ) : null}
      </div>
    </AppShell>
  );
}
