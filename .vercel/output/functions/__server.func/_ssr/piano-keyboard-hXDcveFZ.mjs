import { B as require_jsx_runtime } from "../_libs/@tanstack/react-router+[...].mjs";
import { U as cn } from "./router-_2DnnNcg.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/piano-keyboard-hXDcveFZ.js
var import_jsx_runtime = require_jsx_runtime();
var WHITE = [
	0,
	2,
	4,
	5,
	7,
	9,
	11
];
var START = 48;
var WHITE_COUNT = 15;
function isWhite(pc) {
	return WHITE.includes(pc);
}
function PianoKeyboard({ activeMidi, expectedMidi, chordPcs = [], onPlay, disabled }) {
	const whites = [];
	for (let m = START; whites.length < WHITE_COUNT; m++) if (isWhite(m % 12)) whites.push(m);
	const blacks = whites.flatMap((w, i) => {
		const pc = w % 12;
		if (pc === 4 || pc === 11) return [];
		const black = w + 1;
		if (!isWhite(black % 12)) return [{
			midi: black,
			after: i
		}];
		return [];
	});
	const chord = new Set(chordPcs.map((p) => (p % 12 + 12) % 12));
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "relative w-full select-none",
		role: "group",
		"aria-label": "Piano keyboard",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: "flex",
			children: whites.map((midi) => {
				const pc = midi % 12;
				const on = activeMidi === midi;
				const exp = expectedMidi === midi;
				const inChord = chord.has(pc);
				return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
					type: "button",
					disabled,
					onPointerDown: (e) => {
						e.preventDefault();
						onPlay(midi);
					},
					className: cn("relative h-28 flex-1 border-r border-border last:border-r-0 first:rounded-l-md last:rounded-r-md", on ? "bg-accent text-accent-fg" : exp ? "bg-ember/40 text-fg" : inChord ? "bg-raised text-ember" : "bg-fg text-bg"),
					"aria-label": `Key ${midi}`,
					children: pc === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
						className: "pointer-events-none absolute inset-x-0 bottom-1 text-center text-[9px] font-medium opacity-70",
						children: ["C", Math.floor(midi / 12) - 1]
					}) : null
				}, midi);
			})
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: "pointer-events-none absolute inset-x-0 top-0 flex h-16",
			children: whites.map((midi, i) => {
				const black = blacks.find((b) => b.after === i);
				if (!black) return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "relative flex-1" }, midi);
				const on = activeMidi === black.midi;
				const exp = expectedMidi === black.midi;
				const inChord = chord.has(black.midi % 12);
				return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "relative flex-1",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
						type: "button",
						disabled,
						onPointerDown: (e) => {
							e.preventDefault();
							onPlay(black.midi);
						},
						className: cn("pointer-events-auto absolute top-0 z-10 h-16 w-[70%] -translate-x-1/2 rounded-b-sm border border-border", "left-full", on ? "bg-accent" : exp ? "bg-ember" : inChord ? "bg-raised" : "bg-bg"),
						"aria-label": `Black key ${black.midi}`
					})
				}, midi);
			})
		})]
	});
}
//#endregion
export { PianoKeyboard as t };
