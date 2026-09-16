import { i as __toESM } from "../_runtime.mjs";
import { n as require_react } from "../_libs/@radix-ui/react-compose-refs+[...].mjs";
import { B as require_jsx_runtime, b as useSearch, y as useNavigate } from "../_libs/@tanstack/react-router+[...].mjs";
import { t as Button } from "./button-DYd0ZC_F.mjs";
import { a as drumHit, c as kick, d as pianoHold, f as pianoTone, g as unlockAudio, h as strumUp, m as strum, n as bassTone, o as ghostNote, p as pluck, r as click, t as bassLegato, u as pianoChord } from "./audio-DIq8nkMh.mjs";
import { t as ChordDiagram } from "./chord-diagram-C6Re10Bn.mjs";
import { t as DrumPads } from "./drum-pads-BH58tIUq.mjs";
import { t as PianoKeyboard } from "./piano-keyboard-hXDcveFZ.mjs";
import { t as PitchMatch } from "./tuner-panel-BbNOOGJL.mjs";
import { n as Repeat, r as Play } from "../_libs/lucide-react.mjs";
import { t as AppShell } from "./app-shell-Cn6Z2zyU.mjs";
import { F as OPEN_FREQ, I as PIANO_VOICINGS, N as CHORDS$2, St as useSpark, U as cn, lt as midiToFreq, tt as instrumentById, z as UKE_CHORDS } from "./router-_2DnnNcg.mjs";
import { n as Route$3 } from "./router-_2DnnNcg2.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/techniques-Dw9x3_eU.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
var BASS_STRINGS = [
	"E",
	"A",
	"D",
	"G"
];
var BASS_OPEN_PC = [
	4,
	9,
	2,
	7
];
var BASS_OPEN_FREQ = [
	41.2,
	55,
	73.42,
	98
];
var BASS_CHORDS = [
	"Em",
	"G",
	"C",
	"D",
	"A",
	"Am"
];
var PC_NAMES = [
	"C",
	"C#",
	"D",
	"D#",
	"E",
	"F",
	"F#",
	"G",
	"G#",
	"A",
	"A#",
	"B"
];
var HAND_TABS = [
	{
		id: "alt",
		label: "Alt"
	},
	{
		id: "ghost",
		label: "Ghost"
	},
	{
		id: "thumb",
		label: "Thumb"
	},
	{
		id: "rake",
		label: "Rake"
	},
	{
		id: "double",
		label: "Double"
	}
];
var LINE_TABS = [
	{
		id: "roots",
		label: "Root"
	},
	{
		id: "fifth",
		label: "5th"
	},
	{
		id: "octave",
		label: "8ve"
	},
	{
		id: "walk",
		label: "Walk"
	},
	{
		id: "hammer",
		label: "Hammer"
	}
];
var TABS$5 = [...HAND_TABS, ...LINE_TABS];
var TAB_IDS = new Set(TABS$5.map((t) => t.id));
function parseTechTab(raw) {
	if (raw === "pluck") return "alt";
	if (typeof raw === "string" && TAB_IDS.has(raw)) return raw;
	return "alt";
}
function parseBassChord(raw) {
	if (typeof raw === "string" && BASS_CHORDS.includes(raw)) return raw;
	return "Em";
}
function bassNoteName(stringIndex, fret) {
	return PC_NAMES[((BASS_OPEN_PC[stringIndex] ?? 4) + fret) % 12] ?? "?";
}
function bassFreq(stringIndex, fret) {
	return (BASS_OPEN_FREQ[stringIndex] ?? 41.2) * Math.pow(2, fret / 12);
}
function posOf(stringIndex, fret, role = "R") {
	const s = Math.max(0, Math.min(3, stringIndex));
	const f = Math.max(0, Math.min(7, fret));
	return {
		string: s,
		fret: f,
		name: bassNoteName(s, f),
		role
	};
}
/** Lowest root for a named chord on E or A. */
var BASS_ROOTS = {
	Em: posOf(0, 0, "R"),
	G: posOf(0, 3, "R"),
	C: posOf(1, 3, "R"),
	D: posOf(1, 5, "R"),
	A: posOf(1, 0, "R"),
	Am: posOf(1, 0, "R")
};
/** Next string, two frets up — the box fifth. */
function fifthOf(root) {
	return posOf(root.string + 1, root.fret + 2, "5");
}
/** Skip a string, two frets up — the octave punch. */
function octaveOf(root) {
	return posOf(root.string + 2, root.fret + 2, "8");
}
function hammerOf(root) {
	return posOf(root.string, root.fret + 2, "hm");
}
var IM = [
	"i",
	"m",
	"i",
	"m",
	"i",
	"m",
	"i",
	"m"
];
function lineFor(tab, chord) {
	const root = BASS_ROOTS[chord];
	if (tab === "alt") return Array.from({ length: 8 }, (_, i) => ({
		pos: root,
		beat: i,
		finger: IM[i]
	}));
	if (tab === "ghost") return Array.from({ length: 8 }, (_, i) => ({
		pos: i % 2 === 1 ? {
			...root,
			role: "gh"
		} : root,
		beat: i,
		ghost: i % 2 === 1,
		finger: IM[i]
	}));
	if (tab === "thumb") {
		const fifth = fifthOf(root);
		const oct = octaveOf(root);
		const cycle = [
			{
				pos: root,
				finger: "p"
			},
			{
				pos: fifth,
				finger: "i"
			},
			{
				pos: root,
				finger: "p"
			},
			{
				pos: oct,
				finger: "m"
			}
		];
		return Array.from({ length: 8 }, (_, i) => ({
			...cycle[i % 4],
			beat: i
		}));
	}
	if (tab === "rake") {
		const mute = posOf(root.string + 1, root.fret, "gh");
		return Array.from({ length: 8 }, (_, i) => i % 2 === 0 ? {
			pos: root,
			beat: i,
			rake: true,
			together: mute,
			finger: "i"
		} : {
			pos: root,
			beat: i,
			finger: "m"
		});
	}
	if (tab === "double") {
		const fifth = fifthOf(root);
		return Array.from({ length: 8 }, (_, i) => ({
			pos: root,
			beat: i,
			together: fifth,
			finger: i % 2 === 0 ? "p" : "i"
		}));
	}
	if (tab === "hammer") {
		const hm = hammerOf(root);
		const out = [];
		for (let i = 0; i < 4; i++) {
			out.push({
				pos: root,
				beat: i * 2,
				finger: IM[i]
			});
			out.push({
				pos: hm,
				beat: i * 2 + 1,
				hammer: true,
				finger: IM[i]
			});
		}
		return out;
	}
	if (tab === "roots") return Array.from({ length: 8 }, (_, i) => ({
		pos: root,
		beat: i,
		finger: IM[i]
	}));
	if (tab === "fifth") {
		const fifth = fifthOf(root);
		return Array.from({ length: 8 }, (_, i) => ({
			pos: i % 2 === 0 ? root : fifth,
			beat: i,
			finger: IM[i]
		}));
	}
	if (tab === "octave") {
		const oct = octaveOf(root);
		return Array.from({ length: 8 }, (_, i) => ({
			pos: i % 2 === 0 ? root : oct,
			beat: i,
			finger: IM[i]
		}));
	}
	return walkLine(chord);
}
/** Approach the next chord from below. Em→G and G→C are the two doors. */
function walkLine(chord) {
	const fingers = [
		"i",
		"m",
		"i",
		"m",
		"i",
		"m",
		"i",
		"m"
	];
	if (chord === "G" || chord === "C") return [
		posOf(0, 3, "R"),
		posOf(0, 5, "ap"),
		posOf(1, 0, "ap"),
		posOf(1, 2, "ap"),
		posOf(1, 3, "R"),
		posOf(1, 3, "R"),
		posOf(1, 3, "R"),
		posOf(1, 3, "R")
	].map((pos, i) => ({
		pos,
		beat: i,
		finger: fingers[i]
	}));
	return [
		posOf(0, 0, "R"),
		posOf(0, 0, "R"),
		posOf(0, 2, "ap"),
		posOf(0, 3, "R"),
		posOf(0, 3, "R"),
		posOf(0, 3, "R"),
		posOf(0, 3, "R"),
		posOf(0, 3, "R")
	].map((pos, i) => ({
		pos,
		beat: i,
		finger: fingers[i]
	}));
}
var TECH_COPY = {
	alt: {
		kicker: "i–m",
		title: "Never the same finger twice",
		body: "Index, middle, index, middle. One string. The stroke that just played is already coming back. If both fingers land as one blob, slow down until you hear two attacks.",
		hear: "i m i m on one pitch. The drone is cheap. The hand is the work."
	},
	ghost: {
		kicker: "Dead stroke",
		title: "Keep the motion. Kill the pitch.",
		body: "Mute with the left hand, pluck anyway. The click is a drum. Funk, reggae, every busy line that isn’t actually busy — ghosts in the holes.",
		hear: "Tone, chuck, tone, chuck. The chuck is the groove."
	},
	thumb: {
		kicker: "p–i–m",
		title: "Thumb owns the root string",
		body: "Plant the thumb on the root. Index takes the fifth (next string, two up). Middle takes the octave (skip a string, two up). Three strings, three fingers. Nobody crosses.",
		hear: "p on the root, i on the fifth, m on the octave."
	},
	rake: {
		kicker: "One finger, two strings",
		title: "Drag into the note",
		body: "Start on the string above, muted, and land on the target in one motion. The extra click is a grace. Don’t pluck twice — fall once.",
		hear: "A muted scrape, then the root. Same finger."
	},
	double: {
		kicker: "Two at once",
		title: "Root and fifth, one attack",
		body: "Thumb on the low string, index on the next. It’s a power chord with no strum. If you hear a flam, the fingers aren’t together.",
		hear: "Two pitches, one hit."
	},
	hammer: {
		kicker: "Left hand finish",
		title: "Pluck once. The next note is free.",
		body: "Sound the first note, then hammer a finger onto a higher fret. No right hand on the second. The arrival should be as loud as the pluck — that’s the work.",
		hear: "A pluck, then a hammer two frets up. No second attack."
	},
	roots: {
		kicker: "The job",
		title: "Name it. Play the lowest one.",
		body: "A bass line starts as the name of the chord, in the lowest place you can reach. Open E is Em. Third fret, E string, is G. The rest of the neck is optional.",
		hear: "One root, eight times. Fat and late is better than early and thin."
	},
	fifth: {
		kicker: "Skeleton",
		title: "Skip the third",
		body: "Root plus fifth is a power chord, played one note at a time. Next string, two frets up. No major, no minor — just the frame a whole band hangs on.",
		hear: "Root, fifth, root, fifth. Lock it to the kick."
	},
	octave: {
		kicker: "Same letter",
		title: "Twelve semitones, one shape",
		body: "Skip a string, two frets up. That’s the octave. Disco, funk, every chorus that needed to jump without changing the harmony. Same name. Higher floor.",
		hear: "Low, high, low, high. The punch is the jump."
	},
	walk: {
		kicker: "Connect",
		title: "Don’t jump. Walk.",
		body: "The notes between two roots are the sentence. From Em, F♯ is one fret below G — arrive from underneath and the G feels like home, not a guess.",
		hear: "E, E, F♯, G. Then sit on G."
	}
};
var FINGER_LABEL = {
	p: "thumb",
	i: "index",
	m: "middle"
};
var ROLE_CLASS = {
	R: "bg-accent text-accent-fg",
	"5": "bg-ember text-accent-fg",
	"8": "bg-good text-bg",
	ap: "bg-raised text-fg ring-1 ring-ember/70",
	gh: "bg-border text-muted",
	hm: "bg-warn text-bg"
};
function BassNeck({ marks, active, onPlay, disabled }) {
	const key = (s, f) => `${s}-${f}`;
	const byKey = new Map(marks.map((m) => [key(m.string, m.fret), m]));
	const activeKey = active ? key(active.string, active.fret) : null;
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: "overflow-x-auto",
		role: "grid",
		"aria-label": "Bass neck, five frets",
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "min-w-[18rem]",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "grid gap-px",
				style: { gridTemplateColumns: `1.6rem repeat(8, minmax(0, 1fr))` },
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {}),
					Array.from({ length: 8 }, (_, f) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "pb-1 text-center text-[10px] tabular text-dim",
						children: f === 0 ? "open" : f
					}, `n${f}`)),
					[...BASS_STRINGS].map((_, rev) => {
						const s = BASS_STRINGS.length - 1 - rev;
						return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Row, {
							stringIndex: s,
							byKey,
							activeKey,
							onPlay,
							disabled
						}, BASS_STRINGS[s]);
					})
				]
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "mt-1 grid gap-px",
				style: { gridTemplateColumns: `1.6rem repeat(8, minmax(0, 1fr))` },
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {}), Array.from({ length: 8 }, (_, f) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "flex h-3 items-center justify-center",
					children: f === 3 || f === 5 || f === 7 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "size-1 rounded-full bg-dim/70" }) : null
				}, `d${f}`))]
			})]
		})
	});
}
function Row({ stringIndex, byKey, activeKey, onPlay, disabled }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: "flex h-11 items-center justify-center text-[10px] font-medium text-muted",
		children: BASS_STRINGS[stringIndex]
	}), Array.from({ length: 8 }, (_, fret) => {
		const mark = byKey.get(`${stringIndex}-${fret}`);
		const on = activeKey === `${stringIndex}-${fret}`;
		return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
			type: "button",
			disabled,
			onPointerDown: (e) => {
				e.preventDefault();
				onPlay(mark ?? {
					string: stringIndex,
					fret,
					name: bassNoteName(stringIndex, fret),
					role: "R"
				});
			},
			className: cn("relative flex h-11 items-center justify-center rounded-[3px] border border-border/80", fret === 0 ? "bg-surface" : "bg-raised/60", on && "ring-1 ring-fg"),
			"aria-label": `${BASS_STRINGS[stringIndex]} string fret ${fret}${mark ? ` ${mark.name}` : ""}`,
			children: mark ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
				className: cn("flex size-7 items-center justify-center rounded-full text-[10px] font-semibold leading-none", ROLE_CLASS[mark.role]),
				children: mark.role === "gh" ? "x" : mark.role === "hm" ? "h" : mark.name
			}) : null
		}, fret);
	})] });
}
function RoleLegend({ className, roles }) {
	const items = [
		{
			role: "R",
			label: "Root"
		},
		{
			role: "5",
			label: "5th"
		},
		{
			role: "8",
			label: "Octave"
		},
		{
			role: "ap",
			label: "Approach"
		},
		{
			role: "hm",
			label: "Hammer"
		},
		{
			role: "gh",
			label: "Ghost"
		}
	];
	const shown = roles ? items.filter((it) => roles.includes(it.role)) : items.slice(0, 4);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
		className: cn("flex flex-wrap gap-3 text-[11px] text-muted", className),
		children: shown.map((it) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", {
			className: "flex items-center gap-1.5",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: cn("size-2.5 rounded-full", ROLE_CLASS[it.role]) }), it.label]
		}, it.role))
	});
}
function TabRow({ tabs, active, onPick, cols = 5 }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: cn("grid gap-0.5", cols === 4 ? "grid-cols-4" : "grid-cols-5"),
		children: tabs.map((t) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
			type: "button",
			onClick: () => onPick(t.id),
			className: cn("h-11 rounded-md text-sm font-medium transition-colors duration-(--motion-quick)", active === t.id ? "bg-accent text-accent-fg" : "text-muted hover:text-fg"),
			children: t.label
		}, t.id))
	});
}
function Chip({ active, onClick, children }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
		type: "button",
		onClick,
		className: cn("h-11 min-w-11 rounded-md px-3 text-sm font-medium transition-colors duration-(--motion-quick)", active ? "bg-accent text-accent-fg" : "border border-border bg-raised text-fg hover:border-ember/50"),
		children
	});
}
function BeatStrip({ cells, cursorBeat }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
		className: "mt-5",
		"aria-label": "Eight-beat line",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
			className: "mb-2 text-[11px] uppercase tracking-[0.18em] text-dim",
			children: "Line"
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("ol", {
			className: "grid grid-cols-8 gap-1",
			children: cells.slice(0, 8).map((c, i) => {
				const on = cursorBeat != null && Math.floor(cursorBeat) === c.beat;
				return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", {
					className: cn("flex h-16 flex-col items-center justify-center rounded-md border", on ? "border-accent bg-accent text-accent-fg" : "border-border bg-raised text-muted"),
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						className: "font-display text-sm font-semibold leading-none",
						children: c.top
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						className: "mt-1 text-[11px] tabular leading-none",
						children: c.bot
					})]
				}, `${c.beat}-${i}`);
			})
		})]
	});
}
function usePlayhead() {
	const [beatN, setBeatN] = (0, import_react.useState)(null);
	const [cursorBeat, setCursorBeat] = (0, import_react.useState)(null);
	const [mark, setMark] = (0, import_react.useState)(null);
	const [lockKick, setLockKick] = (0, import_react.useState)(true);
	const timers = (0, import_react.useRef)([]);
	(0, import_react.useEffect)(() => {
		return () => {
			timers.current.forEach((id) => window.clearTimeout(id));
			timers.current = [];
		};
	}, []);
	const clear = () => {
		timers.current.forEach((id) => window.clearTimeout(id));
		timers.current = [];
		setBeatN(null);
		setCursorBeat(null);
		setMark(null);
	};
	const play = (hits, bpm, extraKick) => {
		clear();
		const ac = unlockAudio();
		const beat = 60 / bpm;
		const origin = ac.currentTime;
		const kicked = /* @__PURE__ */ new Set();
		const clicked = /* @__PURE__ */ new Set();
		hits.forEach((ev) => {
			const when = origin + ev.beat * beat;
			ev.sound(when);
			const isInt = ev.beat === Math.floor(ev.beat);
			if (extraKick && lockKick && isInt && ev.beat % 2 === 0 && !kicked.has(ev.beat)) {
				kicked.add(ev.beat);
				kick(when);
			}
			if (lockKick && isInt && !clicked.has(ev.beat)) {
				clicked.add(ev.beat);
				click(ev.beat % 4 === 0, when);
			}
			const delay = Math.max(0, (when - ac.currentTime) * 1e3);
			const id = window.setTimeout(() => {
				setCursorBeat(ev.beat);
				setBeatN(Math.floor(ev.beat) % 4 + 1);
				setMark(ev.mark ?? null);
			}, delay);
			timers.current.push(id);
		});
		const last = hits[hits.length - 1]?.beat ?? 8;
		timers.current.push(window.setTimeout(() => {
			setBeatN(null);
			setCursorBeat(null);
			setMark(null);
		}, (last + 1) * beat * 1e3 + 200));
	};
	return {
		beatN,
		cursorBeat,
		mark,
		setMark,
		lockKick,
		setLockKick,
		play,
		clear
	};
}
function PlayBar({ onPlay, lockKick, onToggleKick, kickLabel = "Kick", beatN }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "mt-5",
		children: [beatN ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
			className: "mb-3 font-display text-sm tabular text-dim",
			children: ["beat ", beatN]
		}) : null, /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "flex gap-2",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
				onClick: onPlay,
				className: "flex-1",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Play, { className: "size-4" }), "Play the line"]
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
				variant: "secondary",
				onClick: onToggleKick,
				className: cn("px-4", lockKick && "border-accent text-accent"),
				"aria-pressed": lockKick,
				children: kickLabel
			})]
		})]
	});
}
function LabCopy({ kicker, title, body, hear, children }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
		className: "mt-5 rounded-xl border border-border bg-surface p-5",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "text-[11px] uppercase tracking-[0.18em] text-dim",
				children: kicker
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
				className: "mt-1 font-display text-3xl font-semibold tracking-tight",
				children: title
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "mt-3 text-pretty text-sm leading-relaxed text-muted",
				children: body
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "mt-2 text-sm text-fg",
				children: hear
			}),
			children
		]
	});
}
var TABS$4 = [
	{
		id: "kick",
		label: "Kick"
	},
	{
		id: "backbeat",
		label: "2 + 4"
	},
	{
		id: "hats",
		label: "Hats"
	},
	{
		id: "four",
		label: "Four"
	},
	{
		id: "fill",
		label: "Fill"
	}
];
var COPY$4 = {
	kick: {
		kicker: "The floor",
		title: "One is the whole song",
		body: "The kick names beat one. Everything else leans on it. Play it late rather than early — a rushed kick makes the band sound nervous.",
		hear: "Kick on one and three. Leave the rest empty."
	},
	backbeat: {
		kicker: "The clap",
		title: "Snare on two and four",
		body: "That’s the backbeat. Kick holds one and three. Snare answers. If the snare is early, the groove leans forward. Sit on the back of two.",
		hear: "Kick, snare, kick, snare. The snare is the handclap."
	},
	hats: {
		kicker: "The clock",
		title: "Hats keep time so you don’t have to",
		body: "Closed hat on every eighth. Kick and snare sit inside that grid. The hat is quieter than both — if it yells, the groove disappears.",
		hear: "Tick-tick-tick-tick, with the backbeat still in the middle."
	},
	four: {
		kicker: "Four on the floor",
		title: "Kick every beat. Don’t get fancy.",
		body: "Disco, house, every chorus that needed the floor to move. Snare still on two and four. The kick is a four-letter word: just, even, fat, late.",
		hear: "Four kicks. Two snares. Hats if you can spare a hand."
	},
	fill: {
		kicker: "The comma",
		title: "A fill is a breath, not a solo",
		body: "Toms walk you from the end of a phrase back into one. Count it. Land on the kick of the next bar, not in the middle of a thought.",
		hear: "Kick, snare, tom, tom — then you’re home."
	}
};
var NAMES = [
	"K",
	"S",
	"H",
	"T"
];
function parseTab$4(raw) {
	if (raw === "kick" || raw === "backbeat" || raw === "hats" || raw === "four" || raw === "fill") return raw;
	return "kick";
}
function pattern(tab) {
	if (tab === "kick") return [0, 4].map((b) => ({
		beat: b,
		pad: 0
	}));
	if (tab === "backbeat") return [
		{
			beat: 0,
			pad: 0
		},
		{
			beat: 2,
			pad: 1
		},
		{
			beat: 4,
			pad: 0
		},
		{
			beat: 6,
			pad: 1
		}
	];
	if (tab === "hats") {
		const out = [];
		for (let b = 0; b < 8; b++) {
			out.push({
				beat: b,
				pad: 2
			});
			if (b === 0 || b === 4) out.push({
				beat: b,
				pad: 0
			});
			if (b === 2 || b === 6) out.push({
				beat: b,
				pad: 1
			});
		}
		return out;
	}
	if (tab === "four") {
		const out = [];
		for (let b = 0; b < 8; b++) {
			if (b % 2 === 0) out.push({
				beat: b,
				pad: 0
			});
			if (b === 2 || b === 6) out.push({
				beat: b,
				pad: 1
			});
			out.push({
				beat: b,
				pad: 2
			});
		}
		return out;
	}
	return [
		{
			beat: 0,
			pad: 0
		},
		{
			beat: 2,
			pad: 1
		},
		{
			beat: 4,
			pad: 3
		},
		{
			beat: 5,
			pad: 3
		},
		{
			beat: 6,
			pad: 1
		},
		{
			beat: 7,
			pad: 2
		}
	];
}
function cells(tab) {
	const hits = pattern(tab);
	return Array.from({ length: 8 }, (_, beat) => {
		const here = hits.filter((h) => h.beat === beat);
		if (!here.length) return {
			beat,
			top: "·",
			bot: "·"
		};
		const main = here.find((h) => h.pad !== 2) ?? here[0];
		return {
			beat,
			top: NAMES[main.pad] ?? "·",
			bot: here.length > 1 ? "+" : NAMES[main.pad] ?? "·"
		};
	});
}
function DrumsLab() {
	const search = useSearch({ from: "/techniques" });
	const navigate = useNavigate({ from: "/techniques" });
	const tab = parseTab$4(search.tab);
	const hits = pattern(tab);
	const copy = COPY$4[tab];
	const head = usePlayhead();
	const patch = (next) => {
		navigate({
			search: {
				tab: next,
				chord: ""
			},
			replace: true
		});
		head.clear();
	};
	const play = () => {
		unlockAudio();
		const line = hits.map((h) => ({
			beat: h.beat,
			mark: h.pad,
			sound: (when) => drumHit(h.pad, when)
		}));
		head.play(line, 92, false);
	};
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(AppShell, { children: [
		/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("header", {
			className: "px-5 pb-2 pt-8",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "text-[11px] uppercase tracking-[0.22em] text-dim",
					children: "Drums lab · Kit"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
					className: "mt-2 font-display text-4xl font-semibold tracking-tight",
					children: "Groove"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "mt-3 max-w-sm text-pretty text-muted",
					children: "Kick names one. Snare answers. Hats are the clock."
				})
			]
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: "sticky top-0 z-10 mx-4 mt-4 rounded-lg border border-border bg-surface/95 p-2 backdrop-blur-sm",
			children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(TabRow, {
				tabs: TABS$4,
				active: tab,
				onPick: patch
			})
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "px-5 pb-8 pt-5",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(LabCopy, {
					...copy,
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(PlayBar, {
						onPlay: play,
						lockKick: head.lockKick,
						onToggleKick: () => head.setLockKick((v) => !v),
						kickLabel: "Click",
						beatN: head.beatN
					})
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(BeatStrip, {
					cells: cells(tab),
					cursorBeat: head.cursorBeat
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
					className: "mt-6",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "mb-2 text-[11px] uppercase tracking-[0.18em] text-dim",
						children: "Pads"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(DrumPads, {
						active: head.mark,
						expected: head.mark,
						onHit: (i) => drumHit(i)
					})]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "mt-5 text-pretty text-sm text-muted",
					children: "Tap a pad yourself. Then play the line and match it."
				})
			]
		})
	] });
}
var GCHORDS = [
	"Em",
	"G",
	"C",
	"D"
];
var TABS$3 = [
	{
		id: "down",
		label: "Down"
	},
	{
		id: "up",
		label: "Down-up"
	},
	{
		id: "chuck",
		label: "Chuck"
	},
	{
		id: "hammer",
		label: "Hammer"
	},
	{
		id: "travis",
		label: "Travis"
	}
];
var COPY$3 = {
	down: {
		kicker: "The stroke",
		title: "Wrist. Not the elbow.",
		body: "A downstroke is a small rotation. If your forearm is doing the work, you’re late and you’re loud. Six strings, one motion, on the beat.",
		hear: "Eight downs on one chord."
	},
	up: {
		kicker: "The return",
		title: "The hand never stops",
		body: "Down, up, down, up. The missed strings on the way up are part of the sound. Keep the pendulum even when you skip a stroke.",
		hear: "D U D U. The up is lighter."
	},
	chuck: {
		kicker: "Mute",
		title: "The left hand is a snare",
		body: "Strum, then flatten the fingers across the strings. Funk, reggae, every tight rhythm guitar part — the chuck is the drum inside the chord.",
		hear: "Chord, chuck, chord, chuck."
	},
	hammer: {
		kicker: "Left hand finish",
		title: "Pluck once. The next note is free.",
		body: "Open G string, then hammer the second fret. No right hand on the second attack. If you hear a pick click, you cheated.",
		hear: "G, then A, no second pick."
	},
	travis: {
		kicker: "Thumb drone",
		title: "Thumb on the bass. Fingers on the rest.",
		body: "Thumb alternates the two lowest strings. Index and middle fill the high strings between. The bass never stops. That’s the whole folk engine.",
		hear: "Bass, treble, bass, treble."
	}
};
function parseTab$3(raw) {
	if (raw === "down" || raw === "up" || raw === "chuck" || raw === "hammer" || raw === "travis") return raw;
	return "down";
}
function parseChord$2(raw) {
	if (GCHORDS.includes(raw)) return raw;
	return "Em";
}
function freqs$1(id) {
	const c = CHORDS$2[id];
	if (!c) return [...OPEN_FREQ];
	return c.frets.map((f, i) => f == null ? null : OPEN_FREQ[i] * Math.pow(2, f / 12)).filter((f) => f != null);
}
function GuitarLab() {
	const search = useSearch({ from: "/techniques" });
	const navigate = useNavigate({ from: "/techniques" });
	const tab = parseTab$3(search.tab);
	const chord = parseChord$2(search.chord);
	const copy = COPY$3[tab];
	const head = usePlayhead();
	const f = freqs$1(chord);
	const patch = (next) => {
		navigate({
			search: {
				tab: next.tab ?? tab,
				chord: next.chord ?? chord
			},
			replace: true
		});
		head.clear();
	};
	const play = () => {
		unlockAudio();
		let hits = [];
		if (tab === "down") hits = Array.from({ length: 8 }, (_, i) => ({
			beat: i,
			sound: (w) => strum(f, w)
		}));
		else if (tab === "up") hits = Array.from({ length: 8 }, (_, i) => ({
			beat: i,
			sound: (w) => i % 2 === 0 ? strum(f, w) : strumUp(f, w)
		}));
		else if (tab === "chuck") hits = Array.from({ length: 8 }, (_, i) => ({
			beat: i,
			sound: (w) => i % 2 === 0 ? strum(f, w) : ghostNote(w)
		}));
		else if (tab === "hammer") hits = Array.from({ length: 4 }, (_, i) => [{
			beat: i * 2,
			sound: (w) => pluck(OPEN_FREQ[3] ?? 196, w, .4)
		}, {
			beat: i * 2 + 1,
			sound: (w) => bassLegato((OPEN_FREQ[3] ?? 196) * Math.pow(2, 2 / 12), w)
		}]).flat();
		else hits = Array.from({ length: 8 }, (_, i) => ({
			beat: i,
			sound: (w) => {
				if (i % 2 === 0) pluck(OPEN_FREQ[i % 4 === 0 ? 0 : 1] ?? 82, w, .45);
				else pluck(OPEN_FREQ[5] ?? 330, w, .3);
			}
		}));
		head.play(hits, 84, true);
	};
	const cells = Array.from({ length: 8 }, (_, beat) => {
		if (tab === "up") return {
			beat,
			top: beat % 2 === 0 ? "D" : "U",
			bot: chord
		};
		if (tab === "chuck") return {
			beat,
			top: beat % 2 === 0 ? "D" : "x",
			bot: chord
		};
		if (tab === "hammer") return {
			beat,
			top: beat % 2 === 0 ? "G" : "h",
			bot: beat % 2 === 0 ? "pick" : "A"
		};
		if (tab === "travis") return {
			beat,
			top: beat % 2 === 0 ? "p" : "i",
			bot: beat % 2 === 0 ? "bass" : "high"
		};
		return {
			beat,
			top: "D",
			bot: chord
		};
	});
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(AppShell, { children: [
		/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("header", {
			className: "px-5 pb-2 pt-8",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "text-[11px] uppercase tracking-[0.22em] text-dim",
					children: "Guitar lab · 6-string"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
					className: "mt-2 font-display text-4xl font-semibold tracking-tight",
					children: "Right hand"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "mt-3 max-w-sm text-pretty text-muted",
					children: "The chord is a shape. The groove is the stroke."
				})
			]
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: "sticky top-0 z-10 mx-4 mt-4 rounded-lg border border-border bg-surface/95 p-2 backdrop-blur-sm",
			children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(TabRow, {
				tabs: TABS$3,
				active: tab,
				onPick: (id) => patch({ tab: id })
			})
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "px-5 pb-8 pt-5",
			children: [
				tab !== "hammer" && tab !== "travis" ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "text-[11px] uppercase tracking-[0.18em] text-dim",
					children: "Chord"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "mt-2 flex flex-wrap gap-1.5",
					children: GCHORDS.map((c) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Chip, {
						active: chord === c,
						onClick: () => patch({ chord: c }),
						children: c
					}, c))
				})] }) : null,
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(LabCopy, {
					...copy,
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(PlayBar, {
						onPlay: play,
						lockKick: head.lockKick,
						onToggleKick: () => head.setLockKick((v) => !v),
						beatN: head.beatN
					})
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(BeatStrip, {
					cells,
					cursorBeat: head.cursorBeat
				}),
				tab !== "hammer" && tab !== "travis" ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
					className: "mt-6 flex flex-col items-center",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "mb-2 self-start text-[11px] uppercase tracking-[0.18em] text-dim",
						children: "Shape"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ChordDiagram, { chordId: chord })]
				}) : null
			]
		})
	] });
}
var CHORDS$1 = [
	"C",
	"G",
	"Am",
	"F"
];
var TABS$2 = [
	{
		id: "middlec",
		label: "C"
	},
	{
		id: "triad",
		label: "Triad"
	},
	{
		id: "invert",
		label: "Invert"
	},
	{
		id: "cadence",
		label: "V–I"
	},
	{
		id: "five",
		label: "5-finger"
	}
];
var COPY$2 = {
	middlec: {
		kicker: "Home key",
		title: "Two black keys. C is the left one.",
		body: "Find the pair of black keys. The white key immediately left is C. Middle C is the one near the middle of the keyboard. Everything else is measured from here.",
		hear: "Eight C’s. Same pitch. Same finger if you want."
	},
	triad: {
		kicker: "The chord",
		title: "Skip a tooth, skip a tooth",
		body: "Root, skip, third, skip, fifth. C–E–G. Play them one at a time, then together. The skip is the shape. The names come later.",
		hear: "C, E, G, then all three."
	},
	invert: {
		kicker: "Same notes, new bass",
		title: "The bottom note is the story",
		body: "Root position: C on the bottom. First inversion: E. Second: G. Same three pitches. The lowest one decides how heavy it feels.",
		hear: "C–E–G, then E–G–C, then G–C–E."
	},
	cadence: {
		kicker: "Gravity",
		title: "G wants to fall into C",
		body: "The five chord is a step above the home chord’s fifth — that’s why it pulls. Play C, then G, then C. Don’t rush the return. The return is the point.",
		hear: "Home. Away. Home."
	},
	five: {
		kicker: "The hand",
		title: "One finger per white key",
		body: "Thumb on C, pinky on G. Walk up, walk down. Don’t collapse the unused fingers. The five-finger position is how every beginner piece starts — because it’s true.",
		hear: "C D E F G, then back down."
	}
};
function parseTab$2(raw) {
	if (raw === "middlec" || raw === "triad" || raw === "invert" || raw === "cadence" || raw === "five") return raw;
	return "middlec";
}
function parseChord$1(raw) {
	if (CHORDS$1.includes(raw)) return raw;
	return "C";
}
function invert(midis, n) {
	const notes = [...midis];
	for (let i = 0; i < n; i++) {
		const x = notes.shift();
		if (x != null) notes.push(x + 12);
	}
	return notes;
}
function line(tab, chord) {
	const voicing = PIANO_VOICINGS[chord] ?? [
		60,
		64,
		67
	];
	if (tab === "middlec") return Array.from({ length: 8 }, (_, i) => ({
		beat: i,
		midis: [60],
		label: "C"
	}));
	if (tab === "triad") {
		const names = voicing.map((m) => [
			"C",
			"C#",
			"D",
			"D#",
			"E",
			"F",
			"F#",
			"G",
			"G#",
			"A",
			"A#",
			"B"
		][m % 12] ?? "?");
		return [
			{
				beat: 0,
				midis: [voicing[0]],
				label: names[0] ?? "R"
			},
			{
				beat: 1,
				midis: [voicing[1]],
				label: names[1] ?? "3"
			},
			{
				beat: 2,
				midis: [voicing[2]],
				label: names[2] ?? "5"
			},
			{
				beat: 3,
				midis: voicing,
				label: chord
			},
			{
				beat: 4,
				midis: [voicing[0]],
				label: names[0] ?? "R"
			},
			{
				beat: 5,
				midis: [voicing[1]],
				label: names[1] ?? "3"
			},
			{
				beat: 6,
				midis: [voicing[2]],
				label: names[2] ?? "5"
			},
			{
				beat: 7,
				midis: voicing,
				label: chord
			}
		];
	}
	if (tab === "invert") {
		const a = invert(voicing, 0);
		const b = invert(voicing, 1);
		const c = invert(voicing, 2);
		return [
			{
				beat: 0,
				midis: a,
				label: "R"
			},
			{
				beat: 1,
				midis: a,
				label: "R"
			},
			{
				beat: 2,
				midis: b,
				label: "1st"
			},
			{
				beat: 3,
				midis: b,
				label: "1st"
			},
			{
				beat: 4,
				midis: c,
				label: "2nd"
			},
			{
				beat: 5,
				midis: c,
				label: "2nd"
			},
			{
				beat: 6,
				midis: a,
				label: "R"
			},
			{
				beat: 7,
				midis: a,
				label: "R"
			}
		];
	}
	if (tab === "cadence") {
		const g = PIANO_VOICINGS.G ?? [
			67,
			71,
			74
		];
		return [
			{
				beat: 0,
				midis: voicing,
				label: chord
			},
			{
				beat: 1,
				midis: voicing,
				label: chord
			},
			{
				beat: 2,
				midis: g,
				label: "G"
			},
			{
				beat: 3,
				midis: g,
				label: "G"
			},
			{
				beat: 4,
				midis: voicing,
				label: chord
			},
			{
				beat: 5,
				midis: voicing,
				label: chord
			},
			{
				beat: 6,
				midis: g,
				label: "G"
			},
			{
				beat: 7,
				midis: voicing,
				label: chord
			}
		];
	}
	const scale = [
		60,
		62,
		64,
		65,
		67,
		65,
		64,
		62
	];
	const names = [
		"C",
		"D",
		"E",
		"F",
		"G",
		"F",
		"E",
		"D"
	];
	return scale.map((m, i) => ({
		beat: i,
		midis: [m],
		label: names[i] ?? "C"
	}));
}
function PianoLab() {
	const search = useSearch({ from: "/techniques" });
	const navigate = useNavigate({ from: "/techniques" });
	const tab = parseTab$2(search.tab);
	const chord = parseChord$1(search.chord);
	const events = line(tab, chord);
	const copy = COPY$2[tab];
	const head = usePlayhead();
	const activeMidi = head.mark;
	const patch = (next) => {
		navigate({
			search: {
				tab: next.tab ?? tab,
				chord: next.chord ?? chord
			},
			replace: true
		});
		head.clear();
	};
	const play = () => {
		unlockAudio();
		const hits = events.map((e) => ({
			beat: e.beat,
			mark: e.midis[0] ?? 60,
			sound: (when) => {
				if (e.midis.length > 1) pianoChord(e.midis.map(midiToFreq), when);
				else pianoTone(midiToFreq(e.midis[0] ?? 60), when);
			}
		}));
		head.play(hits, 80, true);
	};
	const chordPcs = (() => {
		if (tab === "five") return [
			0,
			2,
			4,
			5,
			7
		];
		if (tab === "middlec") return [0];
		return ((events.find((e) => e.beat === Math.floor(head.cursorBeat ?? 0)) ?? events[0])?.midis ?? [60]).map((m) => m % 12);
	})();
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(AppShell, { children: [
		/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("header", {
			className: "px-5 pb-2 pt-8",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "text-[11px] uppercase tracking-[0.22em] text-dim",
					children: "Piano lab · Keys"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
					className: "mt-2 font-display text-4xl font-semibold tracking-tight",
					children: "Hands"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "mt-3 max-w-sm text-pretty text-muted",
					children: "Find C, build a triad, feel G pull you home."
				})
			]
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: "sticky top-0 z-10 mx-4 mt-4 rounded-lg border border-border bg-surface/95 p-2 backdrop-blur-sm",
			children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(TabRow, {
				tabs: TABS$2,
				active: tab,
				onPick: (id) => patch({ tab: id })
			})
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "px-5 pb-8 pt-5",
			children: [
				tab !== "middlec" && tab !== "five" ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "text-[11px] uppercase tracking-[0.18em] text-dim",
					children: "Chord"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "mt-2 flex flex-wrap gap-1.5",
					children: CHORDS$1.map((c) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Chip, {
						active: chord === c,
						onClick: () => patch({ chord: c }),
						children: c
					}, c))
				})] }) : null,
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(LabCopy, {
					...copy,
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(PlayBar, {
						onPlay: play,
						lockKick: head.lockKick,
						onToggleKick: () => head.setLockKick((v) => !v),
						beatN: head.beatN
					})
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(BeatStrip, {
					cells: events.map((e) => ({
						beat: e.beat,
						top: e.label,
						bot: e.midis.length > 1 ? "chord" : "key"
					})),
					cursorBeat: head.cursorBeat
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
					className: "mt-6",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "mb-2 text-[11px] uppercase tracking-[0.18em] text-dim",
						children: "Keyboard"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(PianoKeyboard, {
						activeMidi,
						expectedMidi: activeMidi,
						chordPcs,
						onPlay: (midi) => {
							pianoTone(midiToFreq(midi));
							head.setMark(midi);
						}
					})]
				})
			]
		})
	] });
}
var CHORDS = [
	"C",
	"G",
	"Am",
	"F"
];
var TABS$1 = [
	{
		id: "down",
		label: "Down"
	},
	{
		id: "island",
		label: "Island"
	},
	{
		id: "chunk",
		label: "Chunk"
	},
	{
		id: "pick",
		label: "Pick"
	},
	{
		id: "switch",
		label: "Switch"
	}
];
var COPY$1 = {
	down: {
		kicker: "The stroke",
		title: "All four strings, one direction",
		body: "Wrist, not elbow. The nail or the flesh, either works — consistency is the sound. Land on the beat, not ahead of it.",
		hear: "Eight downs. Same chord. Same volume."
	},
	island: {
		kicker: "D DU UDU",
		title: "The pattern everyone already knows",
		body: "Down, skip, down-up, skip, up, down-up. Keep the arm moving through the rests — the ghost swing is what makes it lilt instead of march.",
		hear: "D · D U · U D U"
	},
	chunk: {
		kicker: "The mute",
		title: "Left hand kills the ring",
		body: "Strum, then drop the left-hand fingers flat across the strings. The chunk is a snare. Alternate open downs with chunks and the uke becomes a drum.",
		hear: "Chord, chuck, chord, chuck."
	},
	pick: {
		kicker: "p-i-m-a",
		title: "One finger per string",
		body: "Thumb on G, index on C, middle on E, ring on A. Not a strum — four separate attacks. Slow until each string speaks.",
		hear: "G, C, E, A. Then again."
	},
	switch: {
		kicker: "The hard part",
		title: "Change on one. Not on three.",
		body: "Four downs on C, four on G. The switch happens in the gap before beat one of the new chord. If you land late, you didn’t leave early.",
		hear: "C C C C, G G G G."
	}
};
function parseTab$1(raw) {
	if (raw === "down" || raw === "island" || raw === "chunk" || raw === "pick" || raw === "switch") return raw;
	return "down";
}
function parseChord(raw) {
	if (CHORDS.includes(raw)) return raw;
	return "C";
}
function freqs(id) {
	const inst = instrumentById("ukulele");
	const c = UKE_CHORDS[id];
	if (!c) return [...inst.openFreq];
	return c.frets.map((f, i) => f == null ? null : inst.openFreq[i] * Math.pow(2, f / 12)).filter((f) => f != null);
}
function shape(id) {
	const c = UKE_CHORDS[id];
	if (!c) return void 0;
	return {
		id,
		name: id,
		...c
	};
}
function UkeLab() {
	const search = useSearch({ from: "/techniques" });
	const navigate = useNavigate({ from: "/techniques" });
	const tab = parseTab$1(search.tab);
	const chord = parseChord(search.chord);
	const copy = COPY$1[tab];
	const head = usePlayhead();
	const f = freqs(chord);
	const open = instrumentById("ukulele").openFreq;
	const patch = (next) => {
		navigate({
			search: {
				tab: next.tab ?? tab,
				chord: next.chord ?? chord
			},
			replace: true
		});
		head.clear();
	};
	const play = () => {
		unlockAudio();
		let hits = [];
		if (tab === "down") hits = Array.from({ length: 8 }, (_, i) => ({
			beat: i,
			sound: (w) => strum(f, w)
		}));
		else if (tab === "island") hits = [
			"D",
			".",
			"D",
			"U",
			".",
			"U",
			"D",
			"U"
		].flatMap((kind, i) => kind === "." ? [] : [{
			beat: i,
			sound: (w) => kind === "U" ? strumUp(f, w) : strum(f, w)
		}]);
		else if (tab === "chunk") hits = Array.from({ length: 8 }, (_, i) => ({
			beat: i,
			sound: (w) => i % 2 === 0 ? strum(f, w) : ghostNote(w)
		}));
		else if (tab === "pick") hits = [
			0,
			1,
			2,
			3,
			4,
			5,
			6,
			7
		].map((i) => ({
			beat: i,
			mark: i % 4,
			sound: (w) => pluck(open[i % 4] ?? 392, w, .4)
		}));
		else {
			const g = freqs("G");
			hits = Array.from({ length: 8 }, (_, i) => ({
				beat: i,
				sound: (w) => strum(i < 4 ? f : g, w)
			}));
		}
		head.play(hits, 84, true);
	};
	const liveChord = tab === "switch" && (head.cursorBeat ?? 0) >= 4 ? "G" : chord;
	const cells = Array.from({ length: 8 }, (_, beat) => {
		if (tab === "island") return {
			beat,
			top: [
				"D",
				"·",
				"D",
				"U",
				"·",
				"U",
				"D",
				"U"
			][beat] ?? "·",
			bot: chord
		};
		if (tab === "chunk") return {
			beat,
			top: beat % 2 === 0 ? "D" : "x",
			bot: chord
		};
		if (tab === "pick") return {
			beat,
			top: [
				"p",
				"i",
				"m",
				"a"
			][beat % 4] ?? "p",
			bot: [
				"G",
				"C",
				"E",
				"A"
			][beat % 4] ?? "G"
		};
		if (tab === "switch") return {
			beat,
			top: "D",
			bot: beat < 4 ? chord : "G"
		};
		return {
			beat,
			top: "D",
			bot: chord
		};
	});
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(AppShell, { children: [
		/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("header", {
			className: "px-5 pb-2 pt-8",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "text-[11px] uppercase tracking-[0.22em] text-dim",
					children: "Ukulele lab · GCEA"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
					className: "mt-2 font-display text-4xl font-semibold tracking-tight",
					children: "Strum"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "mt-3 max-w-sm text-pretty text-muted",
					children: "Four strings. The right hand is the song."
				})
			]
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: "sticky top-0 z-10 mx-4 mt-4 rounded-lg border border-border bg-surface/95 p-2 backdrop-blur-sm",
			children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(TabRow, {
				tabs: TABS$1,
				active: tab,
				onPick: (id) => patch({ tab: id })
			})
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "px-5 pb-8 pt-5",
			children: [
				tab !== "pick" ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "text-[11px] uppercase tracking-[0.18em] text-dim",
					children: "Chord"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "mt-2 flex flex-wrap gap-1.5",
					children: CHORDS.map((c) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Chip, {
						active: chord === c,
						onClick: () => patch({ chord: c }),
						children: c
					}, c))
				})] }) : null,
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(LabCopy, {
					...copy,
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(PlayBar, {
						onPlay: play,
						lockKick: head.lockKick,
						onToggleKick: () => head.setLockKick((v) => !v),
						beatN: head.beatN
					})
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(BeatStrip, {
					cells,
					cursorBeat: head.cursorBeat
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
					className: "mt-6 flex flex-col items-center",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "mb-2 self-start text-[11px] uppercase tracking-[0.18em] text-dim",
						children: "Shape"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ChordDiagram, { shape: shape(liveChord) })]
				})
			]
		})
	] });
}
var TABS = [
	{
		id: "drone",
		label: "Drone"
	},
	{
		id: "match",
		label: "Match"
	},
	{
		id: "hold",
		label: "Hold"
	},
	{
		id: "neighbor",
		label: "Step"
	},
	{
		id: "octave",
		label: "8ve"
	}
];
var COPY = {
	drone: {
		kicker: "The floor",
		title: "Hum until it disappears",
		body: "A drone is a pitch you stop hearing as a pitch — it becomes the room. Match the C, then forget it. Breath is even. Jaw is nothing.",
		hear: "One C. Let it ring. You ring with it."
	},
	match: {
		kicker: "Twenty cents",
		title: "Land inside the note, not next to it",
		body: "Slide from below. The last millimetre is the work. If you attack from above you will be sharp forever. Use the mic. Watch the needle.",
		hear: "Reference, then you. Closer. Closer."
	},
	hold: {
		kicker: "One breath",
		title: "Four beats. Don’t dump the air.",
		body: "Start quieter than you think. The note should be as loud on four as on one. If it thins out, you spent the breath in the first second.",
		hear: "C, held across four counts. Then another."
	},
	neighbor: {
		kicker: "Stepwise",
		title: "The next note is one tooth over",
		body: "C to D is a whole step. Don’t jump at it — release C and arrive. The space between is a door, not a gap. Come back the same way.",
		hear: "C, D, E, D, C."
	},
	octave: {
		kicker: "Same letter, new floor",
		title: "C4 to C5 without grabbing",
		body: "The octave is the same name, twice as fast. Don’t reach with your chin. Think of placing the high note on a shelf, not throwing it at the ceiling.",
		hear: "Low C, high C, low C."
	}
};
function parseTab(raw) {
	if (raw === "drone" || raw === "match" || raw === "hold" || raw === "neighbor" || raw === "octave") return raw;
	return "drone";
}
function target(tab) {
	if (tab === "octave") return {
		midi: 60,
		name: "C4"
	};
	if (tab === "neighbor") return {
		midi: 62,
		name: "D4"
	};
	return {
		midi: 60,
		name: "C4"
	};
}
function VoiceLab() {
	const search = useSearch({ from: "/techniques" });
	const navigate = useNavigate({ from: "/techniques" });
	const tab = parseTab(search.tab);
	const copy = COPY[tab];
	const head = usePlayhead();
	const t = target(tab);
	const patch = (next) => {
		navigate({
			search: {
				tab: next,
				chord: "C"
			},
			replace: true
		});
		head.clear();
	};
	const play = () => {
		unlockAudio();
		let hits = [];
		if (tab === "drone" || tab === "match") hits = Array.from({ length: 8 }, (_, i) => ({
			beat: i,
			mark: 60,
			sound: (w) => pianoTone(midiToFreq(60), w, .22)
		}));
		else if (tab === "hold") hits = [{
			beat: 0,
			mark: 60,
			sound: (w) => pianoHold(midiToFreq(60), 3.6, w)
		}, {
			beat: 4,
			mark: 60,
			sound: (w) => pianoHold(midiToFreq(60), 3.6, w)
		}];
		else if (tab === "neighbor") hits = [
			60,
			62,
			64,
			62,
			60,
			62,
			64,
			60
		].map((m, i) => ({
			beat: i,
			mark: m,
			sound: (w) => pianoTone(midiToFreq(m), w, .26)
		}));
		else hits = [
			{
				beat: 0,
				mark: 60,
				sound: (w) => pianoTone(midiToFreq(60), w, .26)
			},
			{
				beat: 2,
				mark: 72,
				sound: (w) => pianoTone(midiToFreq(72), w, .24)
			},
			{
				beat: 4,
				mark: 60,
				sound: (w) => pianoTone(midiToFreq(60), w, .26)
			},
			{
				beat: 6,
				mark: 72,
				sound: (w) => pianoTone(midiToFreq(72), w, .24)
			}
		];
		head.play(hits, 60, false);
	};
	const cells = tab === "neighbor" ? [
		"C",
		"D",
		"E",
		"D",
		"C",
		"D",
		"E",
		"C"
	].map((n, beat) => ({
		beat,
		top: "·",
		bot: n
	})) : tab === "octave" ? [
		"C4",
		"·",
		"C5",
		"·",
		"C4",
		"·",
		"C5",
		"·"
	].map((n, beat) => ({
		beat,
		top: n === "·" ? "·" : "C",
		bot: n
	})) : tab === "hold" ? Array.from({ length: 8 }, (_, beat) => ({
		beat,
		top: beat % 4 === 0 ? "hold" : "→",
		bot: "C"
	})) : Array.from({ length: 8 }, (_, beat) => ({
		beat,
		top: "C",
		bot: "drone"
	}));
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(AppShell, { children: [
		/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("header", {
			className: "px-5 pb-2 pt-8",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "text-[11px] uppercase tracking-[0.22em] text-dim",
					children: "Voice lab · Pitch"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
					className: "mt-2 font-display text-4xl font-semibold tracking-tight",
					children: "Breath"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "mt-3 max-w-sm text-pretty text-muted",
					children: "Match a C. Hold it. The air is the instrument."
				})
			]
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: "sticky top-0 z-10 mx-4 mt-4 rounded-lg border border-border bg-surface/95 p-2 backdrop-blur-sm",
			children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(TabRow, {
				tabs: TABS,
				active: tab,
				onPick: patch
			})
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "px-5 pb-8 pt-5",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(LabCopy, {
					...copy,
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(PlayBar, {
						onPlay: play,
						lockKick: head.lockKick,
						onToggleKick: () => head.setLockKick((v) => !v),
						kickLabel: "Click",
						beatN: head.beatN
					})
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(BeatStrip, {
					cells,
					cursorBeat: head.cursorBeat
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("section", {
					className: "mt-6",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(PitchMatch, {
						targetFreq: midiToFreq(t.midi),
						targetName: t.name
					})
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
					className: "mt-6",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "mb-2 text-[11px] uppercase tracking-[0.18em] text-dim",
						children: "Reference"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(PianoKeyboard, {
						activeMidi: head.mark,
						expectedMidi: t.midi,
						chordPcs: [t.midi % 12],
						onPlay: (midi) => {
							pianoTone(midiToFreq(midi));
							head.setMark(midi);
						}
					})]
				})
			]
		})
	] });
}
function TechniquesPage() {
	const instrument = useSpark((s) => s.instrument);
	if (instrument === "drums") return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(DrumsLab, {});
	if (instrument === "piano") return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(PianoLab, {});
	if (instrument === "ukulele") return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(UkeLab, {});
	if (instrument === "vocals") return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(VoiceLab, {});
	if (instrument === "guitar") return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(GuitarLab, {});
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(BassLab, {});
}
function BassLab() {
	const search = Route$3.useSearch();
	const navigate = Route$3.useNavigate();
	const tab = parseTechTab(search.tab);
	const chord = parseBassChord(search.chord);
	const patch = (next) => {
		navigate({
			search: {
				tab: next.tab ?? tab,
				chord: next.chord ?? chord
			},
			replace: true
		});
	};
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(AppShell, { children: [
		/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("header", {
			className: "px-5 pb-2 pt-8",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "text-[11px] uppercase tracking-[0.22em] text-dim",
					children: "Bass lab · EADG"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
					className: "mt-2 font-display text-4xl font-semibold tracking-tight",
					children: "Fingerstyle"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "mt-3 max-w-sm text-pretty text-muted",
					children: "The right hand is the groove. The left hand only names the note."
				})
			]
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "sticky top-0 z-10 mx-4 mt-4 space-y-2 rounded-lg border border-border bg-surface/95 p-2 backdrop-blur-sm",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "px-1 pb-1 text-[11px] uppercase tracking-[0.16em] text-dim",
				children: "Right hand"
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(TabRow, {
				tabs: HAND_TABS,
				active: tab,
				onPick: (id) => patch({ tab: id })
			})] }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "px-1 pb-1 text-[11px] uppercase tracking-[0.16em] text-dim",
				children: "The line"
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(TabRow, {
				tabs: LINE_TABS,
				active: tab,
				onPick: (id) => patch({ tab: id })
			})] })]
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Lab, {
			search: {
				tab,
				chord
			},
			patch
		})
	] });
}
function Lab({ search, patch }) {
	const copy = TECH_COPY[search.tab];
	const root = BASS_ROOTS[search.chord];
	const line = (0, import_react.useMemo)(() => lineFor(search.tab, search.chord), [search.tab, search.chord]);
	const marks = (0, import_react.useMemo)(() => uniqueMarks(line.flatMap((e) => e.together ? [e.pos, e.together] : [e.pos])), [line]);
	const [active, setActive] = (0, import_react.useState)(null);
	const [beatN, setBeatN] = (0, import_react.useState)(null);
	const [cursorBeat, setCursorBeat] = (0, import_react.useState)(null);
	const [finger, setFinger] = (0, import_react.useState)(null);
	const [lockKick, setLockKick] = (0, import_react.useState)(true);
	const timers = (0, import_react.useRef)([]);
	(0, import_react.useEffect)(() => {
		return () => {
			timers.current.forEach((id) => window.clearTimeout(id));
			timers.current = [];
		};
	}, []);
	(0, import_react.useEffect)(() => {
		setActive(null);
		setBeatN(null);
		setCursorBeat(null);
		setFinger(null);
	}, [search.tab, search.chord]);
	const playPos = (pos, ghost = pos.role === "gh") => {
		unlockAudio();
		if (ghost) ghostNote();
		else if (pos.role === "hm") bassLegato(bassFreq(pos.string, pos.fret));
		else bassTone(bassFreq(pos.string, pos.fret));
		setActive(pos);
	};
	const playLine = () => {
		timers.current.forEach((id) => window.clearTimeout(id));
		timers.current = [];
		const ac = unlockAudio();
		const beat = 60 / 88;
		const origin = ac.currentTime;
		line.forEach((ev) => {
			const when = origin + ev.beat * beat;
			soundEvent(ev, when);
			if (lockKick && ev.beat % 2 === 0 && ev.beat === Math.floor(ev.beat)) kick(when);
			if (ev.beat === Math.floor(ev.beat)) click(ev.beat % 4 === 0, when);
			const delay = Math.max(0, (when - ac.currentTime) * 1e3);
			const id = window.setTimeout(() => {
				setActive(ev.pos);
				setBeatN(Math.floor(ev.beat) % 4 + 1);
				setCursorBeat(ev.beat);
				setFinger(ev.finger ?? null);
			}, delay);
			timers.current.push(id);
		});
		const lastBeat = line[line.length - 1]?.beat ?? 8;
		const end = window.setTimeout(() => {
			setActive(null);
			setBeatN(null);
			setCursorBeat(null);
			setFinger(null);
		}, (lastBeat + 1) * beat * 1e3 + 200);
		timers.current.push(end);
	};
	const extraMarks = marksFor(search.tab, root, marks);
	const legendRoles = Array.from(new Set(extraMarks.map((m) => m.role)));
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "px-5 pb-8 pt-5",
		children: [
			search.tab !== "alt" && search.tab !== "ghost" ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "text-[11px] uppercase tracking-[0.18em] text-dim",
				children: "Chord"
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "mt-2 flex flex-wrap gap-1.5",
				children: BASS_CHORDS.map((c) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Chip, {
					active: search.chord === c,
					onClick: () => patch({ chord: c }),
					children: c
				}, c))
			})] }) : null,
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
				className: "mt-5 rounded-xl border border-border bg-surface p-5",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "text-[11px] uppercase tracking-[0.18em] text-dim",
						children: copy.kicker
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
						className: "mt-1 font-display text-3xl font-semibold tracking-tight",
						children: copy.title
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "mt-3 text-pretty text-sm leading-relaxed text-muted",
						children: copy.body
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "mt-2 text-sm text-fg",
						children: copy.hear
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "mt-5 flex items-center gap-3",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(RightHandPads, { finger }), beatN ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
							className: "font-display text-sm tabular text-dim",
							children: ["beat ", beatN]
						}) : null]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "mt-5 flex gap-2",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
							onClick: playLine,
							className: "flex-1",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Play, { className: "size-4" }), "Play the line"]
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
							variant: "secondary",
							onClick: () => setLockKick((v) => !v),
							className: cn("px-4", lockKick && "border-accent text-accent"),
							"aria-pressed": lockKick,
							children: "Kick"
						})]
					})
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(LineStrip, {
				line,
				cursorBeat
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
				className: "mt-6",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "mb-2 flex items-baseline justify-between gap-3",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "text-[11px] uppercase tracking-[0.18em] text-dim",
						children: "Neck"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(RoleLegend, { roles: legendRoles })]
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(BassNeck, {
					marks: extraMarks,
					active,
					onPlay: (pos) => playPos(pos)
				})]
			}),
			search.tab === "alt" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "mt-5 text-pretty text-sm text-muted",
				children: "Tap open E. Alternate even if you only hear one pitch. Slow is correct."
			}) : null,
			search.tab === "ghost" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "mt-5 text-pretty text-sm text-muted",
				children: "Left hand stays on the string. The muted stroke should be as loud as the open one — just empty."
			}) : null,
			search.tab === "walk" ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
				className: "mt-5 flex items-start gap-2 text-sm text-muted",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Repeat, { className: "mt-0.5 size-4 shrink-0 text-dim" }), "Em walks up to G. Switch the chord chip to G and the line walks into C."]
			}) : null,
			search.tab === "hammer" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "mt-5 text-pretty text-sm text-muted",
				children: "Pluck, then drop a left-hand finger two frets higher. If the second note has a click, you plucked it."
			}) : null,
			search.tab === "rake" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "mt-5 text-pretty text-sm text-muted",
				children: "One finger. Start on the muted string above and fall onto the root. Two clicks is two plucks."
			}) : null
		]
	});
}
function soundEvent(ev, when) {
	if (ev.ghost) {
		ghostNote(when);
		return;
	}
	if (ev.hammer) {
		bassLegato(bassFreq(ev.pos.string, ev.pos.fret), when);
		return;
	}
	if (ev.rake && ev.together) {
		ghostNote(when);
		bassTone(bassFreq(ev.pos.string, ev.pos.fret), when + .045);
		return;
	}
	bassTone(bassFreq(ev.pos.string, ev.pos.fret), when);
	if (ev.together && ev.together.role !== "gh") bassTone(bassFreq(ev.together.string, ev.together.fret), when, .32);
}
function RightHandPads({ finger }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
		className: "flex gap-1.5",
		"aria-label": "Right-hand fingers",
		children: [
			"p",
			"i",
			"m"
		].map((f) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
			className: cn("flex size-11 flex-col items-center justify-center rounded-md border text-center", finger === f ? "border-accent bg-accent text-accent-fg" : "border-border bg-raised text-muted"),
			"aria-label": FINGER_LABEL[f],
			"aria-current": finger === f || void 0,
			children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
				className: "font-display text-base font-semibold leading-none",
				children: f
			})
		}) }, f))
	});
}
function LineStrip({ line, cursorBeat }) {
	const beats = line.filter((e) => e.beat === Math.floor(e.beat)).slice(0, 8);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
		className: "mt-5",
		"aria-label": "Eight-beat line",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
			className: "mb-2 text-[11px] uppercase tracking-[0.18em] text-dim",
			children: "Line"
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("ol", {
			className: "grid grid-cols-8 gap-1",
			children: beats.map((ev, i) => {
				const on = cursorBeat != null && Math.floor(cursorBeat) === ev.beat;
				return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", {
					className: cn("flex h-16 flex-col items-center justify-center rounded-md border", on ? "border-accent bg-accent text-accent-fg" : "border-border bg-raised text-muted"),
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						className: "font-display text-sm font-semibold leading-none",
						children: ev.finger ?? "·"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						className: "mt-1 text-[11px] tabular leading-none",
						children: ev.ghost ? "x" : ev.hammer ? "h" : ev.rake ? `x${ev.pos.name}` : ev.together ? `${ev.pos.name}+` : ev.pos.name
					})]
				}, `${ev.beat}-${i}`);
			})
		})]
	});
}
function marksFor(tab, root, marks) {
	if (tab === "fifth" || tab === "double") return [root, fifthOf(root)];
	if (tab === "octave") return [root, octaveOf(root)];
	if (tab === "thumb") return [
		root,
		fifthOf(root),
		octaveOf(root)
	];
	if (tab === "hammer") return [root, hammerOf(root)];
	if (tab === "rake") return [root, posOf(root.string + 1, root.fret, "gh")];
	if (tab === "roots" || tab === "alt" || tab === "ghost") return [root];
	return marks;
}
function uniqueMarks(list) {
	const seen = /* @__PURE__ */ new Set();
	const out = [];
	for (const p of list) {
		const k = `${p.string}-${p.fret}-${p.role}`;
		if (seen.has(k)) continue;
		seen.add(k);
		out.push(p);
	}
	return out;
}
//#endregion
export { TechniquesPage as component };
