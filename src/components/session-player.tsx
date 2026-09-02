import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { ChevronLeft } from "lucide-react";
import { CHORDS, fretToFreq, OPEN_FREQ } from "@/lib/spark/guitar";
import { bassTone, comboSting, drumHit, hitSfx, pianoChord, pianoTone, pluck, strum, unlockAudio, click } from "@/lib/spark/audio";
import {
  instrumentById,
  midiToFreq,
  PIANO_VOICINGS,
  UKE_CHORDS,
  type InstrumentId,
} from "@/lib/spark/instruments";
import { buildTimeline, consumeHit, countInBeats, summarizeItem, type NoteEvent } from "@/lib/spark/practice";
import { AUTO_ADVANCE_MS, itemCloseCopy } from "@/lib/spark/psychology";
import { coachCue, howYouPlay, patternInWords, successLine } from "@/lib/spark/udl";
import { chordsFromCreatePick, refineLine, whyThisPiece } from "@/lib/spark/nafme";
import { comboCue, isComboGate } from "@/lib/spark/game";
import { currentItem, isSessionDone } from "@/lib/spark/session";
import { useSpark } from "@/store/spark";
import { Button } from "@/components/ui/button";
import { ChordDiagram } from "@/components/chord-diagram";
import { DrumPads } from "@/components/drum-pads";
import { StringRack } from "@/components/fretboard";
import { PianoKeyboard } from "@/components/piano-keyboard";
import { RhythmHighway } from "@/components/rhythm-highway";
import { PitchMatch } from "@/components/tuner-panel";
import { RoleTag, RhythmRead, CriteriaList, HarmonyRead } from "@/components/udl-chrome";
import { cn } from "@/lib/utils";
import type { ChordShape, HitJudge, ItemResult } from "@/lib/spark/types";

type Phase = "intro" | "countin" | "play" | "itemdone";

const WHITE_C4 = [60, 62, 64, 65, 67, 69, 71];

function ukeShape(id: string): ChordShape | undefined {
  const c = UKE_CHORDS[id];
  if (!c) return undefined;
  return { id, name: id, ...c };
}

function playInstrumentChord(instrument: InstrumentId, chordId: string, inst = instrumentById(instrument)) {
  if (instrument === "piano" || instrument === "vocals") {
    const midi = PIANO_VOICINGS[chordId];
    if (midi) pianoChord(midi.map(midiToFreq));
    else pianoTone(midiToFreq(60));
    return;
  }
  if (instrument === "ukulele") {
    const c = UKE_CHORDS[chordId];
    if (!c) return;
    const freqs = c.frets
      .map((f, i) => (f == null ? null : inst.openFreq[i] * Math.pow(2, f / 12)))
      .filter((f): f is number => f != null);
    strum(freqs);
    return;
  }
  if (instrument === "bass") {
    const root: Record<string, number> = { Em: 0, G: 3, C: 3, D: 5, A: 5, Am: 0, E: 0 };
    const fret = root[chordId] ?? 0;
    bassTone(inst.openFreq[0] * Math.pow(2, fret / 12));
    return;
  }
  const c = CHORDS[chordId];
  if (!c) return;
  const freqs = c.frets.map((f, i) => (f === null ? null : fretToFreq(i, f))).filter((f): f is number => f !== null);
  strum(freqs);
}

export function SessionPlayer() {
  const navigate = useNavigate();
  const instrument = useSpark((s) => s.instrument);
  const session = useSpark((s) => s.session);
  const hit = useSpark((s) => s.hit);
  const miss = useSpark((s) => s.miss);
  const finishItem = useSpark((s) => s.finishItem);
  const skipCurrent = useSpark((s) => s.skipCurrent);
  const finishDay = useSpark((s) => s.finishDay);
  const abortSession = useSpark((s) => s.abortSession);
  const inst = instrumentById(instrument);

  const item = session ? currentItem(session) : null;
  const [phase, setPhase] = useState<Phase>("intro");
  const [combo, setCombo] = useState(0);
  const [flash, setFlash] = useState<HitJudge | null>(null);
  const [count, setCount] = useState(4);
  const [beatN, setBeatN] = useState(1);
  const [activeString, setActiveString] = useState<number | null>(null);
  const [expectedString, setExpectedString] = useState<number | null>(null);
  const [liveChord, setLiveChord] = useState(item?.chords[0] ?? "");
  const [itemSummary, setItemSummary] = useState<ItemResult | null>(null);
  const [modeling, setModeling] = useState(false);
  const [createPick, setCreatePick] = useState<string | null>(null);
  const [listenPick, setListenPick] = useState<"same" | "different" | null>(null);
  const notesRef = useRef<NoteEvent[]>([]);
  const consumed = useRef<Set<number>>(new Set());
  const startRef = useRef(0);
  const nowRef = useRef(0);
  const raf = useRef(0);
  const lastBeat = useRef(-1);
  const hitsRef = useRef(0);
  const missesRef = useRef(0);
  const modelTimers = useRef<number[]>([]);
  const needsPickRef = useRef(false);

  const resetItem = useCallback(() => {
    setPhase("intro");
    setFlash(null);
    setCount(4);
    setBeatN(1);
    setItemSummary(null);
    setExpectedString(null);
    setLiveChord(item?.chords[0] ?? "");
    setModeling(false);
    setCreatePick(null);
    setListenPick(null);
    consumed.current = new Set();
    notesRef.current = [];
    lastBeat.current = -1;
    hitsRef.current = 0;
    missesRef.current = 0;
    nowRef.current = 0;
    for (const id of modelTimers.current) window.clearTimeout(id);
    modelTimers.current = [];
  }, [item?.chords, item?.id]);

  useEffect(() => {
    resetItem();
  }, [item?.id, resetItem]);

  const effectiveItem = useMemo(() => {
    if (!item) return null;
    if (item.process === "create" && createPick) {
      return {
        ...item,
        chords: chordsFromCreatePick(createPick, item.chords),
        createPick,
      };
    }
    return item;
  }, [createPick, item]);

  const beginPlay = useCallback(() => {
    if (!effectiveItem) return;
    unlockAudio();
    notesRef.current = buildTimeline(effectiveItem);
    consumed.current = new Set();
    hitsRef.current = 0;
    missesRef.current = 0;
    nowRef.current = 0;
    const beat = 60 / effectiveItem.bpm;
    startRef.current = performance.now() + countInBeats() * beat * 1000;
    setPhase("countin");
    setCount(4);
    setLiveChord(effectiveItem.chords[0] ?? "");
  }, [effectiveItem]);

  useEffect(() => {
    if (phase !== "countin" || !item) return;
    const beatMs = (60 / item.bpm) * 1000;
    const playAt = startRef.current;
    const origin = playAt - countInBeats() * beatMs;
    let lastN = 5;
    const loop = (t: number) => {
      const n = 4 - Math.floor((t - origin) / beatMs);
      if (n !== lastN && n >= 1 && n <= 4) {
        click(n === 4);
        setCount(n);
        lastN = n;
      }
      if (t >= playAt) {
        setPhase("play");
        return;
      }
      raf.current = requestAnimationFrame(loop);
    };
    raf.current = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf.current);
  }, [item, phase]);

  const onJudge = useCallback(
    (judge: HitJudge) => {
      setFlash(judge);
      hitSfx(judge);
      window.setTimeout(() => setFlash(null), 140);
      if (judge === "miss") {
        setCombo(0);
        missesRef.current += 1;
        miss();
      } else {
        setCombo((c) => {
          const n = c + 1;
          if (isComboGate(n)) comboSting(n);
          return n;
        });
        hitsRef.current += 1;
        hit();
      }
    },
    [hit, miss],
  );

  const attempt = useCallback(
    (kind: "strum" | "pluck", stringIndex?: number) => {
      if (phase !== "play" || !item) return;
      const t = (performance.now() - startRef.current) / 1000;
      const pending = notesRef.current.filter((_, i) => !consumed.current.has(i));
      const res = consumeHit(pending, t, item.windowMs ?? 230);
      const surface = item.surface ?? inst.surface;
      const needsMatch = (surface === "keys" || surface === "pads" || surface === "voice") && kind === "pluck";

      if (kind === "pluck" && stringIndex !== undefined) {
        if (instrument === "drums") drumHit(stringIndex);
        else if (instrument === "piano" || instrument === "vocals") pianoTone(midiToFreq(stringIndex));
        else if (instrument === "bass") bassTone(inst.openFreq[stringIndex] ?? 41.2);
        else pluck(inst.openFreq[stringIndex] ?? OPEN_FREQ[stringIndex] ?? 110);
        setActiveString(stringIndex);
      }

      if (!res.hit || !res.note) {
        onJudge("miss");
        return;
      }
      if (needsMatch && res.note.string !== undefined && stringIndex !== res.note.string) {
        onJudge("miss");
        return;
      }
      const realIndex = notesRef.current.indexOf(res.note);
      consumed.current.add(realIndex);
      if (kind !== "pluck") {
        if (res.note.chord) {
          playInstrumentChord(instrument, res.note.chord, inst);
          setLiveChord(res.note.chord);
        } else if (instrument === "drums") {
          drumHit(stringIndex ?? 0);
        } else if (instrument === "piano" || instrument === "vocals") {
          pianoTone(midiToFreq(60));
        } else if (instrument === "bass") {
          bassTone(inst.openFreq[stringIndex ?? 0] ?? 41.2);
        } else {
          pluck(inst.openFreq[stringIndex ?? inst.openFreq.length - 1] ?? 220);
        }
      } else if (res.note.chord) {
        setLiveChord(res.note.chord);
      }
      onJudge(res.judge);
    },
    [inst, instrument, item, onJudge, phase],
  );

  useEffect(() => {
    if (phase !== "play" || !item) return;
    const loop = (t: number) => {
      const elapsed = (t - startRef.current) / 1000;
      nowRef.current = elapsed;
      const beatLen = 60 / item.bpm;
      const beat = Math.floor(elapsed / beatLen);
      if (beat !== lastBeat.current && beat >= 0) {
        lastBeat.current = beat;
        click(beat % 4 === 0);
        setBeatN((beat % 4) + 1);
        const upcoming = notesRef.current.find((n, i) => !consumed.current.has(i) && n.t >= elapsed - 0.05);
        if (upcoming?.string !== undefined) setExpectedString(upcoming.string);
        if (upcoming?.chord) setLiveChord(upcoming.chord);
      }
      for (let i = 0; i < notesRef.current.length; i++) {
        if (consumed.current.has(i)) continue;
        if (elapsed - notesRef.current[i].t > (item.windowMs ?? 230) / 1000) {
          consumed.current.add(i);
          onJudge("miss");
        }
      }
      const last = notesRef.current[notesRef.current.length - 1];
      if (last && elapsed > last.t + 0.8) {
        setItemSummary(summarizeItem(item, hitsRef.current, missesRef.current));
        setPhase("itemdone");
        return;
      }
      raf.current = requestAnimationFrame(loop);
    };
    raf.current = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf.current);
  }, [item, onJudge, phase]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.repeat) return;
      if (e.code === "Escape") {
        abortSession();
        void navigate({ to: "/today" });
        return;
      }
      if (phase === "intro" && (e.code === "Enter" || e.code === "Space")) {
        e.preventDefault();
        if (!modeling && !needsPickRef.current) beginPlay();
        return;
      }
      if (phase !== "play") return;
      if (e.code === "Space") {
        e.preventDefault();
        attempt("strum");
      }
      const n = Number(e.key);
      if (n >= 1 && n <= 7) {
        const surface = item?.surface ?? inst.surface;
        if (surface === "keys" || surface === "voice") {
          attempt("pluck", WHITE_C4[n - 1] ?? 60);
        } else if (n <= inst.stringNames.length) {
          attempt("pluck", n - 1);
        }
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [abortSession, attempt, beginPlay, inst.stringNames.length, inst.surface, item?.surface, modeling, navigate, phase]);

  const goNext = useCallback(() => {
    finishItem();
    const s = useSpark.getState().session;
    if (!s || isSessionDone(s)) {
      finishDay();
      void navigate({ to: "/results" });
    } else {
      resetItem();
    }
  }, [finishDay, finishItem, navigate, resetItem]);

  const skipThis = useCallback(() => {
    setCombo(0);
    skipCurrent();
    const s = useSpark.getState().session;
    if (!s || isSessionDone(s)) {
      finishDay();
      void navigate({ to: "/results" });
    } else {
      resetItem();
    }
  }, [finishDay, navigate, resetItem, skipCurrent]);

  const leave = useCallback(() => {
    abortSession();
    void navigate({ to: "/today" });
  }, [abortSession, navigate]);

  const playModelEvent = useCallback(
    (note: NoteEvent) => {
      if (note.kind === "pluck" && note.string !== undefined) {
        if (instrument === "drums") drumHit(note.string);
        else if (instrument === "piano" || instrument === "vocals") pianoTone(midiToFreq(note.string));
        else if (instrument === "bass") bassTone(inst.openFreq[note.string] ?? 41.2);
        else pluck(inst.openFreq[note.string] ?? OPEN_FREQ[note.string] ?? 110);
        if (note.chord) setLiveChord(note.chord);
        return;
      }
      if (note.chord) playInstrumentChord(instrument, note.chord, inst);
      else click(note.beat === 0);
    },
    [inst, instrument],
  );

  const hearOnce = useCallback(() => {
    const src = effectiveItem ?? item;
    if (!src || modeling) return;
    unlockAudio();
    for (const id of modelTimers.current) window.clearTimeout(id);
    modelTimers.current = [];
    const notes = buildTimeline(src);
    const beat = 60 / src.bpm;
    const windowSec = beat * 4;
    setModeling(true);
    for (let b = 0; b < 4; b++) {
      modelTimers.current.push(window.setTimeout(() => click(b === 0), b * beat * 1000));
    }
    for (const note of notes) {
      if (note.t >= windowSec - 0.01) break;
      modelTimers.current.push(window.setTimeout(() => playModelEvent(note), note.t * 1000));
    }
    modelTimers.current.push(window.setTimeout(() => setModeling(false), windowSec * 1000 + 160));
  }, [effectiveItem, item, modeling, playModelEvent]);

  const playListen = useCallback(
    (side: "a" | "b") => {
      if (!item?.listenPrompt) return;
      unlockAudio();
      const token = item.listenPrompt[side];
      if (instrument === "drums") {
        const beat = 60 / item.bpm;
        for (let b = 0; b < 4; b++) {
          const pad = token === "backbeat" ? (b % 2 === 0 ? 0 : 1) : b === 0 ? 0 : -1;
          window.setTimeout(() => {
            click(b === 0);
            if (pad >= 0) drumHit(pad);
          }, b * beat * 1000);
        }
        return;
      }
      playInstrumentChord(instrument, token, inst);
    },
    [inst, instrument, item],
  );

  useEffect(() => {
    if (phase !== "itemdone") return;
    const id = window.setTimeout(() => goNext(), AUTO_ADVANCE_MS);
    return () => window.clearTimeout(id);
  }, [goNext, phase]);

  if (!session || !item) return null;

  const isWarm =
    (item.type === "warmup" || item.type === "skill") && item.process !== "respond" && item.process !== "create";
  const surface = item.surface ?? inst.surface;
  const useHighway = surface === "strings" && !isWarm;
  const chordPcs = liveChord && PIANO_VOICINGS[liveChord] ? PIANO_VOICINGS[liveChord].map((m) => m % 12) : [];
  const lastItem = session.index + 1 >= session.plan.items.length;

  const uke = instrument === "ukulele" ? ukeShape(liveChord || item.chords[0] || "C") : undefined;
  const needsPick =
    (item.process === "create" && item.createOptions && item.createOptions.length >= 2 && !createPick) ||
    (item.process === "respond" && item.listenPrompt && !listenPick);
  const listenRight = listenPick && item.listenPrompt ? listenPick === item.listenPrompt.answer : null;
  const pieceLine = whyThisPiece(item);
  needsPickRef.current = Boolean(needsPick);

  return (
    <div className="flex min-h-dvh flex-col bg-bg">
      <header className="flex items-center gap-3 px-4 py-3">
        <Button variant="ghost" size="icon" aria-label="Leave session" onClick={leave}>
          <ChevronLeft className="size-5" />
        </Button>
        <div className="min-w-0 flex-1">
          <p className="text-[11px] uppercase tracking-[0.18em] text-dim">
            {inst.name} · {session.index + 1} / {session.plan.items.length}
            {item.repertoire ? ` · ${item.repertoire}` : ""}
          </p>
          <h1 className="truncate font-display text-lg font-semibold">{item.title}</h1>
        </div>
        <div className="tabular text-right text-sm text-muted">
          <div className={cn("text-ember", isComboGate(combo) && "combo-pop")}>
            {combo} {comboCue(combo)}
          </div>
          <div>
            {session.itemHits} hit · {session.itemMisses} miss
          </div>
        </div>
      </header>

      <div className="flex-1 px-4 pb-5">
        {phase === "intro" ? (
          <div className="mx-auto flex max-w-md flex-col items-center gap-4 pt-4">
            {instrument === "piano" || instrument === "vocals" ? (
              <PianoKeyboard activeMidi={null} chordPcs={chordPcs.length ? chordPcs : [0]} onPlay={() => undefined} disabled />
            ) : instrument === "drums" ? (
              <DrumPads active={null} onHit={() => undefined} disabled />
            ) : item.chords[0] && instrument === "ukulele" ? (
              <ChordDiagram shape={uke} />
            ) : item.chords[0] && instrument === "guitar" ? (
              <ChordDiagram chordId={item.chords[0]} />
            ) : (
              <StringRack active={null} names={inst.stringNames} onPluck={() => undefined} disabled />
            )}
            <RoleTag role={item.role} process={item.process} />
            {pieceLine ? <p className="text-center text-sm text-muted">{pieceLine}</p> : null}
            <CriteriaList items={item.criteria?.length ? item.criteria : item.objectives?.length ? item.objectives : [item.subtitle]} />
            {!item.criteria?.length ? <p className="text-center text-sm text-dim">{successLine(item)}</p> : null}
            <RhythmRead pattern={item.pattern} />
            <HarmonyRead symbols={item.analysis} />
            {item.process === "create" && item.createOptions ? (
              <div className="grid w-full grid-cols-2 gap-2">
                {item.createOptions.map((opt) => (
                  <Button
                    key={opt}
                    variant={createPick === opt ? "primary" : "secondary"}
                    className="h-12"
                    onClick={() => setCreatePick(opt)}
                  >
                    {opt}
                  </Button>
                ))}
              </div>
            ) : null}
            {item.process === "respond" && item.listenPrompt ? (
              <div className="flex w-full flex-col gap-2">
                <p className="text-center text-sm text-muted">{item.listenPrompt.ask}</p>
                <div className="grid grid-cols-2 gap-2">
                  <Button variant="secondary" onClick={() => playListen("a")} disabled={modeling}>
                    Hear A
                  </Button>
                  <Button variant="secondary" onClick={() => playListen("b")} disabled={modeling}>
                    Hear B
                  </Button>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <Button variant={listenPick === "same" ? "primary" : "secondary"} onClick={() => setListenPick("same")}>
                    Same
                  </Button>
                  <Button variant={listenPick === "different" ? "primary" : "secondary"} onClick={() => setListenPick("different")}>
                    Different
                  </Button>
                </div>
                {listenRight == null ? null : (
                  <p className="text-center text-sm text-muted">
                    {listenRight ? "That's the difference." : "They're different. Still counts."}
                  </p>
                )}
              </div>
            ) : null}
            <Button size="xl" className="w-full" onClick={beginPlay} disabled={modeling || Boolean(needsPick)}>
              Count me in
            </Button>
            {item.process === "respond" ? null : (
              <Button variant="secondary" className="w-full" onClick={hearOnce} disabled={modeling}>
                {modeling ? "Listening" : "Hear it once"}
              </Button>
            )}
            <Button variant="ghost" className="w-full" onClick={skipThis}>
              Skip this one
            </Button>
          </div>
        ) : null}

        {phase === "countin" ? (
          <div className="flex h-[50vh] flex-col items-center justify-center gap-3">
            <p key={count} className="count-pop font-display text-7xl font-semibold tabular text-accent">
              {count}
            </p>
            <p className="text-sm uppercase tracking-[0.2em] text-dim">{item.bpm} bpm</p>
          </div>
        ) : null}

        {phase === "play" ? (
          <div className="mx-auto flex max-w-lg flex-col gap-4">
            {item.chords.length && surface !== "pads" ? (
              <div className="flex flex-col items-center gap-3">
                {instrument === "guitar" ? <ChordDiagram chordId={liveChord || item.chords[0]} compact /> : null}
                {instrument === "ukulele" ? <ChordDiagram shape={uke} compact /> : null}
                <div className="flex flex-wrap justify-center gap-2 text-sm">
                  {item.chords.map((c) => (
                    <span
                      key={c}
                      className={cn(
                        "rounded-sm px-2 py-1 tabular",
                        c === liveChord ? "bg-accent text-accent-fg" : "text-muted",
                      )}
                    >
                      {c}
                    </span>
                  ))}
                </div>
              </div>
            ) : null}

            {surface === "keys" || surface === "voice" ? (
              <PianoKeyboard
                activeMidi={activeString}
                expectedMidi={expectedString}
                chordPcs={chordPcs.length ? chordPcs : surface === "voice" ? [0] : []}
                onPlay={(midi) => attempt("pluck", midi)}
              />
            ) : null}

            {surface === "voice" ? <PitchMatch targetFreq={midiToFreq(60)} targetName="C4" /> : null}

            {surface === "pads" ? (
              <DrumPads active={activeString} expected={expectedString} onHit={(i) => attempt("pluck", i)} />
            ) : null}

            {surface === "strings" && isWarm ? (
              <StringRack
                names={inst.stringNames}
                active={activeString}
                expected={expectedString}
                onPluck={(i) => attempt("pluck", i)}
              />
            ) : null}

            {useHighway ? (
              <div className="h-64 overflow-hidden rounded-lg border border-border bg-raised">
                <RhythmHighway
                  notesRef={notesRef}
                  consumedRef={consumed}
                  nowRef={nowRef}
                  lookAhead={1.8}
                  flash={flash}
                />
              </div>
            ) : null}

            <p className="text-center font-display text-sm tabular text-dim">beat {beatN}</p>
            <p className="text-center text-sm text-muted">{item.interpret ?? coachCue(item)}</p>
            <p className="text-center text-sm text-dim">{patternInWords(item.pattern)}</p>
            <Button
              size="xl"
              variant="strum"
              className="w-full touch-none"
              onPointerDown={(e) => {
                e.preventDefault();
                attempt("strum");
              }}
            >
              {surface === "pads" ? "Hit" : surface === "keys" ? "Play" : surface === "voice" ? "Match" : instrument === "bass" ? "Pluck" : "Strum"}
            </Button>
            <p
              className={cn(
                "text-center font-display text-sm uppercase tracking-[0.2em]",
                flash === "perfect" ? "text-good" : flash === "miss" ? "text-bad" : "text-muted",
              )}
            >
              {flash ?? "play on the beat"}
            </p>
            <p className="text-center text-xs text-dim">{howYouPlay(item)}</p>
          </div>
        ) : null}

        {phase === "itemdone" ? (
          <div className="mx-auto flex max-w-md flex-col items-center gap-5 pt-10 text-center">
            <p className="text-[11px] uppercase tracking-[0.2em] text-dim">
              {session.index + 1} / {session.plan.items.length}
            </p>
            <p className="font-display text-4xl font-semibold">
              {itemCloseCopy(itemSummary?.stars ?? 0, lastItem)}
            </p>
            <p className="tabular text-muted">
              {itemSummary?.stars ?? 0}★ · {Math.round((itemSummary?.accuracy ?? 0) * 100)}% · +{itemSummary?.xp ?? 0} xp
            </p>
            <p className="text-pretty text-sm text-muted">{refineLine(item, itemSummary?.stars ?? 0)}</p>
            <Button size="lg" className="w-full" onClick={goNext}>
              {lastItem ? "See today" : "Next"}
            </Button>
          </div>
        ) : null}
      </div>
    </div>
  );
}
