import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { ChevronLeft } from "lucide-react";
import { CHORDS, fretToFreq, OPEN_FREQ } from "@/lib/spark/guitar";
import { bassTone, comboSting, drumHit, ghostNote, hitSfx, pianoChord, pianoHold, pianoTone, pluck, strum, unlockAudio, click } from "@/lib/spark/audio";
import {
  BANJO_CHORDS,
  banjoChordFrequencies,
  instrumentById,
  LAPSTEEL_CHORDS,
  MANDOLIN_CHORDS,
  midiToFreq,
  PIANO_VOICINGS,
  UKE_CHORDS,
  type InstrumentId,
} from "@/lib/spark/instruments";
import { beatsPerBarOf, buildTimeline, consumeHit, countInBeats, isPluckDrill, patternEndSec, summarizeItem, type NoteEvent } from "@/lib/spark/practice";
import { AUTO_ADVANCE_MS, itemCloseCopy } from "@/lib/spark/psychology";
import { coachCue, howYouPlay, patternInWords, successLine } from "@/lib/spark/udl";
import { chordsFromCreatePick, refineLine, whyThisPiece } from "@/lib/spark/nafme";
import { comboCue, isComboGate } from "@/lib/spark/game";
import { currentItem, isSessionDone } from "@/lib/spark/session";
import { createItemAdvanceGuard } from "@/lib/spark/item-advance-guard";
import { useSpark } from "@/store/spark";
import { Button } from "@/components/ui/button";
import { ChordDiagram } from "@/components/chord-diagram";
import { DrumPads } from "@/components/drum-pads";
import { useMidiDrums } from "@/components/use-midi-drums";
import { StringRack } from "@/components/fretboard";
import { PianoKeyboard } from "@/components/piano-keyboard";
import { RhythmHighway } from "@/components/rhythm-highway";
import { MicSignalMeter } from "@/components/mic-signal-meter";
import { startMicAnalyser } from "@/lib/spark/tuner";
import { matchesOpenStringTarget } from "@/lib/spark/open-string-judging";
import {
  activeInputDeviceId,
  initMicrophone,
  listAudioInputs,
  listedInputDevices,
  selectableDeviceId,
} from "@/lib/spark/mic-session";
import {
  rmsLevel,
  StrumDirectionDetector,
  StrumOnsetDetector,
  type StrumDirectionEstimate,
} from "@/lib/spark/strum-detection";
import {
  AcousticAttackDetector,
  acousticInputModeFor,
  analyzeChordSpectrum,
  assessChordPitches,
  PercussionOnsetDetector,
  PitchOnsetDetector,
  PitchTracker,
  type AcousticInputMode,
} from "@/lib/spark/acoustic-input";
import { RoleTag, RhythmRead, CriteriaList, HarmonyRead } from "@/components/udl-chrome";
import { cn } from "@/lib/utils";
import { hasInstrumentPattern } from "@/lib/spark/instrument-patterns";
import { pitchWithinTolerance, VocalHoldJudge } from "@/lib/spark/vocal-judge";
import { practiceShape } from "@/lib/spark/lesson-practice";
import type { ChordShape, HitJudge, ItemResult } from "@/lib/spark/types";

type Phase = "intro" | "countin" | "play" | "itemdone";

type AcousticHitEvidence = {
  spectrumDb?: Float32Array;
  sampleRate?: number;
  fftSize?: number;
  direction?: StrumDirectionEstimate;
  /** Unrounded tracked pitch (vocals) — the cents judge reads this, not the rounded MIDI. */
  frequencyHz?: number;
  /** A hold judge has already verified this exact note; consume it directly. */
  verifiedNoteIndex?: number;
};
type AttemptFn = (kind: "strum" | "pluck", stringIndex?: number, detectedAtMs?: number, detectedMidi?: number, evidence?: AcousticHitEvidence) => void;

function supportsMicrophoneInput(surface: string): boolean {
  return surface === "strings" || surface === "keys" || surface === "pads" || surface === "voice";
}

function acousticInstrumentLabel(instrument: InstrumentId, name: string) {
  if (instrument === "vocals") return "voice";
  if (instrument === "drums") return "drum kit";
  return name.toLowerCase();
}

function acousticInputDescription(instrument: InstrumentId, name: string, mode: AcousticInputMode) {
  const label = acousticInstrumentLabel(instrument, name);
  if (instrument === "vocals") {
    return "Sing or hum the target pitch on the cue. Held notes are checked at each beat.";
  }
  if (mode === "strum" && instrument === "piano") {
    return "Play the chord on your real piano. Timing and sounding notes are checked when the microphone can separate them clearly.";
  }
  if (mode === "strum") {
    return `Strum your real ${label} on the cue. The mic checks timing and chord-note coverage, and grades down/up direction only when the signal is clear. It cannot see finger placement.`;
  }
  if (mode === "percussion") {
    return "Play your real drum kit on the cue. The mic classifies kick, snare, hi-hat/cymbal, or tom when confidence is high; ambiguous hits are not guessed.";
  }
  if (mode === "attack") {
    return "Play each ringing stroke or muted chop on the cue. Attack timing is scored; muted-chop quality and exact voicing are not graded yet.";
  }
  return `Play a real note on your ${label} on the cue. Pitch is checked when the exercise provides a target.`;
}

const WHITE_C4 = [60, 62, 64, 65, 67, 69, 71];

function playMusicalEvent(note: NoteEvent, bpm: number) {
  if (note.muted) ghostNote();
  note.notes?.forEach((midi) => pianoHold(midiToFreq(midi), (note.duration ?? 0.4) * 60 / bpm, undefined, 0.2 / Math.sqrt(note.notes!.length)));
}

function ukeShape(id: string): ChordShape | undefined {
  const c = UKE_CHORDS[id];
  if (!c) return undefined;
  return { id, name: id, ...c };
}

function mandolinShape(id: string): ChordShape | undefined {
  const c = MANDOLIN_CHORDS[id];
  if (!c) return undefined;
  return { id, name: id, ...c };
}

function banjoShape(id: string): ChordShape | undefined {
  const c = BANJO_CHORDS[id];
  if (!c) return undefined;
  return { id, name: id, ...c };
}

function lapsteelShape(id: string): ChordShape | undefined {
  const c = LAPSTEEL_CHORDS[id];
  if (!c) return undefined;
  return { id, name: id, ...c };
}

function playInstrumentChord(instrument: InstrumentId, chordId: string, inst = instrumentById(instrument)) {
  if (instrument === "violin") {
    // Tokens are open-string names; a sustained tone stands in for the bow.
    const string = inst.stringNames.indexOf(chordId);
    pianoHold(string >= 0 ? inst.openFreq[string] : midiToFreq(62), 2);
    return;
  }
  if (instrument === "piano" || instrument === "vocals") {
    const midi = PIANO_VOICINGS[chordId];
    if (midi) pianoChord(midi.map(midiToFreq));
    else pianoTone(midiToFreq(60));
    return;
  }
  if (instrument === "ukulele" || instrument === "mandolin" || instrument === "banjo" || instrument === "lapsteel") {
    const c =
      instrument === "ukulele"
        ? UKE_CHORDS[chordId]
        : instrument === "mandolin"
          ? MANDOLIN_CHORDS[chordId]
          : instrument === "banjo"
            ? BANJO_CHORDS[chordId]
            : LAPSTEEL_CHORDS[chordId];
    if (!c) return;
    const freqs = instrument === "banjo" ? banjoChordFrequencies(chordId) : c.frets
      .map((f, i) => (f == null ? null : inst.openFreq[i] * Math.pow(2, f / 12)))
      .filter((f): f is number => f != null);
    strum(freqs);
    return;
  }
  if (instrument === "bass") {
    const root: Record<string, number> = { Em: 0, G: 3, C: 8, D: 10, A: 5, Am: 5, E: 0 };
    const fret = root[chordId] ?? 0;
    bassTone(inst.openFreq[0] * Math.pow(2, fret / 12));
    return;
  }
  const c = CHORDS[chordId];
  if (!c) return;
  const freqs = c.frets.map((f, i) => (f === null ? null : fretToFreq(i, f))).filter((f): f is number => f !== null);
  strum(freqs);
}

function chordMidiNotes(instrument: InstrumentId, chord: string, inst = instrumentById(instrument)) {
  if (instrument === "piano") return PIANO_VOICINGS[chord] ?? [];
  const shape = practiceShape(instrument, chord);
  if (!shape) return [];
  return shape.frets.flatMap((fret, index) => {
    if (fret === null) return [];
    const openHz = inst.openFreq[index];
    if (!Number.isFinite(openHz) || openHz <= 0) return [];
    const frequencyHz = openHz * Math.pow(2, fret / 12);
    return [Math.round(69 + 12 * Math.log2(frequencyHz / 440))];
  });
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
  const pauseSession = useSpark((s) => s.pauseSession);
  const checkpointSaved = useSpark((s) => s.checkpointSaved);
  const inst = instrumentById(instrument);

  const item = session ? currentItem(session) : null;
  const micTimeline = useMemo(() => item ? buildTimeline(item) : [], [item]);
  const hasChordCues = Boolean(item && micTimeline.some((note) =>
    (note.notes?.length ?? 0) > 1 ||
    (!note.notes?.length && Boolean(note.chord && item.chords.includes(note.chord))),
  ));
  const hasSingleNoteCues = micTimeline.some((note) =>
    note.notes?.length === 1 || note.expectedMidi !== undefined,
  );
  const [phase, setPhase] = useState<Phase>("intro");
  const [combo, setCombo] = useState(0);
  const [flash, setFlash] = useState<HitJudge | null>(null);
  /** Latest judged result, held as text in the header status line; the canvas flash alone is gone in 140 ms. */
  const [lastVerdict, setLastVerdict] = useState<HitJudge | null>(null);
  const [count, setCount] = useState(4);
  const [beatN, setBeatN] = useState(1);
  const [activeString, setActiveString] = useState<number | null>(null);
  const [expectedString, setExpectedString] = useState<number | null>(null);
  const [liveChord, setLiveChord] = useState(item?.chords[0] ?? "");
  const [itemSummary, setItemSummary] = useState<ItemResult | null>(null);
  const [modeling, setModeling] = useState(false);
  const [createPick, setCreatePick] = useState<string | null>(null);
  const [listenPick, setListenPick] = useState<"same" | "different" | null>(null);
  const [micStatus, setMicStatus] = useState<"off" | "starting" | "listening" | "blocked">("off");
  const [micLevel, setMicLevel] = useState(0);
  const [micError, setMicError] = useState<string | null>(null);
  const [micFeedback, setMicFeedback] = useState<string | null>(null);
  const [micDetectedEvents, setMicDetectedEvents] = useState(0);
  const [lastDetectedPitch, setLastDetectedPitch] = useState<string | null>(null);
  const [micInputName, setMicInputName] = useState("");
  const [micDeviceId, setMicDeviceId] = useState("");
  const [micDevices, setMicDevices] = useState<MediaDeviceInfo[]>([]);
  const [visualOnly, setVisualOnly] = useState(false);
  const micSurface = item?.surface ?? inst.surface;
  const requiresMicInput = supportsMicrophoneInput(micSurface);
  const micMode = acousticInputModeFor({
    instrument,
    surface: micSurface,
    pluckDrill: item !== null && isPluckDrill(item),
    hasPattern: item !== null && hasInstrumentPattern(item),
    hasChordCues,
    hasSingleNoteCues,
    lessonId: item?.lessonId,
  });
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
  const visualOnlyRef = useRef(false);
  const phaseRef = useRef<Phase>("intro");
  const requiresMicInputRef = useRef(false);
  const micModeRef = useRef<AcousticInputMode>("strum");
  const micSurfaceRef = useRef(micSurface);
  const micInstrumentRef = useRef(instrument);
  const micOpenFreqRef = useRef(inst.openFreq);
  const micRequiresOpenStringRef = useRef(Boolean(item && micSurface === "strings" && isPluckDrill(item)));
  const micItemIdRef = useRef(item?.id ?? "");
  const micWindowMsRef = useRef(item?.windowMs ?? 230);
  const micBpmRef = useRef(item?.bpm ?? 60);
  const holdJudgesRef = useRef(new Map<number, VocalHoldJudge>());
  const micStopRef = useRef<(() => void) | null>(null);
  const micFrameRef = useRef(0);
  const micRequestRef = useRef(0);
  const attemptRef = useRef<AttemptFn | null>(null);
  // A rapid double click must not advance two exercises using a stale render.
  const advanceGuardRef = useRef(createItemAdvanceGuard());
  phaseRef.current = phase;
  requiresMicInputRef.current = requiresMicInput;
  micModeRef.current = micMode;
  micSurfaceRef.current = micSurface;
  micInstrumentRef.current = instrument;
  micOpenFreqRef.current = inst.openFreq;
  micRequiresOpenStringRef.current = Boolean(item && micSurface === "strings" && isPluckDrill(item));
  micItemIdRef.current = item?.id ?? "";
  micWindowMsRef.current = item?.windowMs ?? 230;
  micBpmRef.current = item?.bpm ?? 60;

  useEffect(() => () => {
    pauseSession();
    micRequestRef.current += 1;
    micStopRef.current?.();
    micStopRef.current = null;
    cancelAnimationFrame(raf.current);
    cancelAnimationFrame(micFrameRef.current);
    for (const id of modelTimers.current) window.clearTimeout(id);
  }, [pauseSession]);

  useEffect(() => {
    if (session && isSessionDone(session)) {
      finishDay();
      void navigate({ to: "/results" });
    }
  }, [session, finishDay, navigate]);

  const resetItem = useCallback(() => {
    setPhase("intro");
    setFlash(null);
    setLastVerdict(null);
    setCount(4);
    setBeatN(1);
    setItemSummary(null);
    setMicFeedback(null);
    setMicDetectedEvents(0);
    setExpectedString(null);
    setActiveString(null);
    setLastDetectedPitch(null);
    setLiveChord(item?.chords[0] ?? "");
    setModeling(false);
    setCreatePick(null);
    setListenPick(null);
    setVisualOnly(false);
    visualOnlyRef.current = false;
    consumed.current = new Set();
    holdJudgesRef.current.clear();
    notesRef.current = [];
    lastBeat.current = -1;
    hitsRef.current = 0;
    missesRef.current = 0;
    nowRef.current = 0;
    for (const id of modelTimers.current) window.clearTimeout(id);
    modelTimers.current = [];
  }, [item?.chords]);

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
    if (requiresMicInput && micStatus !== "listening" && !visualOnlyRef.current) return;
    unlockAudio();
    notesRef.current = buildTimeline(effectiveItem);
    consumed.current = new Set();
    holdJudgesRef.current.clear();
    hitsRef.current = 0;
    missesRef.current = 0;
    nowRef.current = 0;
    const beat = 60 / effectiveItem.bpm;
    startRef.current = performance.now() + countInBeats(effectiveItem) * beat * 1000;
    setPhase("countin");
    setCount(countInBeats(effectiveItem));
    setLiveChord(effectiveItem.chords[0] ?? "");
  }, [effectiveItem, micStatus, requiresMicInput]);

  useEffect(() => {
    if (phase !== "countin" || !item) return;
    const beatMs = (60 / item.bpm) * 1000;
    const playAt = startRef.current;
    const meter = countInBeats(item);
    const origin = playAt - meter * beatMs;
    let lastN = meter + 1;
    const loop = (t: number) => {
      const n = meter - Math.floor((t - origin) / beatMs);
      if (n !== lastN && n >= 1 && n <= meter) {
        click(n === meter);
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
    (judge: HitJudge, soundFeedback = true) => {
      setFlash(judge);
      setLastVerdict(judge);
      if (soundFeedback) hitSfx(judge);
      window.setTimeout(() => setFlash(null), 140);
      if (judge === "miss") {
        setCombo(0);
        missesRef.current += 1;
        miss();
      } else {
        setCombo((c) => {
          const n = c + 1;
          if (soundFeedback && isComboGate(n)) comboSting(n);
          return n;
        });
        hitsRef.current += 1;
        hit();
      }
    },
    [hit, miss],
  );

  const attempt = useCallback(
    (kind: "strum" | "pluck", stringIndex?: number, detectedAtMs?: number, detectedMidi?: number, evidence?: AcousticHitEvidence) => {
      if (phase !== "play" || !item) return;
      const fromMic = detectedAtMs !== undefined;
      if (requiresMicInput && !fromMic) return;
      if (fromMic) setMicFeedback(null);
      if (hasInstrumentPattern(item) && !fromMic) {
        kind = "strum";
        stringIndex = undefined;
      }
      const t = ((detectedAtMs ?? performance.now()) - startRef.current) / 1000;
      let res: ReturnType<typeof consumeHit>;
      if (fromMic && evidence?.verifiedNoteIndex !== undefined) {
        // A vocals hold judge verified this exact note over its full span;
        // consume it directly — its window closed beats ago, so the timed
        // consumeHit lookup no longer applies.
        const note = notesRef.current[evidence.verifiedNoteIndex];
        if (!note || consumed.current.has(evidence.verifiedNoteIndex)) return;
        res = { hit: true, judge: "good", deltaMs: 0, note, index: evidence.verifiedNoteIndex };
      } else {
        const pending = notesRef.current.filter((_, i) => !consumed.current.has(i));
        res = consumeHit(pending, t, item.windowMs ?? 230);
      }

      if (kind === "pluck" && stringIndex !== undefined) {
        if (!fromMic) {
          if (instrument === "drums") drumHit(stringIndex);
          else if (instrument === "piano" || instrument === "vocals") pianoTone(midiToFreq(stringIndex));
          else if (instrument === "bass") bassTone(inst.openFreq[stringIndex] ?? 41.2);
          else pluck(inst.openFreq[stringIndex] ?? OPEN_FREQ[stringIndex] ?? 110);
        }
        if (!fromMic) setActiveString(stringIndex);
      }

      if (!res.hit || !res.note) {
        if (fromMic) {
          setMicFeedback("I heard an attack, but it did not land near a cue. Try the next beat.");
        }
        onJudge("miss", !fromMic);
        return;
      }
      // Judged cues (expectedMidi: bespoke vocals cues, violin's fingered
      // notes, lap steel's barred notes) are scored only from the mic's
      // unrounded pitch: within 20
      // cents of the target counts, anything else
      // — wrong pitch, wrong octave, no pitch evidence — scores nothing here
      // and the note is left to expire as a miss. The drone lesson carries no
      // expectedMidi and keeps its octave-tolerant pitch-class check below.
      if (res.note.expectedMidi !== undefined && evidence?.verifiedNoteIndex === undefined) {
        const freq = evidence?.frequencyHz;
        if (!fromMic || freq === undefined || !pitchWithinTolerance(freq, res.note.expectedMidi)) return;
      }
      if (kind !== "pluck" && fromMic && !res.note.muted && evidence?.spectrumDb && evidence.sampleRate && evidence.fftSize) {
        const expectedChord = res.note.notes?.length
          ? res.note.notes
          : res.note.chord
            ? chordMidiNotes(instrument, res.note.chord, inst)
            : [];
        if (expectedChord.length >= 2) {
          const spectrum = analyzeChordSpectrum(evidence.spectrumDb, evidence.sampleRate, evidence.fftSize);
          const assessment = assessChordPitches(spectrum, expectedChord);
          if (assessment.status === "match") {
            setMicFeedback("Chord tones detected.");
          } else if (assessment.status === "mismatch") {
            setMicFeedback(`Chord check: ${assessment.missingMidi.length} expected note(s) were not clearly detected.`);
            onJudge("miss", false);
            return;
          } else {
            setMicFeedback("Timing counted; the microphone could not separate enough chord tones to grade the chord reliably.");
          }
        }
      }
      const expectedDirection = res.note.kind;
      if (
        kind !== "pluck" &&
        fromMic &&
        (instrument === "guitar" || instrument === "ukulele" || instrument === "mandolin" || instrument === "banjo" || instrument === "lapsteel") &&
        (expectedDirection === "down" || expectedDirection === "up") &&
        evidence?.direction &&
        evidence.direction.confidence >= 0.65 &&
        evidence.direction.direction !== "unknown"
      ) {
        if (evidence.direction.direction !== expectedDirection) {
          setMicFeedback(`Strum direction sounded like an ${evidence.direction.direction}stroke; the cue asked for an ${expectedDirection}stroke.`);
          onJudge("miss", false);
          return;
        }
        setMicFeedback((previous) => {
          const directionMessage = `${evidence.direction!.direction === "down" ? "Downstroke" : "Upstroke"} detected.`;
          return previous ? `${previous} ${directionMessage}` : directionMessage;
        });
      }
      // Pluck/pad/key notes carry an expected string/pad/midi. Timing alone
      // is not enough — a wrong string, key, or pad is a miss.
      if (res.note.string !== undefined && stringIndex !== res.note.string) {
        const octaveFlexibleVoiceMatch =
          fromMic &&
          instrument === "vocals" &&
          detectedMidi !== undefined &&
          ((detectedMidi - res.note.string) % 12 + 12) % 12 === 0;
        if (!octaveFlexibleVoiceMatch) {
          if (fromMic) setMicFeedback("I heard a sound, but it did not match the expected string or pad. Try the highlighted target.");
          onJudge("miss", !fromMic);
          return;
        }
      }
      if (fromMic && detectedMidi !== undefined && res.note.notes?.length) {
        const pitchMatches = res.note.notes.some((expected) =>
          Math.abs(expected - detectedMidi) <= 1 ||
          (res.note!.notes!.length > 1 && Math.abs(Math.abs(expected - detectedMidi) - 12) <= 1),
        );
        if (!pitchMatches) {
          setMicFeedback("I heard a note, but its pitch did not match the target. Try the highlighted note.");
          onJudge("miss", false);
          return;
        }
      }
      const realIndex = notesRef.current.indexOf(res.note);
      consumed.current.add(realIndex);
      if (fromMic && kind === "pluck" && res.note.string !== undefined) setActiveString(res.note.string);
      if (kind !== "pluck") {
        if (fromMic) {
          // Do not play a synthetic chord or hit sound back into the open mic.
          if (res.note.chord) setLiveChord(res.note.chord);
        } else if (res.note.notes || res.note.muted) {
          playMusicalEvent(res.note, item.bpm);
          if (res.note.chord) setLiveChord(res.note.chord);
        } else if (res.note.chord) {
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
      onJudge(res.judge, !fromMic);
    },
    [inst, instrument, item, onJudge, phase, requiresMicInput],
  );

  attemptRef.current = attempt;

  const startAcousticMic = useCallback(async (selectedDeviceId?: string) => {
    if (!requiresMicInput) return;
    const request = ++micRequestRef.current;
    micStopRef.current?.();
    micStopRef.current = null;
    setMicStatus("starting");
    setMicLevel(0);
    setMicError(null);
    setMicDetectedEvents(0);
    unlockAudio();

    const init = await initMicrophone({
      startAnalyser: startMicAnalyser,
      deviceId: selectedDeviceId,
      request,
      isCurrent: (candidate) => candidate === micRequestRef.current,
      isSecureContext: window.isSecureContext,
    });
    if (init.status === "superseded") return;
    if (init.status === "blocked") {
      setMicStatus("blocked");
      setMicError(init.error);
      return;
    }
    const mic = init.mic;

    const audioTrack = mic.stream.getAudioTracks()[0];
    setMicInputName(audioTrack?.label || "Default microphone");
    setMicDeviceId(activeInputDeviceId(audioTrack?.getSettings().deviceId, selectedDeviceId));
    const devices = await listAudioInputs(() => navigator.mediaDevices.enumerateDevices());
    if (request !== micRequestRef.current) {
      mic.stop();
      return;
    }
    setMicDevices(devices);

    mic.analyser.smoothingTimeConstant = 0.2;
    const strumDetector = new StrumOnsetDetector();
    const directionDetector = new StrumDirectionDetector();
    const pitchDetector = new PitchOnsetDetector();
    const voicePitchTracker = new PitchTracker();
    const percussionDetector = new PercussionOnsetDetector();
    const attackDetector = new AcousticAttackDetector();
    const timeData = new Float32Array(mic.analyser.fftSize);
    const spectrumData = new Float32Array(mic.analyser.frequencyBinCount);
    let activeMode = micModeRef.current;
    let activeItemId = micItemIdRef.current;
    let lastMeterUpdate = Number.NEGATIVE_INFINITY;
    let recognizedEvents = 0;
    micStopRef.current = () => {
      cancelAnimationFrame(micFrameRef.current);
      mic.stop();
    };
    setMicLevel(0);
    setMicStatus("listening");

    const loop = (ts: number) => {
      if (request !== micRequestRef.current) return;
      // Read the input continuously, including during the intro/count-in. This
      // makes permission and a live analyser signal distinguishable from actual
      // scored note detection, which is enabled only during the play phase.
      mic.analyser.getFloatTimeDomainData(timeData);
      const inputLevel = rmsLevel(timeData);
      if (ts - lastMeterUpdate >= 80) {
        setMicLevel(inputLevel);
        lastMeterUpdate = ts;
      }
      if (phaseRef.current === "play" && requiresMicInputRef.current && !visualOnlyRef.current) {
        const mode = micModeRef.current;
        const itemId = micItemIdRef.current;
        if (mode !== activeMode || itemId !== activeItemId) {
          strumDetector.reset();
          directionDetector.reset();
          pitchDetector.reset();
          voicePitchTracker.reset();
          percussionDetector.reset();
          recognizedEvents = 0;
          setMicDetectedEvents(0);
          attackDetector.reset();
          activeMode = mode;
          activeItemId = itemId;
        }
        mic.analyser.getFloatFrequencyData(spectrumData);

        if (mode === "strum") {
          directionDetector.process(spectrumData, mic.ctx.sampleRate, mic.analyser.fftSize, ts);
          const onset = strumDetector.process(
            timeData,
            spectrumData,
            mic.ctx.sampleRate,
            mic.analyser.fftSize,
            ts,
          );
          if (onset) {
            recognizedEvents += 1;
            setMicDetectedEvents(recognizedEvents);
            const direction = directionDetector.classify(onset.onsetMs);
            attemptRef.current?.("strum", undefined, onset.onsetMs, undefined, {
              spectrumDb: spectrumData,
              sampleRate: mic.ctx.sampleRate,
              fftSize: mic.analyser.fftSize,
              direction,
            });
          }
        } else if (mode === "pitch") {
          const lowestReference = Math.min(...micOpenFreqRef.current);
          const minimumHz = micSurfaceRef.current === "voice"
            ? 70
            : Math.max(30, Math.min(160, lowestReference * 0.65));
          const maximumHz = micInstrumentRef.current === "bass"
            ? 500
            : micInstrumentRef.current === "vocals"
              ? 900
              : 1200;

          if (micInstrumentRef.current === "vocals") {
            const sample = voicePitchTracker.process(
              timeData,
              mic.ctx.sampleRate,
              ts,
              2,
              minimumHz,
              maximumHz,
            );
            // Bespoke hold cues are judged over their whole span, not at a
            // single onset: feed every frame (pitched or silent) to the
            // note's hold judge and settle the verdict as the span closes.
            const beatSec = 60 / (micBpmRef.current || 60);
            notesRef.current.forEach((note, i) => {
              if (note.expectedMidi === undefined || !note.holdBeats || consumed.current.has(i)) return;
              // Judged span: 100 ms attack grace at the front, closing a
              // frame early so the verdict lands before the item ends.
              const startMs = startRef.current + (note.t + 0.1) * 1000;
              const endMs = startRef.current + (note.t + note.holdBeats * beatSec - 0.05) * 1000;
              if (ts < startMs - 250 || (ts > endMs && !holdJudgesRef.current.has(i))) return;
              let judge = holdJudgesRef.current.get(i);
              if (!judge) {
                judge = new VocalHoldJudge(note.expectedMidi, startMs, endMs);
                holdJudgesRef.current.set(i, judge);
              }
              judge.observe(ts, sample ? sample.frequencyHz : null);
              if (ts >= endMs) {
                holdJudgesRef.current.delete(i);
                if (judge.passes()) {
                  attemptRef.current?.("pluck", note.expectedMidi, ts, note.expectedMidi, { verifiedNoteIndex: i });
                }
              }
            });
            if (sample) {
              const elapsed = (ts - startRef.current) / 1000;
              const windowSec = Math.min(100, micWindowMsRef.current) / 1000;
              const upcoming = notesRef.current.find((note, i) =>
                !consumed.current.has(i) && Math.abs(note.t - elapsed) <= windowSec,
              );
              const expectedMidi = upcoming?.string ?? upcoming?.notes?.[0];
              if (upcoming && expectedMidi !== undefined) {
                // Hold cues belong to the hold judge above — an in-tune
                // first instant must not score them early.
                if (!upcoming.holdBeats) {
                  const samePitchClass = ((sample.midi - expectedMidi) % 12 + 12) % 12 === 0;
                  if (samePitchClass) {
                    attemptRef.current?.("pluck", sample.midi, ts, sample.midi, { frequencyHz: sample.frequencyHz });
                  }
                }
              } else {
                const onset = pitchDetector.process(
                  timeData,
                  mic.ctx.sampleRate,
                  ts,
                  2,
                  minimumHz,
                  maximumHz,
                );
                if (onset) attemptRef.current?.("pluck", onset.midi, onset.onsetMs, onset.midi, { frequencyHz: onset.frequencyHz });
              }
            }
          } else {
            const onset = pitchDetector.process(
              timeData,
              mic.ctx.sampleRate,
              ts,
              2,
              minimumHz,
              maximumHz,
            );
            if (onset) {
              recognizedEvents += 1;
              setMicDetectedEvents(recognizedEvents);
              if (micInstrumentRef.current === "ukulele") {
                setLastDetectedPitch(`${onset.frequencyHz.toFixed(1)} Hz · MIDI ${onset.midi}`);
              }
              let inputIndex = onset.midi;
              if (micSurfaceRef.current === "strings") {
                if (micRequiresOpenStringRef.current) {
                  // Ukulele high-G is re-entrant: nearest pitch cannot reliably
                  // identify the physical string. Judge the scheduled open-string
                  // target instead; non-target notes must not be accepted.
                  const elapsed = (onset.onsetMs - startRef.current) / 1000;
                  const target = notesRef.current.find((note, i) =>
                    !consumed.current.has(i) &&
                    note.string !== undefined &&
                    Math.abs(note.t - elapsed) * 1000 <= micWindowMsRef.current,
                  );
                  const targetHz = target?.string !== undefined
                    ? micOpenFreqRef.current[target.string]
                    : undefined;
                  if (!targetHz || !matchesOpenStringTarget(onset.frequencyHz, targetHz)) {
                    setMicFeedback("A note was detected, but it was not the target open string. Check the highlighted string and tune it if needed.");
                    micFrameRef.current = requestAnimationFrame(loop);
                    return;
                  }
                  inputIndex = target!.string!;
                }
              }
              // Judged cues (expectedMidi: vocals, violin's fingered notes,
              // lap steel's barred notes) read the onset's UNROUNDED
              // frequency from the evidence; unjudged notes ignore it,
              // exactly as before.
              attemptRef.current?.("pluck", inputIndex, onset.onsetMs, onset.midi, { frequencyHz: onset.frequencyHz });
            }
          }
        } else if (mode === "attack") {
          const onset = attackDetector.process(timeData, mic.ctx.sampleRate, ts);
          if (onset) attemptRef.current?.("strum", undefined, onset.onsetMs);
        } else {
          const onset = percussionDetector.process(
            timeData,
            spectrumData,
            mic.ctx.sampleRate,
            mic.analyser.fftSize,
            ts,
          );
          if (onset) {
            recognizedEvents += 1;
            setMicDetectedEvents(recognizedEvents);
            attemptRef.current?.("pluck", onset.padIndex, onset.onsetMs);
          }
        }
      }
      micFrameRef.current = requestAnimationFrame(loop);
    };
    micFrameRef.current = requestAnimationFrame(loop);
  }, [requiresMicInput]);

  const stopAcousticMic = useCallback(() => {
    if (phaseRef.current === "play" && requiresMicInputRef.current) {
      // Stopping mid-exercise ends scoring for this item rather than turning
      // every remaining beat into a miss.
      visualOnlyRef.current = true;
      setVisualOnly(true);
      hitsRef.current = 0;
      missesRef.current = 0;
      setCombo(0);
    }
    micRequestRef.current += 1;
    micStopRef.current?.();
    micStopRef.current = null;
    setMicStatus("off");
    setMicLevel(0);
    setMicError(null);
  }, []);

  const beginVisualOnly = useCallback(() => {
    if (!requiresMicInput || needsPickRef.current || modeling) return;
    visualOnlyRef.current = true;
    setVisualOnly(true);
    beginPlay();
  }, [beginPlay, modeling, requiresMicInput]);

  useEffect(() => {
    if (phase !== "play" || !item) return;
    const meter = beatsPerBarOf(item);
    const loop = (t: number) => {
      const elapsed = (t - startRef.current) / 1000;
      nowRef.current = elapsed;
      const beatLen = 60 / item.bpm;
      const beat = Math.floor(elapsed / beatLen);
      if (beat !== lastBeat.current && beat >= 0) {
        lastBeat.current = beat;
        click(beat % meter === 0);
        setBeatN((beat % meter) + 1);
        const upcoming = notesRef.current.find((n, i) => !consumed.current.has(i) && n.t >= elapsed - 0.05);
        setExpectedString(upcoming?.string ?? null);
        setActiveString(null);
        if (upcoming?.chord) setLiveChord(upcoming.chord);
      }
      if (!visualOnlyRef.current) {
        for (let i = 0; i < notesRef.current.length; i++) {
          if (consumed.current.has(i)) continue;
          const note = notesRef.current[i];
          // Hold cues stay open for their full span (plus the usual hit
          // window) — the hold judge settles them, not this clock.
          const expiry = note.holdBeats
            ? note.t + note.holdBeats * beatLen + (item.windowMs ?? 230) / 1000
            : note.t + (item.windowMs ?? 230) / 1000;
          if (elapsed > expiry) {
            consumed.current.add(i);
            onJudge("miss");
          }
        }
      }
      const last = notesRef.current[notesRef.current.length - 1];
      const end = hasInstrumentPattern(item) ? patternEndSec(item) : (last?.t ?? 0) + 0.8;
      if (last && elapsed > end) {
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
        pauseSession();
        void navigate({ to: "/today" });
        return;
      }
      // Let focused controls keep their native Enter/Space behavior.
      if (e.target instanceof Element && e.target.closest("button, a, input, select, textarea, [role='button']")) return;
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
  }, [pauseSession, attempt, beginPlay, inst.stringNames.length, inst.surface, item?.surface, modeling, navigate, phase]);

  const goNext = useCallback(() => {
    if (!item || !advanceGuardRef.current.claim(item.id)) return;
    if (visualOnlyRef.current) skipCurrent();
    else finishItem();
    const s = useSpark.getState().session;
    const nextItem = s ? currentItem(s) : null;
    const nextSurface = nextItem?.surface ?? inst.surface;
    const nextNeedsMic = nextItem !== null &&
      (nextSurface === "strings" || nextSurface === "keys" || nextSurface === "pads" || nextSurface === "voice");
    if (!nextNeedsMic && micStatus === "listening") stopAcousticMic();
    if (!s || isSessionDone(s)) {
      finishDay();
      void navigate({ to: "/results" });
    } else {
      resetItem();
    }
  }, [finishDay, finishItem, inst.surface, item, micStatus, navigate, resetItem, skipCurrent, stopAcousticMic]);

  const skipThis = useCallback(() => {
    if (!item || !advanceGuardRef.current.claim(item.id)) return;
    setCombo(0);
    skipCurrent();
    const s = useSpark.getState().session;
    const nextItem = s ? currentItem(s) : null;
    const nextSurface = nextItem?.surface ?? inst.surface;
    const nextNeedsMic = nextItem !== null &&
      (nextSurface === "strings" || nextSurface === "keys" || nextSurface === "pads" || nextSurface === "voice");
    if (!nextNeedsMic && micStatus === "listening") stopAcousticMic();
    if (!s || isSessionDone(s)) {
      finishDay();
      void navigate({ to: "/results" });
    } else {
      resetItem();
    }
  }, [finishDay, inst.surface, item, micStatus, navigate, resetItem, skipCurrent, stopAcousticMic]);

  const leave = useCallback(() => {
    pauseSession();
    void navigate({ to: "/today" });
  }, [pauseSession, navigate]);

  const playModelEvent = useCallback(
    (note: NoteEvent) => {
      if (note.notes || note.muted) {
        playMusicalEvent(note, item?.bpm ?? 60);
        if (note.chord) setLiveChord(note.chord);
        return;
      }
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
    [inst, instrument, item?.bpm],
  );

  const hearOnce = useCallback(() => {
    const src = effectiveItem ?? item;
    if (!src || modeling) return;
    unlockAudio();
    for (const id of modelTimers.current) window.clearTimeout(id);
    modelTimers.current = [];
    const notes = buildTimeline(src);
    const beat = 60 / src.bpm;
    const meter = beatsPerBarOf(src);
    const windowSec = beat * meter;
    setModeling(true);
    for (let b = 0; b < meter; b++) {
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
        for (const id of modelTimers.current) window.clearTimeout(id);
        modelTimers.current = [];
        const beat = 60 / item.bpm;
        const meter = beatsPerBarOf(item);
        for (let b = 0; b < meter; b++) {
          const pad = token === "backbeat" ? (b % 2 === 0 ? 0 : 1) : b === 0 ? 0 : -1;
          modelTimers.current.push(window.setTimeout(() => {
            click(b === 0);
            if (pad >= 0) drumHit(pad);
          }, b * beat * 1000));
        }
        return;
      }
      playInstrumentChord(instrument, token, inst);
    },
    [inst, instrument, item],
  );

  useEffect(() => {
    if (phase !== "itemdone" || visualOnly) return;
    const id = window.setTimeout(() => goNext(), AUTO_ADVANCE_MS);
    return () => window.clearTimeout(id);
  }, [goNext, phase, visualOnly]);

  // Opt-in MIDI kit (drums sessions): a hit sounds the pad and flashes it —
  // the same primitives a pad tap uses — but never enters the judging
  // pipeline. Playing along only; nothing is scored.
  const midiPadHit = useCallback((pad: number) => {
    drumHit(pad);
    setActiveString(pad);
  }, []);
  const midiKit = useMidiDrums(midiPadHit);

  if (!session || !item) return null;

  const isWarm = isPluckDrill(item);
  const musicalPattern = hasInstrumentPattern(item);
  const surface = item.surface ?? inst.surface;
  const useHighway = surface === "strings" && !isWarm;
  // Pluck timelines expect a specific string/pad/key. A generic strum would
  // always miss, so hide the big button and force the specific control.
  const expectsSpecific = surface === "pads" || isWarm;
  const actionLabel =
    surface === "pads"
      ? "Hit"
      : surface === "keys"
        ? "Play"
        : surface === "voice"
          ? "Match"
          : instrument === "bass"
            ? "Pluck"
            : instrument === "violin"
              ? "Bow"
              : musicalPattern ? "Tap the cue" : "Strum";
  const chordPcs = liveChord && PIANO_VOICINGS[liveChord] ? PIANO_VOICINGS[liveChord].map((m) => m % 12) : [];
  const lastItem = session.index + 1 >= session.plan.items.length;

  const uke = instrument === "ukulele" ? ukeShape(liveChord || item.chords[0] || "C") : undefined;
  const mandolin = instrument === "mandolin" ? mandolinShape(liveChord || item.chords[0] || "G") : undefined;
  const banjo = instrument === "banjo" ? banjoShape(liveChord || item.chords[0] || "G") : undefined;
  const lapsteel = instrument === "lapsteel" ? lapsteelShape(liveChord || item.chords[0] || "C") : undefined;
  const needsPick =
    (item.process === "create" && item.createOptions && item.createOptions.length >= 2 && !createPick) ||
    (item.process === "respond" && item.listenPrompt && !listenPick);
  const listenRight = listenPick && item.listenPrompt ? listenPick === item.listenPrompt.answer : null;
  const pieceLine = whyThisPiece(item);
  needsPickRef.current = Boolean(needsPick);

  return (
    <div className="flex min-h-dvh flex-col bg-bg">
      <header className="flex items-center gap-3 px-4 py-3">
        <Button variant="ghost" size="icon" aria-label="Pause and leave session" onClick={leave}>
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
          {lastVerdict ? <div>last: {lastVerdict}</div> : null}
        </div>
      </header>
      {!checkpointSaved ? <p role="status" className="mx-auto max-w-lg px-5 pb-3 text-sm text-ember">This browser could not save your place. Keep this tab open to finish your loop.</p> : null}

      <div className="flex-1 px-4 pb-5">
        {phase === "intro" ? (
          <div className="mx-auto flex max-w-md flex-col items-center gap-4 pt-4">
            {instrument === "piano" || instrument === "vocals" ? (
              <PianoKeyboard activeMidi={null} chordPcs={chordPcs.length ? chordPcs : [0]} onPlay={() => undefined} disabled />
            ) : instrument === "drums" ? (
              <DrumPads active={null} onHit={() => undefined} disabled />
            ) : item.chords[0] && instrument === "ukulele" ? (
              <ChordDiagram shape={uke} />
            ) : item.chords[0] && instrument === "mandolin" ? (
              <ChordDiagram shape={mandolin} />
            ) : item.chords[0] && instrument === "banjo" ? (
              <ChordDiagram shape={banjo} />
            ) : item.chords[0] && instrument === "lapsteel" ? (
              <ChordDiagram shape={lapsteel} />
            ) : item.chords[0] && instrument === "guitar" ? (
              <ChordDiagram chordId={item.chords[0]} />
            ) : (
              <StringRack active={null} names={inst.stringNames} onPluck={() => undefined} disabled />
            )}
            <RoleTag role={item.role} process={item.process} />
            {pieceLine ? <p className="text-center text-sm text-muted">{pieceLine}</p> : null}
            <CriteriaList items={item.criteria?.length ? item.criteria : item.objectives?.length ? item.objectives : [item.subtitle]} />
            {!item.criteria?.length ? <p className="text-center text-sm text-dim">{successLine(item)}</p> : null}
            {musicalPattern ? (
              <p className="text-center text-sm text-muted">
                First bar: {buildTimeline(item).filter((note) => note.bar === 0).map((note) => note.label).join(" · ")}. Follow the cue timing; keep counting through holds and rests.
              </p>
            ) : <RhythmRead pattern={item.pattern} />}
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
            {requiresMicInput ? (
              <section className="w-full rounded-lg border border-border bg-surface p-4">
                <p role="status" className="text-sm leading-relaxed text-muted">
                  {micStatus === "listening"
                    ? `Microphone ready. ${acousticInputDescription(instrument, inst.name, micMode)}`
                    : micStatus === "starting"
                      ? "Requesting microphone access…"
                      : micError ?? `Enable the microphone to score real ${acousticInstrumentLabel(instrument, inst.name)} input. Audio is analyzed locally, never recorded or uploaded.`}
                </p>
                {micStatus === "listening" ? <MicSignalMeter level={micLevel} mode={micMode} /> : null}
                {micStatus === "listening" ? (
                  <div className="mt-3 space-y-2" aria-label="Microphone input diagnostics">
                    <p className="text-xs leading-relaxed text-muted">
                      Using: {micInputName}. {micLevel < 0.0015
                        ? "Play your instrument beside this microphone. If the meter stays empty, select a different input below or check your system microphone permission."
                        : "Audio is arriving. Detection and scoring begin after the count-in."}
                    </p>
                    {phase === "intro" && micDevices.length > 1 ? (
                      <label className="block text-xs text-muted">
                        Microphone source
                        <select
                          aria-label="Microphone source"
                          className="mt-1 w-full rounded-md border border-border bg-surface px-2 py-2 text-sm text-fg"
                          value={selectableDeviceId(micDevices, micDeviceId)}
                          onChange={(event) => {
                            const nextDeviceId = event.currentTarget.value;
                            stopAcousticMic();
                            void startAcousticMic(nextDeviceId || undefined);
                          }}
                        >
                          <option value="">System default</option>
                          {listedInputDevices(micDevices).map((device, index) => (
                            <option key={device.deviceId} value={device.deviceId}>
                              {device.label || `Microphone ${index + 1}`}
                            </option>
                          ))}
                        </select>
                      </label>
                    ) : null}
                  </div>
                ) : null}
                <div className="mt-3 grid gap-2">
                  <Button
                    variant={micStatus === "listening" ? "secondary" : "primary"}
                    disabled={micStatus === "starting"}
                    onClick={() => (micStatus === "listening" ? stopAcousticMic() : void startAcousticMic())}
                  >
                    {micStatus === "starting"
                      ? "Opening microphone…"
                      : micStatus === "listening"
                        ? "Stop microphone"
                        : "Enable microphone"}
                  </Button>
                  {micStatus !== "listening" ? (
                    <Button
                      variant="ghost"
                      disabled={modeling || Boolean(needsPick) || micStatus === "starting"}
                      onClick={beginVisualOnly}
                    >
                      Continue without mic (unscored)
                    </Button>
                  ) : null}
                </div>
                <p className="mt-3 text-xs leading-relaxed text-dim">
                  Headphones help prevent the metronome from being picked up by the mic. Audio is never recorded or uploaded.
                </p>
              </section>
            ) : null}
            <Button
              size="xl"
              className="w-full"
              onClick={beginPlay}
              disabled={
                modeling ||
                Boolean(needsPick) ||
                (requiresMicInput && micStatus !== "listening" && !visualOnly)
              }
            >
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
            {requiresMicInput && micStatus === "listening" ? (
              <p className="text-xs text-good">Microphone on · acoustic input starts with the first cue.</p>
            ) : null}
          </div>
        ) : null}

        {phase === "play" ? (
          <div className="mx-auto flex max-w-lg flex-col gap-4">
            {item.chords.length && surface !== "pads" ? (
              <div className="flex flex-col items-center gap-3">
                {instrument === "guitar" ? <ChordDiagram chordId={liveChord || item.chords[0]} compact /> : null}
                {instrument === "ukulele" ? <ChordDiagram shape={uke} compact /> : null}
                {instrument === "mandolin" ? <ChordDiagram shape={mandolin} compact /> : null}
                {instrument === "banjo" ? <ChordDiagram shape={banjo} compact /> : null}
                {instrument === "lapsteel" ? <ChordDiagram shape={lapsteel} compact /> : null}
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
                disabled={requiresMicInput}
              />
            ) : null}

            {surface === "pads" ? (
              <DrumPads active={activeString} expected={expectedString} onHit={(i) => attempt("pluck", i)} disabled={requiresMicInput} />
            ) : null}

            {surface === "pads" ? (
              <div className="flex flex-col items-center gap-2">
                <Button
                  variant="secondary"
                  aria-pressed={midiKit.status === "on" || midiKit.status === "no-device"}
                  onClick={() => {
                    unlockAudio();
                    midiKit.toggle();
                  }}
                >
                  MIDI kit: {midiKit.status === "on" || midiKit.status === "no-device" ? "on" : "off"}
                </Button>
                <p role="status" className="text-center text-xs text-muted">
                  {midiKit.status === "on"
                    ? "Play your kit — hits play the pads here. Nothing is scored."
                    : midiKit.status === "no-device"
                      ? "MIDI is on, but no kit is connected yet. Plug one in and it will be picked up automatically."
                      : midiKit.status === "denied"
                        ? "MIDI permission was blocked, so the kit can't be heard. Taps still work."
                        : midiKit.status === "unavailable"
                          ? "This browser has no MIDI support. Taps still work."
                          : "Have an electronic kit? Turn this on and play the pads from it."}
                </p>
              </div>
            ) : null}

            {surface === "strings" && isWarm ? (
              <div className="space-y-2">
                <p className="text-center text-xs text-muted">Amber outline = target string · Solid highlight = correctly played</p>
                <StringRack
                names={inst.stringNames}
                active={activeString}
                expected={expectedString}
                onPluck={(i) => attempt("pluck", i)}
                  disabled={requiresMicInput}
                />
              </div>
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
            <p className="text-center text-sm text-dim">
              {requiresMicInput
                ? acousticInputDescription(instrument, inst.name, micMode)
                : musicalPattern
                  ? "Tap with each note or muted click. Taps practise timing; they do not assess your instrument playing."
                  : patternInWords(item.pattern)}
            </p>
            {requiresMicInput ? (
              <section className="w-full rounded-lg border border-border bg-surface p-4">
                <p role="status" className="text-center text-sm font-medium text-muted">
                  {visualOnly
                    ? "Visual-only practice. This attempt will not be scored."
                    : micStatus === "listening"
                      ? micMode === "percussion"
                        ? "Listening for your drum hits…"
                        : micMode === "attack"
                          ? "Listening for ringing strokes and muted chops…"
                          : micMode === "pitch"
                            ? `Listening for notes from your ${acousticInstrumentLabel(instrument, inst.name)}…`
                            : `Listening for ${acousticInstrumentLabel(instrument, inst.name)} strums…`
                      : "Microphone unavailable. This attempt will not be scored."}
                </p>
                <p className="mt-2 text-center text-xs leading-relaxed text-dim">
                  {acousticInputDescription(instrument, inst.name, micMode)} Use headphones for the click; audio stays on this device.
                </p>
                {micStatus === "listening" ? <MicSignalMeter level={micLevel} mode={micMode} /> : null}
                {!visualOnly && micStatus === "listening" ? (
                  <div className="mt-3 space-y-1">
                    <div className="flex justify-between gap-2 text-xs text-muted">
                      <span>Attacks recognized</span>
                      <span className="tabular-nums">{micDetectedEvents}</span>
                    </div>
                    {micDetectedEvents === 0 && micLevel >= 0.0015 ? (
                      <p className="text-xs text-muted">The microphone hears audio, but no playable attack has been recognized yet.</p>
                    ) : null}
                  </div>
                ) : null}
                {instrument === "ukulele" && micMode === "pitch" && micStatus === "listening" ? (
                  <p role="status" className="mt-2 text-center text-xs text-muted">Mic heard: {lastDetectedPitch ?? "waiting for a note"} · Target: {expectedString === null ? "waiting" : inst.stringNames[expectedString]}</p>
                ) : null}
                {micFeedback ? (
                  <p role="status" aria-live="polite" className="mt-2 text-center text-xs leading-relaxed text-muted">
                    {micFeedback}
                  </p>
                ) : null}
                {!visualOnly && micStatus === "listening" ? (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="mt-2 w-full"
                    onClick={stopAcousticMic}
                  >
                    Stop mic and continue unscored
                  </Button>
                ) : null}
              </section>
            ) : expectsSpecific ? (
              <p className="text-center text-sm text-muted">Tap the highlighted pad, key, or string — pitch and timing both count.</p>
            ) : (
              <Button
                size="xl"
                variant="strum"
                className="w-full touch-none"
                onPointerDown={(e) => {
                  e.preventDefault();
                  attempt("strum");
                }}
                onClick={(e) => {
                  // Keyboard activation (Enter/Space detail === 0). Pointer
                  // input is already handled via onPointerDown above.
                  if (e.detail === 0) attempt("strum");
                }}
              >
                {actionLabel}
              </Button>
            )}
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
              {visualOnly ? "Pattern complete" : itemCloseCopy(itemSummary?.stars ?? 0, lastItem)}
            </p>
            {visualOnly ? (
              <p className="text-pretty text-sm text-muted">
                Visual-only practice is not scored. No hits, misses, or XP were recorded.
              </p>
            ) : (
              <>
                <p className="tabular text-muted">
                  {itemSummary?.stars ?? 0}★ · {Math.round((itemSummary?.accuracy ?? 0) * 100)}% · +{itemSummary?.xp ?? 0} xp
                </p>
                <p className="text-pretty text-sm text-muted">{refineLine(item, itemSummary?.stars ?? 0)}</p>
              </>
            )}
            {micStatus === "listening" ? (
              <Button variant="ghost" className="w-full" onClick={stopAcousticMic}>
                Stop microphone
              </Button>
            ) : null}
            <Button size="lg" className="w-full" onClick={goNext}>
              {lastItem ? "See today" : "Next"}
            </Button>
          </div>
        ) : null}
      </div>
    </div>
  );
}
