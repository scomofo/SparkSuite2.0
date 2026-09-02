import { useNavigate, useSearch } from "@tanstack/react-router";
import { AppShell } from "@/components/app-shell";
import { DrumPads } from "@/components/drum-pads";
import { BeatStrip, LabCopy, PlayBar, TabRow, usePlayhead, type BeatCell, type LineHit } from "@/components/labs/shared";
import { drumHit, unlockAudio } from "@/lib/spark/audio";

export type DrumTab = "kick" | "backbeat" | "hats" | "four" | "fill";

const TABS: { id: DrumTab; label: string }[] = [
  { id: "kick", label: "Kick" },
  { id: "backbeat", label: "2 + 4" },
  { id: "hats", label: "Hats" },
  { id: "four", label: "Four" },
  { id: "fill", label: "Fill" },
];

const COPY: Record<DrumTab, { kicker: string; title: string; body: string; hear: string }> = {
  kick: {
    kicker: "The floor",
    title: "One is the whole song",
    body: "The kick names beat one. Everything else leans on it. Play it late rather than early — a rushed kick makes the band sound nervous.",
    hear: "Kick on one and three. Leave the rest empty.",
  },
  backbeat: {
    kicker: "The clap",
    title: "Snare on two and four",
    body: "That’s the backbeat. Kick holds one and three. Snare answers. If the snare is early, the groove leans forward. Sit on the back of two.",
    hear: "Kick, snare, kick, snare. The snare is the handclap.",
  },
  hats: {
    kicker: "The clock",
    title: "Hats keep time so you don’t have to",
    body: "Closed hat on every eighth. Kick and snare sit inside that grid. The hat is quieter than both — if it yells, the groove disappears.",
    hear: "Tick-tick-tick-tick, with the backbeat still in the middle.",
  },
  four: {
    kicker: "Four on the floor",
    title: "Kick every beat. Don’t get fancy.",
    body: "Disco, house, every chorus that needed the floor to move. Snare still on two and four. The kick is a four-letter word: just, even, fat, late.",
    hear: "Four kicks. Two snares. Hats if you can spare a hand.",
  },
  fill: {
    kicker: "The comma",
    title: "A fill is a breath, not a solo",
    body: "Toms walk you from the end of a phrase back into one. Count it. Land on the kick of the next bar, not in the middle of a thought.",
    hear: "Kick, snare, tom, tom — then you’re home.",
  },
};

const NAMES = ["K", "S", "H", "T"];

function parseTab(raw: string): DrumTab {
  if (raw === "kick" || raw === "backbeat" || raw === "hats" || raw === "four" || raw === "fill") return raw;
  return "kick";
}

function pattern(tab: DrumTab): { beat: number; pad: number }[] {
  if (tab === "kick") return [0, 4].map((b) => ({ beat: b, pad: 0 }));
  if (tab === "backbeat")
    return [
      { beat: 0, pad: 0 },
      { beat: 2, pad: 1 },
      { beat: 4, pad: 0 },
      { beat: 6, pad: 1 },
    ];
  if (tab === "hats") {
    const out: { beat: number; pad: number }[] = [];
    for (let b = 0; b < 8; b++) {
      out.push({ beat: b, pad: 2 });
      if (b === 0 || b === 4) out.push({ beat: b, pad: 0 });
      if (b === 2 || b === 6) out.push({ beat: b, pad: 1 });
    }
    return out;
  }
  if (tab === "four") {
    const out: { beat: number; pad: number }[] = [];
    for (let b = 0; b < 8; b++) {
      if (b % 2 === 0) out.push({ beat: b, pad: 0 });
      if (b === 2 || b === 6) out.push({ beat: b, pad: 1 });
      out.push({ beat: b, pad: 2 });
    }
    return out;
  }
  return [
    { beat: 0, pad: 0 },
    { beat: 2, pad: 1 },
    { beat: 4, pad: 3 },
    { beat: 5, pad: 3 },
    { beat: 6, pad: 1 },
    { beat: 7, pad: 2 },
  ];
}

function cells(tab: DrumTab): BeatCell[] {
  const hits = pattern(tab);
  return Array.from({ length: 8 }, (_, beat) => {
    const here = hits.filter((h) => h.beat === beat);
    if (!here.length) return { beat, top: "·", bot: "·" };
    const main = here.find((h) => h.pad !== 2) ?? here[0];
    return { beat, top: NAMES[main.pad] ?? "·", bot: here.length > 1 ? "+" : NAMES[main.pad] ?? "·" };
  });
}

export function DrumsLab() {
  const search = useSearch({ from: "/techniques" });
  const navigate = useNavigate({ from: "/techniques" });
  const tab = parseTab(search.tab);
  const hits = pattern(tab);
  const copy = COPY[tab];
  const head = usePlayhead();

  const patch = (next: DrumTab) => {
    void navigate({ search: { tab: next, chord: "" }, replace: true });
    head.clear();
  };

  const play = () => {
    unlockAudio();
    const line: LineHit[] = hits.map((h) => ({
      beat: h.beat,
      mark: h.pad,
      sound: (when) => drumHit(h.pad, when),
    }));
    head.play(line, 92, false);
  };

  return (
    <AppShell>
      <header className="px-5 pb-2 pt-8">
        <p className="text-[11px] uppercase tracking-[0.22em] text-dim">Drums lab · Kit</p>
        <h1 className="mt-2 font-display text-4xl font-semibold tracking-tight">Groove</h1>
        <p className="mt-3 max-w-sm text-pretty text-muted">Kick names one. Snare answers. Hats are the clock.</p>
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
        <BeatStrip cells={cells(tab)} cursorBeat={head.cursorBeat} />
        <section className="mt-6">
          <p className="mb-2 text-[11px] uppercase tracking-[0.18em] text-dim">Pads</p>
          <DrumPads active={head.mark} expected={head.mark} onHit={(i) => drumHit(i)} />
        </section>
        <p className="mt-5 text-pretty text-sm text-muted">Tap a pad yourself. Then play the line and match it.</p>
      </div>
    </AppShell>
  );
}
