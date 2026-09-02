import { useNavigate, useSearch } from "@tanstack/react-router";
import { AppShell } from "@/components/app-shell";
import { ChordDiagram } from "@/components/chord-diagram";
import { BeatStrip, Chip, LabCopy, PlayBar, TabRow, usePlayhead, type LineHit } from "@/components/labs/shared";
import { ghostNote, pluck, strum, strumUp, unlockAudio } from "@/lib/spark/audio";
import { instrumentById, UKE_CHORDS } from "@/lib/spark/instruments";

export type UkeTab = "down" | "island" | "chunk" | "pick" | "switch";
const CHORDS = ["C", "G", "Am", "F"] as const;
type UkeChord = (typeof CHORDS)[number];

const TABS: { id: UkeTab; label: string }[] = [
  { id: "down", label: "Down" },
  { id: "island", label: "Island" },
  { id: "chunk", label: "Chunk" },
  { id: "pick", label: "Pick" },
  { id: "switch", label: "Switch" },
];

const COPY: Record<UkeTab, { kicker: string; title: string; body: string; hear: string }> = {
  down: {
    kicker: "The stroke",
    title: "All four strings, one direction",
    body: "Wrist, not elbow. The nail or the flesh, either works — consistency is the sound. Land on the beat, not ahead of it.",
    hear: "Eight downs. Same chord. Same volume.",
  },
  island: {
    kicker: "D DU UDU",
    title: "The pattern everyone already knows",
    body: "Down, skip, down-up, skip, up, down-up. Keep the arm moving through the rests — the ghost swing is what makes it lilt instead of march.",
    hear: "D · D U · U D U",
  },
  chunk: {
    kicker: "The mute",
    title: "Left hand kills the ring",
    body: "Strum, then drop the left-hand fingers flat across the strings. The chunk is a snare. Alternate open downs with chunks and the uke becomes a drum.",
    hear: "Chord, chuck, chord, chuck.",
  },
  pick: {
    kicker: "p-i-m-a",
    title: "One finger per string",
    body: "Thumb on G, index on C, middle on E, ring on A. Not a strum — four separate attacks. Slow until each string speaks.",
    hear: "G, C, E, A. Then again.",
  },
  switch: {
    kicker: "The hard part",
    title: "Change on one. Not on three.",
    body: "Four downs on C, four on G. The switch happens in the gap before beat one of the new chord. If you land late, you didn’t leave early.",
    hear: "C C C C, G G G G.",
  },
};

function parseTab(raw: string): UkeTab {
  if (raw === "down" || raw === "island" || raw === "chunk" || raw === "pick" || raw === "switch") return raw;
  return "down";
}
function parseChord(raw: string): UkeChord {
  if ((CHORDS as readonly string[]).includes(raw)) return raw as UkeChord;
  return "C";
}

function freqs(id: string) {
  const inst = instrumentById("ukulele");
  const c = UKE_CHORDS[id];
  if (!c) return [...inst.openFreq];
  return c.frets
    .map((f, i) => (f == null ? null : inst.openFreq[i] * Math.pow(2, f / 12)))
    .filter((f): f is number => f != null);
}

function shape(id: string) {
  const c = UKE_CHORDS[id];
  if (!c) return undefined;
  return { id, name: id, ...c };
}

export function UkeLab() {
  const search = useSearch({ from: "/techniques" });
  const navigate = useNavigate({ from: "/techniques" });
  const tab = parseTab(search.tab);
  const chord = parseChord(search.chord);
  const copy = COPY[tab];
  const head = usePlayhead();
  const f = freqs(chord);
  const open = instrumentById("ukulele").openFreq;

  const patch = (next: Partial<{ tab: string; chord: string }>) => {
    void navigate({ search: { tab: next.tab ?? tab, chord: next.chord ?? chord }, replace: true });
    head.clear();
  };

  const play = () => {
    unlockAudio();
    let hits: LineHit[] = [];
    if (tab === "down") {
      hits = Array.from({ length: 8 }, (_, i) => ({ beat: i, sound: (w) => strum(f, w) }));
    } else if (tab === "island") {
      const slots: ("D" | "U" | ".")[] = ["D", ".", "D", "U", ".", "U", "D", "U"];
      hits = slots.flatMap((kind, i) =>
        kind === "." ? [] : [{ beat: i, sound: (w: number) => (kind === "U" ? strumUp(f, w) : strum(f, w)) }],
      );
    } else if (tab === "chunk") {
      hits = Array.from({ length: 8 }, (_, i) => ({
        beat: i,
        sound: (w) => (i % 2 === 0 ? strum(f, w) : ghostNote(w)),
      }));
    } else if (tab === "pick") {
      hits = [0, 1, 2, 3, 4, 5, 6, 7].map((i) => ({
        beat: i,
        mark: i % 4,
        sound: (w) => pluck(open[i % 4] ?? 392, w, 0.4),
      }));
    } else {
      const g = freqs("G");
      hits = Array.from({ length: 8 }, (_, i) => ({
        beat: i,
        sound: (w) => strum(i < 4 ? f : g, w),
      }));
    }
    head.play(hits, 84, true);
  };

  const liveChord = tab === "switch" && (head.cursorBeat ?? 0) >= 4 ? "G" : chord;
  const cells = Array.from({ length: 8 }, (_, beat) => {
    if (tab === "island") {
      const slots = ["D", "·", "D", "U", "·", "U", "D", "U"];
      return { beat, top: slots[beat] ?? "·", bot: chord };
    }
    if (tab === "chunk") return { beat, top: beat % 2 === 0 ? "D" : "x", bot: chord };
    if (tab === "pick") return { beat, top: ["p", "i", "m", "a"][beat % 4] ?? "p", bot: ["G", "C", "E", "A"][beat % 4] ?? "G" };
    if (tab === "switch") return { beat, top: "D", bot: beat < 4 ? chord : "G" };
    return { beat, top: "D", bot: chord };
  });

  return (
    <AppShell>
      <header className="px-5 pb-2 pt-8">
        <p className="text-[11px] uppercase tracking-[0.22em] text-dim">Ukulele lab · GCEA</p>
        <h1 className="mt-2 font-display text-4xl font-semibold tracking-tight">Strum</h1>
        <p className="mt-3 max-w-sm text-pretty text-muted">Four strings. The right hand is the song.</p>
      </header>
      <div className="sticky top-0 z-10 mx-4 mt-4 rounded-lg border border-border bg-surface/95 p-2 backdrop-blur-sm">
        <TabRow tabs={TABS} active={tab} onPick={(id) => patch({ tab: id })} />
      </div>
      <div className="px-5 pb-8 pt-5">
        {tab !== "pick" ? (
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
        <section className="mt-6 flex flex-col items-center">
          <p className="mb-2 self-start text-[11px] uppercase tracking-[0.18em] text-dim">Shape</p>
          <ChordDiagram shape={shape(liveChord)} />
        </section>
      </div>
    </AppShell>
  );
}
