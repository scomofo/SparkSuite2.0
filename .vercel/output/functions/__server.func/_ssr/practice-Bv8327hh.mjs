import { i as __toESM } from "../_runtime.mjs";
import { n as require_react } from "../_libs/@radix-ui/react-compose-refs+[...].mjs";
import { B as require_jsx_runtime, v as Link, y as useNavigate } from "../_libs/@tanstack/react-router+[...].mjs";
import { t as Button } from "./button-DYd0ZC_F.mjs";
import { a as drumHit, f as pianoTone, g as unlockAudio, i as comboSting, m as strum, n as bassTone, p as pluck, r as click, s as hitSfx, u as pianoChord } from "./audio-DIq8nkMh.mjs";
import { t as ChordDiagram } from "./chord-diagram-C6Re10Bn.mjs";
import { t as DrumPads } from "./drum-pads-BH58tIUq.mjs";
import { t as PianoKeyboard } from "./piano-keyboard-hXDcveFZ.mjs";
import { t as PitchMatch } from "./tuner-panel-BbNOOGJL.mjs";
import { a as RoleTag, i as RhythmRead, n as CriteriaList, r as HarmonyRead } from "./udl-chrome-B3jlEpW1.mjs";
import { u as ChevronLeft } from "../_libs/lucide-react.mjs";
import { $ as fretToFreq, B as buildTimeline, F as OPEN_FREQ, G as comboCue, I as PIANO_VOICINGS, J as currentItem, K as consumeHit, N as CHORDS, R as STRING_NAMES, St as useSpark, U as cn, V as chordsFromCreatePick, W as coachCue, at as itemCloseCopy, bt as summarizeItem, dt as patternInWords, et as howYouPlay, j as AUTO_ADVANCE_MS, lt as midiToFreq, nt as isComboGate, pt as refineLine, q as countInBeats, rt as isSessionDone, tt as instrumentById, wt as whyThisPiece, yt as successLine, z as UKE_CHORDS } from "./router-_2DnnNcg.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/practice-Bv8327hh.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
function StringRack({ active, expected, onPluck, disabled, names = STRING_NAMES }) {
	const last = names.length - 1;
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: "flex w-full max-w-sm flex-col gap-2",
		role: "group",
		"aria-label": "Strings",
		children: [...names].reverse().map((name, rev) => {
			const i = last - rev;
			return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
				type: "button",
				disabled,
				onClick: () => onPluck(i),
				className: cn("flex h-12 items-center justify-between rounded-md border px-4 font-display text-lg tracking-wide transition-colors duration-(--motion-quick)", active === i ? "border-accent bg-accent text-accent-fg" : expected === i ? "border-ember bg-raised text-ember" : "border-border bg-raised text-fg hover:border-ember/60"),
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						className: "text-xs uppercase tracking-[0.18em] text-dim",
						children: names.length - i
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: name }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						className: "tabular text-xs text-muted",
						children: i + 1
					})
				]
			}, `${name}-${i}`);
		})
	});
}
function RhythmHighway({ notesRef, consumedRef, nowRef, lookAhead, flash }) {
	const canvasRef = (0, import_react.useRef)(null);
	const flashRef = (0, import_react.useRef)(flash);
	flashRef.current = flash;
	(0, import_react.useEffect)(() => {
		const canvas = canvasRef.current;
		if (!canvas) return;
		const parent = canvas.parentElement;
		let raf = 0;
		let running = true;
		const resize = () => {
			const dpr = Math.min(2, window.devicePixelRatio || 1);
			const w = parent?.clientWidth ?? 360;
			const h = parent?.clientHeight ?? 280;
			canvas.width = Math.floor(w * dpr);
			canvas.height = Math.floor(h * dpr);
			canvas.style.width = `${w}px`;
			canvas.style.height = `${h}px`;
		};
		resize();
		const ro = typeof ResizeObserver !== "undefined" ? new ResizeObserver(resize) : null;
		if (parent && ro) ro.observe(parent);
		const draw = () => {
			if (!running) return;
			const ctx = canvas.getContext("2d");
			if (!ctx) return;
			const dpr = Math.min(2, window.devicePixelRatio || 1);
			const w = canvas.width / dpr;
			const h = canvas.height / dpr;
			ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
			ctx.fillStyle = "#160f0b";
			ctx.fillRect(0, 0, w, h);
			const hitY = h * .82;
			const laneX = w / 2;
			const now = nowRef.current;
			ctx.strokeStyle = "rgba(237,230,218,0.08)";
			ctx.lineWidth = 1;
			for (let i = 0; i < 5; i++) {
				const x = laneX - 48 + i * 24;
				ctx.beginPath();
				ctx.moveTo(x, 12);
				ctx.lineTo(x, h - 8);
				ctx.stroke();
			}
			ctx.fillStyle = "rgba(255,123,58,0.18)";
			ctx.fillRect(laneX - 56, hitY - 10, 112, 20);
			ctx.strokeStyle = "#ff7b3a";
			ctx.lineWidth = 2;
			ctx.beginPath();
			ctx.moveTo(laneX - 58, hitY);
			ctx.lineTo(laneX + 58, hitY);
			ctx.stroke();
			const notes = notesRef.current;
			const consumed = consumedRef.current;
			for (let i = 0; i < notes.length; i++) {
				if (consumed.has(i)) continue;
				const n = notes[i];
				const dt = n.t - now;
				if (dt < -.25 || dt > lookAhead) continue;
				const y = hitY - dt / lookAhead * (hitY - 24);
				const isUp = n.kind === "up";
				const r = isUp ? 8 : 12;
				ctx.beginPath();
				if (isUp) {
					ctx.fillStyle = "#ede6da";
					ctx.moveTo(laneX, y - r);
					ctx.lineTo(laneX + r, y + r * .6);
					ctx.lineTo(laneX - r, y + r * .6);
					ctx.closePath();
					ctx.fill();
				} else {
					ctx.fillStyle = "#ff7b3a";
					ctx.arc(laneX, y, r, 0, Math.PI * 2);
					ctx.fill();
				}
				if (n.chord && Math.abs(dt) < .45) {
					ctx.fillStyle = "#ede6da";
					ctx.font = "600 13px 'Plus Jakarta Sans Variable', sans-serif";
					ctx.textAlign = "left";
					ctx.fillText(n.chord, laneX + 22, y + 4);
				}
			}
			const f = flashRef.current;
			if (f) {
				ctx.fillStyle = f === "miss" ? "rgba(196,80,64,0.28)" : f === "perfect" ? "rgba(111,191,115,0.32)" : "rgba(255,170,106,0.28)";
				ctx.fillRect(0, hitY - 28, w, 56);
			}
			raf = requestAnimationFrame(draw);
		};
		raf = requestAnimationFrame(draw);
		return () => {
			running = false;
			cancelAnimationFrame(raf);
			ro?.disconnect();
		};
	}, [
		consumedRef,
		lookAhead,
		notesRef,
		nowRef
	]);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("canvas", {
		ref: canvasRef,
		className: "h-full w-full touch-none rounded-lg"
	});
}
var WHITE_C4 = [
	60,
	62,
	64,
	65,
	67,
	69,
	71
];
function ukeShape(id) {
	const c = UKE_CHORDS[id];
	if (!c) return void 0;
	return {
		id,
		name: id,
		...c
	};
}
function playInstrumentChord(instrument, chordId, inst = instrumentById(instrument)) {
	if (instrument === "piano" || instrument === "vocals") {
		const midi = PIANO_VOICINGS[chordId];
		if (midi) pianoChord(midi.map(midiToFreq));
		else pianoTone(midiToFreq(60));
		return;
	}
	if (instrument === "ukulele") {
		const c = UKE_CHORDS[chordId];
		if (!c) return;
		const freqs = c.frets.map((f, i) => f == null ? null : inst.openFreq[i] * Math.pow(2, f / 12)).filter((f) => f != null);
		strum(freqs);
		return;
	}
	if (instrument === "bass") {
		const fret = {
			Em: 0,
			G: 3,
			C: 3,
			D: 5,
			A: 5,
			Am: 0,
			E: 0
		}[chordId] ?? 0;
		bassTone(inst.openFreq[0] * Math.pow(2, fret / 12));
		return;
	}
	const c = CHORDS[chordId];
	if (!c) return;
	const freqs = c.frets.map((f, i) => f === null ? null : fretToFreq(i, f)).filter((f) => f !== null);
	strum(freqs);
}
function SessionPlayer() {
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
	const [phase, setPhase] = (0, import_react.useState)("intro");
	const [combo, setCombo] = (0, import_react.useState)(0);
	const [flash, setFlash] = (0, import_react.useState)(null);
	const [count, setCount] = (0, import_react.useState)(4);
	const [beatN, setBeatN] = (0, import_react.useState)(1);
	const [activeString, setActiveString] = (0, import_react.useState)(null);
	const [expectedString, setExpectedString] = (0, import_react.useState)(null);
	const [liveChord, setLiveChord] = (0, import_react.useState)(item?.chords[0] ?? "");
	const [itemSummary, setItemSummary] = (0, import_react.useState)(null);
	const [modeling, setModeling] = (0, import_react.useState)(false);
	const [createPick, setCreatePick] = (0, import_react.useState)(null);
	const [listenPick, setListenPick] = (0, import_react.useState)(null);
	const notesRef = (0, import_react.useRef)([]);
	const consumed = (0, import_react.useRef)(/* @__PURE__ */ new Set());
	const startRef = (0, import_react.useRef)(0);
	const nowRef = (0, import_react.useRef)(0);
	const raf = (0, import_react.useRef)(0);
	const lastBeat = (0, import_react.useRef)(-1);
	const hitsRef = (0, import_react.useRef)(0);
	const missesRef = (0, import_react.useRef)(0);
	const modelTimers = (0, import_react.useRef)([]);
	const needsPickRef = (0, import_react.useRef)(false);
	const resetItem = (0, import_react.useCallback)(() => {
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
		consumed.current = /* @__PURE__ */ new Set();
		notesRef.current = [];
		lastBeat.current = -1;
		hitsRef.current = 0;
		missesRef.current = 0;
		nowRef.current = 0;
		for (const id of modelTimers.current) window.clearTimeout(id);
		modelTimers.current = [];
	}, [item?.chords, item?.id]);
	(0, import_react.useEffect)(() => {
		resetItem();
	}, [item?.id, resetItem]);
	const effectiveItem = (0, import_react.useMemo)(() => {
		if (!item) return null;
		if (item.process === "create" && createPick) return {
			...item,
			chords: chordsFromCreatePick(createPick, item.chords),
			createPick
		};
		return item;
	}, [createPick, item]);
	const beginPlay = (0, import_react.useCallback)(() => {
		if (!effectiveItem) return;
		unlockAudio();
		notesRef.current = buildTimeline(effectiveItem);
		consumed.current = /* @__PURE__ */ new Set();
		hitsRef.current = 0;
		missesRef.current = 0;
		nowRef.current = 0;
		const beat = 60 / effectiveItem.bpm;
		startRef.current = performance.now() + countInBeats() * beat * 1e3;
		setPhase("countin");
		setCount(4);
		setLiveChord(effectiveItem.chords[0] ?? "");
	}, [effectiveItem]);
	(0, import_react.useEffect)(() => {
		if (phase !== "countin" || !item) return;
		const beatMs = 60 / item.bpm * 1e3;
		const playAt = startRef.current;
		const origin = playAt - countInBeats() * beatMs;
		let lastN = 5;
		const loop = (t) => {
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
	const onJudge = (0, import_react.useCallback)((judge) => {
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
	}, [hit, miss]);
	const attempt = (0, import_react.useCallback)((kind, stringIndex) => {
		if (phase !== "play" || !item) return;
		const t = (performance.now() - startRef.current) / 1e3;
		const pending = notesRef.current.filter((_, i) => !consumed.current.has(i));
		const res = consumeHit(pending, t, item.windowMs ?? 230);
		const surface = item.surface ?? inst.surface;
		const needsMatch = (surface === "keys" || surface === "pads" || surface === "voice") && kind === "pluck";
		if (kind === "pluck" && stringIndex !== void 0) {
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
		if (needsMatch && res.note.string !== void 0 && stringIndex !== res.note.string) {
			onJudge("miss");
			return;
		}
		const realIndex = notesRef.current.indexOf(res.note);
		consumed.current.add(realIndex);
		if (kind !== "pluck") {
			if (res.note.chord) {
				playInstrumentChord(instrument, res.note.chord, inst);
				setLiveChord(res.note.chord);
			} else if (instrument === "drums") drumHit(stringIndex ?? 0);
			else if (instrument === "piano" || instrument === "vocals") pianoTone(midiToFreq(60));
			else if (instrument === "bass") bassTone(inst.openFreq[stringIndex ?? 0] ?? 41.2);
			else pluck(inst.openFreq[stringIndex ?? inst.openFreq.length - 1] ?? 220);
		} else if (res.note.chord) setLiveChord(res.note.chord);
		onJudge(res.judge);
	}, [
		inst,
		instrument,
		item,
		onJudge,
		phase
	]);
	(0, import_react.useEffect)(() => {
		if (phase !== "play" || !item) return;
		const loop = (t) => {
			const elapsed = (t - startRef.current) / 1e3;
			nowRef.current = elapsed;
			const beatLen = 60 / item.bpm;
			const beat = Math.floor(elapsed / beatLen);
			if (beat !== lastBeat.current && beat >= 0) {
				lastBeat.current = beat;
				click(beat % 4 === 0);
				setBeatN(beat % 4 + 1);
				const upcoming = notesRef.current.find((n, i) => !consumed.current.has(i) && n.t >= elapsed - .05);
				if (upcoming?.string !== void 0) setExpectedString(upcoming.string);
				if (upcoming?.chord) setLiveChord(upcoming.chord);
			}
			for (let i = 0; i < notesRef.current.length; i++) {
				if (consumed.current.has(i)) continue;
				if (elapsed - notesRef.current[i].t > (item.windowMs ?? 230) / 1e3) {
					consumed.current.add(i);
					onJudge("miss");
				}
			}
			const last = notesRef.current[notesRef.current.length - 1];
			if (last && elapsed > last.t + .8) {
				setItemSummary(summarizeItem(item, hitsRef.current, missesRef.current));
				setPhase("itemdone");
				return;
			}
			raf.current = requestAnimationFrame(loop);
		};
		raf.current = requestAnimationFrame(loop);
		return () => cancelAnimationFrame(raf.current);
	}, [
		item,
		onJudge,
		phase
	]);
	(0, import_react.useEffect)(() => {
		const onKey = (e) => {
			if (e.repeat) return;
			if (e.code === "Escape") {
				abortSession();
				navigate({ to: "/today" });
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
				if (surface === "keys" || surface === "voice") attempt("pluck", WHITE_C4[n - 1] ?? 60);
				else if (n <= inst.stringNames.length) attempt("pluck", n - 1);
			}
		};
		window.addEventListener("keydown", onKey);
		return () => window.removeEventListener("keydown", onKey);
	}, [
		abortSession,
		attempt,
		beginPlay,
		inst.stringNames.length,
		inst.surface,
		item?.surface,
		modeling,
		navigate,
		phase
	]);
	const goNext = (0, import_react.useCallback)(() => {
		finishItem();
		const s = useSpark.getState().session;
		if (!s || isSessionDone(s)) {
			finishDay();
			navigate({ to: "/results" });
		} else resetItem();
	}, [
		finishDay,
		finishItem,
		navigate,
		resetItem
	]);
	const skipThis = (0, import_react.useCallback)(() => {
		setCombo(0);
		skipCurrent();
		const s = useSpark.getState().session;
		if (!s || isSessionDone(s)) {
			finishDay();
			navigate({ to: "/results" });
		} else resetItem();
	}, [
		finishDay,
		navigate,
		resetItem,
		skipCurrent
	]);
	const leave = (0, import_react.useCallback)(() => {
		abortSession();
		navigate({ to: "/today" });
	}, [abortSession, navigate]);
	const playModelEvent = (0, import_react.useCallback)((note) => {
		if (note.kind === "pluck" && note.string !== void 0) {
			if (instrument === "drums") drumHit(note.string);
			else if (instrument === "piano" || instrument === "vocals") pianoTone(midiToFreq(note.string));
			else if (instrument === "bass") bassTone(inst.openFreq[note.string] ?? 41.2);
			else pluck(inst.openFreq[note.string] ?? OPEN_FREQ[note.string] ?? 110);
			if (note.chord) setLiveChord(note.chord);
			return;
		}
		if (note.chord) playInstrumentChord(instrument, note.chord, inst);
		else click(note.beat === 0);
	}, [inst, instrument]);
	const hearOnce = (0, import_react.useCallback)(() => {
		const src = effectiveItem ?? item;
		if (!src || modeling) return;
		unlockAudio();
		for (const id of modelTimers.current) window.clearTimeout(id);
		modelTimers.current = [];
		const notes = buildTimeline(src);
		const beat = 60 / src.bpm;
		const windowSec = beat * 4;
		setModeling(true);
		for (let b = 0; b < 4; b++) modelTimers.current.push(window.setTimeout(() => click(b === 0), b * beat * 1e3));
		for (const note of notes) {
			if (note.t >= windowSec - .01) break;
			modelTimers.current.push(window.setTimeout(() => playModelEvent(note), note.t * 1e3));
		}
		modelTimers.current.push(window.setTimeout(() => setModeling(false), windowSec * 1e3 + 160));
	}, [
		effectiveItem,
		item,
		modeling,
		playModelEvent
	]);
	const playListen = (0, import_react.useCallback)((side) => {
		if (!item?.listenPrompt) return;
		unlockAudio();
		const token = item.listenPrompt[side];
		if (instrument === "drums") {
			const beat = 60 / item.bpm;
			for (let b = 0; b < 4; b++) {
				const pad = token === "backbeat" ? b % 2 === 0 ? 0 : 1 : b === 0 ? 0 : -1;
				window.setTimeout(() => {
					click(b === 0);
					if (pad >= 0) drumHit(pad);
				}, b * beat * 1e3);
			}
			return;
		}
		playInstrumentChord(instrument, token, inst);
	}, [
		inst,
		instrument,
		item
	]);
	(0, import_react.useEffect)(() => {
		if (phase !== "itemdone") return;
		const id = window.setTimeout(() => goNext(), AUTO_ADVANCE_MS);
		return () => window.clearTimeout(id);
	}, [goNext, phase]);
	if (!session || !item) return null;
	const isWarm = (item.type === "warmup" || item.type === "skill") && item.process !== "respond" && item.process !== "create";
	const surface = item.surface ?? inst.surface;
	const useHighway = surface === "strings" && !isWarm;
	const chordPcs = liveChord && PIANO_VOICINGS[liveChord] ? PIANO_VOICINGS[liveChord].map((m) => m % 12) : [];
	const lastItem = session.index + 1 >= session.plan.items.length;
	const uke = instrument === "ukulele" ? ukeShape(liveChord || item.chords[0] || "C") : void 0;
	const needsPick = item.process === "create" && item.createOptions && item.createOptions.length >= 2 && !createPick || item.process === "respond" && item.listenPrompt && !listenPick;
	const listenRight = listenPick && item.listenPrompt ? listenPick === item.listenPrompt.answer : null;
	const pieceLine = whyThisPiece(item);
	needsPickRef.current = Boolean(needsPick);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "flex min-h-dvh flex-col bg-bg",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("header", {
			className: "flex items-center gap-3 px-4 py-3",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
					variant: "ghost",
					size: "icon",
					"aria-label": "Leave session",
					onClick: leave,
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ChevronLeft, { className: "size-5" })
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "min-w-0 flex-1",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
						className: "text-[11px] uppercase tracking-[0.18em] text-dim",
						children: [
							inst.name,
							" · ",
							session.index + 1,
							" / ",
							session.plan.items.length,
							item.repertoire ? ` · ${item.repertoire}` : ""
						]
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
						className: "truncate font-display text-lg font-semibold",
						children: item.title
					})]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "tabular text-right text-sm text-muted",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: cn("text-ember", isComboGate(combo) && "combo-pop"),
						children: [
							combo,
							" ",
							comboCue(combo)
						]
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [
						session.itemHits,
						" hit · ",
						session.itemMisses,
						" miss"
					] })]
				})
			]
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "flex-1 px-4 pb-5",
			children: [
				phase === "intro" ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "mx-auto flex max-w-md flex-col items-center gap-4 pt-4",
					children: [
						instrument === "piano" || instrument === "vocals" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(PianoKeyboard, {
							activeMidi: null,
							chordPcs: chordPcs.length ? chordPcs : [0],
							onPlay: () => void 0,
							disabled: true
						}) : instrument === "drums" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(DrumPads, {
							active: null,
							onHit: () => void 0,
							disabled: true
						}) : item.chords[0] && instrument === "ukulele" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ChordDiagram, { shape: uke }) : item.chords[0] && instrument === "guitar" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ChordDiagram, { chordId: item.chords[0] }) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(StringRack, {
							active: null,
							names: inst.stringNames,
							onPluck: () => void 0,
							disabled: true
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(RoleTag, {
							role: item.role,
							process: item.process
						}),
						pieceLine ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "text-center text-sm text-muted",
							children: pieceLine
						}) : null,
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(CriteriaList, { items: item.criteria?.length ? item.criteria : item.objectives?.length ? item.objectives : [item.subtitle] }),
						!item.criteria?.length ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "text-center text-sm text-dim",
							children: successLine(item)
						}) : null,
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(RhythmRead, { pattern: item.pattern }),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(HarmonyRead, { symbols: item.analysis }),
						item.process === "create" && item.createOptions ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "grid w-full grid-cols-2 gap-2",
							children: item.createOptions.map((opt) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
								variant: createPick === opt ? "primary" : "secondary",
								className: "h-12",
								onClick: () => setCreatePick(opt),
								children: opt
							}, opt))
						}) : null,
						item.process === "respond" && item.listenPrompt ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "flex w-full flex-col gap-2",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
									className: "text-center text-sm text-muted",
									children: item.listenPrompt.ask
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "grid grid-cols-2 gap-2",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
										variant: "secondary",
										onClick: () => playListen("a"),
										disabled: modeling,
										children: "Hear A"
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
										variant: "secondary",
										onClick: () => playListen("b"),
										disabled: modeling,
										children: "Hear B"
									})]
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "grid grid-cols-2 gap-2",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
										variant: listenPick === "same" ? "primary" : "secondary",
										onClick: () => setListenPick("same"),
										children: "Same"
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
										variant: listenPick === "different" ? "primary" : "secondary",
										onClick: () => setListenPick("different"),
										children: "Different"
									})]
								}),
								listenRight == null ? null : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
									className: "text-center text-sm text-muted",
									children: listenRight ? "That's the difference." : "They're different. Still counts."
								})
							]
						}) : null,
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
							size: "xl",
							className: "w-full",
							onClick: beginPlay,
							disabled: modeling || Boolean(needsPick),
							children: "Count me in"
						}),
						item.process === "respond" ? null : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
							variant: "secondary",
							className: "w-full",
							onClick: hearOnce,
							disabled: modeling,
							children: modeling ? "Listening" : "Hear it once"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
							variant: "ghost",
							className: "w-full",
							onClick: skipThis,
							children: "Skip this one"
						})
					]
				}) : null,
				phase === "countin" ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex h-[50vh] flex-col items-center justify-center gap-3",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "count-pop font-display text-7xl font-semibold tabular text-accent",
						children: count
					}, count), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
						className: "text-sm uppercase tracking-[0.2em] text-dim",
						children: [item.bpm, " bpm"]
					})]
				}) : null,
				phase === "play" ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "mx-auto flex max-w-lg flex-col gap-4",
					children: [
						item.chords.length && surface !== "pads" ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "flex flex-col items-center gap-3",
							children: [
								instrument === "guitar" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ChordDiagram, {
									chordId: liveChord || item.chords[0],
									compact: true
								}) : null,
								instrument === "ukulele" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ChordDiagram, {
									shape: uke,
									compact: true
								}) : null,
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
									className: "flex flex-wrap justify-center gap-2 text-sm",
									children: item.chords.map((c) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
										className: cn("rounded-sm px-2 py-1 tabular", c === liveChord ? "bg-accent text-accent-fg" : "text-muted"),
										children: c
									}, c))
								})
							]
						}) : null,
						surface === "keys" || surface === "voice" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(PianoKeyboard, {
							activeMidi: activeString,
							expectedMidi: expectedString,
							chordPcs: chordPcs.length ? chordPcs : surface === "voice" ? [0] : [],
							onPlay: (midi) => attempt("pluck", midi)
						}) : null,
						surface === "voice" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(PitchMatch, {
							targetFreq: midiToFreq(60),
							targetName: "C4"
						}) : null,
						surface === "pads" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(DrumPads, {
							active: activeString,
							expected: expectedString,
							onHit: (i) => attempt("pluck", i)
						}) : null,
						surface === "strings" && isWarm ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(StringRack, {
							names: inst.stringNames,
							active: activeString,
							expected: expectedString,
							onPluck: (i) => attempt("pluck", i)
						}) : null,
						useHighway ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "h-64 overflow-hidden rounded-lg border border-border bg-raised",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(RhythmHighway, {
								notesRef,
								consumedRef: consumed,
								nowRef,
								lookAhead: 1.8,
								flash
							})
						}) : null,
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
							className: "text-center font-display text-sm tabular text-dim",
							children: ["beat ", beatN]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "text-center text-sm text-muted",
							children: item.interpret ?? coachCue(item)
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "text-center text-sm text-dim",
							children: patternInWords(item.pattern)
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
							size: "xl",
							variant: "strum",
							className: "w-full touch-none",
							onPointerDown: (e) => {
								e.preventDefault();
								attempt("strum");
							},
							children: surface === "pads" ? "Hit" : surface === "keys" ? "Play" : surface === "voice" ? "Match" : instrument === "bass" ? "Pluck" : "Strum"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: cn("text-center font-display text-sm uppercase tracking-[0.2em]", flash === "perfect" ? "text-good" : flash === "miss" ? "text-bad" : "text-muted"),
							children: flash ?? "play on the beat"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "text-center text-xs text-dim",
							children: howYouPlay(item)
						})
					]
				}) : null,
				phase === "itemdone" ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "mx-auto flex max-w-md flex-col items-center gap-5 pt-10 text-center",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
							className: "text-[11px] uppercase tracking-[0.2em] text-dim",
							children: [
								session.index + 1,
								" / ",
								session.plan.items.length
							]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "font-display text-4xl font-semibold",
							children: itemCloseCopy(itemSummary?.stars ?? 0, lastItem)
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
							className: "tabular text-muted",
							children: [
								itemSummary?.stars ?? 0,
								"★ · ",
								Math.round((itemSummary?.accuracy ?? 0) * 100),
								"% · +",
								itemSummary?.xp ?? 0,
								" xp"
							]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "text-pretty text-sm text-muted",
							children: refineLine(item, itemSummary?.stars ?? 0)
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
							size: "lg",
							className: "w-full",
							onClick: goNext,
							children: lastItem ? "See today" : "Next"
						})
					]
				}) : null
			]
		})]
	});
}
function PracticePage() {
	if (!useSpark((s) => s.session)) return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "flex min-h-dvh flex-col items-center justify-center gap-4 bg-bg px-5",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
			className: "text-muted",
			children: "The loop is on Today."
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
			asChild: true,
			children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
				to: "/today",
				children: "Back to today"
			})
		})]
	});
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SessionPlayer, {});
}
//#endregion
export { PracticePage as component };
