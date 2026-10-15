import { useState } from "react";
import { useNavigate, useSearch } from "@tanstack/react-router";
import { AppShell } from "@/components/app-shell";
import { ChordDiagram } from "@/components/chord-diagram";
import { BeatStrip, Chip, LabCopy, PlayBar, TabRow } from "@/components/labs/shared";
import { usePlayhead, type LineHit } from "@/components/labs/use-playhead";
import { PitchMatch } from "@/components/tuner-panel";
import { ghostNote, pianoHold, strum, unlockAudio } from "@/lib/spark/audio";
import { instrumentById, LAPSTEEL_CHORDS, midiToFreq } from "@/lib/spark/instruments";
import { cn } from "@/lib/utils";

export type LapSteelTab = "bar" | "slide" | "vibrato" | "block" | "positions" | "slant" | "pitch";
const CHORDS = ["C", "F", "G", "D"] as const;
type LapSteelChord = (typeof CHORDS)[number];

const TABS: { id: LapSteelTab; label: string }[] = [
  { id: "bar", label: "Bar" },
  { id: "slide", label: "Slide" },
  { id: "vibrato", label: "Vibrato" },
  { id: "block", label: "Block" },
  { id: "positions", label: "Positions" },
  { id: "slant", label: "Slant" },
  { id: "pitch", label: "Pitch" },
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
  slant: {
    kicker: "Slanted bar",
    title: "Tip the top end back a fret",
    body: "Strings 4 and 2 above fret 2 with string 1 above fret 1 sounds A–D–F: D minor, a chord no straight bar can make in C6. Pick strings 4, 2 and 1; the others stay quiet.",
    hear: "Open C, then the slant to D minor. Twice.",
  },
  pitch: {
    kicker: "Twenty cents",
    title: "Land the bar inside the note",
    body: "Pick a target below, hear it, then play it on the string named. The needle shows how far your pitch sits from the target, in cents — inside 20 counts as in tune, the same standard the daily lessons use with the mic on. The open strings are the reference for every bar position: tune them first.",
    hear: "The target, twice. Then your turn.",
  },
};

/** Bar placements the daily path teaches, open strings included as references. */
const PITCH_TARGETS: { midi: number; name: string; place: string }[] = [
  { midi: 60, name: "C4", place: "2nd string · open" },
  { midi: 62, name: "D4", place: "2nd string · fret 2" },
  { midi: 64, name: "E4", place: "1st string · open" },
  { midi: 65, name: "F4", place: "1st string · fret 1" },
  { midi: 67, name: "G4", place: "1st string · fret 3" },
  { midi: 69, name: "A4", place: "1st string · fret 5" },
  { midi: 71, name: "B4", place: "1st string · fret 7" },
  { midi: 72, name: "C5", place: "2nd string · fret 12" },
];

function parseTab(raw: string): LapSteelTab {
  if (
    raw === "bar" ||
    raw === "slide" ||
    raw === "vibrato" ||
    raw === "block" ||
    raw === "positions" ||
    raw === "slant" ||
    raw === "pitch"
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
  // The Pitch tab's target: the reference pattern presents this note and
  // PitchMatch judges against this same note — presented and judged are
  // the same pitch by construction.
  const [pitchTarget, setPitchTarget] = useState(69);
  const target = PITCH_TARGETS.find((t) => t.midi === pitchTarget) ?? PITCH_TARGETS[5];

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
    } else if (tab === "slant") {
      const openPair = [55, 60, 64].map(midiToFreq);
      const dmSlant = [57, 62, 65].map(midiToFreq);
      hits = [0, 2, 4, 6].map((beat) => ({
        beat,
        sound: (w: number) => strum(beat % 4 === 0 ? openPair : dmSlant, w),
      }));
    } else if (tab === "pitch") {
      hits = [0, 4].map((beat) => ({
        beat,
        sound: (w: number) => pianoHold(midiToFreq(target.midi), beatSec * 1.8, w, 0.22),
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
    if (tab === "slant")
      return {
        beat,
        top: beat % 2 === 0 ? "↓" : "hold",
        bot: beat < 2 || (beat >= 4 && beat < 6) ? "C · open" : "Dm · slant",
      };
    if (tab === "pitch")
      return {
        beat,
        top: beat % 4 === 0 ? target.name : "·",
        bot: beat % 4 === 0 ? "target" : "you",
      };
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
        {tab === "pitch" ? (
          <>
            <div
              className="mt-6 grid w-full gap-2"
              style={{ gridTemplateColumns: "repeat(auto-fit, minmax(4.5rem, 1fr))" }}
              role="group"
              aria-label="Pitch targets"
            >
              {PITCH_TARGETS.map((t) => (
                <button
                  key={t.midi}
                  type="button"
                  aria-pressed={t.midi === target.midi}
                  onClick={() => setPitchTarget(t.midi)}
                  className={cn(
                    "flex h-12 flex-col items-center justify-center rounded-lg border text-sm font-medium transition-colors",
                    t.midi === target.midi
                      ? "border-ember bg-raised text-ember shadow-xs"
                      : "border-border bg-surface text-fg hover:border-ember/50 hover:bg-raised",
                  )}
                >
                  <span>{t.name}</span>
                  <span className="text-[10px] text-dim">{t.place}</span>
                </button>
              ))}
            </div>
            <section className="mt-6">
              <PitchMatch targetFreq={midiToFreq(target.midi)} targetName={target.name} />
            </section>
          </>
        ) : null}
        <p className="mt-6 text-xs leading-relaxed text-muted">
          References are synthesized tones, not a lap steel; slides are approximated by the arrival
          chord. Only the Pitch tab listens to your playing; the other tabs play references.
        </p>
      </div>
    </AppShell>
  );
}
