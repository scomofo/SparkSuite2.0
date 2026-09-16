import { i as __toESM } from "../_runtime.mjs";
import { n as require_react } from "../_libs/@radix-ui/react-compose-refs+[...].mjs";
import { B as require_jsx_runtime } from "../_libs/@tanstack/react-router+[...].mjs";
import { t as Button } from "./button-DYd0ZC_F.mjs";
import { f as pianoTone, g as unlockAudio, m as strum, p as pluck, u as pianoChord } from "./audio-DIq8nkMh.mjs";
import { t as ChordDiagram } from "./chord-diagram-C6Re10Bn.mjs";
import { t as PianoKeyboard } from "./piano-keyboard-hXDcveFZ.mjs";
import { a as ListMusic, n as Repeat, r as Play } from "../_libs/lucide-react.mjs";
import { t as AppShell } from "./app-shell-Cn6Z2zyU.mjs";
import { A as voicingFreqs, D as roleOfPc, E as qualityById, O as scalePcs, St as useSpark, T as pcOf, U as cn, _ as listVoicings, a as INTERVAL_INFO, c as QUALITIES, d as chordLabel, f as chordMidis, g as fretNoteOn, h as fretNote, i as FN_LABEL, k as useFlats, l as STRING_LABELS, lt as midiToFreq, m as diatonicChords, o as PICKER_ROOTS, p as chordPcs, r as FIFTHS, s as PROGRESSIONS, tt as instrumentById, u as cagedShapes, v as neckVoicing, vt as stringFreq, x as parseNumeral, y as noteName } from "./router-_2DnnNcg.mjs";
import { t as Route$2 } from "./router-_2DnnNcg2.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/theory-CB7p4J1N.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
var r = (n) => Math.round(n * 10) / 10;
function CircleFifths({ tonicPc, mode, onPick }) {
	const size = 260;
	const cx = size / 2;
	const cy = size / 2;
	const outerR = 110;
	const innerR = 68;
	const holeR = 34;
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("svg", {
		viewBox: `0 0 ${size} ${size}`,
		width: size,
		height: size,
		className: "mx-auto block text-fg",
		role: "img",
		"aria-label": "Circle of fifths",
		children: [
			FIFTHS.map((pc, i) => {
				const a0 = i / 12 * Math.PI * 2 - Math.PI / 2 - Math.PI / 12;
				const a1 = (i + 1) / 12 * Math.PI * 2 - Math.PI / 2 - Math.PI / 12;
				const mid = (a0 + a1) / 2;
				const active = pc === tonicPc;
				const rel = (pc + 9) % 12;
				const relActive = mode === "minor" && rel === tonicPc;
				const outerLabel = noteName(pc, [
					3,
					8,
					10,
					5
				].includes(pc));
				const innerLabel = `${noteName(rel, [
					0,
					3,
					5,
					10
				].includes(rel))}m`;
				return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("g", { children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("path", {
						d: annulus(cx, cy, innerR, outerR, a0, a1),
						fill: active && mode === "major" ? "var(--color-accent)" : "var(--color-raised)",
						stroke: "var(--color-border)",
						strokeWidth: 1,
						className: "cursor-pointer",
						onClick: () => onPick(pc, "major"),
						"aria-label": `${outerLabel} major`
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("path", {
						d: annulus(cx, cy, holeR, innerR, a0, a1),
						fill: relActive ? "var(--color-accent)" : "var(--color-surface)",
						stroke: "var(--color-border)",
						strokeWidth: 1,
						className: "cursor-pointer",
						onClick: () => onPick(rel, "minor"),
						"aria-label": `${innerLabel} minor`
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("text", {
						x: r(cx + Math.cos(mid) * 89),
						y: r(cy + Math.sin(mid) * 89),
						textAnchor: "middle",
						dominantBaseline: "middle",
						fill: active && mode === "major" ? "var(--color-accent-fg)" : "var(--color-fg)",
						fontSize: 13,
						fontWeight: 600,
						fontFamily: "var(--font-display)",
						className: "pointer-events-none",
						children: outerLabel
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("text", {
						x: r(cx + Math.cos(mid) * 51),
						y: r(cy + Math.sin(mid) * 51),
						textAnchor: "middle",
						dominantBaseline: "middle",
						fill: relActive ? "var(--color-accent-fg)" : "var(--color-muted)",
						fontSize: 10,
						fontFamily: "var(--font-sans)",
						className: "pointer-events-none",
						children: innerLabel
					})
				] }, pc);
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("circle", {
				cx,
				cy,
				r: 33,
				fill: "var(--color-bg)"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("text", {
				x: cx,
				y: 124,
				textAnchor: "middle",
				fill: "var(--color-fg)",
				fontSize: 16,
				fontWeight: 600,
				fontFamily: "var(--font-display)",
				children: noteName(tonicPc, mode === "minor" ? [
					0,
					3,
					5,
					10
				].includes(tonicPc) : [
					3,
					8,
					10,
					5
				].includes(tonicPc))
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("text", {
				x: cx,
				y: 142,
				textAnchor: "middle",
				fill: "var(--color-muted)",
				fontSize: 10,
				fontFamily: "var(--font-sans)",
				children: mode
			})
		]
	});
}
function annulus(cx, cy, r0, r1, a0, a1) {
	const p = (rad, a) => [r(cx + Math.cos(a) * rad), r(cy + Math.sin(a) * rad)];
	const large = a1 - a0 > Math.PI ? 1 : 0;
	const [x0, y0] = p(r1, a0);
	const [x1, y1] = p(r1, a1);
	const [x2, y2] = p(r0, a1);
	const [x3, y3] = p(r0, a0);
	return `M ${x0} ${y0} A ${r1} ${r1} 0 ${large} 1 ${x1} ${y1} L ${x2} ${y2} A ${r0} ${r0} 0 ${large} 0 ${x3} ${y3} Z`;
}
function Legend({ className }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
		className: cn("flex flex-wrap gap-3 text-[11px] text-muted", className),
		children: [
			{
				cls: "bg-accent",
				label: "Root"
			},
			{
				cls: "bg-ember",
				label: "3rd"
			},
			{
				cls: "bg-good",
				label: "5th"
			},
			{
				cls: "bg-fg",
				label: "7th"
			}
		].map((it) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", {
			className: "flex items-center gap-1.5",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: cn("size-2.5 rounded-full", it.cls) }), it.label]
		}, it.label))
	});
}
var FRETS = 12;
function toneClass(role, inScale) {
	if (role === "1") return "bg-accent text-accent-fg";
	if (role === "3" || role === "b3") return "bg-ember text-accent-fg";
	if (role === "5" || role === "b5" || role === "#5") return "bg-good text-bg";
	if (role === "7" || role === "b7" || role === "bb7") return "bg-fg text-bg";
	if (role) return "bg-raised text-fg ring-1 ring-ember/70";
	if (inScale) return "bg-border text-muted";
	return "";
}
function TheoryFretboard({ rootPc, qualityId, scalePcs = [], voicing, preferFlats = false, labels = STRING_LABELS, openPc, openFreq, onPlay }) {
	const scaleSet = new Set(scalePcs);
	const n = labels.length;
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: "overflow-x-auto",
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "min-w-[20rem]",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "grid gap-px",
				style: { gridTemplateColumns: `1.4rem repeat(${FRETS}, minmax(0, 1fr))` },
				role: "grid",
				"aria-label": `${n}-string fretboard, 12 frets`,
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {}),
					Array.from({ length: FRETS }, (_, f) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "pb-1 text-center text-[10px] tabular text-dim",
						children: f + 1
					}, `n${f + 1}`)),
					labels.map((_, rev) => {
						const i = n - 1 - rev;
						return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(FretRow, {
							stringIndex: i,
							label: labels[i] ?? "",
							stringCount: n,
							rootPc,
							qualityId,
							scaleSet,
							voicingFret: voicing?.[i] ?? null,
							preferFlats,
							openPc,
							openFreq,
							onPlay
						}, `${labels[i]}-${i}`);
					})
				]
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "mt-1 grid gap-px",
				style: { gridTemplateColumns: `1.4rem repeat(${FRETS}, minmax(0, 1fr))` },
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {}), Array.from({ length: FRETS }, (_, f) => {
					const mark = f + 1;
					const dots = mark === 12 ? 2 : [
						3,
						5,
						7,
						9
					].includes(mark) ? 1 : 0;
					return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "flex h-3 items-center justify-center gap-0.5",
						children: Array.from({ length: dots }, (_, d) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "size-1 rounded-full bg-dim/70" }, d))
					}, `m${mark}`);
				})]
			})]
		})
	});
}
function FretRow({ stringIndex, label, stringCount, rootPc, qualityId, scaleSet, voicingFret, preferFlats, openPc, openFreq, onPlay }) {
	const noteAt = (fret) => openPc && openFreq ? fretNoteOn(openPc, openFreq, stringIndex, fret, preferFlats) : fretNote(stringIndex, fret, preferFlats);
	const open = noteAt(0);
	const openRole = roleOfPc(rootPc, qualityId, open.pc);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
		type: "button",
		onClick: () => onPlay?.(stringIndex, 0),
		className: cn("flex h-7 items-center justify-center rounded-sm text-[10px] font-medium", toneClass(openRole, scaleSet.has(open.pc)) || "text-muted", voicingFret === 0 && "ring-1 ring-fg"),
		"aria-label": `Open ${open.name}`,
		children: label
	}), Array.from({ length: FRETS }, (_, f) => {
		const fret = f + 1;
		const note = noteAt(fret);
		const role = roleOfPc(rootPc, qualityId, note.pc);
		const inScale = scaleSet.has(note.pc);
		const painted = Boolean(role || inScale);
		return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
			type: "button",
			onClick: () => onPlay?.(stringIndex, fret),
			className: cn("relative flex h-7 items-center justify-center rounded-[3px] border border-border/80 bg-raised/60", voicingFret === fret && "ring-1 ring-fg"),
			"aria-label": `${note.name} string ${stringCount - stringIndex} fret ${fret}`,
			children: painted ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
				className: cn("flex size-5 items-center justify-center rounded-full text-[8px] font-semibold leading-none", toneClass(role, inScale)),
				children: role ?? "·"
			}) : null
		}, fret);
	})] });
}
function ChromaticStrip({ rootPc, qualityId, preferFlats }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: "grid grid-cols-12 gap-0.5",
		"aria-label": "Intervals from the root",
		children: Array.from({ length: 12 }, (_, i) => {
			const pc = (rootPc + i) % 12;
			const role = roleOfPc(rootPc, qualityId, pc);
			return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex flex-col items-center gap-1",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: cn("flex h-8 w-full items-center justify-center rounded-sm text-[10px] font-semibold", role ? toneClass(role, false) : "bg-raised text-dim"),
					children: role ?? ""
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
					className: "text-[9px] text-dim",
					children: noteName(pc, preferFlats)
				})]
			}, i);
		})
	});
}
var TABS = [
	{
		id: "build",
		label: "Build"
	},
	{
		id: "key",
		label: "Key"
	},
	{
		id: "changes",
		label: "Changes"
	},
	{
		id: "caged",
		label: "CAGED"
	}
];
function pickerFromPc(pc) {
	return PICKER_ROOTS.find((n) => pcOf(n) === pc) ?? "C";
}
function hearQuality(rootPc, qualityId, when) {
	const inst = instrumentById(useSpark.getState().instrument);
	unlockAudio();
	if (inst.theoryNeck === "piano" || inst.surface === "keys" || inst.surface === "voice") {
		pianoChord(chordMidis(rootPc, qualityId).map(midiToFreq), when);
		return;
	}
	if (inst.theoryNeck === "four") {
		const freqs = neckVoicing(inst.openPc, chordPcs(rootPc, qualityId)).map((f, i) => f == null ? null : stringFreq(inst, i, f)).filter((f) => f != null);
		strum(freqs, when);
		return;
	}
	const v = listVoicings(rootPc, qualityId)[0];
	if (v) strum(voicingFreqs(v), when);
}
function playNeckFret(stringIndex, fret) {
	const inst = instrumentById(useSpark.getState().instrument);
	unlockAudio();
	if (inst.theoryNeck === "four") {
		pluck(stringFreq(inst, stringIndex, fret));
		return;
	}
	pluck(fretNote(stringIndex, fret).freq);
}
function NeckFor({ rootPc, qualityId, voicing, scalePcs: scale, preferFlats }) {
	const instrument = useSpark((s) => s.instrument);
	const inst = instrumentById(instrument);
	if (inst.theoryNeck === "none") return null;
	if (inst.theoryNeck === "piano") return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(PianoKeyboard, {
		activeMidi: null,
		chordPcs: chordPcs(rootPc, qualityId),
		onPlay: (midi) => pianoTone(midiToFreq(midi))
	});
	const four = inst.theoryNeck === "four" ? neckVoicing(inst.openPc, chordPcs(rootPc, qualityId)) : void 0;
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(TheoryFretboard, {
		rootPc,
		qualityId,
		voicing: voicing ?? four,
		scalePcs: scale,
		preferFlats,
		labels: inst.stringNames,
		openPc: inst.openPc,
		openFreq: inst.openFreq,
		onPlay: playNeckFret
	});
}
function TheoryPage() {
	const search = Route$2.useSearch();
	const navigate = Route$2.useNavigate();
	const instrument = useSpark((s) => s.instrument);
	const inst = instrumentById(instrument);
	const tabs = inst.id === "guitar" ? TABS : TABS.filter((t) => t.id !== "caged");
	const tab = search.tab === "caged" && inst.id !== "guitar" ? "build" : search.tab;
	const patch = (next) => {
		navigate({
			search: (prev) => ({
				...prev,
				...next
			}),
			replace: true
		});
	};
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(AppShell, { children: [
		/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("header", {
			className: "px-5 pb-2 pt-8",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
					className: "text-[11px] uppercase tracking-[0.22em] text-dim",
					children: ["Chord lab · ", inst.name]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
					className: "mt-2 font-display text-4xl font-semibold tracking-tight",
					children: "Theory"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
					className: "mt-3 max-w-sm text-pretty text-muted",
					children: ["Harmony is shared. ", inst.theoryNeck === "none" ? "Listen; the kit doesn’t have a neck." : "The neck changes with the instrument."]
				})
			]
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: "sticky top-0 z-10 mx-4 mt-4 rounded-lg border border-border bg-surface/95 p-1 backdrop-blur-sm",
			children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: cn("grid gap-0.5", tabs.length === 4 ? "grid-cols-4" : "grid-cols-3"),
				children: tabs.map((t) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
					type: "button",
					onClick: () => patch({ tab: t.id }),
					className: cn("h-10 rounded-md text-sm font-medium transition-colors duration-(--motion-quick)", tab === t.id ? "bg-accent text-accent-fg" : "text-muted hover:text-fg"),
					children: t.label
				}, t.id))
			})
		}),
		tab === "build" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(BuildTab, {
			search,
			patch
		}) : null,
		tab === "key" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(KeyTab, {
			search,
			patch
		}) : null,
		tab === "changes" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ChangesTab, {
			search,
			patch
		}) : null,
		tab === "caged" && inst.id === "guitar" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(CagedTab, {
			search,
			patch
		}) : null
	] });
}
function Chip({ active, onClick, children }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
		type: "button",
		onClick,
		className: cn("h-10 min-w-10 rounded-md px-3 text-sm font-medium transition-colors duration-(--motion-quick)", active ? "bg-accent text-accent-fg" : "border border-border bg-raised text-fg hover:border-ember/50"),
		children
	});
}
function BuildTab({ search, patch }) {
	const instrument = useSpark((s) => s.instrument);
	const inst = instrumentById(instrument);
	const rootPc = pcOf(search.root);
	const flats = useFlats(rootPc, "major");
	const quality = qualityById(search.q);
	const pcs = chordPcs(rootPc, search.q);
	const voicings = (0, import_react.useMemo)(() => inst.id === "guitar" ? listVoicings(rootPc, search.q) : [], [
		inst.id,
		rootPc,
		search.q
	]);
	const [voicingIdx, setVoicingIdx] = (0, import_react.useState)(0);
	const [focusIv, setFocusIv] = (0, import_react.useState)(null);
	(0, import_react.useEffect)(() => {
		setVoicingIdx(0);
		setFocusIv(null);
	}, [search.root, search.q]);
	const voicing = voicings[Math.min(voicingIdx, Math.max(0, voicings.length - 1))];
	const info = focusIv ? INTERVAL_INFO[focusIv] : null;
	const fourShape = inst.theoryNeck === "four" ? {
		id: "neck",
		name: chordLabel(rootPc, search.q, flats),
		frets: neckVoicing(inst.openPc, pcs),
		fingers: neckVoicing(inst.openPc, pcs).map((f) => f && f > 0 ? 1 : 0),
		notes: []
	} : null;
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
			chordMidis(rootPc, search.q).forEach((m, i) => pianoTone(midiToFreq(m), ac.currentTime + i * .16, .28));
			return;
		}
		if (fourShape) {
			const ac = unlockAudio();
			fourShape.frets.forEach((f, i) => {
				if (f == null) return;
				pluck(stringFreq(inst, i, f), ac.currentTime + i * .16, .42);
			});
			return;
		}
		if (!voicing) return;
		const ac = unlockAudio();
		voicingFreqs(voicing).forEach((f, i) => pluck(f, ac.currentTime + i * .16, .42));
	};
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "px-5 pb-8 pt-5",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "text-[11px] uppercase tracking-[0.18em] text-dim",
				children: "Root"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "mt-2 flex flex-wrap gap-1.5",
				children: PICKER_ROOTS.map((n) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Chip, {
					active: search.root === n,
					onClick: () => patch({ root: n }),
					children: n
				}, n))
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "mt-5 text-[11px] uppercase tracking-[0.18em] text-dim",
				children: "Quality"
			}),
			[
				"triad",
				"seventh",
				"colour"
			].map((group) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "mt-2 flex flex-wrap gap-1.5",
				children: QUALITIES.filter((q) => q.group === group).map((q) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Chip, {
					active: search.q === q.id,
					onClick: () => patch({ q: q.id }),
					children: q.suffix || "maj"
				}, q.id))
			}, group)),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
				className: "mt-6 rounded-xl border border-border bg-surface p-5",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "text-[11px] uppercase tracking-[0.18em] text-dim",
						children: quality.name
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
						className: "mt-1 font-display text-5xl font-semibold tracking-tight",
						children: chordLabel(rootPc, search.q, flats)
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "mt-4 flex flex-wrap gap-2",
						children: quality.formula.map((iv, i) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
							type: "button",
							onClick: () => setFocusIv(iv === focusIv ? null : iv),
							className: cn("rounded-md px-3 py-2 text-sm font-medium", focusIv === iv ? "bg-accent text-accent-fg" : "bg-raised text-fg"),
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "block text-[10px] uppercase tracking-wider opacity-70",
								children: noteName(pcs[i] ?? rootPc, flats)
							}), iv]
						}, iv + String(i)))
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "mt-4 text-pretty text-sm leading-relaxed text-muted",
						children: info ? info.role : quality.blurb
					}),
					info ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
						className: "mt-1 text-sm text-fg",
						children: [
							info.name,
							" · ",
							info.semitones,
							" semitone",
							info.semitones === 1 ? "" : "s"
						]
					}) : null,
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "mt-5 flex gap-2",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
							onClick: hearChord,
							className: "flex-1",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Play, { className: "size-4" }), inst.surface === "keys" || inst.surface === "voice" ? "Play" : "Strum"]
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
							variant: "secondary",
							onClick: hearArp,
							className: "flex-1",
							children: "Arpeggio"
						})]
					})
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
				className: "mt-5",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "mb-2 text-[11px] uppercase tracking-[0.18em] text-dim",
					children: "From the root"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ChromaticStrip, {
					rootPc,
					qualityId: search.q,
					preferFlats: flats
				})]
			}),
			inst.theoryNeck !== "none" ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
				className: "mt-6",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "mb-2 flex items-baseline justify-between gap-3",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "text-[11px] uppercase tracking-[0.18em] text-dim",
						children: inst.theoryNeck === "piano" ? "Keyboard" : "Neck"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Legend, {})]
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(NeckFor, {
					rootPc,
					qualityId: search.q,
					voicing: voicing?.frets,
					preferFlats: flats
				})]
			}) : null,
			voicings.length ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
				className: "mt-6",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "text-[11px] uppercase tracking-[0.18em] text-dim",
					children: "Voicings"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "mt-3 flex gap-3 overflow-x-auto pb-2",
					children: voicings.map((v, i) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ChordDiagram, {
						shape: v,
						compact: true,
						selected: i === voicingIdx,
						onSelect: () => {
							setVoicingIdx(i);
							unlockAudio();
							strum(voicingFreqs(v));
						}
					}, v.id))
				})]
			}) : null,
			fourShape ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
				className: "mt-6",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "text-[11px] uppercase tracking-[0.18em] text-dim",
					children: "On this neck"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "mt-3",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ChordDiagram, {
						shape: fourShape,
						compact: true,
						onSelect: () => hearQuality(rootPc, search.q)
					})
				})]
			}) : null
		]
	});
}
function KeyTab({ search, patch }) {
	const instrument = useSpark((s) => s.instrument);
	const inst = instrumentById(instrument);
	const keyPc = pcOf(search.key);
	const flats = useFlats(keyPc, search.mode);
	const [sevenths, setSevenths] = (0, import_react.useState)(false);
	const [sel, setSel] = (0, import_react.useState)(0);
	const chords = diatonicChords(keyPc, search.mode, sevenths);
	const scale = scalePcs(keyPc, search.mode);
	const chosen = chords[sel] ?? chords[0];
	(0, import_react.useEffect)(() => {
		setSel(0);
	}, [
		search.key,
		search.mode,
		sevenths
	]);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "px-5 pb-8 pt-5",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "text-[11px] uppercase tracking-[0.18em] text-dim",
				children: "Tonic"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "mt-2 flex flex-wrap gap-1.5",
				children: PICKER_ROOTS.map((n) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Chip, {
					active: search.key === n,
					onClick: () => patch({ key: n }),
					children: n
				}, n))
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "mt-3 flex gap-1.5",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Chip, {
						active: search.mode === "major",
						onClick: () => patch({ mode: "major" }),
						children: "Major"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Chip, {
						active: search.mode === "minor",
						onClick: () => patch({ mode: "minor" }),
						children: "Minor"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Chip, {
						active: sevenths,
						onClick: () => setSevenths((s) => !s),
						children: "7ths"
					})
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "mt-5",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(CircleFifths, {
					tonicPc: keyPc,
					mode: search.mode,
					onPick: (pc, nextMode) => patch({
						key: pickerFromPc(pc),
						mode: nextMode
					})
				})
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
				className: "mt-2 text-center text-sm text-muted",
				children: ["Scale · ", scale.map((pc) => noteName(pc, flats)).join("  ")]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "mt-1 text-center text-xs text-dim",
				children: "Outer ring = major keys · inner = relative minors"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
				className: "mt-6 space-y-2",
				children: chords.map((c, i) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", { children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
					type: "button",
					onClick: () => {
						setSel(i);
						hearQuality(c.rootPc, c.quality);
					},
					className: cn("flex w-full items-center gap-3 rounded-lg border px-4 py-3 text-left transition-colors duration-(--motion-quick)", sel === i ? "border-accent bg-raised" : "border-border bg-surface hover:border-ember/40"),
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "w-14 font-display text-lg font-semibold",
							children: c.roman
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
							className: "flex-1",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "block font-medium",
								children: c.label
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "block text-xs text-muted",
								children: FN_LABEL[c.fn]
							})]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Play, { className: "size-4 text-dim" })
					]
				}) }, c.roman))
			}),
			chosen ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
				className: "mt-5 rounded-xl border border-border bg-surface p-5",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
						className: "text-[11px] uppercase tracking-[0.18em] text-dim",
						children: [
							FN_LABEL[chosen.fn],
							" · ",
							chosen.roman
						]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", {
						className: "mt-1 font-display text-2xl font-semibold",
						children: chosen.label
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "mt-3 text-pretty text-sm leading-relaxed text-muted",
						children: chosen.hint
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
						className: "mt-4 w-full",
						variant: "secondary",
						onClick: () => patch({
							tab: "build",
							root: pickerFromPc(chosen.rootPc),
							q: chosen.quality
						}),
						children: "Open in the lab"
					})
				]
			}) : null,
			inst.theoryNeck !== "none" ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
				className: "mt-6",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "mb-2 text-[11px] uppercase tracking-[0.18em] text-dim",
					children: inst.theoryNeck === "piano" ? "Scale on the keys" : "Scale on the neck"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(NeckFor, {
					rootPc: chosen.rootPc,
					qualityId: chosen.quality,
					scalePcs: scale,
					preferFlats: flats
				})]
			}) : null
		]
	});
}
function ChangesTab({ search, patch }) {
	const keyPc = pcOf(search.key);
	const list = PROGRESSIONS.filter((p) => p.mode === "any" || p.mode === search.mode);
	const [active, setActive] = (0, import_react.useState)("axis");
	const prog = list.find((p) => p.id === active) ?? list[0];
	const parsed = prog ? prog.numerals.map((n) => parseNumeral(n, keyPc, search.mode)) : [];
	(0, import_react.useEffect)(() => {
		const ids = PROGRESSIONS.filter((p) => p.mode === "any" || p.mode === search.mode).map((p) => p.id);
		setActive((cur) => ids.includes(cur) ? cur : ids[0] ?? "axis");
	}, [search.mode]);
	const playLoop = () => {
		const ac = unlockAudio();
		const beat = 60 / 88;
		parsed.forEach((ch, i) => {
			hearQuality(ch.rootPc, ch.qualityId, ac.currentTime + i * beat * 2);
		});
	};
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "px-5 pb-8 pt-5",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "text-[11px] uppercase tracking-[0.18em] text-dim",
				children: "In the key of"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "mt-2 flex flex-wrap gap-1.5",
				children: PICKER_ROOTS.map((n) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Chip, {
					active: search.key === n,
					onClick: () => patch({ key: n }),
					children: n
				}, n))
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "mt-3 flex gap-1.5",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Chip, {
					active: search.mode === "major",
					onClick: () => patch({ mode: "major" }),
					children: "Major"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Chip, {
					active: search.mode === "minor",
					onClick: () => patch({ mode: "minor" }),
					children: "Minor"
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
				className: "mt-5 space-y-2",
				children: list.map((p) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", { children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
					type: "button",
					onClick: () => setActive(p.id),
					className: cn("w-full rounded-lg border px-4 py-3 text-left transition-colors duration-(--motion-quick)", active === p.id ? "border-accent bg-raised" : "border-border bg-surface hover:border-ember/40"),
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						className: "font-display font-semibold",
						children: p.name
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						className: "mt-0.5 block text-sm text-muted",
						children: p.blurb
					})]
				}) }, p.id))
			}),
			prog ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
				className: "mt-5 rounded-xl border border-border bg-surface p-5",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
						className: "text-[11px] uppercase tracking-[0.18em] text-dim",
						children: [
							search.key,
							" ",
							search.mode
						]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", {
						className: "mt-1 font-display text-2xl font-semibold",
						children: prog.name
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("ol", {
						className: "mt-4 grid grid-cols-4 gap-2",
						children: parsed.map((ch, i) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", { children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
							type: "button",
							onClick: () => hearQuality(ch.rootPc, ch.qualityId),
							className: "flex h-full min-h-16 w-full flex-col items-center justify-center rounded-md bg-raised px-1 py-2",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "font-display text-sm font-semibold",
								children: ch.numeral
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "text-xs text-muted",
								children: ch.label
							})]
						}) }, `${ch.numeral}-${i}`))
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
						className: "mt-4 w-full",
						onClick: playLoop,
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Repeat, { className: "size-4" }), "Play the changes"]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "mt-3 text-pretty text-sm text-muted",
						children: prog.blurb
					})
				]
			}) : null,
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
				className: "mt-6 flex items-start gap-2 text-sm text-muted",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ListMusic, { className: "mt-0.5 size-4 shrink-0 text-dim" }), "Tap a numeral to hear it. I is home, IV lifts, V pulls back."]
			})
		]
	});
}
function CagedTab({ search, patch }) {
	const rootPc = pcOf(search.root);
	const flats = useFlats(rootPc, "major");
	const q = search.q === "min" || search.q === "m7" ? "min" : "maj";
	const shapes = [...cagedShapes(rootPc, q)].sort((a, b) => a.offset - b.offset);
	const [sel, setSel] = (0, import_react.useState)(0);
	const chosen = shapes[sel] ?? shapes[0];
	(0, import_react.useEffect)(() => {
		setSel(0);
	}, [search.root, q]);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "px-5 pb-8 pt-5",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "max-w-sm text-pretty text-sm text-muted",
				children: "Five open-chord shapes, moved up the neck, cover every major and minor triad. Named for the open chords they come from: C, A, G, E, D."
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "mt-5 text-[11px] uppercase tracking-[0.18em] text-dim",
				children: "Root"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "mt-2 flex flex-wrap gap-1.5",
				children: PICKER_ROOTS.map((n) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Chip, {
					active: search.root === n,
					onClick: () => patch({ root: n }),
					children: n
				}, n))
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "mt-3 flex gap-1.5",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Chip, {
					active: q === "maj",
					onClick: () => patch({ q: "maj" }),
					children: "Major"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Chip, {
					active: q === "min",
					onClick: () => patch({ q: "min" }),
					children: "Minor"
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "mt-5 flex gap-3 overflow-x-auto pb-2",
				children: shapes.map((s, i) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ChordDiagram, {
					shape: {
						...s.shape,
						name: `${s.caged} · ${s.offset ? `fret ${s.offset}` : "open"}`
					},
					compact: true,
					selected: i === sel,
					onSelect: () => {
						setSel(i);
						unlockAudio();
						strum(voicingFreqs(s.shape));
					}
				}, s.caged))
			}),
			chosen ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
				className: "mt-5 rounded-xl border border-border bg-surface p-5",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
						className: "text-[11px] uppercase tracking-[0.18em] text-dim",
						children: [
							chosen.caged,
							" shape · ",
							chosen.offset ? `barre ${chosen.offset}` : "open"
						]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", {
						className: "mt-1 font-display text-2xl font-semibold",
						children: chordLabel(rootPc, q, flats)
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "mt-3 text-pretty text-sm leading-relaxed text-muted",
						children: cagedCopy(chosen.caged, chosen.offset)
					})
				]
			}) : null,
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
				className: "mt-6",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "mb-2 text-[11px] uppercase tracking-[0.18em] text-dim",
						children: "All five on the neck"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Legend, { className: "mb-2" }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(NeckFor, {
						rootPc,
						qualityId: q,
						voicing: chosen?.shape.frets,
						preferFlats: flats
					})
				]
			})
		]
	});
}
function cagedCopy(caged, offset) {
	return `The ${caged} form ${offset ? `at fret ${offset}` : "in open position"}. ${{
		E: "Roots sit on strings 6, 4, and 1.",
		A: "Roots sit on strings 5 and 3.",
		G: "Roots sit on strings 6, 3, and 1.",
		C: "Root on string 5 — the third is often the lowest note in this form.",
		D: "Roots sit on strings 4 and 2."
	}[caged] ?? ""} Slide it and the next CAGED neighbour shares those roots a string-set away.`;
}
//#endregion
export { TheoryPage as component };
