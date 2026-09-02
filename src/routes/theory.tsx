import { useEffect, useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { ListMusic, Play, Repeat } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { ChordDiagram } from "@/components/chord-diagram";
import { CircleFifths, Legend } from "@/components/circle-fifths";
import { ChromaticStrip, TheoryFretboard } from "@/components/theory-fretboard";
import { PianoKeyboard } from "@/components/piano-keyboard";
import { Button } from "@/components/ui/button";
import { pianoChord, pianoTone, pluck, strum, unlockAudio } from "@/lib/spark/audio";
import { instrumentById, midiToFreq, stringFreq } from "@/lib/spark/instruments";
import {
  cagedShapes,
  chordLabel,
  chordMidis,
  chordPcs,
  diatonicChords,
  FN_LABEL,
  fretNote,
  INTERVAL_INFO,
  listVoicings,
  neckVoicing,
  noteName,
  parseMode,
  parseNumeral,
  parseQuality,
  parseRoot,
  parseTab,
  pcOf,
  PICKER_ROOTS,
  PROGRESSIONS,
  QUALITIES,
  qualityById,
  scalePcs,
  useFlats,
  voicingFreqs,
  type Mode,
  type TheoryTab,
} from "@/lib/spark/theory";
import { useSpark } from "@/store/spark";
import { cn } from "@/lib/utils";

type Search = {
  tab: TheoryTab;
  root: string;
  q: string;
  key: string;
  mode: Mode;
};

export const Route = createFileRoute("/theory")({
  validateSearch: (raw: Record<string, unknown>): Search => ({
    tab: parseTab(raw.tab),
    root: parseRoot(raw.root),
    q: parseQuality(raw.q),
    key: parseRoot(raw.key),
    mode: parseMode(raw.mode),
  }),
  component: TheoryPage,
});

const TABS: { id: TheoryTab; label: string }[] = [
  { id: "build", label: "Build" },
  { id: "key", label: "Key" },
  { id: "changes", label: "Changes" },
  { id: "caged", label: "CAGED" },
];

function pickerFromPc(pc: number) {
  return PICKER_ROOTS.find((n) => pcOf(n) === pc) ?? "C";
}

function hearQuality(rootPc: number, qualityId: string, when?: number) {
  const inst = instrumentById(useSpark.getState().instrument);
  unlockAudio();
  if (inst.theoryNeck === "piano" || inst.surface === "keys" || inst.surface === "voice") {
    pianoChord(chordMidis(rootPc, qualityId).map(midiToFreq), when);
    return;
  }
  if (inst.theoryNeck === "four") {
    const frets = neckVoicing(inst.openPc, chordPcs(rootPc, qualityId));
    const freqs = frets
      .map((f, i) => (f == null ? null : stringFreq(inst, i, f)))
      .filter((f): f is number => f != null);
    strum(freqs, when);
    return;
  }
  const v = listVoicings(rootPc, qualityId)[0];
  if (v) strum(voicingFreqs(v), when);
}

function playNeckFret(stringIndex: number, fret: number) {
  const inst = instrumentById(useSpark.getState().instrument);
  unlockAudio();
  if (inst.theoryNeck === "four") {
    pluck(stringFreq(inst, stringIndex, fret));
    return;
  }
  pluck(fretNote(stringIndex, fret).freq);
}

function NeckFor({
  rootPc,
  qualityId,
  voicing,
  scalePcs: scale,
  preferFlats,
}: {
  rootPc: number;
  qualityId: string;
  voicing?: (number | null)[];
  scalePcs?: number[];
  preferFlats: boolean;
}) {
  const instrument = useSpark((s) => s.instrument);
  const inst = instrumentById(instrument);
  if (inst.theoryNeck === "none") return null;
  if (inst.theoryNeck === "piano") {
    return (
      <PianoKeyboard
        activeMidi={null}
        chordPcs={chordPcs(rootPc, qualityId)}
        onPlay={(midi) => pianoTone(midiToFreq(midi))}
      />
    );
  }
  const four = inst.theoryNeck === "four" ? neckVoicing(inst.openPc, chordPcs(rootPc, qualityId)) : undefined;
  return (
    <TheoryFretboard
      rootPc={rootPc}
      qualityId={qualityId}
      voicing={voicing ?? four}
      scalePcs={scale}
      preferFlats={preferFlats}
      labels={inst.stringNames}
      openPc={inst.openPc}
      openFreq={inst.openFreq}
      onPlay={playNeckFret}
    />
  );
}

function TheoryPage() {
  const search = Route.useSearch();
  const navigate = Route.useNavigate();
  const instrument = useSpark((s) => s.instrument);
  const inst = instrumentById(instrument);
  const tabs = inst.id === "guitar" ? TABS : TABS.filter((t) => t.id !== "caged");
  const tab = search.tab === "caged" && inst.id !== "guitar" ? "build" : search.tab;
  const patch = (next: Partial<Search>) => {
    void navigate({ search: (prev) => ({ ...prev, ...next }), replace: true });
  };

  return (
    <AppShell>
      <header className="px-5 pb-2 pt-8">
        <p className="text-[11px] uppercase tracking-[0.22em] text-dim">
          Chord lab · {inst.name}
        </p>
        <h1 className="mt-2 font-display text-4xl font-semibold tracking-tight">Theory</h1>
        <p className="mt-3 max-w-sm text-pretty text-muted">
          Harmony is shared. {inst.theoryNeck === "none" ? "Listen; the kit doesn’t have a neck." : "The neck changes with the instrument."}
        </p>
      </header>

      <div className="sticky top-0 z-10 mx-4 mt-4 rounded-lg border border-border bg-surface/95 p-1 backdrop-blur-sm">
        <div className={cn("grid gap-0.5", tabs.length === 4 ? "grid-cols-4" : "grid-cols-3")}>
          {tabs.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => patch({ tab: t.id })}
              className={cn(
                "h-10 rounded-md text-sm font-medium transition-colors duration-(--motion-quick)",
                tab === t.id ? "bg-accent text-accent-fg" : "text-muted hover:text-fg",
              )}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {tab === "build" ? <BuildTab search={search} patch={patch} /> : null}
      {tab === "key" ? <KeyTab search={search} patch={patch} /> : null}
      {tab === "changes" ? <ChangesTab search={search} patch={patch} /> : null}
      {tab === "caged" && inst.id === "guitar" ? <CagedTab search={search} patch={patch} /> : null}
    </AppShell>
  );
}

function Chip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "h-10 min-w-10 rounded-md px-3 text-sm font-medium transition-colors duration-(--motion-quick)",
        active ? "bg-accent text-accent-fg" : "border border-border bg-raised text-fg hover:border-ember/50",
      )}
    >
      {children}
    </button>
  );
}

function BuildTab({ search, patch }: { search: Search; patch: (n: Partial<Search>) => void }) {
  const instrument = useSpark((s) => s.instrument);
  const inst = instrumentById(instrument);
  const rootPc = pcOf(search.root);
  const flats = useFlats(rootPc, "major");
  const quality = qualityById(search.q);
  const pcs = chordPcs(rootPc, search.q);
  const voicings = useMemo(() => (inst.id === "guitar" ? listVoicings(rootPc, search.q) : []), [inst.id, rootPc, search.q]);
  const [voicingIdx, setVoicingIdx] = useState(0);
  const [focusIv, setFocusIv] = useState<string | null>(null);

  useEffect(() => {
    setVoicingIdx(0);
    setFocusIv(null);
  }, [search.root, search.q]);

  const voicing = voicings[Math.min(voicingIdx, Math.max(0, voicings.length - 1))];
  const info = focusIv ? INTERVAL_INFO[focusIv] : null;
  const fourShape =
    inst.theoryNeck === "four"
      ? {
          id: "neck",
          name: chordLabel(rootPc, search.q, flats),
          frets: neckVoicing(inst.openPc, pcs),
          fingers: neckVoicing(inst.openPc, pcs).map((f) => (f && f > 0 ? 1 : 0)),
          notes: [],
        }
      : null;

  const hearChord = () => {
    if (inst.id === "guitar" && voicing) {
      unlockAudio();
      strum(voicingFreqs(voicing));
      return;
    }
    hearQuality(rootPc, search.q);
  };
  const hearArp = () => {
    unlockAudio();
    if (inst.theoryNeck === "piano" || inst.surface === "keys" || inst.surface === "voice") {
      const ac = unlockAudio();
      chordMidis(rootPc, search.q).forEach((m, i) => pianoTone(midiToFreq(m), ac.currentTime + i * 0.16, 0.28));
      return;
    }
    if (fourShape) {
      const ac = unlockAudio();
      fourShape.frets.forEach((f, i) => {
        if (f == null) return;
        pluck(stringFreq(inst, i, f), ac.currentTime + i * 0.16, 0.42);
      });
      return;
    }
    if (!voicing) return;
    const ac = unlockAudio();
    voicingFreqs(voicing).forEach((f, i) => pluck(f, ac.currentTime + i * 0.16, 0.42));
  };

  return (
    <div className="px-5 pb-8 pt-5">
      <p className="text-[11px] uppercase tracking-[0.18em] text-dim">Root</p>
      <div className="mt-2 flex flex-wrap gap-1.5">
        {PICKER_ROOTS.map((n) => (
          <Chip key={n} active={search.root === n} onClick={() => patch({ root: n })}>
            {n}
          </Chip>
        ))}
      </div>

      <p className="mt-5 text-[11px] uppercase tracking-[0.18em] text-dim">Quality</p>
      {(["triad", "seventh", "colour"] as const).map((group) => (
        <div key={group} className="mt-2 flex flex-wrap gap-1.5">
          {QUALITIES.filter((q) => q.group === group).map((q) => (
            <Chip key={q.id} active={search.q === q.id} onClick={() => patch({ q: q.id })}>
              {q.suffix || "maj"}
            </Chip>
          ))}
        </div>
      ))}

      <section className="mt-6 rounded-xl border border-border bg-surface p-5">
        <p className="text-[11px] uppercase tracking-[0.18em] text-dim">{quality.name}</p>
        <h2 className="mt-1 font-display text-5xl font-semibold tracking-tight">{chordLabel(rootPc, search.q, flats)}</h2>
        <div className="mt-4 flex flex-wrap gap-2">
          {quality.formula.map((iv, i) => (
            <button
              key={iv + String(i)}
              type="button"
              onClick={() => setFocusIv(iv === focusIv ? null : iv)}
              className={cn(
                "rounded-md px-3 py-2 text-sm font-medium",
                focusIv === iv ? "bg-accent text-accent-fg" : "bg-raised text-fg",
              )}
            >
              <span className="block text-[10px] uppercase tracking-wider opacity-70">{noteName(pcs[i] ?? rootPc, flats)}</span>
              {iv}
            </button>
          ))}
        </div>
        <p className="mt-4 text-pretty text-sm leading-relaxed text-muted">{info ? info.role : quality.blurb}</p>
        {info ? (
          <p className="mt-1 text-sm text-fg">
            {info.name} · {info.semitones} semitone{info.semitones === 1 ? "" : "s"}
          </p>
        ) : null}

        <div className="mt-5 flex gap-2">
          <Button onClick={hearChord} className="flex-1">
            <Play className="size-4" />
            {inst.surface === "keys" || inst.surface === "voice" ? "Play" : "Strum"}
          </Button>
          <Button variant="secondary" onClick={hearArp} className="flex-1">
            Arpeggio
          </Button>
        </div>
      </section>

      <section className="mt-5">
        <p className="mb-2 text-[11px] uppercase tracking-[0.18em] text-dim">From the root</p>
        <ChromaticStrip rootPc={rootPc} qualityId={search.q} preferFlats={flats} />
      </section>

      {inst.theoryNeck !== "none" ? (
        <section className="mt-6">
          <div className="mb-2 flex items-baseline justify-between gap-3">
            <p className="text-[11px] uppercase tracking-[0.18em] text-dim">{inst.theoryNeck === "piano" ? "Keyboard" : "Neck"}</p>
            <Legend />
          </div>
          <NeckFor rootPc={rootPc} qualityId={search.q} voicing={voicing?.frets} preferFlats={flats} />
        </section>
      ) : null}

      {voicings.length ? (
        <section className="mt-6">
          <p className="text-[11px] uppercase tracking-[0.18em] text-dim">Voicings</p>
          <div className="mt-3 flex gap-3 overflow-x-auto pb-2">
            {voicings.map((v, i) => (
              <ChordDiagram
                key={v.id}
                shape={v}
                compact
                selected={i === voicingIdx}
                onSelect={() => {
                  setVoicingIdx(i);
                  unlockAudio();
                  strum(voicingFreqs(v));
                }}
              />
            ))}
          </div>
        </section>
      ) : null}

      {fourShape ? (
        <section className="mt-6">
          <p className="text-[11px] uppercase tracking-[0.18em] text-dim">On this neck</p>
          <div className="mt-3">
            <ChordDiagram
              shape={fourShape}
              compact
              onSelect={() => hearQuality(rootPc, search.q)}
            />
          </div>
        </section>
      ) : null}
    </div>
  );
}

function KeyTab({ search, patch }: { search: Search; patch: (n: Partial<Search>) => void }) {
  const instrument = useSpark((s) => s.instrument);
  const inst = instrumentById(instrument);
  const keyPc = pcOf(search.key);
  const flats = useFlats(keyPc, search.mode);
  const [sevenths, setSevenths] = useState(false);
  const [sel, setSel] = useState(0);
  const chords = diatonicChords(keyPc, search.mode, sevenths);
  const scale = scalePcs(keyPc, search.mode);
  const chosen = chords[sel] ?? chords[0];

  useEffect(() => {
    setSel(0);
  }, [search.key, search.mode, sevenths]);

  return (
    <div className="px-5 pb-8 pt-5">
      <p className="text-[11px] uppercase tracking-[0.18em] text-dim">Tonic</p>
      <div className="mt-2 flex flex-wrap gap-1.5">
        {PICKER_ROOTS.map((n) => (
          <Chip key={n} active={search.key === n} onClick={() => patch({ key: n })}>
            {n}
          </Chip>
        ))}
      </div>
      <div className="mt-3 flex gap-1.5">
        <Chip active={search.mode === "major"} onClick={() => patch({ mode: "major" })}>
          Major
        </Chip>
        <Chip active={search.mode === "minor"} onClick={() => patch({ mode: "minor" })}>
          Minor
        </Chip>
        <Chip active={sevenths} onClick={() => setSevenths((s) => !s)}>
          7ths
        </Chip>
      </div>

      <div className="mt-5">
        <CircleFifths
          tonicPc={keyPc}
          mode={search.mode}
          onPick={(pc, nextMode) => patch({ key: pickerFromPc(pc), mode: nextMode })}
        />
      </div>

      <p className="mt-2 text-center text-sm text-muted">Scale · {scale.map((pc) => noteName(pc, flats)).join("  ")}</p>
      <p className="mt-1 text-center text-xs text-dim">Outer ring = major keys · inner = relative minors</p>

      <ul className="mt-6 space-y-2">
        {chords.map((c, i) => (
          <li key={c.roman}>
            <button
              type="button"
              onClick={() => {
                setSel(i);
                hearQuality(c.rootPc, c.quality);
              }}
              className={cn(
                "flex w-full items-center gap-3 rounded-lg border px-4 py-3 text-left transition-colors duration-(--motion-quick)",
                sel === i ? "border-accent bg-raised" : "border-border bg-surface hover:border-ember/40",
              )}
            >
              <span className="w-14 font-display text-lg font-semibold">{c.roman}</span>
              <span className="flex-1">
                <span className="block font-medium">{c.label}</span>
                <span className="block text-xs text-muted">{FN_LABEL[c.fn]}</span>
              </span>
              <Play className="size-4 text-dim" />
            </button>
          </li>
        ))}
      </ul>

      {chosen ? (
        <section className="mt-5 rounded-xl border border-border bg-surface p-5">
          <p className="text-[11px] uppercase tracking-[0.18em] text-dim">
            {FN_LABEL[chosen.fn]} · {chosen.roman}
          </p>
          <h3 className="mt-1 font-display text-2xl font-semibold">{chosen.label}</h3>
          <p className="mt-3 text-pretty text-sm leading-relaxed text-muted">{chosen.hint}</p>
          <Button
            className="mt-4 w-full"
            variant="secondary"
            onClick={() =>
              patch({
                tab: "build",
                root: pickerFromPc(chosen.rootPc),
                q: chosen.quality,
              })
            }
          >
            Open in the lab
          </Button>
        </section>
      ) : null}

      {inst.theoryNeck !== "none" ? (
        <section className="mt-6">
          <p className="mb-2 text-[11px] uppercase tracking-[0.18em] text-dim">
            {inst.theoryNeck === "piano" ? "Scale on the keys" : "Scale on the neck"}
          </p>
          <NeckFor
            rootPc={chosen.rootPc}
            qualityId={chosen.quality}
            scalePcs={scale}
            preferFlats={flats}
          />
        </section>
      ) : null}
    </div>
  );
}

function ChangesTab({ search, patch }: { search: Search; patch: (n: Partial<Search>) => void }) {
  const keyPc = pcOf(search.key);
  const list = PROGRESSIONS.filter((p) => p.mode === "any" || p.mode === search.mode);
  const [active, setActive] = useState("axis");
  const prog = list.find((p) => p.id === active) ?? list[0];
  const parsed = prog ? prog.numerals.map((n) => parseNumeral(n, keyPc, search.mode)) : [];

  useEffect(() => {
    const ids = PROGRESSIONS.filter((p) => p.mode === "any" || p.mode === search.mode).map((p) => p.id);
    setActive((cur) => (ids.includes(cur) ? cur : (ids[0] ?? "axis")));
  }, [search.mode]);

  const playLoop = () => {
    const ac = unlockAudio();
    const beat = 60 / 88;
    parsed.forEach((ch, i) => {
      hearQuality(ch.rootPc, ch.qualityId, ac.currentTime + i * beat * 2);
    });
  };

  return (
    <div className="px-5 pb-8 pt-5">
      <p className="text-[11px] uppercase tracking-[0.18em] text-dim">In the key of</p>
      <div className="mt-2 flex flex-wrap gap-1.5">
        {PICKER_ROOTS.map((n) => (
          <Chip key={n} active={search.key === n} onClick={() => patch({ key: n })}>
            {n}
          </Chip>
        ))}
      </div>
      <div className="mt-3 flex gap-1.5">
        <Chip active={search.mode === "major"} onClick={() => patch({ mode: "major" })}>
          Major
        </Chip>
        <Chip active={search.mode === "minor"} onClick={() => patch({ mode: "minor" })}>
          Minor
        </Chip>
      </div>

      <ul className="mt-5 space-y-2">
        {list.map((p) => (
          <li key={p.id}>
            <button
              type="button"
              onClick={() => setActive(p.id)}
              className={cn(
                "w-full rounded-lg border px-4 py-3 text-left transition-colors duration-(--motion-quick)",
                active === p.id ? "border-accent bg-raised" : "border-border bg-surface hover:border-ember/40",
              )}
            >
              <span className="font-display font-semibold">{p.name}</span>
              <span className="mt-0.5 block text-sm text-muted">{p.blurb}</span>
            </button>
          </li>
        ))}
      </ul>

      {prog ? (
        <section className="mt-5 rounded-xl border border-border bg-surface p-5">
          <p className="text-[11px] uppercase tracking-[0.18em] text-dim">
            {search.key} {search.mode}
          </p>
          <h3 className="mt-1 font-display text-2xl font-semibold">{prog.name}</h3>
          <ol className="mt-4 grid grid-cols-4 gap-2">
            {parsed.map((ch, i) => (
              <li key={`${ch.numeral}-${i}`}>
                <button
                  type="button"
                  onClick={() => hearQuality(ch.rootPc, ch.qualityId)}
                  className="flex h-full min-h-16 w-full flex-col items-center justify-center rounded-md bg-raised px-1 py-2"
                >
                  <span className="font-display text-sm font-semibold">{ch.numeral}</span>
                  <span className="text-xs text-muted">{ch.label}</span>
                </button>
              </li>
            ))}
          </ol>
          <Button className="mt-4 w-full" onClick={playLoop}>
            <Repeat className="size-4" />
            Play the changes
          </Button>
          <p className="mt-3 text-pretty text-sm text-muted">{prog.blurb}</p>
        </section>
      ) : null}

      <p className="mt-6 flex items-start gap-2 text-sm text-muted">
        <ListMusic className="mt-0.5 size-4 shrink-0 text-dim" />
        Tap a numeral to hear it. I is home, IV lifts, V pulls back.
      </p>
    </div>
  );
}

function CagedTab({ search, patch }: { search: Search; patch: (n: Partial<Search>) => void }) {
  const rootPc = pcOf(search.root);
  const flats = useFlats(rootPc, "major");
  const q = search.q === "min" || search.q === "m7" ? "min" : "maj";
  const shapes = [...cagedShapes(rootPc, q)].sort((a, b) => a.offset - b.offset);
  const [sel, setSel] = useState(0);
  const chosen = shapes[sel] ?? shapes[0];

  useEffect(() => {
    setSel(0);
  }, [search.root, q]);

  return (
    <div className="px-5 pb-8 pt-5">
      <p className="max-w-sm text-pretty text-sm text-muted">
        Five open-chord shapes, moved up the neck, cover every major and minor triad. Named for the open chords they come from: C, A, G, E, D.
      </p>
      <p className="mt-5 text-[11px] uppercase tracking-[0.18em] text-dim">Root</p>
      <div className="mt-2 flex flex-wrap gap-1.5">
        {PICKER_ROOTS.map((n) => (
          <Chip key={n} active={search.root === n} onClick={() => patch({ root: n })}>
            {n}
          </Chip>
        ))}
      </div>
      <div className="mt-3 flex gap-1.5">
        <Chip active={q === "maj"} onClick={() => patch({ q: "maj" })}>
          Major
        </Chip>
        <Chip active={q === "min"} onClick={() => patch({ q: "min" })}>
          Minor
        </Chip>
      </div>

      <div className="mt-5 flex gap-3 overflow-x-auto pb-2">
        {shapes.map((s, i) => (
          <ChordDiagram
            key={s.caged}
            shape={{ ...s.shape, name: `${s.caged} · ${s.offset ? `fret ${s.offset}` : "open"}` }}
            compact
            selected={i === sel}
            onSelect={() => {
              setSel(i);
              unlockAudio();
              strum(voicingFreqs(s.shape));
            }}
          />
        ))}
      </div>

      {chosen ? (
        <section className="mt-5 rounded-xl border border-border bg-surface p-5">
          <p className="text-[11px] uppercase tracking-[0.18em] text-dim">
            {chosen.caged} shape · {chosen.offset ? `barre ${chosen.offset}` : "open"}
          </p>
          <h3 className="mt-1 font-display text-2xl font-semibold">{chordLabel(rootPc, q, flats)}</h3>
          <p className="mt-3 text-pretty text-sm leading-relaxed text-muted">{cagedCopy(chosen.caged, chosen.offset)}</p>
        </section>
      ) : null}

      <section className="mt-6">
        <p className="mb-2 text-[11px] uppercase tracking-[0.18em] text-dim">All five on the neck</p>
        <Legend className="mb-2" />
        <NeckFor rootPc={rootPc} qualityId={q} voicing={chosen?.shape.frets} preferFlats={flats} />
      </section>
    </div>
  );
}

function cagedCopy(caged: string, offset: number) {
  const place = offset ? `at fret ${offset}` : "in open position";
  const roots: Record<string, string> = {
    E: "Roots sit on strings 6, 4, and 1.",
    A: "Roots sit on strings 5 and 3.",
    G: "Roots sit on strings 6, 3, and 1.",
    C: "Root on string 5 — the third is often the lowest note in this form.",
    D: "Roots sit on strings 4 and 2.",
  };
  return `The ${caged} form ${place}. ${roots[caged] ?? ""} Slide it and the next CAGED neighbour shares those roots a string-set away.`;
}
