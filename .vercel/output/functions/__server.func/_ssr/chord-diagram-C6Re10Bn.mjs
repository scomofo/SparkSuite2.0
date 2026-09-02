import { B as require_jsx_runtime } from "../_libs/@tanstack/react-router+[...].mjs";
import { N as CHORDS, U as cn } from "./router-_2DnnNcg.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/chord-diagram-C6Re10Bn.js
var import_jsx_runtime = require_jsx_runtime();
function ChordDiagram({ chordId, shape, className, compact = false, selected = false, onSelect }) {
	const chord = shape ?? (chordId ? CHORDS[chordId] : void 0);
	if (!chord) return null;
	const frets = chord.frets;
	const fingered = frets.filter((f) => f != null && f > 0);
	const minFinger = fingered.length ? Math.min(...fingered) : 1;
	const maxFinger = fingered.length ? Math.max(...fingered) : 4;
	const start = frets.some((f) => f === 0) || minFinger <= 1 ? 1 : minFinger;
	const nut = start === 1;
	const shown = Math.max(4, maxFinger - start + 1);
	const w = compact ? 112 : 156;
	const h = compact ? 148 : 208;
	const padX = compact ? 18 : 24;
	const padY = compact ? 28 : 36;
	const n = Math.max(2, frets.length);
	const innerW = w - padX * 2;
	const innerH = h - padY - 18;
	const stringX = (i) => padX + (n === 1 ? innerW / 2 : innerW * i / (n - 1));
	const fretY = (f) => padY + innerH * f / shown;
	const barreFret = (() => {
		const counts = /* @__PURE__ */ new Map();
		frets.forEach((f, i) => {
			if (f == null || f < start) return;
			const arr = counts.get(f) ?? [];
			arr.push(i);
			counts.set(f, arr);
		});
		for (const [f, idxs] of counts) if (idxs.length >= 3 && f === start) return {
			fret: f,
			from: idxs[0],
			to: idxs[idxs.length - 1]
		};
		return null;
	})();
	const body = /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: cn("flex flex-col items-center gap-1.5", className),
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("svg", {
			viewBox: `0 0 ${w} ${h}`,
			width: w,
			height: h,
			"aria-hidden": Boolean(onSelect),
			"aria-label": onSelect ? void 0 : `${chord.name} chord`,
			className: "text-fg",
			children: [
				frets.map((fret, i) => {
					const x = stringX(i);
					if (fret === null) return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("text", {
						x,
						y: padY - 12,
						textAnchor: "middle",
						fill: "currentColor",
						opacity: .5,
						fontSize: compact ? 11 : 13,
						children: "×"
					}, `x${i}`);
					if (fret === 0) return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("circle", {
						cx: x,
						cy: padY - 12,
						r: compact ? 4 : 5,
						fill: "none",
						stroke: "currentColor",
						strokeWidth: 1.5
					}, `o${i}`);
					return null;
				}),
				!nut ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("text", {
					x: 4,
					y: padY + innerH / shown / 2 + 4,
					fill: "currentColor",
					opacity: .55,
					fontSize: 10,
					fontFamily: "var(--font-sans)",
					children: [start, "fr"]
				}) : null,
				Array.from({ length: shown + 1 }, (_, f) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("line", {
					x1: padX,
					x2: padX + innerW,
					y1: fretY(f),
					y2: fretY(f),
					stroke: "currentColor",
					strokeWidth: f === 0 && nut ? 4 : 1,
					opacity: f === 0 && nut ? .9 : .35
				}, `f${f}`)),
				frets.map((_, i) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("line", {
					x1: stringX(i),
					x2: stringX(i),
					y1: padY,
					y2: padY + innerH,
					stroke: "currentColor",
					strokeWidth: 1.2 + i * .15,
					opacity: .55
				}, `s${i}`)),
				barreFret ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("rect", {
					x: stringX(barreFret.from) - (compact ? 8 : 11),
					y: (fretY(barreFret.fret - start) + fretY(barreFret.fret - start + 1)) / 2 - (compact ? 8 : 11),
					width: stringX(barreFret.to) - stringX(barreFret.from) + (compact ? 16 : 22),
					height: compact ? 16 : 22,
					rx: compact ? 8 : 11,
					fill: "var(--color-accent)",
					opacity: .95
				}) : null,
				frets.map((fret, i) => {
					if (fret === null || fret === 0) return null;
					const slot = fret - start;
					if (slot < 0 || slot >= shown) return null;
					const finger = chord.fingers[i];
					const inBarre = barreFret && fret === barreFret.fret && i >= barreFret.from && i <= barreFret.to;
					const cy = (fretY(slot) + fretY(slot + 1)) / 2;
					return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("g", { children: [!inBarre ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("circle", {
						cx: stringX(i),
						cy,
						r: compact ? 8 : 11,
						fill: "var(--color-accent)"
					}) : null, finger ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("text", {
						x: stringX(i),
						y: cy + 4,
						textAnchor: "middle",
						fill: "var(--color-accent-fg)",
						fontSize: compact ? 9 : 11,
						fontWeight: 600,
						children: finger
					}) : null] }, `d${i}`);
				})
			]
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
			className: "max-w-[11rem] text-center font-display text-sm font-semibold leading-tight tracking-tight",
			children: chord.name
		})]
	});
	if (!onSelect) return body;
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
		type: "button",
		onClick: onSelect,
		"aria-label": chord.name,
		"aria-pressed": selected,
		className: cn("rounded-lg border px-1.5 pb-2 pt-1 text-left transition-colors duration-(--motion-quick)", selected ? "border-accent bg-raised" : "border-border bg-surface hover:border-ember/50"),
		children: body
	});
}
//#endregion
export { ChordDiagram as t };
