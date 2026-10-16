import { useEffect, useRef, useState } from "react";
import { FileAudio, FolderOpen, Pause, Play, Repeat, Square, Trash2 } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { Chip, TabRow } from "@/components/labs/shared";
import { Button } from "@/components/ui/button";
import { StemEngine } from "@/lib/spark/stem-engine";
import {
  STEM_DEFS,
  STEM_IDS,
  STEM_PRESETS,
  classifyStemFiles,
  emptyStemMix,
  formatStemTime,
  loadStemMix,
  saveStemMix,
  songKeyFor,
  type StemId,
  type StemMix,
} from "@/lib/spark/stems";
import type { LoadedStem } from "@/lib/spark/stem-engine";
import { cn } from "@/lib/utils";

type StemTab = "mixer" | "guide";
const TABS: { id: StemTab; label: string }[] = [
  { id: "mixer", label: "Mixer" },
  { id: "guide", label: "Make stems" },
];

type TrayFile = { id: number; file: File; path: string };

const AUDIO_EXT = /\.(wav|mp3|ogg|oga|flac|m4a|aac|webm|opus)$/i;

function cloneMix(mix: StemMix): StemMix {
  return {
    gains: { ...mix.gains },
    muted: { ...mix.muted },
    soloed: { ...mix.soloed },
    master: mix.master,
  };
}

export function StemLab() {
  const [tab, setTab] = useState<StemTab>("mixer");
  const engineRef = useRef<StemEngine | null>(null);
  if (!engineRef.current) engineRef.current = new StemEngine();
  const engine = engineRef.current;

  const [loaded, setLoaded] = useState<LoadedStem[]>([]);
  const [song, setSong] = useState<string | null>(null);
  const [tray, setTray] = useState<TrayFile[]>([]);
  const [notice, setNotice] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [positionSec, setPositionSec] = useState(0);
  const [loopA, setLoopA] = useState<number | null>(null);
  const [loopB, setLoopB] = useState<number | null>(null);
  const [loopOn, setLoopOn] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [activePreset, setActivePreset] = useState<string | null>("full");

  const mixRef = useRef<StemMix>(emptyStemMix());
  const [mix, setMixState] = useState<StemMix>(mixRef.current);
  const songKeyRef = useRef<string | null>(null);
  const trayId = useRef(0);
  const filesInput = useRef<HTMLInputElement | null>(null);
  const folderInput = useRef<HTMLInputElement | null>(null);

  const durationSec = engine.timeline?.durationSec ?? 0;
  const firstSound = new Map(
    (engine.timeline?.tracks ?? []).map((t) => [t.stem, t.firstSoundSec] as const),
  );

  useEffect(() => {
    engine.onEnded = () => {
      setPlaying(false);
      setPositionSec(0);
    };
    return () => engine.dispose();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!playing) return;
    const id = window.setInterval(() => setPositionSec(engine.position()), 200);
    return () => window.clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [playing]);

  const setMix = (next: StemMix, presetId: string | null, persist = true) => {
    mixRef.current = next;
    setMixState(next);
    setActivePreset(presetId);
    engine.applyMix(next);
    if (persist && songKeyRef.current) saveStemMix(songKeyRef.current, next);
  };

  const refreshLoaded = () => {
    const now = engine
      .loadedStems()
      .sort((a, b) => STEM_IDS.indexOf(a.stem) - STEM_IDS.indexOf(b.stem));
    setLoaded(now);
    return now;
  };

  /** After the loaded set changes: find this song's saved mix, if any. */
  const adoptSong = (now: LoadedStem[]) => {
    if (!now.length) {
      songKeyRef.current = null;
      return;
    }
    const key = songKeyFor(now.map((l) => ({ name: l.fileName, durationSec: l.durationSec })));
    songKeyRef.current = key;
    const saved = loadStemMix(key);
    if (saved) setMix(saved, null, false);
    else engine.applyMix(mixRef.current);
  };

  const ingest = async (files: File[]) => {
    const audio = files.filter((f) => AUDIO_EXT.test(f.name) && f.size > 0);
    if (!audio.length) {
      setNotice("No audio files there. Stems are wav, mp3, ogg or flac files.");
      return;
    }
    setBusy(true);
    const notes: string[] = [];
    try {
      const paths = audio.map((f) => f.webkitRelativePath || f.name);
      const classified = classifyStemFiles(paths);
      if (classified.song) setSong(classified.song);
      const byPath = new Map(audio.map((f, i) => [paths[i], f] as const));
      const matched = classified.files.filter((f) => f.stem);
      const unmatched = classified.files.filter((f) => !f.stem);
      for (const f of matched) {
        const file = byPath.get(f.path)!;
        try {
          await engine.addStem(f.stem!, file);
        } catch {
          notes.push(`Could not decode ${file.name}.`);
        }
      }
      if (unmatched.length) {
        setTray((prev) => [
          ...prev,
          ...unmatched.map((f) => ({
            id: ++trayId.current,
            file: byPath.get(f.path)!,
            path: f.path,
          })),
        ]);
        notes.push(
          `${unmatched.length} file${unmatched.length === 1 ? "" : "s"} could not be placed by name — assign ${unmatched.length === 1 ? "it" : "them"} below.`,
        );
      }
      const now = refreshLoaded();
      adoptSong(now);
      if (now.length) {
        notes.push(`${now.length} stem${now.length === 1 ? "" : "s"} loaded.`);
      }
      setNotice(notes.length ? notes.join(" ") : null);
    } finally {
      setBusy(false);
    }
  };

  const assignTray = async (item: TrayFile, stem: StemId) => {
    setBusy(true);
    try {
      await engine.addStem(stem, item.file);
      setTray((prev) => prev.filter((t) => t.id !== item.id));
      adoptSong(refreshLoaded());
      setNotice(null);
    } catch {
      setNotice(`Could not decode ${item.file.name}.`);
    } finally {
      setBusy(false);
    }
  };

  const togglePlay = () => {
    if (playing) {
      engine.pause();
      setPlaying(false);
      setPositionSec(engine.position());
    } else {
      engine.play();
      setPlaying(engine.isPlaying);
    }
  };

  const stopAll = () => {
    engine.stop();
    setPlaying(false);
    setPositionSec(0);
  };

  const applyLoop = (a: number | null, b: number | null, on: boolean) => {
    setLoopA(a);
    setLoopB(b);
    setLoopOn(on);
    engine.setLoop(on && a !== null && b !== null && b > a ? { a, b } : null);
  };

  const patchMix = (patch: (m: StemMix) => void) => {
    const next = cloneMix(mixRef.current);
    patch(next);
    setMix(next, null);
  };

  return (
    <AppShell>
      <header className="px-5 pb-2 pt-8">
        <p className="text-[11px] uppercase tracking-[0.22em] text-dim">Stem lab · Any instrument</p>
        <h1 className="mt-2 font-display text-4xl font-semibold tracking-tight">Stems</h1>
        <p className="mt-3 max-w-sm text-pretty text-muted">
          Bring a song that has already been split into stems. Mute the part you play, and play it
          against the band. SparkSuite does not split songs itself — the Make stems tab shows the
          quick way to do that with Demucs.
        </p>
      </header>

      <div className="sticky top-0 z-10 mx-4 mt-4 rounded-lg border border-border bg-surface/95 p-2 backdrop-blur-sm">
        <TabRow tabs={TABS} active={tab} onPick={setTab} cols={4} />
      </div>

      {tab === "guide" ? <MakeStemsGuide /> : null}

      {tab === "mixer" ? (
        <div className="px-5 pb-8 pt-5">
          <section
            aria-label="Add stems"
            onDragOver={(e) => {
              e.preventDefault();
              setDragOver(true);
            }}
            onDragLeave={() => setDragOver(false)}
            onDrop={(e) => {
              e.preventDefault();
              setDragOver(false);
              void ingest([...e.dataTransfer.files]);
            }}
            className={cn(
              "rounded-xl border border-dashed p-5 text-center transition-colors",
              dragOver ? "border-accent bg-raised" : "border-border bg-surface",
            )}
          >
            <FileAudio className="mx-auto size-8 text-dim" aria-hidden="true" />
            <p className="mt-3 text-sm text-muted">
              Drop stem files here — vocals, drums, bass, guitar, piano, other — or a whole
              Demucs output folder.
            </p>
            <div className="mt-4 flex flex-wrap justify-center gap-2">
              <Button
                variant="secondary"
                disabled={busy}
                onClick={() => filesInput.current?.click()}
              >
                <FileAudio className="size-4" />
                Add stem files
              </Button>
              <Button
                variant="secondary"
                disabled={busy}
                onClick={() => folderInput.current?.click()}
              >
                <FolderOpen className="size-4" />
                Add a folder
              </Button>
            </div>
            <input
              ref={filesInput}
              type="file"
              accept="audio/*,.wav,.mp3,.ogg,.flac,.m4a"
              multiple
              className="hidden"
              onChange={(e) => {
                if (e.target.files) void ingest([...e.target.files]);
                e.target.value = "";
              }}
            />
            <input
              type="file"
              multiple
              className="hidden"
              ref={(el) => {
                folderInput.current = el;
                el?.setAttribute("webkitdirectory", "");
              }}
              onChange={(e) => {
                if (e.target.files) void ingest([...e.target.files]);
                e.target.value = "";
              }}
            />
            {song || loaded.length ? (
              <p className="mt-4 text-sm text-fg" role="status">
                {song ? `${song} · ` : ""}
                {loaded.length} stem{loaded.length === 1 ? "" : "s"}
                {durationSec ? ` · ${formatStemTime(durationSec)}` : ""}
              </p>
            ) : null}
            {notice ? (
              <p className="mt-2 text-sm text-muted" role="status">
                {notice}
              </p>
            ) : null}
          </section>

          {tray.length ? (
            <section aria-label="Unassigned files" className="mt-5 rounded-xl border border-border bg-surface p-5">
              <p className="text-[11px] uppercase tracking-[0.18em] text-dim">Needs a home</p>
              <ul className="mt-3 space-y-3">
                {tray.map((item) => (
                  <TrayRow key={item.id} item={item} busy={busy} onAssign={(s) => void assignTray(item, s)} />
                ))}
              </ul>
            </section>
          ) : null}

          {loaded.length ? (
            <>
              <section aria-label="Transport" className="mt-5 rounded-xl border border-border bg-surface p-5">
                <div className="flex gap-2">
                  <Button onClick={togglePlay} className="flex-1" disabled={busy}>
                    {playing ? <Pause className="size-4" /> : <Play className="size-4" />}
                    {playing ? "Pause" : "Play"}
                  </Button>
                  <Button variant="secondary" onClick={stopAll} className="px-4" aria-label="Stop and return to the start">
                    <Square className="size-4" />
                  </Button>
                </div>
                <div className="mt-4 flex items-center gap-3">
                  <span className="text-xs tabular text-dim">{formatStemTime(positionSec)}</span>
                  <input
                    type="range"
                    aria-label="Seek"
                    min={0}
                    max={Math.max(0.1, durationSec)}
                    step={0.1}
                    value={Math.min(positionSec, durationSec)}
                    onChange={(e) => {
                      const v = Number(e.target.value);
                      engine.seek(v);
                      setPositionSec(v);
                    }}
                    className="h-11 flex-1 accent-accent"
                  />
                  <span className="text-xs tabular text-dim">{formatStemTime(durationSec)}</span>
                </div>
                <div className="mt-2 flex flex-wrap items-center gap-1.5">
                  <Chip active={false} onClick={() => applyLoop(positionSec, loopB, loopOn)}>
                    Set A{loopA !== null ? ` · ${formatStemTime(loopA)}` : ""}
                  </Chip>
                  <Chip active={false} onClick={() => applyLoop(loopA, positionSec, loopOn)}>
                    Set B{loopB !== null ? ` · ${formatStemTime(loopB)}` : ""}
                  </Chip>
                  <Chip
                    active={loopOn}
                    onClick={() => applyLoop(loopA, loopB, !loopOn)}
                  >
                    <span className="inline-flex items-center gap-1">
                      <Repeat className="size-3.5" /> Loop
                    </span>
                  </Chip>
                  {loopA !== null || loopB !== null ? (
                    <Chip active={false} onClick={() => applyLoop(null, null, false)}>
                      Clear
                    </Chip>
                  ) : null}
                  {loopOn && (loopA === null || loopB === null || loopB <= loopA) ? (
                    <p className="w-full text-xs text-muted">
                      Set A, play on, then set B after it — the loop needs both ends.
                    </p>
                  ) : null}
                </div>
              </section>

              <section aria-label="Play-along presets" className="mt-6">
                <p className="text-[11px] uppercase tracking-[0.18em] text-dim">Play along</p>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {STEM_PRESETS.map((p) => (
                    <Chip
                      key={p.id}
                      active={activePreset === p.id}
                      onClick={() => setMix(cloneMix(p.mix), p.id)}
                    >
                      {p.label}
                    </Chip>
                  ))}
                  {activePreset === null ? (
                    <span className="inline-flex h-11 items-center rounded-md border border-accent px-3 text-sm font-medium text-accent">
                      Custom
                    </span>
                  ) : null}
                </div>
              </section>

              <section aria-label="Mixer" className="mt-6 space-y-3">
                {loaded.map((l) => {
                  const soundAt = firstSound.get(l.stem) ?? 0;
                  return (
                    <div key={l.stem} className="rounded-xl border border-border bg-surface p-4">
                      <div className="flex items-baseline justify-between gap-3">
                        <p className="font-display text-lg font-semibold">{STEM_DEFS[l.stem].label}</p>
                        <p className="text-xs tabular text-dim">
                          {soundAt > 0.05 ? `first sound ${formatStemTime(soundAt)} · ` : ""}
                          {formatStemTime(l.durationSec)}
                        </p>
                      </div>
                      <div className="mt-1 flex items-center gap-3">
                        <input
                          type="range"
                          aria-label={`${STEM_DEFS[l.stem].label} volume`}
                          min={0}
                          max={1.25}
                          step={0.01}
                          value={mix.gains[l.stem]}
                          onChange={(e) =>
                            patchMix((m) => {
                              m.gains[l.stem] = Number(e.target.value);
                            })
                          }
                          className="h-11 flex-1 accent-accent"
                        />
                        <span className="w-10 text-right text-xs tabular text-dim">
                          {Math.round(mix.gains[l.stem] * 100)}%
                        </span>
                      </div>
                      <div className="flex gap-1.5">
                        <Chip
                          active={mix.muted[l.stem]}
                          onClick={() =>
                            patchMix((m) => {
                              m.muted[l.stem] = !m.muted[l.stem];
                            })
                          }
                        >
                          Mute
                        </Chip>
                        <Chip
                          active={mix.soloed[l.stem]}
                          onClick={() =>
                            patchMix((m) => {
                              m.soloed[l.stem] = !m.soloed[l.stem];
                            })
                          }
                        >
                          Solo
                        </Chip>
                        <button
                          type="button"
                          aria-label={`Remove ${STEM_DEFS[l.stem].label} stem`}
                          onClick={() => {
                            engine.removeStem(l.stem);
                            const now = refreshLoaded();
                            adoptSong(now);
                            if (!now.length) {
                              setPlaying(false);
                              setPositionSec(0);
                            }
                          }}
                          className="ml-auto inline-flex h-11 w-11 items-center justify-center rounded-md text-muted transition-colors hover:text-fg"
                        >
                          <Trash2 className="size-4" />
                        </button>
                      </div>
                    </div>
                  );
                })}
                <div className="rounded-xl border border-border bg-surface p-4">
                  <div className="flex items-baseline justify-between gap-3">
                    <p className="font-display text-lg font-semibold">Master</p>
                    <span className="text-xs tabular text-dim">{Math.round(mix.master * 100)}%</span>
                  </div>
                  <input
                    type="range"
                    aria-label="Master volume"
                    min={0}
                    max={1.25}
                    step={0.01}
                    value={mix.master}
                    onChange={(e) =>
                      patchMix((m) => {
                        m.master = Number(e.target.value);
                      })
                    }
                    className="h-11 w-full accent-accent"
                  />
                </div>
              </section>

              <p className="mt-6 text-xs leading-relaxed text-muted">
                Every stem plays from the song&apos;s true start, silence included — nothing is
                trimmed or shifted, so each stem keeps its place against the original recording.
                Your mix for this song is remembered on this device.
              </p>
            </>
          ) : (
            <p className="mt-5 text-pretty text-sm text-muted">
              No stems yet. If your song is still one file, the Make stems tab turns it into a
              folder of stems in about two minutes — then drop the folder here.
            </p>
          )}
        </div>
      ) : null}
    </AppShell>
  );
}

function TrayRow({
  item,
  busy,
  onAssign,
}: {
  item: TrayFile;
  busy: boolean;
  onAssign: (stem: StemId) => void;
}) {
  const [choice, setChoice] = useState<StemId | "">("");
  return (
    <li className="flex flex-wrap items-center gap-2">
      <span className="min-w-0 flex-1 truncate text-sm">{item.file.name}</span>
      <select
        aria-label={`Assign ${item.file.name} to a stem`}
        value={choice}
        onChange={(e) => setChoice(e.target.value as StemId | "")}
        className="h-11 rounded-md border border-border bg-raised px-2 text-sm text-fg"
      >
        <option value="">Choose a stem…</option>
        {STEM_IDS.map((id) => (
          <option key={id} value={id}>
            {STEM_DEFS[id].label}
          </option>
        ))}
      </select>
      <Button
        variant="secondary"
        disabled={busy || !choice}
        onClick={() => {
          if (choice) onAssign(choice);
        }}
      >
        Assign
      </Button>
    </li>
  );
}

function MakeStemsGuide() {
  return (
    <div className="px-5 pb-8 pt-5">
      <section className="rounded-xl border border-border bg-surface p-5">
        <p className="text-[11px] uppercase tracking-[0.18em] text-dim">The honest split</p>
        <h2 className="mt-1 font-display text-3xl font-semibold tracking-tight">
          Demucs makes the stems
        </h2>
        <p className="mt-3 text-pretty text-sm leading-relaxed text-muted">
          Splitting a finished song into separate instruments takes a trained model, and that
          model does not run in a web page. Demucs is the free, standard tool for it, and it runs
          on your own computer. SparkSuite never receives or uploads your song — the files stay
          yours from start to finish.
        </p>
      </section>

      <section className="mt-5 rounded-xl border border-border bg-surface p-5">
        <p className="text-[11px] uppercase tracking-[0.18em] text-dim">Once, then per song</p>
        <ol className="mt-3 list-decimal space-y-3 pl-5 text-sm leading-relaxed text-muted">
          <li>
            Install Demucs (needs Python):
            <pre className="mt-2 overflow-x-auto rounded-md bg-raised p-3 text-xs text-fg">
              pip install demucs
            </pre>
          </li>
          <li>
            Split a song with the six-stem model:
            <pre className="mt-2 overflow-x-auto rounded-md bg-raised p-3 text-xs text-fg">
              demucs -n htdemucs_6s &quot;song.mp3&quot;
            </pre>
          </li>
          <li>
            That writes a folder — <code>separated/htdemucs_6s/song/</code> — holding one file
            per stem: vocals, drums, bass, guitar, piano, other.
          </li>
          <li>
            Back on the Mixer tab, choose <strong className="text-fg">Add a folder</strong> and
            pick that folder. Every stem lands on its own strip.
          </li>
        </ol>
      </section>

      <section className="mt-5 rounded-xl border border-border bg-surface p-5">
        <p className="text-[11px] uppercase tracking-[0.18em] text-dim">Worth knowing</p>
        <ul className="mt-3 list-disc space-y-2 pl-5 text-sm leading-relaxed text-muted">
          <li>
            <strong className="text-fg">Keep the stem files exactly as Demucs writes them.</strong>{" "}
            Do not trim the silence at the start of a stem. This lab keeps every stem on the
            song&apos;s original timeline by design, and a trimmed stem would fall out of step
            with the original recording.
          </li>
          <li>
            The plain command <code>demucs &quot;song.mp3&quot;</code> (four stems) works too —
            guitar and piano then live inside <code>other.wav</code>.
          </li>
          <li>
            A stem can be shorter than the song. It simply ends when it ends; the rest keep
            playing. Nothing is padded or stretched to cover the gap.
          </li>
        </ul>
      </section>
    </div>
  );
}
